import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Instructivo from "../pages/Instructivo.jsx"; // ← NUEVO
import { useAuth } from "../context/AuthContext.jsx";

function ProtectedRoute() {
  const { token, ready } = useAuth();

  // La sesión se lee de localStorage en un efecto, así que en el primer render
  // token todavía es null. Sin esta espera, refrescar /dashboard expulsa al login.
  if (!ready) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-10 text-slate-500">
        Cargando…
      </main>
    );
  }

  return token ? <Outlet /> : <Navigate to="/" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/instructivo" element={<Instructivo />} /> {/* ← NUEVO (pública) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
