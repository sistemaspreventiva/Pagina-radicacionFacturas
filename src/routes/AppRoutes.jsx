import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";   // <-- default
import Dashboard from "../pages/Dashboard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function ProtectedRoute() {
  const { token } = useAuth();
  return token ? <Outlet /> : <Navigate to="/" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
