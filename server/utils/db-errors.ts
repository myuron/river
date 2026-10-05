/** True for a Postgres foreign key violation (also when wrapped by Drizzle). */
export function isForeignKeyViolation(error: unknown): boolean {
  for (let e: unknown = error; e && typeof e === "object"; e = (e as { cause?: unknown }).cause) {
    if ((e as { code?: unknown }).code === "23503") return true;
  }
  return false;
}
