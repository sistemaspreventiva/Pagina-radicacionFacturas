// src/lib/consecutivo.js

/**
 * Genera el consecutivo de la cuenta de cobro.
 *
 * Formato: DSMMYY-CC
 *   - DS: prefijo fijo (Documento Soporte)
 *   - MM: mes del PERIODO QUE SE RADICA (01..12)
 *   - YY: año del periodo, 2 dígitos
 *   - CC: cédula del usuario
 *
 * Importante: el mes es el del periodo cobrado, NO el de hoy.
 * En agosto se radica julio, así que el consecutivo debe decir 07.
 *
 * @param {string|number} dni     cédula del usuario
 * @param {string}        periodo periodo a radicar en formato "YYYY-MM"
 * @returns {string} consecutivo, o "" si falta algún dato
 */
export function genConsecutivo(dni, periodo) {
  const cc = String(dni ?? "").trim();
  if (!cc) return "";

  const m = /^(\d{4})-(\d{2})$/.exec(String(periodo ?? "").trim());
  if (!m) return "";

  const [, yyyy, mm] = m;
  if (Number(mm) < 1 || Number(mm) > 12) return "";

  return `DS${mm}${yyyy.slice(-2)}-${cc}`;
}
