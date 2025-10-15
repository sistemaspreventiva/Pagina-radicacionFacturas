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
   CONFIG BÁSICA
   ────────────────────────────────────────────────────────────── */
const ORIGIN = process.env.CORS_ORIGIN || ""; // e.g. http://localhost:5173 (en monolito puedes dejar vacío)
if (ORIGIN) {
  app.use(cors({ origin: ORIGIN.split(",").map((s) => s.trim()), credentials: false }));
}

/* Si tienes otros JSON endpoints */
app.use(express.json());

/* Multer en memoria (hasta 10 archivos, 15MB c/u) */
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

/* Límite total seguro (Gmail ~25MB incluyendo codificación) */
const MAX_TOTAL_MB = Number(process.env.MAX_TOTAL_MB || 20);
const MAX_TOTAL_BYTES = MAX_TOTAL_MB * 1024 * 1024;

/* ──────────────────────────────────────────────────────────────
   SMTP (Gmail / Google Workspace)
   ────────────────────────────────────────────────────────────── */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // p.ej. smtp.gmail.com
  port: Number(process.env.SMTP_PORT || 587),
  secure: (process.env.SMTP_SECURE || "false") === "true", // false para 587 (STARTTLS), true para 465
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

transporter.verify((err) => {
  if (err) console.error("SMTP VERIFY ERROR:", err.message);
  else console.log("SMTP listo para enviar");
});

/* ──────────────────────────────────────────────────────────────
   ENDPOINTS
   ────────────────────────────────────────────────────────────── */
app.get("/", (_req, res) => res.send({ ok: true }));

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
          .send(`Formato no permitido: "${f.originalname}". Solo PDF, Word (DOC/DOCX) y Excel (XLS/XLSX).`);
      }
      total += f.size;
    }
    if (total > MAX_TOTAL_BYTES) {
      return res
        .status(400)
        .send(`Tamaño total ${(total / 1024 / 1024).toFixed(1)}MB excede ${MAX_TOTAL_MB}MB.`);
    }

    // Modo simulación opcional (no envía correo, útil para probar UI)
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
      from: process.env.MAIL_FROM, // p.ej. "Radicación Preventiva IPS" <tu_cuenta@gmail.com>
      to: process.env.MAIL_TO, // p.ej. contabilidad@preventivaips.com.co
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
   SERVIR FRONTEND COMPILADO (Vite) DESDE /dist — Express 5 compat
   ──────────────────────────────────────────────────────────────
   Importante: el build del frontend debe generar la carpeta /dist
   en la raíz del repo. Con el Build Command de Render:
   cd .. && npm ci && npm run build && cd backend && npm ci --omit=dev
   se genera en ../dist (una carpeta arriba del backend).
*/
const DIST_DIR = path.join(__dirname, "..", "dist");
if (fs.existsSync(DIST_DIR)) {
  // Archivos estáticos (assets, js, css, etc.)
  app.use(express.static(DIST_DIR));

  // Fallback SPA: cualquier ruta que NO empiece por /api/ devuelve index.html
  // (En Express 5 NO uses "*" pelado; usa regex o "/*")
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(DIST_DIR, "index.html"));
  });
} else {
  console.warn("⚠️ No se encontró la carpeta dist. Asegúrate de ejecutar el build del frontend.");
}

/* ──────────────────────────────────────────────────────────────
   START
   ────────────────────────────────────────────────────────────── */
const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => console.log(`Servidor escuchando en :${PORT}`));
