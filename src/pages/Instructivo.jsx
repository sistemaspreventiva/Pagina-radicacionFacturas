// src/pages/Instructivo.jsx
import { instructivos } from "../lib/instructivos.js";

export default function Instructivo() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      {/* TÍTULO */}
      <h1 className="text-3xl font-bold mb-6">
        Instructivos de Radicación de Cuentas de cobro.
      </h1>

      <p className="text-slate-600 mb-8">
        Descarga los formatos y guías necesarios según tu rol.
      </p>

      {/* ==================================================
          BLOQUE 1 — VIDEO + 4 DOCUMENTOS (ARRIBA)
         ================================================== */}
      <section className="mb-14 bg-white rounded-2xl border p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-2">
          Guía general del proceso de radicación
        </h2>

        <p className="text-sm text-slate-600 mb-6">
          Revisa el video para entender el proceso completo y descarga los
          documentos generales de apoyo.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* VIDEO */}
          <div className="w-full aspect-video rounded-lg overflow-hidden border">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/TU_ID_DE_VIDEO"
              title="Video instructivo de radicación"
              frameBorder="0"
              allowFullScreen
            />
          </div>

          {/* DOCUMENTOS GENERALES */}
          <div className="flex flex-col gap-3">
            <DocLink
              titulo="IN-GH-002 INSTRUCTIVO CUENTA DE COBRO PERSONAL ASISTENCIAL"
              href="/Generales/IN-GH-002 INSTRUCTIVO CUENTA DE COBRO PERSONAL ASISTENCIAL v02.pdf"
            />
            <DocLink
              titulo="IN-GH-003 INSTRUCTIVO COTIZACION SEGURIDAD SOCIAL INDEPENDIENTES"
              href="/Generales/IN-GH-003 INSTRUCTIVO COTIZACION SEGURIDAD SOCIAL INDEPENDIENTES v01.pdf"
            />
            <DocLink
              titulo="IN-GH-004 INSTRUCTIVO PARA RADICACIÓN CUENTA DE COBRO"
              href="/Generales/IN-GH-004 INSTRUCTIVO PARA RADICACIÓN CUENTA DE COBRO v01.pdf"
            />
            <DocLink
              titulo="IN-GH-005 INSTRUCTIVO CUENTA DE COBRO CONDUCTORES"
              href="/Generales/IN-GH-005 INSTRUCTIVO CUENTA DE COBRO CONDUCTORES v01.pdf"
            />
          </div>
        </div>
      </section>

      {/* ==================================================
          BLOQUE 2 — DESCARGAS POR ROL (ABAJO)
         ================================================== */}
      <h2 className="text-2xl font-semibold mb-6">
        Formatos según tipo de usuarios
      </h2>

      <section className="grid md:grid-cols-3 gap-6">
        <Card
          titulo="Asistencial"
          descripcion="Formatos y guías para personal asistencial. Radicación del 1 al 10 de cada mes."
          items={Array.isArray(instructivos.asistencial) ? instructivos.asistencial : []}
          color="border-cyan-500"
        />
        <Card
          titulo="Administrativo"
          descripcion="Formatos y guías para administrativo. Radicación del 1 al 10 de cada mes."
          items={Array.isArray(instructivos.administrativo) ? instructivos.administrativo : []}
          color="border-blue-600"
        />
        <Card
          titulo="Transporte / Conductores"
          descripcion="Formatos y guías para transporte. Habilitado todo el mes."
          items={Array.isArray(instructivos.conductores) ? instructivos.conductores : []}
          color="border-orange-500"
        />
      </section>
    </main>
  );
}

/* ======================================================
   Link de documento (reutilizable)
   ====================================================== */
function DocLink({ titulo, href }) {
  return (
    <a
      href={href}
      download
      className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-slate-50"
    >
      <span>📄 {titulo}</span>
      <span className="text-sm text-slate-500">PDF · Descargar</span>
    </a>
  );
}

/* ======================================================
   Card por rol
   ====================================================== */
function Card({ titulo, descripcion, items, color }) {
  return (
    <div className={`rounded-2xl border ${color} p-5 bg-white shadow-sm`}>
      <h3 className="text-xl font-semibold mb-1">{titulo}</h3>
      <p className="text-sm text-slate-600 mb-4">{descripcion}</p>

      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((d, i) => (
            <li key={i}>
              <a
                href={encodeURI(d.href)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-slate-50"
                download
              >
                <span className="truncate pr-3">{d.titulo}</span>
                <span className="text-sm text-slate-500">Descargar</span>
              </a>
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
