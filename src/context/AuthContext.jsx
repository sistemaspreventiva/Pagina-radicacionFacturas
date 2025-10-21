import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

const LS_TOKEN = "token";
const LS_USER = "currentUser";
const LS_USERS = "users";
const ROLES = ["asistencial", "conductor", "administrativo"];

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem(LS_TOKEN));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(LS_USER);
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (!localStorage.getItem(LS_USERS)) {
      localStorage.setItem(LS_USERS, JSON.stringify([]));
    }
  }, []);

  const register = ({ name, email, username, password, role }) => {
    if (!ROLES.includes(role)) throw new Error("Rol inválido");
    const list = JSON.parse(localStorage.getItem(LS_USERS) || "[]");

    const exists = list.some(
      u =>
        u.username.toLowerCase() === username.toLowerCase() ||
        u.email.toLowerCase() === email.toLowerCase()
    );
    if (exists) throw new Error("Usuario o email ya registrado");

    const newUser = {
      id: crypto.randomUUID(),
      name,
      email,
      username,
      password,  // solo demo (en backend: hash)
      role,
      createdAt: new Date().toISOString(),
    };
    list.push(newUser);
    localStorage.setItem(LS_USERS, JSON.stringify(list));
    return true;
  };

  const login = (username, password) => {
    const list = JSON.parse(localStorage.getItem(LS_USERS) || "[]");
    const found = list.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    if (!found) return false;

    const t = "dev-token-" + found.id;
    setToken(t);
    const cu = {
      id: found.id,
      name: found.name,
      email: found.email,
      username: found.username,
      role: found.role || "asistencial",
    };
    setUser(cu);
    localStorage.setItem(LS_TOKEN, t);
    localStorage.setItem(LS_USER, JSON.stringify(cu));
    return true;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_USER);
  };

  return (
    <AuthContext.Provider value={{ token, user, register, login, logout, ROLES }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
