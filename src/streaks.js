// Lógica pura de rachas: sin DOM, sin localStorage.
// Todas las funciones reciben los datos (y "today") como parámetros,
// así se pueden testear fácilmente.

const DAY_MS = 86_400_000;

export const STATUS = { FULL: "f", MIN: "m" };

/** Date -> "YYYY-MM-DD" (en hora local) */
export function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "YYYY-MM-DD" -> Date (a medianoche local) */
export function fromKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** ¿Ese día cuenta como entrenado? (completa o mínima) */
export function isDone(data, key) {
  return data[key] === STATUS.FULL || data[key] === STATUS.MIN;
}

/** Ciclo al tocar un día: vacío -> completa -> mínima -> vacío */
export function nextStatus(current) {
  if (!current) return STATUS.FULL;
  if (current === STATUS.FULL) return STATUS.MIN;
  return null;
}

/**
 * Racha actual. Si hoy aún no está marcado, la racha no se rompe:
 * se cuenta desde ayer.
 */
export function currentStreak(data, today) {
  const cursor = new Date(today);
  if (!isDone(data, toKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (isDone(data, toKey(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

/** Mejor racha de todos los tiempos. */
export function bestStreak(data) {
  const days = Object.keys(data)
    .filter((k) => isDone(data, k))
    .sort()
    .map(fromKey);

  let best = 0;
  let run = 0;
  days.forEach((day, i) => {
    // Math.round evita problemas con cambios de horario (DST)
    const gap = i > 0 ? Math.round((day - days[i - 1]) / DAY_MS) : null;
    run = gap === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}

/** Días entrenados en un mes (month: 0-11, como Date). */
export function monthCount(data, year, month) {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  return Object.keys(data).filter((k) => k.startsWith(prefix) && isDone(data, k)).length;
}

/**
 * Qué toca hoy según la regla "nunca dos días seguidos":
 *  "done" -> hoy ya está marcado
 *  "must" -> ayer no entrenaste, hoy es obligatorio (aunque sea la mínima)
 *  "rest" -> ayer entrenaste, hoy puedes descansar
 */
export function dailyHint(data, today) {
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isDone(data, toKey(today))) return "done";
  if (!isDone(data, toKey(yesterday))) return "must";
  return "rest";
}
