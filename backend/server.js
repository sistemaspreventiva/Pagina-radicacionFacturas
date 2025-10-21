// backend/server.js
require("dotenv").config();

const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

/* ──────────────────────────────────────────────────────────────
   CONFIG BÁSICA
   ────────────────────────────────────────────────────────────── */
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

// CORS: si CORS_ORIGIN no está definido, mejor no fijar origin (same-origin en Render)
const ORIGINS = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

if (ORIGINS.length) {
  app.use(cors({ origin: ORIGINS, credentials: false }));
} else {
  app.use(cors()); // seguro en monolito (same-origin)
}

app.use(express.json({ limit: "2mb" }));

/* ──────────────────────────────────────────────────────────────
   MULTER (subida en memoria)
   ────────────────────────────────────────────────────────────── */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 10 }, // 15MB c/u, hasta 10
});

// Tipos permitidos
const ALLOWED = new Set([
  "application/pdf", // .pdf
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel", // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel.sheet.macroEnabled.12", // .xlsm
]);

// Peso total recomendado (encima de ~25MB SMTP suele fallar)
const MAX_TOTAL_MB = Number(process.env.MAX_TOTAL_MB || 20);
const MAX_TOTAL_BYTES = MAX_TOTAL_MB * 1024 * 1024;

/* ──────────────────────────────────────────────────────────────
   SMTP (Gmail / Workspace / Office 365 con pass de app)
   ────────────────────────────────────────────────────────────── */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // smtp.gmail.com
  port: Number(process.env.SMTP_PORT || 587),
  secure: (process.env.SMTP_SECURE || "false") === "true", // 465 => true, 587 => false
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

transporter.verify((err) => {
  if (err) console.error("SMTP VERIFY ERROR:", err.message);
  else console.log("SMTP listo para enviar");
});

/* ──────────────────────────────────────────────────────────────
   HELPERS
   ────────────────────────────────────────────────────────────── */
function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function authMiddleware(req, _res, next) {
  const h = req.headers.authorization || "";
  const m = /^Bearer\s+(.+)$/.exec(h);
  if (!m) return next();
  try {
    req.user = jwt.verify(m[1], JWT_SECRET);
  } catch (_e) {
    // token inválido/expirado → sin user, pero no rompe
  }
  next();
}

app.use(authMiddleware);

/* ──────────────────────────────────────────────────────────────
   ENDPOINTS
   ────────────────────────────────────────────────────────────── */

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

/**
 * Auth: Register
 * body: { email, username, password, dni?, role: "asistencial"|"administrativo"|"conductor" }
 */
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, username, password, dni, role = "asistencial" } = req.body || {};
    if (!email || !username || !password) {
      return res.status(400).send("Faltan campos requeridos (email, username, password).");
    }
    const exists = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { id: true },
    });
    if (exists) return res.status(409).send("Email o usuario ya existe.");

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, username, password: hash, dni: dni || null, role },
      select: { id: true, email: true, username: true, role: true, createdAt: true },
    });

    const token = signToken(user);
    res.json({ ok: true, token, user });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).send("Error registrando usuario.");
  }
});

/**
 * Auth: Login
 * body: { emailOrUser, password }
 */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { emailOrUser, password } = req.body || {};
    if (!emailOrUser || !password) {
      return res.status(400).send("Faltan credenciales.");
    }
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: emailOrUser }, { username: emailOrUser }] },
    });
    if (!user) return res.status(401).send("Usuario no encontrado.");

    const ok = await bcrypt.compare(password, user.password || "");
    if (!ok) return res.status(401).send("Contraseña incorrecta.");

    const safe = { id: user.id, email: user.email, username: user.username, role: user.role };
    const token = signToken(safe);
    res.json({ ok: true, token, user: safe });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).send("Error de autenticación.");
  }
});

/**
 * Auth: Me (requiere Authorization: Bearer)
 */
app.get("/api/auth/me", async (req, res) => {
  if (!req.user) return res.status(401).send("No autenticado.");
  try {
    const u = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { id: true, email: true, username: true, role: true, createdAt: true },
    });
    if (!u) return res.status(404).send("Usuario no existe.");
    res.json({ ok: true, user: u });
  } catch (err) {
    console.error("ME ERROR:", err);
    res.status(500).send("Error consultando usuario.");
  }
});

/**
 * Radicaciones: subida y envío por correo
 * FormData:
 *  - files (múltiples)
 *  - numero, valor, username, name, email, role, timestamp
 */
app.post("/api/radicaciones", upload.array("files", 10), async (req, res) => {
  try {
    const { numero, valor, username, name, email, role, timestamp } = req.body || {};
    const files = req.files || [];

    if (!files.length) return res.status(400).send("Adjunta al menos 1 archivo.");
    if (!numero) return res.status(400).send("Falta el número de factura.");
    if (!valor) return res.status(400).send("Falta el valor.");

    // Validaciones de tipo y peso total
    let total = 0;
    for (const f of files) {
      if (!ALLOWED.has(f.mimetype)) {
        return res
          .status(400)
          .send(`Formato no permitido: "${f.originalname}". Solo PDF, Word (DOC/DOCX) y Excel (XLS/XLSX).`);
      }
      total += f.size;
    }
    if (total > MAX_TOTAL_BYTES) {
      return res
        .status(400)
        .send(`Tamaño total ${(total / 1024 / 1024).toFixed(1)}MB excede ${MAX_TOTAL_MB}MB.`);
    }

    // Modo simulación opcional
    if ((process.env.DRY_RUN || "").toLowerCase() === "true") {
      console.log("[DRY_RUN] Simulando envío con", files.length, "archivo(s).");
      return res.json({ ok: true, id: "simulado-" + Date.now(), count: files.length });
    }

    const safe = (v) => (v || "").toString().trim();
    const subject = `Radicación ${safe(numero)} - ${safe(username || name || "usuario")} (${safe(role || "rol")}) [${files.length} adjunto(s)]`;

    const list = files
      .map((f) => `<li>${f.originalname} • ${(f.size / 1024 / 1024).toFixed(2)} MB</li>`)
      .join("");

    const html = `
      <h3>Radicación de factura</h3>
      <ul>
        <li><b>Usuario:</b> ${safe(username)} (${safe(name)})</li>
        <li><b>Email:</b> ${safe(email)}</li>
        <li><b>Rol:</b> ${safe(role)}</li>
        <li><b>Número:</b> ${safe(numero)}</li>
        <li><b>Valor:</b> ${safe(valor)}</li>
        <li><b>Fecha:</b> ${safe(timestamp)}</li>
      </ul>
      <p><b>Adjuntos (${files.length}):</b></p>
      <ul>${list}</ul>
    `;

    const attachments = files.map((f) => ({
      filename: f.originalname,
      content: f.buffer,
      contentType: f.mimetype,
    }));

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: process.env.MAIL_TO,
      subject,
      html,
      attachments,
    });

    return res.json({ ok: true, id: info.messageId, count: files.length });
  } catch (err) {
    console.error("SENDMAIL ERROR:", err.message, err.response || "", err.code || "");
    return res.status(500).json({
      ok: false,
      error: err.message,
      detail: err.response || null,
      code: err.code || null,
    });
  }
});

/* ──────────────────────────────────────────────────────────────
   SERVIR FRONTEND (Vite) DESDE ../dist  +  Fallback SPA (Express 5 OK)
   ────────────────────────────────────────────────────────────── */
const DIST_DIR = path.join(__dirname, "..", "dist");

if (fs.existsSync(DIST_DIR)) {
  // Archivos estáticos del build
  app.use(express.static(DIST_DIR));

  // SPA fallback: cualquier ruta que NO sea /api/* => index.html
  // NOTA: usar RegExp literal, NO strings tipo "/*" ni "/(.*)"
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(DIST_DIR, "index.html"));
  });
} else {
  console.warn("⚠️ No se encontró la carpeta dist. Asegúrate de ejecutar el build del frontend.");
}

/* ──────────────────────────────────────────────────────────────
   START
   ────────────────────────────────────────────────────────────── */
app.listen(PORT, () => console.log(`Servidor escuchando en :${PORT}`));
