<script setup lang="ts">
const route = useRoute();
const [{ project }, { data: issue, error }] = await Promise.all([
  useProject(),
  useFetch<Issue>(
    () => `/api/projects/${String(route.params.id)}/issues/${String(route.params.issueId)}`,
  ),
]);
throwOnFetchError(error);

useHead({ title: () => issue.value?.title ?? "" });
</script>

<template>
  <div v-if="project && issue">
    <ProjectNav :project="project" />
    <p><NuxtLink :to="`/projects/${project.id}/issues`">← 課題一覧</NuxtLink></p>
    <h1>{{ issue.title }}</h1>
    <dl class="meta">
      <dt>ステータス</dt>
      <dd><IssueStatusBadge :status="issue.status" /></dd>
      <dt>登録日時</dt>
      <dd><DateTime :value="issue.createdAt" /></dd>
    </dl>
    <div class="card issue-body" data-testid="issue-body">{{ issue.body }}</div>
  </div>
</template>

<style scoped>
.meta {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.35rem 1rem;
  margin: 0 0 1rem;
}

.meta dt {
  color: var(--muted);
  font-size: 0.85rem;
}

.meta dd {
  margin: 0;
}

.issue-body {
  white-space: pre-wrap;
  min-height: 3rem;
}
</style>
