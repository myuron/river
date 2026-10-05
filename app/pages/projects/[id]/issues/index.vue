<script setup lang="ts">
const { projectId, project } = await useProject();
const { data: issues, refresh } = await useFetch<Issue[]>(
  () => `/api/projects/${projectId.value}/issues`,
  { default: () => [] },
);

useHead({ title: () => `課題 - ${project.value?.name ?? ""}` });

const title = ref("");
const body = ref("");
const error = ref("");
const submitting = ref(false);

async function createIssue() {
  error.value = "";
  if (!normalizeRequiredText(title.value)) {
    error.value = "タイトルを入力してください";
    return;
  }
  submitting.value = true;
  try {
    await $fetch<Issue>(`/api/projects/${projectId.value}/issues`, {
      method: "POST",
      body: { title: title.value, body: body.value },
    });
    title.value = "";
    body.value = "";
    await refresh();
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div v-if="project">
    <ProjectNav :project="project" />
    <h1>課題</h1>

    <form class="card issue-form" @submit.prevent="createIssue">
      <label class="field">
        <span>タイトル</span>
        <input v-model="title" name="title" type="text" />
      </label>
      <label class="field">
        <span>本文</span>
        <textarea v-model="body" name="body" rows="4" />
      </label>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <div>
        <button type="submit" :disabled="submitting">課題を登録</button>
      </div>
    </form>

    <p v-if="issues.length === 0" class="empty">課題がまだありません</p>
    <table v-else class="table">
      <thead>
        <tr>
          <th>タイトル</th>
          <th>ステータス</th>
          <th>登録日時</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="issue in issues" :key="issue.id" data-testid="issue-row">
          <td>
            <NuxtLink :to="`/projects/${project.id}/issues/${issue.id}`" data-testid="issue-title">
              {{ issue.title }}
            </NuxtLink>
          </td>
          <td><IssueStatusBadge :status="issue.status" /></td>
          <td><DateTime :value="issue.createdAt" /></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.issue-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}
</style>
