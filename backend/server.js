const express = require("express");
const cors = require("cors");
const multer = require("multer");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));

// Subida en memoria (máx 15MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Healthcheck
app.get("/", (_req, res) => res.send({ ok: true }));

// Endpoint de radicación
app.post("/api/radicaciones", upload.single("file"), async (req, res) => {
  try {
    const { numero, valor, username, name, email, role, timestamp } = req.body;
    const file = req.file;

    if (!file) return res.status(400).send("Archivo requerido");
    if (!numero || !valor) return res.status(400).send("Número y valor requeridos");

    const subject = `Radicación ${numero} - ${username || name || "usuario"} (${role || "rol"})`;
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
    `;

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: process.env.MAIL_TO,
      subject,
      html,
      attachments: [
        {
          filename: file.originalname,
          content: file.buffer,
          contentType: file.mimetype,
        },
      ],
    });

    res.json({ ok: true, id: info.messageId });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error enviando correo");
  }
});

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => console.log(`Servidor escuchando en :${PORT}`));
