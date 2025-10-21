export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-10">
      <div className="h-1 bg-gradient-to-r from-[var(--ps-orange)] via-[var(--ps-cyan)] to-[var(--ps-blue)]" />
      <div className="bg-gradient-to-r from-[var(--ps-navy)] to-[var(--ps-blue)] text-white">
        <div className="max-w-6xl mx-auto px-4 py-6 text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {year} Preventiva Salud IPS</p>
          <p className="text-white/80">Radicación habilitada del 1 al 10 de cada mes</p>
        </div>
      </div>
    </footer>
  );
}
