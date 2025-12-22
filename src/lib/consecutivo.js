// src/lib/consecutivo.js

/**
 * Genera consecutivo para cuenta de cobro
 * Formato: DSMMYY-CC
 *   - DS: prefijo fijo
 *   - MM: mes (01..12)
 *   - YY: año (2 dígitos)
 *   - CC: cédula (DNI)
 */
export function genConsecutivo(dni) {
  const cc = String(dni ?? "").trim();

  // Si no hay DNI, no generamos consecutivo
  if (!cc) return "";

  const now = new Date();

  // MES (01..12)
  const mm = String(now.getMonth() + 1).padStart(2, "0");

  // AÑO (2 dígitos)
  const yy = String(now.getFullYear()).slice(-2);

  return `DS${mm}${yy}-${cc}`;
}
