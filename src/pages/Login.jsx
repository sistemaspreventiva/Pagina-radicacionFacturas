import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [username, setUsername] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const { login } = useAuth();
  const nav = useNavigate();

  const onSubmit = (e) => {
    e.preventDefault();
    setErr("");
    if (!username || !pass) return setErr("Ingresa usuario y contraseña");
    const ok = login(username, pass);
    if (ok) nav("/dashboard"); else setErr("Credenciales inválidas");
  };

  return (
    <main className="bg-slate-50">
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-[color:var(--ps-navy)]">
            Bienvenido a{" "}
            <span className="bg-gradient-to-r from-[var(--ps-cyan)] via-[var(--ps-blue)] to-[var(--ps-orange)] bg-clip-text text-transparent">
              Radicación de Facturas
            </span>
          </h2>
          <p className="text-[color:rgba(10,42,77,.7)]">Preventiva Salud IPS</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <form onSubmit={onSubmit} className="bg-white p-6 rounded-2xl shadow border space-y-3">
            <h1 className="text-lg font-semibold text-[color:var(--ps-navy)]">Iniciar sesión</h1>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <div>
              <label className="block text-sm mb-1">Usuario</label>
              <input className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                     value={username} onChange={(e)=>setUsername(e.target.value)} autoFocus />
            </div>
            <div>
              <label className="block text-sm mb-1">Contraseña</label>
              <input type="password" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                     value={pass} onChange={(e)=>setPass(e.target.value)} />
            </div>
            <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white py-2 rounded-lg font-semibold">
              Iniciar sesión
            </button>
            <p className="text-sm text-slate-600">
              ¿No tienes cuenta? <Link className="text-[color:var(--ps-orange)] hover:underline" to="/register">Regístrate</Link>
            </p>
          </form>

          <div className="hidden md:block">
            <div className="relative rounded-2xl overflow-hidden border aspect-[4/3]">
              <img src="./logo-preventiva.png" alt="Preventiva Salud IPS" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--ps-cyan)]/25 via-[var(--ps-blue)]/20 to-[var(--ps-orange)]/20 mix-blend-multiply" />
              <div className="absolute inset-0 ring-1 ring-white/30"></div>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Suba sus facturas de forma segura los primeros 10 días de cada mes.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
