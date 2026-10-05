import { isBlank } from "./text";

const MAX_ID = 2_147_483_647;

/** True when `value` can be a serial (int4) id. */
export function isId(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= MAX_ID;
}

/**
 * An optional reference id from a form or request body: blank clears it (null),
 * numbers and digit strings (select values) become ids, anything else is invalid.
 */
export function parseOptionalId(
  value: unknown,
): { ok: true; value: number | null } | { ok: false } {
  if (isBlank(value)) return { ok: true, value: null };
  const id = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  return isId(id) ? { ok: true, value: id } : { ok: false };
}
