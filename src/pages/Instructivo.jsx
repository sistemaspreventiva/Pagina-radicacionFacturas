// src/pages/Instructivo.jsx
import {
  instructivos,
  plantillas,
  formatoDe,
  nombreDescarga,
} from "../lib/instructivos.js";
import { OPEN_FROM, OPEN_TO } from "../lib/dateWindow.js";

const VENTANA = `Radicación habilitada del ${OPEN_FROM} al ${OPEN_TO} de cada mes.`;

const ROLES = [
  {
    clave: "asistencial",
    titulo: "Asistencial",
    descripcion: "Formatos para personal asistencial.",
    color: "border-cyan-500",
  },
  {
    clave: "administrativo",
    titulo: "Administrativo",
    descripcion: "Formatos para personal administrativo.",
    color: "border-blue-600",
  },
  {
    clave: "conductores",
    titulo: "Transporte / Conductores",
    descripcion: "Formatos para personal de transporte.",
    color: "border-orange-500",
  },
];

export default function Instructivo() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-[color:var(--ps-navy)] mb-2">
        Instructivos de radicación de cuentas de cobro
      </h1>
      <p className="text-slate-600 mb-2">
        Descarga los formatos y guías necesarios según tu rol.
      </p>
      <p className="text-sm font-medium text-[color:var(--ps-blue)] mb-8">
        {VENTANA}
      </p>

      {/* ── Guía general: video + instructivos ─────────────────────── */}
      <section className="mb-14 bg-white rounded-2xl border p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[color:var(--ps-navy)] mb-2">
          Guía general del proceso de radicación
        </h2>
        <p className="text-sm text-slate-600 mb-6">
          Revisa el video para entender el proceso completo y consulta los
          instructivos de apoyo.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="w-full aspect-video rounded-lg overflow-hidden border bg-black">
            <video
              className="w-full h-full"
              src={encodeURI("/Video/Radicación de Facturas.mp4")}
              controls
              preload="metadata"
              controlsList="nodownload"
            >
              Tu navegador no soporta la reproducción de video.
            </video>
          </div>

          <ul className="flex flex-col gap-3">
            {instructivos.map((doc) => (
              <li key={doc.id}>
                <Documento doc={doc} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Plantillas por rol ─────────────────────────────────────── */}
      <h2 className="text-2xl font-semibold text-[color:var(--ps-navy)] mb-2">
        Formatos según tipo de usuario
      </h2>
      <p className="text-sm text-slate-600 mb-6">
        Descarga el archivo editable para diligenciarlo. El PDF es solo de
        consulta.
      </p>

      <section className="grid md:grid-cols-3 gap-6">
        {ROLES.map((rol) => (
          <Card
            key={rol.clave}
            titulo={rol.titulo}
            descripcion={`${rol.descripcion} ${VENTANA}`}
            items={plantillas[rol.clave] || []}
            color={rol.color}
          />
        ))}
      </section>
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Un documento con sus formatos disponibles
   ══════════════════════════════════════════════════════════════════ */
function Documento({ doc }) {
  return (
    <div className="rounded-lg border px-4 py-3 hover:bg-slate-50 transition-colors">
      <p className="font-medium text-sm text-[color:var(--ps-navy)]">
        <span className="text-slate-400 mr-1">{doc.codigo}</span>
        {doc.titulo}
      </p>

      {doc.descripcion && (
        <p className="text-xs text-slate-500 mt-0.5">{doc.descripcion}</p>
      )}

      <div className="flex flex-wrap gap-2 mt-2">
        {doc.editable && <Descarga doc={doc} ruta={doc.editable} principal />}
        {doc.pdf && <Descarga doc={doc} ruta={doc.pdf} />}
      </div>
    </div>
  );
}

/* Enlace de descarga. Conserva el nombre oficial del documento. */
function Descarga({ doc, ruta, principal = false }) {
  const formato = formatoDe(ruta);
  const estilo = principal
    ? "bg-[var(--ps-blue)] text-white hover:brightness-110"
    : "border text-[color:var(--ps-navy)] hover:bg-slate-100";

  return (
    <a
      href={ruta}
      download={nombreDescarga(doc, ruta)}
      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${estilo}`}
      title={`Descargar ${doc.nombreOficial}.${formato.toLowerCase()}`}
    >
      {formato}
      <span className="opacity-70">↓</span>
    </a>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Tarjeta de plantillas por rol
   ══════════════════════════════════════════════════════════════════ */
function Card({ titulo, descripcion, items, color }) {
  return (
    <div className={`rounded-2xl border ${color} p-5 bg-white shadow-sm`}>
      <h3 className="text-xl font-semibold text-[color:var(--ps-navy)] mb-1">
        {titulo}
      </h3>
      <p className="text-sm text-slate-600 mb-4">{descripcion}</p>

      {items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((doc) => (
            <li key={doc.id}>
              <Documento doc={doc} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-400 italic">
          No hay documentos disponibles.
        </p>
      )}
    </div>
  );
}
