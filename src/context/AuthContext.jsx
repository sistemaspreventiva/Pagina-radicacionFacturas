// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";

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

  useEffect(() => {
    const raw = localStorage.getItem("session");
    if (raw) {
      const s = JSON.parse(raw);
      setUser(s.user); setToken(s.token);
    }
  }, []);

  const login = (username, password) => {
    const u = readUsers().find(x => x.username === username && x.password === password);
    if (!u) return false;
    const session = { user: u, token: "local-token" };
    localStorage.setItem("session", JSON.stringify(session));
    setUser(u); setToken(session.token);
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

  // ventana de radicación (1-10 para roles no conductores)
  const canUploadToday = useMemo(() => {
    if (!user) return false;
    if (user.role === "conductor") return true;
    const d = new Date();
    const day = d.getDate();
    return day >= 1 && day <= 10;
  }, [user]);

  const value = { user, token, login, logout, register, ROLES, canUploadToday };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
