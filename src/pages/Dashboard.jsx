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
    <main className="max-w-5xl mx-auto px-6 pt-16 md:pt-20 pb-8">
      {/* ── Encabezado ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-6 pb-8 border-b border-ps-line">
        <div>
          <p className="eyebrow">{user?.role}</p>
          <h1 className="mt-3 text-title font-semibold text-ps-navy">
            {user?.name || user?.username}
          </h1>
        </div>
        <button onClick={logout} className="btn-ghost shrink-0">
          Cerrar sesión
        </button>
      </div>

      {/* ── Estado de la ventana ────────────────────────────────── */}
      <div className="py-8 border-b border-ps-line">
        <div className="flex items-baseline gap-3">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full translate-y-[-2px] ${
              abierta ? "bg-ps-teal" : "bg-ps-warn"
            }`}
            aria-hidden="true"
          />
          <p className="text-section font-medium text-ps-ink">
            {abierta ? "Ventana abierta" : "Ventana cerrada"}
          </p>
        </div>
        <p className="mt-2 text-ps-muted pl-[18px]">
          La radicación está habilitada{" "}
          <span className="text-ps-ink font-medium">
            del {w.openFrom} al {w.openTo}
          </span>{" "}
          de cada mes, para todos los roles.
        </p>
      </div>

      {/* ── Calendario + formulario ─────────────────────────────── */}
      <div className="grid lg:grid-cols-[auto_1fr] gap-12 lg:gap-16 pt-10">
        <Calendario w={w} dias={dias} />

        <div>
          <p className="eyebrow">Radicar</p>
          <h2 className="mt-3 text-section font-medium text-ps-ink">
            Cuenta de cobro
          </h2>
          <div className="mt-8">
            <UploadForm canUpload={abierta} user={user} />
          </div>
        </div>
      </div>
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Calendario: sin cajas ni bordes. El día habilitado se distingue
   por peso tipográfico; hoy, por el punto naranja.
   ══════════════════════════════════════════════════════════════════ */
function Calendario({ w, dias }) {
  const hoy = w.today.getDate();

  return (
    <section className="lg:w-72">
      <p className="eyebrow">{w.tz}</p>
      <h2 className="mt-3 text-section font-medium text-ps-ink">
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
            <div key={d} className="relative py-1.5">
              <span
                className={
                  habilitado
                    ? "text-sm font-semibold text-ps-navy"
                    : "text-sm text-ps-line"
                }
              >
                {d}
              </span>
              {esHoy && (
                <span
                  className="absolute left-1/2 -translate-x-1/2 bottom-0 w-1 h-1 rounded-full bg-ps-accent"
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-ps-line flex flex-col gap-2 text-xs text-ps-muted">
        <span className="flex items-center gap-2">
          <span className="font-semibold text-ps-navy">1</span>
          Días habilitados
        </span>
        <span className="flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-ps-accent" />
          Hoy
        </span>
      </div>
    </section>
  );
}
