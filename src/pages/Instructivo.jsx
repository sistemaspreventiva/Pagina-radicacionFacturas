export default function Instructivo() {
  const grupos = [
    {
      rol: "Asistencial",
      grad: "from-[var(--ps-cyan)] to-[var(--ps-blue)]",
      base: "/formatos/asistencial",
      files: [
        { label: "Formato de Radicación (DOCX)", path: "FORMATO_Radicacion_Asistencial.docx" },
        { label: "Relación de Servicios (XLSX)", path: "FORMATO_Relacion_Servicios.xlsx" },
        { label: "Certificado Bancario (PDF)", path: "FORMATO_Certificado_Bancario.pdf" },
      ],
      zip: "paquete-asistencial.zip", // opcional
    },
    {
      rol: "Administrativo",
      grad: "from-[var(--ps-blue)] to-[var(--ps-orange)]",
      base: "/formatos/administrativo",
      files: [
        { label: "Formato de Radicación (DOCX)", path: "FORMATO_Radicacion_Administrativo.docx" },
        { label: "Relación de Soportes (XLSX)", path: "FORMATO_Relacion_Soportes.xlsx" },
        { label: "Certificación de Retenciones (PDF)", path: "FORMATO_Certificacion_Retenciones.pdf" },
      ],
      zip: "paquete-administrativo.zip", // opcional
    },
    {
      rol: "Transporte",
      grad: "from-[var(--ps-orange)] to-[var(--ps-cyan)]",
      base: "/formatos/transporte",
      files: [
        { label: "Formato de Radicación (DOCX)", path: "FORMATO_Radicacion_Transporte.docx" },
        { label: "Relación de Rutas (XLSX)", path: "FORMATO_Relacion_Rutas.xlsx" },
        { label: "Soportes de Combustible (PDF)", path: "FORMATO_Soportes_Combustible.pdf" },
      ],
      zip: "paquete-transporte.zip", // opcional
    },
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[color:var(--ps-navy)]">
          Instructivo de Radicación de Facturas
        </h1>
        <p className="text-slate-600">
          Descarga los formatos oficiales según tu rol. Coloca los archivos en <code>/public/formatos/&lt;rol&gt;/</code>.
        </p>
      </header>

      <section className="grid md:grid-cols-3 gap-6">
        {grupos.map((g) => (
          <article key={g.rol} className="rounded-2xl border bg-white overflow-hidden shadow-sm">
            <div className={`h-2 bg-gradient-to-r ${g.grad}`} />
            <div className="p-5">
              <h2 className="text-lg font-semibold text-[color:var(--ps-navy)] mb-1">{g.rol}</h2>
              <p className="text-sm text-slate-600 mb-4">
                Paquete de formatos requeridos para radicar.
              </p>

              <ul className="space-y-2 mb-4">
                {g.files.map((f) => (
                  <li key={f.path} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-slate-700 truncate">{f.label}</span>
                    <a
                      href={`${g.base}/${f.path}`}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border hover:bg-slate-50"
                      title={`Descargar ${f.label}`}
                    >
                      Descargar
                    </a>
                  </li>
                ))}
              </ul>

              {/* Botón para descargar todo en .zip (sube el .zip a /public/formatos/<rol>/ ) */}
              <a
                href={`${g.base}/${g.zip}`}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex justify-center items-center px-3 py-2 rounded-lg text-sm font-semibold text-white bg-[var(--ps-blue)] hover:brightness-95"
                title={`Descargar paquete completo de ${g.rol}`}
              >
                Descargar todo (.zip)
              </a>

              <p className="text-[10px] mt-2 text-slate-500">
                Si un enlace no abre, asegúrate de que el archivo exista en <code>public{g.base.replace(/^\//,"")}</code>.
              </p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
