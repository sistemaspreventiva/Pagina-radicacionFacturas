import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, ROLES } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dni, setDni] = useState("");              // ← nuevo
  const [username, setUsername] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [role, setRole] = useState("asistencial");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const nav = useNavigate();

  const onSubmit = (e) => {
    e.preventDefault();
    setErr(""); setOk("");
    if (!name || !email || !dni || !username || !pass) return setErr("Completa todos los campos");
    if (!/^\d{5,12}$/.test(dni)) return setErr("Cédula/DNI: 5-12 dígitos");
    if (pass !== pass2) return setErr("Las contraseñas no coinciden");
    try {
      register({ name, email, username, password: pass, role, dni });
      setOk("Registro exitoso. Ahora puedes iniciar sesión.");
      setTimeout(() => nav("/"), 800);
    } catch (ex) {
      setErr(ex.message || "No se pudo registrar");
    }
  };

  return (
    <main className="min-h-[calc(100vh-48px)] grid place-items-center bg-slate-50">
      <form onSubmit={onSubmit} className="bg-white p-6 rounded-2xl shadow border w-[28rem] space-y-3">
        <h1 className="text-xl font-bold text-[color:var(--ps-navy)]">Crear cuenta</h1>
        {err && <p className="text-sm text-red-600">{err}</p>}
        {ok && <p className="text-sm text-green-700">{ok}</p>}

        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm mb-1">Nombre completo</label>
            <input className="w-full border rounded px-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input type="email" className="w-full border rounded px-3 py-2" value={email} onChange={(e)=>setEmail(e.target.value)} />
          </div>

          {/* DNI/Cédula */}
          <div>
            <label className="block text-sm mb-1">Cédula / DNI</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={dni}
              onChange={(e)=>setDni(e.target.value.replace(/\D/g,""))}
              placeholder="Solo números"
            />
            <p className="text-xs text-slate-500 mt-1">
              Se usará para generar el consecutivo automático (DSDDYY-CC).
            </p>
          </div>

          <div>
            <label className="block text-sm mb-1">Usuario</label>
            <input className="w-full border rounded px-3 py-2" value={username} onChange={(e)=>setUsername(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Rol</label>
            <select className="w-full border rounded px-3 py-2 bg-white" value={role} onChange={(e)=>setRole(e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{r[0].toUpperCase()+r.slice(1)}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Contraseña</label>
              <input type="password" className="w-full border rounded px-3 py-2" value={pass} onChange={(e)=>setPass(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Repetir contraseña</label>
              <input type="password" className="w-full border rounded px-3 py-2" value={pass2} onChange={(e)=>setPass2(e.target.value)} />
            </div>
          </div>
        </div>

        <button className="w-full bg-sky-600 hover:bg-sky-700 text-white py-2 rounded-lg">Registrarme</button>
        <p className="text-sm text-slate-600">
          ¿Ya tienes cuenta? <Link className="text-[color:var(--ps-orange)] hover:underline" to="/">Inicia sesión</Link>
        </p>
      </form>
    </main>
  );
}
