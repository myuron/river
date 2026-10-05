/** "8h", "1.5h"; "-" when unset. */
export function formatHours(hours: number | null): string {
  return hours === null ? "-" : `${Number(hours.toFixed(2))}h`;
}

/** "2026-01-05〜2026-01-09" with either end possibly open; "-" when both unset. */
export function formatPeriod(start: string | null, end: string | null): string {
  if (!start && !end) return "-";
  return `${start ?? ""}〜${end ?? ""}`;
}
