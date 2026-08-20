// src/pages/Instructivo.jsx
import {
  instructivos,
  plantillas,
  formatoDe,
  nombreDescarga,
} from "../lib/instructivos.js";
import { OPEN_FROM, OPEN_TO } from "../lib/dateWindow.js";

const ROLES = [
  { clave: "asistencial", titulo: "Asistencial", color: "var(--color-ps-teal)" },
  { clave: "administrativo", titulo: "Administrativo", color: "var(--color-ps-blue)" },
  { clave: "conductores", titulo: "Transporte", color: "var(--color-ps-accent)" },
];

export default function Instructivo() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 md:pt-24 pb-8">
      {/* ── Titular ─────────────────────────────────────────────── */}
      <div className="max-w-2xl">
        <p className="eyebrow">Documentos</p>
        <h1 className="mt-5 text-title md:text-display font-semibold text-ps-navy">
          Instructivos
          <br />y formatos
        </h1>
        <div
          className="cintillo mt-8 flex items-baseline gap-3"
          style={{ "--borde": "var(--color-ps-teal)", "--fondo": "var(--color-ps-teal-50)" }}
        >
          <span className="tick translate-y-0.5" aria-hidden="true" />
          <p className="text-ps-muted">
            Radicación habilitada{" "}
            <span className="text-ps-ink font-medium">
              del {OPEN_FROM} al {OPEN_TO}
            </span>{" "}
            de cada mes.
          </p>
        </div>
      </div>

      {/* ── Guía general ────────────────────────────────────────── */}
      <section className="mt-20">
        <Encabezado
          numero="01"
          titulo="Guía del proceso"
          descripcion="Mira el video para entender la radicación de principio a fin, y consulta los instructivos de apoyo."
        />

        <div className="mt-10 grid lg:grid-cols-2 gap-8 items-stretch">
          {/* h-full iguala la altura de la lista; el fondo va aqui y no en
              .card, porque .card fuerza background blanco y dejaba una
              banda clara alrededor del video. */}
          <div
            data-guia="inst-video"
            className="flex items-center justify-center h-full min-h-[16rem] border border-ps-line"
            style={{
              background: "var(--color-ps-ink)",
              borderTop: "3px solid var(--color-ps-teal)",
            }}
          >
            <video
              className="w-full h-full object-contain"
              src={encodeURI("/Video/Radicación de Facturas.mp4")}
              controls
              preload="metadata"
              controlsList="nodownload"
            >
              Tu navegador no soporta la reproducción de video.
            </video>
          </div>

          <ul data-guia="inst-instructivos" className="card !py-2 h-full" style={{ "--barra": "var(--color-ps-blue)" }}>
            {instructivos.map((doc) => (
              <Documento key={doc.id} doc={doc} />
            ))}
          </ul>
        </div>
      </section>

      {/* ── Plantillas por rol ──────────────────────────────────── */}
      <section className="mt-24">
        <Encabezado
          numero="02"
          titulo="Formatos por rol"
          descripcion="Descarga el archivo editable para diligenciarlo. El PDF es solo de consulta."
        />

        <div data-guia="inst-roles" className="mt-10 grid md:grid-cols-3 gap-x-10 gap-y-12">
          {ROLES.map((rol) => (
            <div key={rol.clave} className="card !p-0" style={{ "--barra": rol.color }}>
              <h3
                className="px-5 py-4 text-section font-semibold text-white"
                style={{ background: rol.color }}
              >
                {rol.titulo}
              </h3>
              <ul className="px-5 py-1">
                {(plantillas[rol.clave] || []).map((doc) => (
                  <Documento key={doc.id} doc={doc} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════════ */

function Encabezado({ numero, titulo, descripcion }) {
  return (
    <div className="flex gap-6 md:gap-10 border-t-2 border-ps-navy pt-6">
      <span className="shrink-0 w-9 h-9 flex items-center justify-center bg-ps-navy text-white text-xs font-semibold">
        {numero}
      </span>
      <div className="max-w-xl">
        <h2 className="text-title font-semibold text-ps-navy">{titulo}</h2>
        <p className="mt-3 text-ps-muted">{descripcion}</p>
      </div>
    </div>
  );
}

function Documento({ doc }) {
  return (
    <li className="py-4 border-b border-ps-line last:border-0">
      <p className="text-sm text-ps-ink leading-snug">
        <span className="eyebrow mr-2 text-ps-blue">{doc.codigo}</span>
        {doc.titulo}
      </p>

      {doc.descripcion && (
        <p className="mt-1 text-xs text-ps-muted">{doc.descripcion}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2" data-guia="inst-formatos">
        {doc.editable && <Descarga doc={doc} ruta={doc.editable} principal />}
        {doc.pdf && <Descarga doc={doc} ruta={doc.pdf} />}
      </div>
    </li>
  );
}

/* Enlace de descarga. Conserva el nombre oficial del documento. */
function Descarga({ doc, ruta, principal = false }) {
  const formato = formatoDe(ruta);

  return (
    <a
      href={ruta}
      download={nombreDescarga(doc, ruta)}
      title={`Descargar ${doc.nombreOficial}.${formato.toLowerCase()}`}
      className={`inline-flex items-center gap-1.5 min-h-10 px-3 border text-xs font-semibold transition-colors ${
        principal
          ? "border-ps-blue text-ps-blue hover:bg-ps-blue hover:text-white"
          : "border-ps-line text-ps-muted hover:border-ps-ink hover:text-ps-ink"
      }`}
    >
      {formato}
      <span aria-hidden="true">↓</span>
    </a>
  );
}
