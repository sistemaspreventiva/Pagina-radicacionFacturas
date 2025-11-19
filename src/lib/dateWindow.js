const TZ = "America/Bogota";

function bogotaNow() {
  const fmt = new Intl.DateTimeFormat("es-CO", {
    timeZone: TZ, 
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  const parts = Object.fromEntries(
    fmt.formatToParts(new Date()).map(p => [p.type, p.value])
  );

  return new Date(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
}

export function getWindowForRole(role) {
  const today = bogotaNow();
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const lastDate = monthEnd.getDate();
  const day = today.getDate();

  // 🔥 LÓGICA CORRECTA SEGÚN TU REGLA
  const openFrom = 1;
  const openTo = 10; // TODOS los roles SOLO del 1 al 10

  const isOpenToday = day >= openFrom && day <= openTo;

  return {
    tz: TZ,
    today, year, month, monthStart, monthEnd, lastDate,
    openFrom, openTo, isOpenToday,
    isDayEnabled: (d) => d >= openFrom && d <= openTo,
  };
}
