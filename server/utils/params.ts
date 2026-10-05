import type { H3Event } from "h3";

/** Reads a serial id route param; anything that cannot be an id is a 404. */
export function requireIdParam(event: H3Event, name = "id"): number {
  const raw = getRouterParam(event, name) ?? "";
  const id = /^\d+$/.test(raw) ? Number(raw) : Number.NaN;
  if (!isId(id)) {
    throw createError({ statusCode: 404, statusMessage: "Not Found" });
  }
  return id;
}
