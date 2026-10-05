/** Trims `value`; returns null when it is not a string or is blank. */
export function normalizeRequiredText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** null/undefined or a whitespace-only string: an optional field being cleared. */
export function isBlank(value: unknown): boolean {
  return (
    value === null || value === undefined || (typeof value === "string" && value.trim() === "")
  );
}
