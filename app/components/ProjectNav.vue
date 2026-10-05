<script setup lang="ts">
defineProps<{ project: Project }>();
</script>

<template>
  <nav class="project-nav" aria-label="プロジェクト">
    <span class="project-name">{{ project.name }}</span>
    <NuxtLink :to="`/projects/${project.id}`" exact-active-class="active">WBS</NuxtLink>
    <NuxtLink :to="`/projects/${project.id}/issues`" active-class="active">課題</NuxtLink>
    <NuxtLink :to="`/projects/${project.id}/dashboard`" active-class="active"
      >ダッシュボード</NuxtLink
    >
  </nav>
</template>

<style scoped>
.project-nav {
  display: flex;
  align-items: baseline;
  gap: 1.25rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border);
}

.project-nav a {
  text-decoration: none;
  color: var(--muted);
}

.project-nav a.active {
  color: var(--accent);
  font-weight: 600;
}

.project-name {
  margin-right: auto;
  font-size: 0.9rem;
}
</style>
