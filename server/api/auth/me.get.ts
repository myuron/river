/** The current user, or null when not logged in (not an error: pages use it to decide where to go). */
export default defineEventHandler(async (event) => ({ user: await getSessionUser(event) }));
