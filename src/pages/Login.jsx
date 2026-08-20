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
    <main className="max-w-5xl mx-auto px-6">
      <div className="grid md:grid-cols-[1fr_auto] gap-14 md:gap-16 items-start pt-16 md:pt-20 pb-4">
        {/* ── Titular ─────────────────────────────────────────── */}
        <div className="max-w-xl">
          <p className="eyebrow">Preventiva Salud IPS</p>

          <h1 className="mt-5 text-title md:text-display font-semibold text-ps-navy">
            Radicación de
            <br />
            cuentas de cobro
          </h1>

          <div className="mt-8 flex items-baseline gap-3 border-t border-ps-line pt-5">
            <span className="tick translate-y-0.5" aria-hidden="true" />
            <p className="text-ps-muted">
              Radica del{" "}
              <span className="text-ps-ink font-medium">
                {OPEN_FROM} al {OPEN_TO}
              </span>{" "}
              de cada mes.{" "}
              <Link
                to="/instructivo"
                className="text-ps-blue hover:text-ps-navy font-medium underline underline-offset-4 decoration-ps-blue/40 hover:decoration-current transition-colors"
              >
                Ver instructivos
              </Link>
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={onSubmit} className="mt-12 max-w-sm">
            {err && (
              <p
                role="alert"
                className="mb-6 border-l-2 border-ps-warn pl-3 text-sm text-ps-warn"
              >
                {err}
              </p>
            )}

            <div className="space-y-7">
              <div>
                <label
                  htmlFor="usuario"
                  className="eyebrow block mb-1.5"
                >
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
                <label
                  htmlFor="clave"
                  className="eyebrow block mb-1.5"
                >
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

            <button type="submit" className="btn-primary mt-10 w-full sm:w-auto">
              Iniciar sesión
              <span aria-hidden="true">→</span>
            </button>

            <p className="mt-8 text-sm text-ps-muted">
              ¿No tienes cuenta?{" "}
              <Link
                to="/register"
                className="text-ps-ink font-medium underline underline-offset-4 decoration-ps-line hover:decoration-ps-accent transition-colors"
              >
                Regístrate
              </Link>
            </p>
          </form>
        </div>

        {/* ── Logo ────────────────────────────────────────────── */}
        <div className="hidden md:block w-64 pt-3">
          <img
            src="/logo-preventiva-marca.png"
            alt="Preventiva Salud IPS"
            className="w-full h-auto object-contain"
          />
        </div>
      </div>
    </main>
  );
}
