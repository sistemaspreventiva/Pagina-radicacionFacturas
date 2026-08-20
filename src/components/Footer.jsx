import { OPEN_FROM, OPEN_TO } from "../lib/dateWindow.js";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 panel-marca">
      <div className="max-w-5xl mx-auto px-6 py-9 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
        <p className="text-sm text-white/70">© {year} Preventiva Salud IPS</p>
        <p className="text-sm text-white/70">
          Radicación habilitada{" "}
          <span className="text-white font-medium">
            del {OPEN_FROM} al {OPEN_TO}
          </span>{" "}
          de cada mes
        </p>
      </div>
    </footer>
  );
}
