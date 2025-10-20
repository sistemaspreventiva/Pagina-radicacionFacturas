// src/services/api.js
// En producción (Render) usa same-origin. En local puedes definir VITE_API_BASE=http://localhost:4000
const BASE = (import.meta.env?.VITE_API_BASE || "").trim();
export const apiBase = BASE ? BASE.replace(/\/$/, "") : "";

/* ======================= AUTH ======================= */

export async function registerUser(payload) {
  const res = await fetch(`${apiBase}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // { ok, token, user }
}

export async function loginUser({ emailOrUser, password }) {
  const res = await fetch(`${apiBase}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailOrUser, password }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // { ok, token, user }
}

export async function fetchMe(token) {
  const res = await fetch(`${apiBase}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // { ok, user }
}

/* =================== RADICACIONES =================== */

export async function uploadRadicacion({
  files,       // FileList | File[]
  numero,      // string
  valor,       // string | number
  username,    // string
  name,        // string
  email,       // string
  role,        // "asistencial" | "administrativo" | "conductor"
  timestamp,   // string (ISO)
}) {
  const fd = new FormData();
  Array.from(files || []).forEach((f) => fd.append("files", f));
  fd.append("numero", String(numero ?? ""));
  fd.append("valor", String(valor ?? ""));
  fd.append("username", String(username ?? ""));
  fd.append("name", String(name ?? ""));
  fd.append("email", String(email ?? ""));
  fd.append("role", String(role ?? ""));
  fd.append("timestamp", String(timestamp ?? new Date().toISOString()));

  const res = await fetch(`${apiBase}/api/radicaciones`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // { ok, id, count }
}
