// src/pages/Instructivo.jsx
import { instructivos } from "../lib/instructivos.js";


export default function Instructivo() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">
        Instructivos de Radicación de Facturas
      </h1>

      <p className="text-slate-600 mb-8">
        Descarga los formatos y guías necesarios según tu rol.
      </p>

      <section className="grid md:grid-cols-3 gap-6">
        <Card
          titulo="Asistencial"
          descripcion="Formatos y guías para personal asistencial. Radicación del 1 al 10 de cada mes."
          items={instructivos.asistencial}
          color="border-cyan-500"
        />
        <Card
          titulo="Administrativo"
          descripcion="Formatos y guías para administrativo. Radicación del 1 al 10 de cada mes."
          items={instructivos.administrativo}
          color="border-blue-600"
        />
        <Card
          titulo="Transporte / Conductores"
          descripcion="Formatos y guías para transporte. Habilitado todo el mes."
          items={instructivos.conductores}
          color="border-orange-500"
        />
      </section>
    </main>
  );
}

function Card({ titulo, descripcion, items, color }) {
  return (
    <div className={`rounded-2xl border ${color} p-5 bg-white shadow-sm`}>
      <h2 className="text-xl font-semibold mb-1">{titulo}</h2>
      <p className="text-sm text-slate-600 mb-4">{descripcion}</p>

      <ul className="space-y-2">
        {items.map((d, i) => (
          <li key={i}>
            <a
              href={d.href}
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
    </div>
  );
}
