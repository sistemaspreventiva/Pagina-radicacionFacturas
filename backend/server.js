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
   CONFIG
   ────────────────────────────────────────────────────────────── */

const ORIGIN = process.env.CORS_ORIGIN || ""; // p.ej: "https://preventiva-radicacion.onrender.com,http://localhost:5173"
if (ORIGIN) {
  const origins = ORIGIN.split(",").map((s) => s.trim());
  app.use(cors({ origin: origins, credentials: false }));
}

app.use(express.json());

/* ──────────────────────────────────────────────────────────────
   MULTER (memoria)
   ────────────────────────────────────────────────────────────── */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 10 },
});

// OJO: multer/busboy normalizan el mimetype a minusculas, igual que el navegador.
// Por eso las entradas van en minuscula y se comparan en minuscula.
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel", // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel.sheet.macroenabled.12", // .xlsm
]);

// El mimetype lo declara el cliente, asi que la extension se valida aparte.
const ALLOWED_EXT = new Set([".pdf", ".doc", ".docx", ".xls", ".xlsx", ".xlsm"]);

function tipoPermitido(file) {
  const mime = (file.mimetype || "").toLowerCase().trim();
  const ext = path.extname(file.originalname || "").toLowerCase();
  return ALLOWED_MIME.has(mime) && ALLOWED_EXT.has(ext);
}

const MAX_TOTAL_MB = Number(process.env.MAX_TOTAL_MB || 20);
const MAX_TOTAL_BYTES = MAX_TOTAL_MB * 1024 * 1024;

/* ──────────────────────────────────────────────────────────────
   SMTP (Nodemailer)
   ────────────────────────────────────────────────────────────── */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // p.ej. "smtp.gmail.com"
  port: Number(process.env.SMTP_PORT || 587),
  secure: (process.env.SMTP_SECURE || "false") === "true", // true para 465, false para 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((err) => {
  if (err) {
    console.error("SMTP VERIFY ERROR:", err.message);
  } else {
    console.log("SMTP listo para enviar");
  }
});

/* ──────────────────────────────────────────────────────────────
   ENDPOINTS API
   ────────────────────────────────────────────────────────────── */

// Health (no usar "/" para evitar pisar el SPA)
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

/**
 * POST /api/radicaciones
 * Body tipo FormData:
 *  - files:   archivos (multiple)
 *  - numero:  string
 *  - valor:   string
 *  - periodo: string "YYYY-MM" (mes que se esta cobrando)
 *  - username, name, email, role, timestamp: strings (opcionales)
 */
app.post("/api/radicaciones", upload.array("files", 10), async (req, res) => {
  try {
    const { numero, valor, periodo, username, name, email, role, timestamp } = req.body;
    const files = req.files || [];

    if (!files.length) return res.status(400).send("Adjunta al menos 1 archivo.");
    if (!numero) return res.status(400).send("Falta el número de radicado (o factura).");
    if (!valor) return res.status(400).send("Falta el valor.");

    // Validación de tipos y tamaño total
    let total = 0;
    for (const f of files) {
      if (!tipoPermitido(f)) {
        return res
          .status(400)
          .send(
            `Formato no permitido: "${f.originalname}" (${f.mimetype}). ` +
              `Solo PDF, Word (DOC/DOCX) y Excel (XLS/XLSX/XLSM).`
          );
      }
      total += f.size;
    }
    if (total > MAX_TOTAL_BYTES) {
      return res
        .status(400)
        .send(`Tamaño total ${(total / 1024 / 1024).toFixed(1)}MB excede ${MAX_TOTAL_MB}MB.`);
    }

    // Simulación (no enviar correo)
    if ((process.env.DRY_RUN || "").toLowerCase() === "true") {
      console.log("[DRY_RUN] Simulación de envío con", files.length, "adjunto(s).");
      return res.json({ ok: true, id: "simulado-" + Date.now(), count: files.length });
    }

    // Texto plano (asunto del correo)
    const safe = (v) => (v || "").toString().trim();

    // Escapa HTML: estos valores vienen del cliente y se interpolan en el cuerpo.
    const esc = (v) =>
      safe(v)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const subject = `Radicación ${safe(numero)} - ${safe(username || name || "usuario")} (${safe(
      role || "rol"
    )}) [${files.length} adjunto(s)]`;

    const listItems = files
      .map((f) => `<li>${esc(f.originalname)} • ${(f.size / 1024 / 1024).toFixed(2)} MB</li>`)
      .join("");

    const html = `
      <h3>Radicación de factura</h3>
      <ul>
        <li><b>Usuario:</b> ${esc(username)} (${esc(name)})</li>
        <li><b>Email:</b> ${esc(email)}</li>
        <li><b>Rol:</b> ${esc(role)}</li>
        <li><b>Número:</b> ${esc(numero)}</li>
        <li><b>Valor:</b> ${esc(valor)}</li>
        <li><b>Periodo radicado:</b> ${esc(periodo) || "no indicado"}</li>
        <li><b>Fecha:</b> ${esc(timestamp)}</li>
      </ul>
      <p><b>Adjuntos (${files.length}):</b></p>
      <ul>${listItems}</ul>
    `;

    const attachments = files.map((f) => ({
      filename: f.originalname,
      content: f.buffer,
      contentType: f.mimetype,
    }));

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM, // "Radicación Preventiva IPS" <facturapreventiva8@gmail.com>
      to: process.env.MAIL_TO, // "destino@tu-dominio"
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
   SERVIR FRONTEND (Vite build) DESDE ../dist
   ────────────────────────────────────────────────────────────── */

const DIST_DIR = path.join(__dirname, "..", "dist");

// Sirve assets estáticos si existe la carpeta de build
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));

  // Fallback SPA (sin usar '*' para evitar path-to-regexp en Express 5)
  app.use((req, res, next) => {
    // Si es ruta de API o no es GET → continúa
    if (req.path.startsWith("/api/") || req.method !== "GET") return next();

    // Devuelve index.html para el resto de rutas del SPA
    res.sendFile(path.join(DIST_DIR, "index.html"));
  });
} else {
  console.warn("⚠️  No se encontró la carpeta dist. Ejecuta el build del frontend antes de desplegar.");
}

/* ──────────────────────────────────────────────────────────────
   START
   ────────────────────────────────────────────────────────────── */
const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
  console.log(`Servidor escuchando en :${PORT}`);
});
