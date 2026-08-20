import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, ROLES } from "../context/AuthContext.jsx";

const ETIQUETA_ROL = {
  asistencial: "Asistencial",
  conductor: "Transporte / Conductor",
  administrativo: "Administrativo",
};

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dni, setDni] = useState("");
  const [username, setUsername] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [role, setRole] = useState("asistencial");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const nav = useNavigate();

  const onSubmit = (e) => {
    e.preventDefault();
    setErr("");
    setOk("");
    if (!name || !email || !dni || !username || !pass)
      return setErr("Completa todos los campos.");
    if (!/^\d{5,12}$/.test(dni)) return setErr("La cédula debe tener entre 5 y 12 dígitos.");
    if (pass.length < 6) return setErr("La contraseña debe tener al menos 6 caracteres.");
    if (pass !== pass2) return setErr("Las contraseñas no coinciden.");

    try {
      register({ name, email, username, password: pass, role, dni });
      setOk("Cuenta creada. Te llevamos al inicio de sesión…");
      setTimeout(() => nav("/"), 900);
    } catch (ex) {
      setErr(ex.message || "No se pudo crear la cuenta.");
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6">
      <div className="max-w-lg pt-16 md:pt-24 pb-8">
        <p className="eyebrow">Preventiva Salud IPS</p>
        <h1 className="mt-5 text-title font-semibold text-ps-navy">
          Crear cuenta
        </h1>
        <p className="mt-4 text-ps-muted border-t border-ps-line pt-5">
          Tu cédula se usa para generar el consecutivo de la cuenta de cobro.
        </p>

        <form onSubmit={onSubmit} className="mt-12">
          {err && (
            <p
              role="alert"
              className="mb-6 border-l-2 border-ps-warn pl-3 text-sm text-ps-warn"
            >
              {err}
            </p>
          )}
          {ok && (
            <p
              role="status"
              className="mb-6 border-l-2 border-ps-ok pl-3 text-sm text-ps-ok"
            >
              {ok}
            </p>
          )}

          <div className="space-y-7">
            <Campo
              id="nombre"
              etiqueta="Nombre completo"
              value={name}
              onChange={setName}
              autoComplete="name"
            />
            <Campo
              id="email"
              etiqueta="Correo electrónico"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />
            <Campo
              guia="reg-cedula"
              id="dni"
              etiqueta="Cédula"
              value={dni}
              onChange={(v) => setDni(v.replace(/\D/g, ""))}
              inputMode="numeric"
              ayuda="Solo números, sin puntos ni espacios."
            />
            <Campo
              id="usuario"
              etiqueta="Usuario"
              value={username}
              onChange={setUsername}
              autoComplete="username"
            />

            <div data-guia="reg-rol">
              <label htmlFor="rol" className="eyebrow block mb-1.5">
                Rol
              </label>
              <select
                id="rol"
                className="field cursor-pointer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ETIQUETA_ROL[r] || r}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-7">
              <Campo
                id="pass"
                etiqueta="Contraseña"
                type="password"
                value={pass}
                onChange={setPass}
                autoComplete="new-password"
              />
              <Campo
                id="pass2"
                etiqueta="Repetir contraseña"
                type="password"
                value={pass2}
                onChange={setPass2}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary mt-10 w-full sm:w-auto">
            Crear cuenta
            <span aria-hidden="true">→</span>
          </button>

          <p className="mt-8 text-sm text-ps-muted">
            ¿Ya tienes cuenta?{" "}
            <Link
              to="/"
              className="text-ps-ink font-medium underline underline-offset-4 decoration-ps-line hover:decoration-ps-accent transition-colors"
            >
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

function Campo({ id, etiqueta, value, onChange, ayuda, guia, type = "text", ...rest }) {
  return (
    <div data-guia={guia}>
      <label htmlFor={id} className="eyebrow block mb-1.5">
        {etiqueta}
      </label>
      <input
        id={id}
        type={type}
        className="field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
      {ayuda && <p className="mt-1.5 text-xs text-ps-muted">{ayuda}</p>}
    </div>
  );
}
