export function genConsecutivo(dni, date = new Date()) {
  const dd = String(date.getDate()).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  const clean = String(dni || "").replace(/\D/g, "").slice(-12); // hasta 12 dígitos
  const cc = clean || "CC";
  return `DS${dd}${yy}-${cc}`;
}
