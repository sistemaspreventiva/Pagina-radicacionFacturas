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
   CORS (puedes dejar vacío si sirves el front desde el mismo server)
   ────────────────────────────────────────────────────────────── */
const ORIGIN = process.env.CORS_ORIGIN || ""; // p.ej. http://localhost:5173
if (ORIGIN) {
  app.use(
    cors({
      origin: ORIGIN.split(",").map((s) => s.trim()),
      credentials: false,
    })
  );
}

/* Si tienes otros endpoints JSON */
app.use(express.json());

/* ──────────────────────────────────────────────────────────────
   Multer: Memoria (hasta 10 archivos, 15MB cada uno)
   ────────────────────────────────────────────────────────────── */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 10 },
});

/* Tipos permitidos: PDF, Word, Excel */
const ALLOWED = new Set([
  "application/pdf",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel", // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel.sheet.macroEnabled.12", // .xlsm (opcional)
]);

/* Límite total seguro (HTTP + codificación). */
const MAX_TOTAL_MB = Number(process.env.MAX_TOTAL_MB || 20);
const MAX_TOTAL_BYTES = MAX_TOTAL_MB * 1024 * 1024;

/* ──────────────────────────────────────────────────────────────
   Transporte SMTP (fallback opcional)
   ────────────────────────────────────────────────────────────── */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // ej: smtp.gmail.com o smtp.office365.com
  port: Number(process.env.SMTP_PORT || 587), // 587 con STARTTLS
  secure: (process.env.SMTP_SECURE || "false") === "true", // true solo si usas 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
  tls: {
    minVersion: "TLSv1.2",
    servername: process.env.SMTP_HOST,
  },
});

/* Verificación SMTP (solo log informativo) */
transporter.verify((err) => {
  if (err) console.error("ERROR VERIFICACIÓN SMTP:", err.message);
  else console.log("SMTP listo para enviar");
});

/* ──────────────────────────────────────────────────────────────
   Helpers para Resend (API HTTP)
   ────────────────────────────────────────────────────────────── */

/** Buffer -> base64 (para adjuntos por API) */
function bufToBase64(buf) {
  return Buffer.isBuffer(buf) ? buf.toString("base64") : Buffer.from(buf).toString("base64");
}

/** Envío por Resend (evita ETIMEDOUT de SMTP en Render) */
async function sendViaResend({ from, to, subject, html, attachments }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Falta RESEND_API_KEY");

  const atts = (attachments || []).map((a) => ({
    filename: a.filename,
    content: bufToBase64(a.content),
    contentType: a.contentType || "application/octet-stream",
  }));

  // Node 20+ ya tiene fetch global en Render
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
app.get("/", (_req, res) => res.send({ ok: true }));

/** Diagnóstico SMTP: intenta “verify()” con timeout corto */
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

    // Validaciones de tipo y peso total
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

    // Modo simulación (no envía correo; útil para pruebas)
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
        attachments, // si no quieres adjuntos por API, pásale [] o quítalo
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
   Servir el frontend (Vite) desde /dist si existe
   ────────────────────────────────────────────────────────────── */
const DIST_DIR = path.join(__dirname, "..", "dist");
if (fs.existsSync(DIST_DIR)) {
  // Archivos estáticos (assets, js, css, etc.)
  app.use(express.static(DIST_DIR));

  // SPA fallback: cualquier ruta no-API devuelve index.html
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
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
