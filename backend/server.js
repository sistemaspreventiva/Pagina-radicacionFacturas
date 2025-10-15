const express = require("express");
const cors = require("cors");
const multer = require("multer");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));

// --- Configuración subida (máx 10 archivos, 15MB c/u) ---
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 10 },
});

// --- Tipos permitidos: PDF, Word, Excel ---
const ALLOWED = new Set([
  "application/pdf",                                                     // PDF
  "application/msword",                                                  // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel",                                            // .xls (legacy)
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",   // .xlsx
  "application/vnd.ms-excel.sheet.macroEnabled.12",                      // .xlsm (opcional)
]);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: (process.env.SMTP_SECURE || "false") === "true",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

transporter.verify((err) => {
  if (err) console.error("SMTP VERIFY ERROR:", err.message);
  else console.log("SMTP listo para enviar");
});

const MAX_TOTAL_MB = Number(process.env.MAX_TOTAL_MB || 20);
const MAX_TOTAL_BYTES = MAX_TOTAL_MB * 1024 * 1024;

app.get("/", (_req, res) => res.send({ ok: true }));

app.post("/api/radicaciones", upload.array("files", 10), async (req, res) => {
  try {
    const { numero, valor, username, name, email, role, timestamp } = req.body;
    const files = req.files || [];

    if (!files.length) return res.status(400).send("Adjunta al menos 1 archivo.");
    if (!numero || !valor) return res.status(400).send("Número y valor requeridos.");

    // Validación de tipo y tamaño total
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
        .send(`Tamaño total ${(total / 1024 / 1024).toFixed(1)}MB excede el límite de ${MAX_TOTAL_MB}MB.`);
    }

    // Modo simulación opcional
    if ((process.env.DRY_RUN || "").toLowerCase() === "true") {
      console.log("DRY_RUN activo: simulando envío con", files.length, "archivo(s).");
      return res.json({ ok: true, id: "simulado-" + Date.now(), count: files.length });
    }

    const subject = `Radicación ${numero} - ${username || name || "usuario"} (${role || "rol"}) [${files.length} adjunto(s)]`;
    const list = files
      .map((f) => `<li>${f.originalname} • ${(f.size / 1024 / 1024).toFixed(2)} MB</li>`)
      .join("");

    const html = `
      <h3>Radicación de factura</h3>
      <ul>
        <li><b>Usuario:</b> ${username || ""} (${name || ""})</li>
        <li><b>Email:</b> ${email || ""}</li>
        <li><b>Rol:</b> ${role || ""}</li>
        <li><b>Número:</b> ${numero}</li>
        <li><b>Valor:</b> ${valor}</li>
        <li><b>Fecha:</b> ${timestamp}</li>
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
    return res.status(500).json({ ok: false, error: err.message, detail: err.response || null });
  }
});

// --- (Opcional) servir el frontend compilado si usas monolito ---
const DIST_DIR = path.join(__dirname, "..", "dist");
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(DIST_DIR, "index.html"));
  });
}

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => console.log(`Servidor escuchando en :${PORT}`));
