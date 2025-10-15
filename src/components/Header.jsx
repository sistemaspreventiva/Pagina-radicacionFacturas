import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const base = "inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors";
const linkClass = ({ isActive }) =>
  isActive
    ? `${base} text-white bg-[var(--ps-blue)] shadow-sm`
    : `${base} text-[color:var(--ps-navy)] hover:text-[var(--ps-blue)] hover:bg-slate-100`;

export default function Header() {
  const [open, setOpen] = useState(false);
  const { token, logout } = useAuth();
  const nav = useNavigate();

  return (
    <header className="sticky top-0 z-50">
      <div className="h-1 bg-gradient-to-r from-[var(--ps-cyan)] via-[var(--ps-blue)] to-[var(--ps-orange)]" />
      <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3" end>
            <img src="/logo-preventiva.png" alt="" className="h-9 w-auto" onError={(e)=>e.currentTarget.style.display="none"} />
            <div className="leading-tight">
              <p className="text-[11px] uppercase tracking-wide text-[color:rgba(10,42,77,.7)]">Preventiva Salud IPS</p>
              <h1 className="text-sm font-semibold text-[color:var(--ps-navy)]">Radicación de Facturas</h1>
            </div>
          </NavLink>

          <div className="hidden md:flex items-center gap-2">
            <nav className="flex items-center gap-1">
              <NavLink to="/" end className={linkClass}>Inicio</NavLink>
              <NavLink to="/instructivo" className={linkClass}>Instructivo</NavLink>
            </nav>
            {token && (
              <>
                <NavLink to="/dashboard" className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-[var(--ps-orange)] text-white hover:brightness-90">Ir al Dashboard</NavLink>
                <button onClick={()=>{logout(); nav("/");}} className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium border text-[color:var(--ps-navy)] hover:bg-slate-100">Salir</button>
              </>
            )}
          </div>

          <button onClick={()=>setOpen(v=>!v)} className="md:hidden inline-flex items-center justify-center rounded-lg border px-3 py-2 text-[color:var(--ps-navy)]">☰</button>
        </div>

        {open && (
          <nav className="md:hidden border-t bg-white">
            <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2">
              <NavLink onClick={()=>setOpen(false)} to="/" end className={linkClass}>Inicio</NavLink>
              <NavLink onClick={()=>setOpen(false)} to="/instructivo" className={linkClass}>Instructivo</NavLink>
              {token && (
                <>
                  <NavLink onClick={()=>setOpen(false)} to="/dashboard" className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-[var(--ps-orange)] text-white">Ir al Dashboard</NavLink>
                  <button onClick={()=>{setOpen(false); logout(); nav("/");}} className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium border text-[color:var(--ps-navy)]">Salir</button>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
