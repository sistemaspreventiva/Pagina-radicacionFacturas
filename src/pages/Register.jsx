// src/pages/Register.jsx
import { useState } from "react";
import { registerUser } from "../services/api";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    dni: "",
    role: "asistencial",
  });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setMsg(null);

    if (!form.email || !form.username || !form.password || !form.role) {
      setMsg({ type: "error", text: "Completa los campos requeridos." });
      return;
    }

    try {
      setLoading(true);
      const { token, user } = await registerUser(form);
      localStorage.setItem("token", token);
      // Si tienes un contexto global de auth, aquí podrías setear user
      setMsg({ type: "ok", text: `Usuario creado: ${user.username}` });
      // Redirige al dashboard (o login)
      setTimeout(() => nav("/dashboard"), 600);
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Error registrando." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Registro</h1>

      {msg && (
        <div
          className={`mb-4 rounded-md border p-3 ${
            msg.type === "ok"
              ? "border-green-300 bg-green-50 text-green-800"
              : "border-red-300 bg-red-50 text-red-800"
          }`}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Email *</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="correo@dominio.com"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Usuario *</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="text"
            name="username"
            value={form.username}
            onChange={onChange}
            placeholder="usuario"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Contraseña *</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">DNI / Cédula</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="text"
            name="dni"
            value={form.dni}
            onChange={onChange}
            placeholder="Opcional"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Rol *</label>
          <select
            className="w-full rounded-md border px-3 py-2"
            name="role"
            value={form.role}
            onChange={onChange}
          >
            <option value="asistencial">Asistencial</option>
            <option value="administrativo">Administrativo</option>
            <option value="conductor">Conductor</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2"
        >
          {loading ? "Creando..." : "Crear cuenta"}
        </button>

        <p className="text-sm mt-2">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-emerald-700 underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
}
