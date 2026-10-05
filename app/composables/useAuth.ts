/** The logged-in user, loaded once per app (on the server during SSR) and shared with the client. */
export function useAuth() {
  const user = useState<SessionUser | null>("auth-user", () => null);
  const loaded = useState("auth-loaded", () => false);

  async function ensureLoaded() {
    if (loaded.value) return;
    // useRequestFetch forwards the browser's cookies during SSR.
    const response = await useRequestFetch()<{ user: SessionUser | null }>("/api/auth/me");
    user.value = response.user;
    loaded.value = true;
  }

  function setUser(next: SessionUser | null) {
    user.value = next;
    loaded.value = true;
  }

  async function logout() {
    await $fetch<{ user: null }>("/api/auth/logout", { method: "POST" });
    setUser(null);
    // Drop data fetched as the previous user.
    clearNuxtData();
    await navigateTo("/login");
  }

  return { user, ensureLoaded, setUser, logout };
}
