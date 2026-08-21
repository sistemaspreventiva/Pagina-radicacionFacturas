// src/lib/dateWindow.js
const TZ = "America/Bogota";

// Ventana de radicación: del 1 al 5 de cada mes, para TODOS los roles.
export const OPEN_FROM = 1;
export const OPEN_TO = 30;

/** "Ahora" en hora de Bogotá, independiente de la zona horaria del equipo. */
export function bogotaNow() {
  const fmt = new Intl.DateTimeFormat("es-CO", {
    timeZone: TZ,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(
    fmt.formatToParts(new Date()).map((p) => [p.type, p.value])
  );

  return new Date(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24, // es-CO puede devolver "24" a medianoche
    Number(parts.minute),
    Number(parts.second)
  );
}

/** Periodo en formato "YYYY-MM" a partir de una fecha. */
export function toPeriodo(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Mes actual en Bogotá, "YYYY-MM". Sirve como tope del selector. */
export function periodoActual() {
  return toPeriodo(bogotaNow());
}

/**
 * Mes anterior al actual en Bogotá, "YYYY-MM".
 * Es el periodo que normalmente se radica: en agosto se cobra julio.
 */
export function periodoAnterior() {
  const d = bogotaNow();
  return toPeriodo(new Date(d.getFullYear(), d.getMonth() - 1, 1));
}

/** Etiqueta legible de un periodo "YYYY-MM" → "Julio 2026". */
export function etiquetaPeriodo(periodo) {
  const m = /^(\d{4})-(\d{2})$/.exec(periodo || "");
  if (!m) return "";
  const texto = new Date(Number(m[1]), Number(m[2]) - 1, 1)
    .toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Estado de la ventana de radicación para el mes en curso. */
export function getWindow() {
  const today = bogotaNow();
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthEnd = new Date(year, month + 1, 0);
  const day = today.getDate();

  return {
    tz: TZ,
    today,
    year,
    month,
    monthStart: new Date(year, month, 1),
    monthEnd,
    lastDate: monthEnd.getDate(),
    openFrom: OPEN_FROM,
    openTo: OPEN_TO,
    isOpenToday: day >= OPEN_FROM && day <= OPEN_TO,
    isDayEnabled: (d) => d >= OPEN_FROM && d <= OPEN_TO,
  };
}
