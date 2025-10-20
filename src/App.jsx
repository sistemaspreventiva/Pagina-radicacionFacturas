// src/App.jsx
// src/App.jsx
import { Link, NavLink } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes.jsx"; // ← ruta correcta
import logo from "./assets/logo.svg"; // si no tienes logo.svg, comenta esta línea y la <img />

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/70">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            {/* Si no tienes el logo aún, comenta la siguiente línea */}
            <img src={logo} alt="Preventiva IPS" className="h-10 w-auto" />
            <div className="leading-tight">
              <p className="font-semibold text-slate-800">Preventiva Salud IPS</p>
              <p className="text-xs text-slate-500">Radicación de Facturas</p>
            </div>
          </Link>
          <nav className="flex items-center gap-6">
            <NavLink to="/login" className="text-sm text-slate-600">Inicio</NavLink>
            <NavLink to="/register" className="text-sm text-slate-600">Registro</NavLink>
            <NavLink to="/dashboard" className="text-sm text-slate-600">Radicar</NavLink>
          </nav>
        </div>
      </header>

      {/* Rutas */}
      <main className="flex-1">
        <AppRoutes />
      </main>

      {/* Footer */}
      <footer className="mt-10 border-t border-slate-200/70 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-600 grid gap-2 md:flex md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Preventiva Salud IPS</p>
          <p className="opacity-80">
            Soporte: <a href="mailto:contabilidad@preventivaips.com.co" className="underline">contabilidad@preventivaips.com.co</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
