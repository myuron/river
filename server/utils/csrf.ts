import type { H3Event } from "h3";

/**
 * True when a browser says the request comes from another site. Requests
 * without these headers (curl, server-to-server, tests) are not browser CSRF.
 * Behind a reverse proxy, keep the Host header or set X-Forwarded-Host, or
 * every browser write is rejected.
 */
export function isCrossSiteRequest(event: H3Event): boolean {
  const fetchSite = getRequestHeader(event, "sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") return true;

  const origin = getRequestHeader(event, "origin");
  if (!origin) return false;
  try {
    return new URL(origin).host !== getRequestHost(event, { xForwardedHost: true });
  } catch {
    return true;
  }
}
