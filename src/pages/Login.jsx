// src/pages/Login.jsx
import { useState } from "react";
import { loginUser, fetchMe } from "../services/api";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [emailOrUser, setEmailOrUser] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg(null);

    if (!emailOrUser || !password) {
      setMsg({ type: "error", text: "Completa usuario/email y contraseña." });
      return;
    }

    try {
      setLoading(true);
      const { token, user } = await loginUser({ emailOrUser, password });
      localStorage.setItem("token", token);
      // (Opcional) Validar sesión
      await fetchMe(token);
      setMsg({ type: "ok", text: `Bienvenido, ${user.username}` });
      setTimeout(() => nav("/dashboard"), 500);
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Error de inicio de sesión." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Iniciar sesión</h1>

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
          <label className="block text-sm mb-1">Usuario o Email</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="text"
            value={emailOrUser}
            onChange={(e) => setEmailOrUser(e.target.value)}
            placeholder="usuario o correo@dominio.com"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Contraseña</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2"
        >
          {loading ? "Ingresando..." : "Entrar"}
        </button>

        <p className="text-sm mt-2">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="text-emerald-700 underline">
            Regístrate
          </Link>
        </p>
      </form>
    </div>
  );
}
