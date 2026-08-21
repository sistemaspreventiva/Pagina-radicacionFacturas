import { useAuth } from "../context/AuthContext.jsx";
import { getWindow, etiquetaPeriodo, toPeriodo } from "../lib/dateWindow.js";
import UploadForm from "../components/UploadForm.jsx";

const SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const w = getWindow();
  const abierta = w.isOpenToday;

  // Rejilla que empieza en lunes: getDay() da 0=domingo.
  const primerDia = new Date(w.year, w.month, 1).getDay();
  const huecos = (primerDia + 6) % 7;
  const dias = [
    ...Array.from({ length: huecos }, () => null),
    ...Array.from({ length: w.lastDate }, (_, i) => i + 1),
  ];

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 md:pt-20 pb-8">
      {/* ── Encabezado ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-6 pb-8 border-b-2 border-ps-navy">
        <div>
          <span className="inline-block px-2.5 py-1 bg-ps-blue-50 text-ps-blue text-[11px] font-semibold tracking-[0.14em] uppercase">
            {user?.role}
          </span>
          <h1 className="mt-4 text-title font-semibold text-ps-navy">
            {user?.name || user?.username}
          </h1>
        </div>
        <button onClick={logout} className="btn-ghost shrink-0">
          Cerrar sesión
        </button>
      </div>

      {/* ── Estado de la ventana ────────────────────────────────── */}
      <div
        data-guia="dash-estado"
        className="cintillo my-8"
        style={
          abierta
            ? { "--borde": "var(--color-ps-teal)", "--fondo": "var(--color-ps-teal-50)" }
            : { "--borde": "var(--color-ps-warn)", "--fondo": "var(--color-ps-warn-50)" }
        }
      >
        <p
          className={`text-section font-semibold ${
            abierta ? "text-ps-teal" : "text-ps-warn"
          }`}
        >
          {abierta ? "Ventana abierta" : "Ventana cerrada"}
        </p>
        <p className="mt-1 text-sm text-ps-muted">
          La radicación está habilitada{" "}
          <span className="text-ps-ink font-medium">{w.texto}</span>, para
          todos los roles.
        </p>
      </div>

      {/* ── Calendario + formulario ─────────────────────────────── */}
      <div className="grid lg:grid-cols-[auto_1fr] gap-8">
        <Calendario w={w} dias={dias} />

        <div className="card" style={{ "--barra": "var(--color-ps-accent)" }}>
          <p className="eyebrow">Radicar</p>
          <h2 className="mt-2 text-section font-semibold text-ps-navy">
            Cuenta de cobro
          </h2>
          <div className="mt-7">
            <UploadForm canUpload={abierta} user={user} />
          </div>
        </div>
      </div>
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Calendario: los días habilitados van en turquesa sólido y hoy
   se marca con un anillo naranja.
   ══════════════════════════════════════════════════════════════════ */
function Calendario({ w, dias }) {
  const hoy = w.today.getDate();

  return (
    <section data-guia="dash-calendario" className="card lg:w-72" style={{ "--barra": "var(--color-ps-teal)" }}>
      <p className="eyebrow">{w.tz}</p>
      <h2 className="mt-2 text-section font-semibold text-ps-navy">
        {etiquetaPeriodo(toPeriodo(w.today))}
      </h2>

      <div className="mt-6 grid grid-cols-7 gap-y-1 text-center">
        {SEMANA.map((d) => (
          <div key={d} className="pb-3 text-[11px] font-medium text-ps-muted">
            {d}
          </div>
        ))}

        {dias.map((d, i) => {
          if (d === null) return <div key={`h-${i}`} />;
          const habilitado = w.isDayEnabled(d);
          const esHoy = d === hoy;

          return (
            <div key={d} className="relative py-0.5">
              <span
                className={`inline-flex items-center justify-center w-7 h-7 text-sm ${
                  habilitado
                    ? "bg-ps-teal text-white font-semibold"
                    : "text-slate-300"
                } ${esHoy ? "ring-2 ring-ps-accent ring-offset-1" : ""}`}
              >
                {d}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-ps-line flex flex-col gap-2.5 text-xs text-ps-muted">
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 bg-ps-teal" />
          {w.mesCompleto ? "Todo el mes habilitado" : "Días habilitados"}
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 ring-2 ring-ps-accent ring-inset" />
          Hoy
        </span>
      </div>
    </section>
  );
}
