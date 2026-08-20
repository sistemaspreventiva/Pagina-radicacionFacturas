import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const link = ({ isActive }) =>
  [
    "relative py-1 text-sm transition-colors",
    isActive
      ? "text-ps-blue font-semibold after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-0.5 after:bg-ps-accent"
      : "text-ps-muted hover:text-ps-blue",
  ].join(" ");

export default function Header() {
  const [open, setOpen] = useState(false);
  const { token, logout } = useAuth();
  const nav = useNavigate();

  const salir = () => {
    setOpen(false);
    logout();
    nav("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b-2 border-ps-navy">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <NavLink to="/" end className="flex items-center gap-3 shrink-0">
          <img
            src="/logo-preventiva-marca.png"
            alt=""
            className="h-7 w-auto object-contain"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <span className="leading-none">
            <span className="block eyebrow">Preventiva Salud IPS</span>
            <span className="block mt-1 text-sm font-medium text-ps-ink tracking-tight">
              Radicación de cuentas de cobro
            </span>
          </span>
        </NavLink>

        <nav className="hidden md:flex items-center gap-7">
          <NavLink to="/" end className={link}>
            Inicio
          </NavLink>
          <NavLink to="/instructivo" className={link}>
            Instructivo
          </NavLink>
          {token && (
            <>
              <NavLink to="/dashboard" className={link}>
                Dashboard
              </NavLink>
              <button
                onClick={salir}
                className="text-sm text-ps-muted hover:text-ps-ink transition-colors"
              >
                Salir
              </button>
            </>
          )}
        </nav>

        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden -mr-2 p-2 text-ps-ink"
          aria-expanded={open}
          aria-label="Menú"
        >
          <span className="block w-5 space-y-1.5">
            <span
              className={`block h-px bg-current transition-transform ${
                open ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`block h-px bg-current transition-opacity ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-px bg-current transition-transform ${
                open ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t border-ps-line bg-white">
          <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col gap-4">
            <NavLink onClick={() => setOpen(false)} to="/" end className={link}>
              Inicio
            </NavLink>
            <NavLink
              onClick={() => setOpen(false)}
              to="/instructivo"
              className={link}
            >
              Instructivo
            </NavLink>
            {token && (
              <>
                <NavLink
                  onClick={() => setOpen(false)}
                  to="/dashboard"
                  className={link}
                >
                  Dashboard
                </NavLink>
                <button
                  onClick={salir}
                  className="text-left text-sm text-ps-muted"
                >
                  Salir
                </button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
