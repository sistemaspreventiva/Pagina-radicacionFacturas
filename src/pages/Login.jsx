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
    <main className="max-w-5xl mx-auto px-6 py-10 md:py-14">
      <div className="grid md:grid-cols-2 border border-ps-line">
        {/* ── Formulario ──────────────────────────────────────── */}
        <div className="p-8 sm:p-12">
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

            <div className="space-y-7">
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
        <aside className="panel-marca relative overflow-hidden p-8 sm:p-12 flex flex-col justify-between gap-10 min-h-[22rem]">
          {/* Aura del logo, muy tenue */}
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 w-80 h-80 rounded-full opacity-25 blur-3xl"
            style={{ background: "var(--color-ps-teal)" }}
          />

          <div className="relative">
            <div className="bg-white/95 p-5 inline-block">
              <img
                src="/logo-preventiva-marca.png"
                alt="Preventiva Salud IPS"
                className="w-44 h-auto object-contain"
              />
            </div>
          </div>

          <div className="relative">
            <p className="text-xs font-semibold tracking-[0.14em] uppercase text-ps-teal-100">
              Ventana de radicación
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-tight text-white">
              {OPEN_FROM} — {OPEN_TO}
            </p>
            <p className="mt-2 text-sm text-white/70">de cada mes</p>

            <Link
              to="/instructivo"
              className="mt-7 inline-flex items-center gap-2 border-b border-white/30 pb-1 text-sm font-medium text-white hover:border-ps-accent transition-colors"
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
