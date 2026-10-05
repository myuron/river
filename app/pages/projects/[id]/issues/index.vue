<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const { projectId, project } = await useProject();
const {
  data: issues,
  error: loadError,
  refresh,
} = await useFetch<Issue[]>(() => `/api/projects/${projectId.value}/issues`, {
  default: () => [],
});

useHead({ title: () => `課題 - ${project.value?.name ?? ""}` });

const today = useToday();

// The filter lives in the URL so reloads and shared links show the same list.
const filter = computed(() => parseIssueFilter(route.query));
const visibleIssues = computed(() => filterIssues(issues.value, filter.value, today.value));
const assignees = computed(() => {
  const names = new Set(issues.value.map((i) => i.assignee).filter((a): a is string => a !== null));
  // Keep a selected name from a shared URL visible even if no issue has it any more.
  if (filter.value.assignee.type === "name") names.add(filter.value.assignee.name);
  return [...names].sort((a, b) => a.localeCompare(b, "ja"));
});

function setFilter(next: IssueFilter) {
  void router.replace({ query: issueFilterToQuery(next) });
}

function clearFilter() {
  setFilter({
    statuses: [...ISSUE_STATUSES],
    priorities: [],
    assignee: { type: "any" },
    overdueOnly: false,
  });
}

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

    <p v-if="loadError" class="error">課題を読み込めませんでした</p>
    <p v-else-if="issues.length === 0" class="empty">課題がまだありません</p>
    <template v-else>
      <IssueFilterPanel
        :filter="filter"
        :assignees="assignees"
        @change="setFilter"
        @clear="clearFilter"
      />
      <p class="count" data-testid="issue-count">{{ visibleIssues.length }}件</p>
      <p v-if="visibleIssues.length === 0" class="empty">条件に一致する課題はありません</p>
    </template>
    <table v-if="!loadError && visibleIssues.length > 0" class="table">
      <thead>
        <tr>
          <th>タイトル</th>
          <th>ステータス</th>
          <th>担当者</th>
          <th>優先度</th>
          <th>期限日</th>
          <th>登録日時</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="issue in visibleIssues"
          :key="issue.id"
          data-testid="issue-row"
          :class="{ overdue: isIssueOverdue(issue, today) }"
        >
          <td>
            <NuxtLink :to="`/projects/${project.id}/issues/${issue.id}`" data-testid="issue-title">
              {{ issue.title }}
            </NuxtLink>
          </td>
          <td><IssueStatusBadge :status="issue.status" /></td>
          <td data-testid="issue-assignee">{{ issue.assignee ?? "-" }}</td>
          <td data-testid="issue-priority">{{ ISSUE_PRIORITY_LABELS[issue.priority] }}</td>
          <td class="nowrap">
            <span data-testid="issue-due">{{ issue.dueDate ?? "-" }}</span>
            <OverdueBadge v-if="isIssueOverdue(issue, today)" />
          </td>
          <td><DateTime :value="issue.createdAt" /></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.count {
  color: var(--muted);
  font-size: 0.9rem;
  margin: 0 0 0.5rem;
}

tr.overdue {
  background: var(--danger-bg);
}

.nowrap {
  white-space: nowrap;
}

.issue-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}
</style>
