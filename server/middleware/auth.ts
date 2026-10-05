const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Blocks API writes from other sites (CSRF, including login CSRF where the
 * victim has no cookie yet), then requires a logged-in user for every API
 * except /api/auth/*.
 */
export default defineEventHandler(async (event) => {
  const path = event.path.split("?")[0]!;
  if (!path.startsWith("/api/")) return;

  if (!SAFE_METHODS.has(event.method) && isCrossSiteRequest(event)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      message: "不正なリクエストです",
    });
  }

  if (path.startsWith("/api/auth/")) return;
  const user = await getSessionUser(event);
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "ログインしてください",
    });
  }
  event.context.user = user;
});
