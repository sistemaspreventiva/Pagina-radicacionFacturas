import { OPEN_FROM, OPEN_TO } from "../lib/dateWindow.js";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-ps-line">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
        <p className="text-sm text-ps-muted">
          © {year} Preventiva Salud IPS
        </p>
        <p className="text-sm text-ps-muted">
          Radicación habilitada{" "}
          <span className="text-ps-ink font-medium">
            del {OPEN_FROM} al {OPEN_TO}
          </span>{" "}
          de cada mes
        </p>
      </div>
    </footer>
  );
}
