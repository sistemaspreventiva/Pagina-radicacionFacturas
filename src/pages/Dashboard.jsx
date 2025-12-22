import { useAuth } from "../context/AuthContext.jsx";
import { getWindowForRole } from "../lib/dateWindow.js";
import UploadForm from "../components/UploadForm.jsx";

const week = ["D","L","M","X","J","V","S"];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const role = user?.role || "asistencial";
  const w = getWindowForRole(role);

  const monthName = w.today.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  const firstDow = new Date(w.year, w.month, 1).getDay(); // 0=Dom
  const days = [];
  for (let i = 0; i < firstDow; i++) days.push(null);
  for (let d = 1; d <= w.lastDate; d++) days.push(d);

  const canUploadToday = w.isOpenToday;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[color:var(--ps-navy)]">
            Hola {user?.name || user?.username}
          </h2>
          <p className="text-slate-600">
            Rol: <span className="font-medium capitalize">{role}</span>
          </p>
        </div>
        <button onClick={logout} className="rounded-lg border px-3 py-2 hover:bg-slate-100">
          Cerrar sesión
        </button>
      </div>

      <div className="mt-4 p-3 rounded-xl border bg-white">
        {role === "conductor" ? (
          <p className="text-green-700">
            Para tu rol (<b>Conductor</b>) la radicación está <b>habilitada del 1 al 10 de cada mes</b>.
          </p>
        ) : (
          <p className="text-slate-700">
            Para tu rol (<b>{role}</b>) la radicación está <b>habilitada del 1 al 10 de cada mes</b>.
          </p>
        )}
        <p className={`mt-1 text-sm ${canUploadToday ? "text-green-700" : "text-red-600"}`}>
          Hoy: {canUploadToday ? "Ventana abierta ✅" : "Ventana cerrada ❌"}
        </p>
      </div>

      <div className="mt-6 grid md:grid-cols-2 gap-6">
        {/* Calendario */}
        <div className="p-4 rounded-2xl border bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[color:var(--ps-navy)] capitalize">{monthName}</h3>
            <span className="text-xs text-slate-500">{w.tz}</span>
          </div>

          <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-500 mb-2">
            {week.map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((d, idx) => {
              if (d === null) return <div key={`x-${idx}`} />;
              const enabled = w.isDayEnabled(d);
              const isToday = d === w.today.getDate();
              const base = "py-2 rounded-lg border text-sm";
              const ok = "bg-green-50 border-green-200 text-green-700";
              const ko = "bg-slate-50 border-slate-200 text-slate-400";
              return (
                <div
                  key={d}
                  className={`${base} ${enabled ? ok : ko} ${isToday ? "ring-2 ring-[var(--ps-blue)]" : ""}`}
                >
                  {d}
                </div>
              );
            })}
          </div>
        </div>

        {/* Formulario de radicación */}
        <div className="p-4 rounded-2xl border bg-white">
          <h3 className="font-semibold text-[color:var(--ps-navy)]">Radicar cuenta de cobro</h3>
          <p className="text-xs text-slate-500 mb-3">Destino: contabilidad@preventivaips.com.co</p>
          <UploadForm canUpload={canUploadToday} user={user} />
        </div>
      </div>
    </main>
  );
}
