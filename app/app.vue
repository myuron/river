<script setup lang="ts">
const { user, logout } = useAuth();

// Lets e2e tests wait until the page is interactive.
onMounted(() => {
  document.documentElement.dataset.hydrated = "true";
});
</script>

<template>
  <div class="app">
    <NuxtRouteAnnouncer />
    <header class="app-header">
      <NuxtLink to="/" class="brand">river</NuxtLink>
      <div v-if="user" class="account">
        <span data-testid="current-user">{{ user.name }}</span>
        <button type="button" class="secondary" @click="logout">ログアウト</button>
      </div>
    </header>
    <main class="app-main">
      <NuxtPage />
    </main>
  </div>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.brand {
  font-weight: 700;
  font-size: 1.15rem;
  color: var(--accent);
  text-decoration: none;
  letter-spacing: 0.05em;
}

.account {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.app-main {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.5rem;
}
</style>
