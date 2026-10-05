<script setup lang="ts">
const route = useRoute();
const [{ project }, { data: issue, error, refresh }] = await Promise.all([
  useProject(),
  useFetch<Issue>(
    () => `/api/projects/${String(route.params.id)}/issues/${String(route.params.issueId)}`,
  ),
]);
throwOnFetchError(error);

useHead({ title: () => issue.value?.title ?? "" });

const today = useToday();
const editing = ref(false);
const deleteError = ref("");
const deleting = ref(false);

async function onSaved() {
  editing.value = false;
  await refresh();
}

async function deleteIssue() {
  if (!project.value || !issue.value) return;
  if (!window.confirm(`課題「${issue.value.title}」を削除しますか？`)) return;
  deleteError.value = "";
  deleting.value = true;
  try {
    await $fetch<null>(`/api/projects/${project.value.id}/issues/${issue.value.id}`, {
      method: "DELETE",
    });
    await navigateTo(`/projects/${project.value.id}/issues`);
  } catch (e) {
    deleteError.value = errorMessage(e);
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <div v-if="project && issue">
    <ProjectNav :project="project" />
    <p><NuxtLink :to="`/projects/${project.id}/issues`">← 課題一覧</NuxtLink></p>

    <IssueEditForm
      v-if="editing"
      :project-id="project.id"
      :issue="issue"
      @saved="onSaved"
      @cancel="editing = false"
    />
    <template v-else>
      <div class="title-row">
        <h1>{{ issue.title }}</h1>
        <div class="form-row">
          <button type="button" class="secondary" @click="editing = true">編集</button>
          <button type="button" class="danger" :disabled="deleting" @click="deleteIssue">
            削除
          </button>
        </div>
      </div>
      <p v-if="deleteError" class="error" role="alert">{{ deleteError }}</p>
      <dl class="meta">
        <dt>ステータス</dt>
        <dd><IssueStatusBadge :status="issue.status" /></dd>
        <dt>担当者</dt>
        <dd data-testid="issue-assignee">{{ issue.assignee?.name ?? "-" }}</dd>
        <dt>優先度</dt>
        <dd data-testid="issue-priority">{{ ISSUE_PRIORITY_LABELS[issue.priority] }}</dd>
        <dt>期限日</dt>
        <dd>
          <span data-testid="issue-due">{{ issue.dueDate ?? "-" }}</span>
          <OverdueBadge v-if="isIssueOverdue(issue, today)" />
        </dd>
        <dt>登録日時</dt>
        <dd><DateTime :value="issue.createdAt" /></dd>
      </dl>
      <div class="card issue-body" data-testid="issue-body">{{ issue.body }}</div>
      <IssueComments :project-id="project.id" :issue-id="issue.id" />
    </template>
  </div>
</template>

<style scoped>
.title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

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
