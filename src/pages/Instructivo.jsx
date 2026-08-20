// src/pages/Instructivo.jsx
import {
  instructivos,
  plantillas,
  formatoDe,
  nombreDescarga,
} from "../lib/instructivos.js";
import { OPEN_FROM, OPEN_TO } from "../lib/dateWindow.js";

const ROLES = [
  { clave: "asistencial", titulo: "Asistencial" },
  { clave: "administrativo", titulo: "Administrativo" },
  { clave: "conductores", titulo: "Transporte" },
];

export default function Instructivo() {
  return (
    <main className="max-w-5xl mx-auto px-6 pt-16 md:pt-24 pb-8">
      {/* ── Titular ─────────────────────────────────────────────── */}
      <div className="max-w-2xl">
        <p className="eyebrow">Documentos</p>
        <h1 className="mt-5 text-title md:text-display font-semibold text-ps-navy">
          Instructivos
          <br />y formatos
        </h1>
        <div className="mt-8 flex items-baseline gap-3 border-t border-ps-line pt-5">
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

        <div className="mt-10 grid lg:grid-cols-2 gap-12">
          <div className="w-full aspect-video bg-ps-ink">
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

          <ul className="border-t border-ps-line">
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

        <div className="mt-10 grid md:grid-cols-3 gap-x-10 gap-y-12">
          {ROLES.map((rol) => (
            <div key={rol.clave}>
              <h3 className="pb-3 text-section font-medium text-ps-navy border-b-2 border-ps-navy">
                {rol.titulo}
              </h3>
              <ul>
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
    <div className="flex gap-6 md:gap-10 border-t border-ps-line pt-6">
      <span className="eyebrow shrink-0 pt-1">{numero}</span>
      <div className="max-w-xl">
        <h2 className="text-title font-semibold text-ps-navy">{titulo}</h2>
        <p className="mt-3 text-ps-muted">{descripcion}</p>
      </div>
    </div>
  );
}

function Documento({ doc }) {
  return (
    <li className="py-4 border-b border-ps-line">
      <p className="text-sm text-ps-ink leading-snug">
        <span className="eyebrow mr-2">{doc.codigo}</span>
        {doc.titulo}
      </p>

      {doc.descripcion && (
        <p className="mt-1 text-xs text-ps-muted">{doc.descripcion}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
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
      className={`group inline-flex items-baseline gap-1.5 text-xs font-medium transition-colors ${
        principal
          ? "text-ps-blue hover:text-ps-navy"
          : "text-ps-muted hover:text-ps-ink"
      }`}
    >
      <span className="underline underline-offset-4 decoration-ps-line group-hover:decoration-current">
        {formato}
      </span>
      <span aria-hidden="true">↓</span>
    </a>
  );
}
