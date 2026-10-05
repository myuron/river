import type { H3Event } from "h3";

const MAX_ID = 2_147_483_647;

/** True when `value` can be a serial (int4) id. */
export function isId(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= MAX_ID;
}

/** Reads a serial id route param; anything that cannot be an id is a 404. */
export function requireIdParam(event: H3Event, name = "id"): number {
  const raw = getRouterParam(event, name) ?? "";
  const id = /^\d+$/.test(raw) ? Number(raw) : Number.NaN;
  if (!isId(id)) {
    throw createError({ statusCode: 404, statusMessage: "Not Found" });
  }
  return id;
}
