import { useState } from "react";
import { registerUser } from "../services/api";
import { Link, useNavigate } from "react-router-dom";

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
    if (!form.email || !form.username || !form.password) {
      setMsg({ type: "error", text: "Completa email, usuario y contraseña." });
      return;
    }
    try {
      setLoading(true);
      const { token, user } = await registerUser(form);
      localStorage.setItem("token", token);
      setMsg({ type: "ok", text: `Usuario creado: ${user.username}` });
      setTimeout(() => nav("/dashboard"), 500);
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Error registrando." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 grid md:grid-cols-2 gap-10 items-center">
      <div className="hidden md:block">
        <div className="rounded-2xl bg-[var(--p-prim)]/5 p-8 border border-[var(--p-prim)]/10">
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">
            Crea tu cuenta
          </h2>
          <p className="text-slate-600">
            Para roles asistencial y administrativo: cargue del 1 al 10 de cada mes. Conductores: todo el mes.
          </p>
        </div>
      </div>

      <div className="max-w-md w-full mx-auto">
        <h1 className="text-xl font-semibold mb-4 text-slate-800">Registro</h1>

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
            className="rounded-md bg-[var(--p-prim)] hover:bg-[var(--p-prim-600)] text-white px-4 py-2"
          >
            {loading ? "Creando..." : "Crear cuenta"}
          </button>

          <p className="text-sm mt-2">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-[var(--p-sec)] underline">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
