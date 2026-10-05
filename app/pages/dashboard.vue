<script setup lang="ts">
useHead({ title: "ダッシュボード" });

const { data, error } = await useFetch<{ tasks: MyTask[]; issues: MyIssue[] }>(
  "/api/me/assignments",
  { default: () => ({ tasks: [], issues: [] }) },
);

const today = useToday();
const summary = computed(() => summarizeMyWork(data.value.tasks, data.value.issues, today.value));
const stateOf = (date: string | null) => deadlineState(date, today.value);

/** Whole-row click; modified clicks are left to the link (new tab etc.). */
function openRow(event: MouseEvent, url: string) {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  void navigateTo(url);
}
</script>

<template>
  <div>
    <h1>ダッシュボード</h1>
    <p v-if="error" class="error">担当分を読み込めませんでした</p>
    <template v-else>
      <div class="tiles" aria-label="件数">
        <StatTile label="担当タスク" :value="summary.taskCount" testid="count-tasks" />
        <StatTile label="担当課題" :value="summary.issueCount" testid="count-issues" />
        <StatTile label="期限切れ" :value="summary.overdueCount" testid="count-overdue" />
        <StatTile label="7日以内に期限" :value="summary.soonCount" testid="count-soon" />
      </div>

      <section aria-labelledby="my-tasks">
        <h2 id="my-tasks">担当タスク</h2>
        <p v-if="data.tasks.length === 0" class="empty">担当中のタスクはありません</p>
        <table v-else class="table">
          <thead>
            <tr>
              <th>プロジェクト</th>
              <th>WBS</th>
              <th>タイトル</th>
              <th>ステータス</th>
              <th>終了予定日</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="task in data.tasks"
              :key="task.id"
              class="clickable"
              data-testid="my-task-row"
              :class="stateOf(task.plannedEnd) && `deadline-${stateOf(task.plannedEnd)}`"
              @click="openRow($event, `/projects/${task.projectId}`)"
            >
              <td data-testid="my-task-project">{{ task.projectName }}</td>
              <td data-testid="my-task-number">{{ task.wbsNumber }}</td>
              <td>
                <NuxtLink
                  :to="`/projects/${task.projectId}`"
                  data-testid="my-task-title"
                  @click.stop
                >
                  {{ task.title }}
                </NuxtLink>
              </td>
              <td data-testid="my-task-status">{{ TASK_STATUS_LABELS[task.status] }}</td>
              <td class="nowrap">
                <span data-testid="my-task-end">{{ task.plannedEnd ?? "-" }}</span>
                <DeadlineBadge v-if="stateOf(task.plannedEnd)" :state="stateOf(task.plannedEnd)!" />
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section aria-labelledby="my-issues">
        <h2 id="my-issues">担当課題</h2>
        <p v-if="data.issues.length === 0" class="empty">担当中の課題はありません</p>
        <table v-else class="table">
          <thead>
            <tr>
              <th>プロジェクト</th>
              <th>タイトル</th>
              <th>ステータス</th>
              <th>優先度</th>
              <th>期限日</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="issue in data.issues"
              :key="issue.id"
              class="clickable"
              data-testid="my-issue-row"
              :class="stateOf(issue.dueDate) && `deadline-${stateOf(issue.dueDate)}`"
              @click="openRow($event, `/projects/${issue.projectId}/issues/${issue.id}`)"
            >
              <td data-testid="my-issue-project">{{ issue.projectName }}</td>
              <td>
                <NuxtLink
                  :to="`/projects/${issue.projectId}/issues/${issue.id}`"
                  data-testid="my-issue-title"
                  @click.stop
                >
                  {{ issue.title }}
                </NuxtLink>
              </td>
              <td><IssueStatusBadge :status="issue.status" /></td>
              <td data-testid="my-issue-priority">{{ ISSUE_PRIORITY_LABELS[issue.priority] }}</td>
              <td class="nowrap">
                <span data-testid="my-issue-due">{{ issue.dueDate ?? "-" }}</span>
                <DeadlineBadge v-if="stateOf(issue.dueDate)" :state="stateOf(issue.dueDate)!" />
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>

<style scoped>
.tiles {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.nowrap {
  white-space: nowrap;
}

tr.deadline-overdue {
  background: var(--danger-bg);
}

tr.deadline-soon {
  background: var(--warning-bg);
}

tr.clickable {
  cursor: pointer;
}

tr.clickable:hover {
  /* Darken instead of replacing the background, so deadline tints stay visible. */
  filter: brightness(0.96);
}
</style>
