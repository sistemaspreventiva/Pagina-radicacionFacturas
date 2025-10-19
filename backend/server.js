// backend/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

// ─── Auth & DB (Prisma + JWT + bcrypt) ─────────────────────────
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const app = express();

// ───────────────────────────────────────────────────────────────
// CORS (en monolito puedes omitirlo; si lo dejas, define CORS_ORIGIN)
// ───────────────────────────────────────────────────────────────
const ORIGIN = process.env.CORS_ORIGIN || "";
if (ORIGIN) {
  app.use(cors({ origin: ORIGIN.split(",").map(s => s.trim()), credentials: false }));
}

// JSON para endpoints no-multipart
app.use(express.json());

// ───────────────────────────────────────────────────────────────
// Multer en memoria (hasta 10 archivos, 15MB c/u)
// ───────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 10 },
});

// Tipos permitidos: PDF, Word, Excel
const ALLOWED = new Set([
  "application/pdf",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel", // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel.sheet.macroEnabled.12", // .xlsm (opcional)
]);

// Límite total seguro (~25MB Gmail con codificación); por defecto 20MB
const MAX_TOTAL_MB = Number(process.env.MAX_TOTAL_MB || 20);
const MAX_TOTAL_BYTES = MAX_TOTAL_MB * 1024 * 1024;

// ───────────────────────────────────────────────────────────────
// SMTP (Gmail/Workspace u otro proveedor)
// ───────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // p.ej. smtp.gmail.com
  port: Number(process.env.SMTP_PORT || 587),
  secure: (process.env.SMTP_SECURE || "false") === "true", // false→587 STARTTLS, true→465
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

transporter.verify((err) => {
  if (err) console.error("SMTP VERIFY ERROR:", err.message);
  else console.log("SMTP listo para enviar");
});

// ───────────────────────────────────────────────────────────────
// Helpers Auth (JWT)
// ───────────────────────────────────────────────────────────────
function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );
}

function auth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).send("No token");
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).send("Token inválido");
  }
}

// ───────────────────────────────────────────────────────────────
// ENDPOINTS API
// ───────────────────────────────────────────────────────────────

// Healthcheck (moverlo fuera de "/")
app.get("/api/health", (_req, res) => res.send({ ok: true }));

// Registro de usuario
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, username, password, dni, role } = req.body || {};
    if (!email || !username || !password || !role) {
      return res.status(400).send("Faltan campos requeridos");
    }

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { id: true },
    });
    if (exists) return res.status(409).send("Usuario o email ya existen");

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, username, dni: dni || null, role, password: hash },
      select: { id: true, email: true, username: true, dni: true, role: true, createdAt: true },
    });

    const token = signToken(user);
    return res.json({ ok: true, token, user });
  } catch (e) {
    console.error("REGISTER ERROR:", e);
    return res.status(500).send("Error registrando usuario");
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { emailOrUser, password } = req.body || {};
    if (!emailOrUser || !password) return res.status(400).send("Faltan credenciales");

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: emailOrUser }, { username: emailOrUser }] },
    });
    if (!user) return res.status(401).send("Credenciales inválidas");

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).send("Credenciales inválidas");

    const safe = {
      id: user.id,
      email: user.email,
      username: user.username,
      dni: user.dni,
      role: user.role,
      createdAt: user.createdAt,
    };
    const token = signToken(user);
    return res.json({ ok: true, token, user: safe });
  } catch (e) {
    console.error("LOGIN ERROR:", e);
    return res.status(500).send("Error iniciando sesión");
  }
});

// Perfil autenticado
app.get("/api/auth/me", auth, async (req, res) => {
  const me = await prisma.user.findUnique({
    where: { id: req.user.sub },
    select: { id: true, email: true, username: true, dni: true, role: true, createdAt: true },
  });
  return res.json({ ok: true, user: me });
});

// Radicación: recibe archivos y reenvía por correo
app.post("/api/radicaciones", upload.array("files", 10), async (req, res) => {
  try {
    const { numero, valor, username, name, email, role, timestamp } = req.body;
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

    // Modo simulación opcional (evita envío real)
    if ((process.env.DRY_RUN || "").toLowerCase() === "true") {
      console.log("[DRY_RUN] Simulando envío con", files.length, "archivo(s).");
      return res.json({ ok: true, id: "simulado-" + Date.now(), count: files.length });
    }

    const safe = (v) => (v || "").toString().trim();
    const subject = `Radicación ${safe(numero)} - ${safe(username || name || "usuario")} (${safe(
      role || "rol"
    )}) [${files.length} adjunto(s)]`;

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

// ───────────────────────────────────────────────────────────────
// SERVIR FRONTEND (Vite) DESDE /dist — Express 5 compatible
// ───────────────────────────────────────────────────────────────
const DIST_DIR = path.join(__dirname, "..", "dist");
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  // Fallback SPA: cualquier ruta que NO empiece por /api/
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(DIST_DIR, "index.html"));
  });
} else {
  console.warn("⚠️ No se encontró la carpeta dist. Ejecuta el build del frontend.");
}

// ───────────────────────────────────────────────────────────────
// START
// ───────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => console.log(`Servidor escuchando en :${PORT}`));
