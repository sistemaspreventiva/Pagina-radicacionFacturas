// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
export const ROLES = ["asistencial", "conductor", "administrativo"];

function readUsers() {
  try { return JSON.parse(localStorage.getItem("users") || "[]"); }
  catch { return []; }
}
function writeUsers(list) { localStorage.setItem("users", JSON.stringify(list)); }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  // false hasta terminar de leer localStorage: evita expulsar al login al refrescar
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("session");
      if (raw) {
        const s = JSON.parse(raw);
        setUser(s.user); setToken(s.token);
      }
    } catch {
      localStorage.removeItem("session"); // sesion corrupta: se descarta
    } finally {
      setReady(true);
    }
  }, []);

  const login = (username, password) => {
    const u = readUsers().find(x => x.username === username && x.password === password);
    if (!u) return false;
    const { password: _omit, ...perfil } = u; // la clave no viaja a la sesion
    const session = { user: perfil, token: "local-token" };
    localStorage.setItem("session", JSON.stringify(session));
    setUser(perfil); setToken(session.token);
    return true;
  };

  const logout = () => {
    localStorage.removeItem("session");
    setUser(null); setToken(null);
  };

  const register = ({ name, email, username, password, role, dni }) => {
    if (!ROLES.includes(role)) throw new Error("Rol inválido");
    if (!dni || !/^\d{5,12}$/.test(String(dni))) throw new Error("Cédula/DNI inválido");
    const list = readUsers();
    if (list.some(x => x.username === username)) throw new Error("Usuario ya existe");
    const u = { name, email, username, password, role, dni: String(dni) };
    list.push(u); writeUsers(list);
    return true;
  };

  // La ventana de radicación vive en src/lib/dateWindow.js (una sola fuente de verdad).
  const value = { user, token, ready, login, logout, register, ROLES };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
