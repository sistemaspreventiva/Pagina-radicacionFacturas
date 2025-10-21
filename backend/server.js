// backend/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

const app = express();

/* ──────────────────────────────────────────────────────────────
   CORS
   ────────────────────────────────────────────────────────────── */
const ORIGIN = process.env.CORS_ORIGIN || ""; // ej: http://localhost:5173,https://tu-dominio
if (ORIGIN) {
  app.use(
    cors({
      origin: ORIGIN.split(",").map((s) => s.trim()),
      credentials: false,
    })
  );
} else {
  app.use(cors());
}

app.use(express.json());

/* ──────────────────────────────────────────────────────────────
   Multer: archivos en memoria (hasta 10 archivos, 15MB c/u)
   ────────────────────────────────────────────────────────────── */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 10 },
});

/* Tipos permitidos */
const ALLOWED = new Set([
  "application/pdf",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel", // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel.sheet.macroEnabled.12", // .xlsm
]);

/* Límite total recomendado (SMTP/API) */
const MAX_TOTAL_MB = Number(process.env.MAX_TOTAL_MB || 20);
const MAX_TOTAL_BYTES = MAX_TOTAL_MB * 1024 * 1024;

/* ──────────────────────────────────────────────────────────────
   SMTP (fallback opcional)
   ────────────────────────────────────────────────────────────── */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: (process.env.SMTP_SECURE || "false") === "true", // debe ser false con 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    minVersion: "TLSv1.2",
  },
});


// Log informativo (si falla aquí, igual puedes usar Resend)
transporter.verify((err) => {
  if (err) console.error("ERROR VERIFICACIÓN SMTP:", err.message);
  else console.log("SMTP listo para enviar");
});

/* ──────────────────────────────────────────────────────────────
   Helpers Resend (API HTTP) – evita ETIMEDOUT de SMTP
   ────────────────────────────────────────────────────────────── */
function bufToBase64(buf) {
  return Buffer.isBuffer(buf) ? buf.toString("base64") : Buffer.from(buf).toString("base64");
}

async function sendViaResend({ from, to, subject, html, attachments }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Falta RESEND_API_KEY");

  const atts = (attachments || []).map((a) => ({
    filename: a.filename,
    content: bufToBase64(a.content),
    contentType: a.contentType || "application/octet-stream",
  }));

  // Node 18+ ya trae fetch global (Render usa Node 20/22)
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to, // string o array
      subject,
      html,
      attachments: atts,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body}`);
  }
  return res.json();
}

/* ──────────────────────────────────────────────────────────────
   ENDPOINTS
   ────────────────────────────────────────────────────────────── */
app.get("/", (_req, res) => res.json({ ok: true }));

app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

/** Diagnóstico SMTP muy rápido (opcional) */
app.get("/api/diag/smtp", async (_req, res) => {
  const timeoutMs = 7000;
  try {
    await Promise.race([
      transporter.verify(),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), timeoutMs)),
    ]);
    res.json({ ok: true, message: "SMTP reachable" });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message || String(e) });
  }
});

/**
 * POST /api/radicaciones
 * FormData:
 *  - files: múltiples archivos
 *  - numero, valor, username, name, email, role, timestamp
 */
app.post("/api/radicaciones", upload.array("files", 10), async (req, res) => {
  try {
    const { numero, valor, username, name, email, role, timestamp } = req.body;
    const files = req.files || [];

    if (!files.length) return res.status(400).send("Adjunta al menos 1 archivo.");
    if (!numero) return res.status(400).send("Falta el número de factura.");
    if (!valor) return res.status(400).send("Falta el valor.");

    // Validaciones
    let total = 0;
    for (const f of files) {
      if (!ALLOWED.has(f.mimetype)) {
        return res
          .status(400)
          .send(
            `Formato no permitido: "${f.originalname}". Solo PDF, Word (DOC/DOCX) y Excel (XLS/XLSX).`
          );
      }
      total += f.size;
    }
    if (total > MAX_TOTAL_BYTES) {
      return res
        .status(400)
        .send(`Tamaño total ${(total / 1024 / 1024).toFixed(1)}MB excede ${MAX_TOTAL_MB}MB.`);
    }

    // Simulación opcional
    if ((process.env.DRY_RUN || "").toLowerCase() === "true") {
      console.log("[DRY_RUN] Simulando envío con", files.length, "archivo(s).");
      return res.json({ ok: true, id: "simulado-" + Date.now(), count: files.length, via: "dry" });
    }

    const safe = (v) => (v || "").toString().trim();
    const subject = `Radicación ${safe(numero)} - ${safe(
      username || name || "usuario"
    )} (${safe(role || "rol")}) [${files.length} adjunto(s)]`;

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

    const useResend = (process.env.USE_RESEND || "").toLowerCase() === "true";

    if (useResend) {
      await sendViaResend({
        from: process.env.MAIL_FROM,
        to: process.env.MAIL_TO,
        subject,
        html,
        attachments,
      });
      return res.json({ ok: true, via: "resend", count: files.length });
    } else {
      const info = await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: process.env.MAIL_TO,
        subject,
        html,
        attachments,
      });
      return res.json({ ok: true, id: info.messageId, via: "smtp", count: files.length });
    }
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
   Servir el frontend (Vite) desde /dist SIN usar '*' (Express 5 OK)
   ────────────────────────────────────────────────────────────── */
const DIST_DIR = path.join(__dirname, "..", "dist");
if (fs.existsSync(DIST_DIR)) {
  // 1) Assets estáticos
  app.use(express.static(DIST_DIR, { fallthrough: true }));

  // 2) Fallback SPA: middleware SIN rutas comodín
  app.use((req, res, next) => {
    if (req.method !== "GET") return next();
    if (req.path && req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(DIST_DIR, "index.html"));
  });
} else {
  console.warn("⚠️ No se encontró la carpeta dist. Ejecuta el build del frontend.");
}

/* ──────────────────────────────────────────────────────────────
   Arranque
   ────────────────────────────────────────────────────────────── */
const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => console.log(`Servidor escuchando en :${PORT}`));
