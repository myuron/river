const PUBLIC_PATHS = new Set(["/login", "/signup"]);

/** Every page except login/signup requires a logged-in user. */
export default defineNuxtRouteMiddleware(async (to) => {
  const { user, ensureLoaded } = useAuth();
  await ensureLoaded();

  if (!user.value && !PUBLIC_PATHS.has(to.path)) {
    return navigateTo({ path: "/login", query: { redirect: to.fullPath } });
  }
  if (user.value && PUBLIC_PATHS.has(to.path)) {
    return navigateTo("/");
  }
});
