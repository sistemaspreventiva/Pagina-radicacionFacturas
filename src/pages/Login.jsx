import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { OPEN_FROM, OPEN_TO } from "../lib/dateWindow.js";

export default function Login() {
  const [username, setUsername] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const { login } = useAuth();
  const nav = useNavigate();

  const onSubmit = (e) => {
    e.preventDefault();
    setErr("");
    if (!username || !pass) return setErr("Ingresa usuario y contraseña.");
    if (login(username, pass)) nav("/dashboard");
    else setErr("Usuario o contraseña incorrectos.");
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      <div className="grid md:grid-cols-2 border border-ps-line">
        {/* ── Formulario ──────────────────────────────────────── */}
        <div className="p-6 sm:p-10 lg:p-12">
          <p className="eyebrow">Preventiva Salud IPS</p>
          <h1 className="mt-4 text-title font-semibold text-ps-navy">
            Radicación de
            <br />
            cuentas de cobro
          </h1>

          <form onSubmit={onSubmit} className="mt-10">
            {err && (
              <p
                role="alert"
                className="cintillo mb-7 text-sm text-ps-warn"
                style={{ "--borde": "var(--color-ps-warn)", "--fondo": "var(--color-ps-warn-50)" }}
              >
                {err}
              </p>
            )}

            <div className="space-y-7" data-guia="login-usuario">
              <div>
                <label htmlFor="usuario" className="eyebrow block mb-1.5">
                  Usuario
                </label>
                <input
                  id="usuario"
                  className="field"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="clave" className="eyebrow block mb-1.5">
                  Contraseña
                </label>
                <input
                  id="clave"
                  type="password"
                  className="field"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary mt-9 w-full">
              Iniciar sesión
              <span aria-hidden="true">→</span>
            </button>

            <p className="mt-7 text-sm text-ps-muted">
              ¿No tienes cuenta?{" "}
              <Link
                to="/register"
                className="text-ps-blue font-medium underline underline-offset-4 decoration-ps-blue/40 hover:decoration-current transition-colors"
              >
                Regístrate
              </Link>
            </p>
          </form>
        </div>

        {/* ── Panel de marca ──────────────────────────────────── */}
        <aside className="relative overflow-hidden bg-ps-blue-50 border-t md:border-t-0 md:border-l border-ps-line p-6 sm:p-10 flex flex-col justify-center gap-8 sm:gap-10">
          {/* Aura muy tenue, recordando el halo del logo */}
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-20 w-72 h-72 rounded-full opacity-40 blur-3xl"
            style={{ background: "var(--color-ps-teal-100)" }}
          />

          <img
            src="/logo-preventiva-marca.png"
            alt="Preventiva Salud IPS"
            className="relative w-full max-w-xs mx-auto h-auto object-contain"
          />

          <div className="relative text-center" data-guia="login-ventana">
            <p className="eyebrow text-ps-blue">Ventana de radicación</p>
            <p className="mt-2 text-5xl font-semibold tracking-tight text-ps-navy">
              {OPEN_FROM} <span className="text-ps-teal">—</span> {OPEN_TO}
            </p>
            <p className="mt-1 text-sm text-ps-muted">de cada mes</p>

            <Link
              to="/instructivo"
              data-guia="login-instructivos"
              className="mt-6 inline-flex items-center gap-2 border-b-2 border-ps-accent pb-1 text-sm font-semibold text-ps-navy hover:text-ps-blue transition-colors"
            >
              Ver instructivos y formatos
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
