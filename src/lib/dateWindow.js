// src/lib/dateWindow.js
const TZ = "America/Bogota";

// Ventana de radicación, igual para TODOS los roles.
//
// Con MES_COMPLETO en true se puede radicar cualquier día del mes. El
// último día se calcula de verdad (28, 29, 30 o 31), porque fijarlo en
// 30 dejaba fuera el 31 en los meses que lo tienen.
//
// Para volver al rango corto basta con poner MES_COMPLETO en false:
// entonces rige OPEN_FROM..OPEN_TO.
export const MES_COMPLETO = true;
export const OPEN_FROM = 1;
export const OPEN_TO = 5;

/** Último día del mes de una fecha: 28, 29, 30 o 31. */
export function ultimoDiaDelMes(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
}

/**
 * Cómo se anuncia la ventana en pantalla.
 * Con el mes completo no tiene sentido decir "del 1 al 31": se dice
 * que está abierta todo el mes.
 */
export function textoVentana() {
  return MES_COMPLETO
    ? "todo el mes"
    : `del ${OPEN_FROM} al ${OPEN_TO} de cada mes`;
}

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

  const lastDate = monthEnd.getDate();
  const desde = OPEN_FROM;
  const hasta = MES_COMPLETO ? lastDate : OPEN_TO;

  return {
    tz: TZ,
    today,
    year,
    month,
    monthStart: new Date(year, month, 1),
    monthEnd,
    lastDate,
    mesCompleto: MES_COMPLETO,
    openFrom: desde,
    openTo: hasta,
    texto: textoVentana(),
    isOpenToday: day >= desde && day <= hasta,
    isDayEnabled: (d) => d >= desde && d <= hasta,
  };
}
