/* ──────────────────────────────────────────────────────────────
   CORREO: SMTP clásico o proveedor HTTP (Resend)
   ────────────────────────────────────────────────────────────── */
const MAIL_PROVIDER = (process.env.MAIL_PROVIDER || "smtp").toLowerCase();
const MAIL_FROM = process.env.MAIL_FROM || "";
const MAIL_TO = (process.env.MAIL_TO || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (!MAIL_FROM) {
  console.warn("⚠️ MAIL_FROM no está configurado. Los correos fallarán hasta que lo definas.");
}
if (!MAIL_TO.length) {
  console.warn("⚠️ MAIL_TO no está configurado. Los correos fallarán hasta que lo definas.");
}

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_SECURE_ENV = (process.env.SMTP_SECURE || "false") === "true";
const SMTP_PORT = Number(
  process.env.SMTP_PORT || (SMTP_SECURE_ENV ? 465 : 587)
);
const SMTP_SECURE = SMTP_SECURE_ENV || SMTP_PORT === 465;
const SMTP_CONNECTION_TIMEOUT = Number(process.env.SMTP_CONNECTION_TIMEOUT || 10000);
const SMTP_SOCKET_TIMEOUT = Number(process.env.SMTP_SOCKET_TIMEOUT || 60000);
const SMTP_GREETING_TIMEOUT = Number(process.env.SMTP_GREETING_TIMEOUT || 10000);
const SMTP_IGNORE_TLS = (process.env.SMTP_IGNORE_TLS || "false").toLowerCase() === "true";
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const RESEND_ENDPOINT = process.env.RESEND_BASE_URL || "https://api.resend.com/emails";
const RESEND_TIMEOUT_MS = Number(process.env.RESEND_TIMEOUT_MS || 30000);
const fetchFn = typeof globalThis.fetch === "function" ? globalThis.fetch.bind(globalThis) : null;

function isTimeoutError(err = {}) {
  const msg = err.message || "";
  return (
    ["ETIMEDOUT", "ESOCKET", "ECONNECTION", "ETIMEOUT"].includes(err.code) ||
    /timed out/i.test(msg)
  );
}

function buildTimeoutError(err, providerLabel) {
  const base = providerLabel === "smtp"
    ? `No se pudo conectar al servidor SMTP ${SMTP_HOST || "(sin host)"}:${SMTP_PORT}. ` +
      "Verifica las reglas de firewall o considera usar MAIL_PROVIDER=resend para enviar vía HTTP."
    : `No se obtuvo respuesta del proveedor ${providerLabel} en ${RESEND_TIMEOUT_MS}ms.`;
  const wrapped = new Error(base);
  wrapped.code = err && err.code ? err.code : `${providerLabel.toUpperCase()}_TIMEOUT`;
  wrapped.detail = err && err.message ? err.message : null;
  return wrapped;
}

let activeMailProvider = MAIL_PROVIDER;
let transporter = null;

if (MAIL_PROVIDER === "resend") {
  if (!RESEND_API_KEY) {
    console.error(
      "MAIL_PROVIDER=resend configurado, pero falta RESEND_API_KEY. Se intentará usar SMTP en su lugar."
    );
    activeMailProvider = "smtp";
  } else if (!fetchFn) {
    console.error(
      "MAIL_PROVIDER=resend configurado, pero el runtime no soporta fetch (Node >=18). Se intentará usar SMTP."
    );
    activeMailProvider = "smtp";
  } else {
    console.log("Usando Resend como proveedor de correo (MAIL_PROVIDER=resend).");
  }
}

if (activeMailProvider === "smtp") {
  const missing = [];
  if (!SMTP_HOST) missing.push("SMTP_HOST");
  if (!SMTP_USER) missing.push("SMTP_USER");
  if (!SMTP_PASS) missing.push("SMTP_PASS");
  if (missing.length) {
    console.warn(`⚠️ Variables SMTP faltantes: ${missing.join(", ")}.`);
  }

  if (SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
      connectionTimeout: SMTP_CONNECTION_TIMEOUT,
      socketTimeout: SMTP_SOCKET_TIMEOUT,
      greetingTimeout: SMTP_GREETING_TIMEOUT,
      tls: SMTP_IGNORE_TLS
        ? { rejectUnauthorized: false }
        : SMTP_HOST
        ? { servername: SMTP_HOST }
        : undefined,
    });

    transporter
      .verify()
      .then(() => console.log("SMTP listo para enviar"))
      .catch((err) => {
        console.error("SMTP VERIFY ERROR:", err.message);
        if (isTimeoutError(err)) {
          console.error(
            `No fue posible establecer conexión con ${SMTP_HOST}:${SMTP_PORT}. ` +
              "Si tu plataforma bloquea SMTP saliente, configura MAIL_PROVIDER=resend y RESEND_API_KEY."
          );
        }
      });
  }
}