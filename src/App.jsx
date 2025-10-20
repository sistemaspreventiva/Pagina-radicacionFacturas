import { Link, NavLink } from "react-router-dom";
import AppRoutes from "./AppRoutes";
import logo from "./assets/logo.svg";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/70">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Preventiva IPS" className="h-10 w-auto" />
            <div className="leading-tight">
              <p className="font-semibold text-slate-800">Preventiva Salud IPS</p>
              <p className="text-xs text-slate-500">Radicación de Facturas</p>
            </div>
          </Link>

          <nav className="flex items-center gap-6">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `text-sm ${isActive ? "text-[var(--p-sec)] font-medium" : "text-slate-600"}`
              }
            >
              Inicio
            </NavLink>

            <NavLink
              to="/instructivo"
              className="text-sm text-slate-600"
              onClick={(e) => {
                e.preventDefault();
                // Descargas de formatos (3 categorías)
                const base = "/formatos"; // sirve desde /public/formatos/*
                const archivos = [
                  `${base}/asistencial/FORMATO1.pdf`,
                  `${base}/asistencial/FORMATO2.xlsx`,
                  `${base}/asistencial/FORMATO3.docx`,
                  `${base}/administrativo/FORMATO1.pdf`,
                  `${base}/administrativo/FORMATO2.xlsx`,
                  `${base}/administrativo/FORMATO3.docx`,
                  `${base}/transporte/FORMATO1.pdf`,
                  `${base}/transporte/FORMATO2.xlsx`,
                  `${base}/transporte/FORMATO3.docx`
                ];
                archivos.forEach((url) => window.open(url, "_blank"));
              }}
            >
              Instructivo
            </NavLink>

            <NavLink
              to="/login"
              className={({ isActive }) =>
                `text-sm ${isActive ? "text-[var(--p-sec)] font-medium" : "text-slate-600"}`
              }
            >
              Entrar
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Contenido */}
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
