<script setup lang="ts">
const route = useRoute();
const [{ project }, { data: tasks, error: tasksError }, { data: issues, error: issuesError }] =
  await Promise.all([
    useProject(),
    useFetch<Task[]>(() => `/api/projects/${String(route.params.id)}/tasks`, { default: () => [] }),
    useFetch<Issue[]>(() => `/api/projects/${String(route.params.id)}/issues`, {
      default: () => [],
    }),
  ]);

useHead({ title: () => `ダッシュボード - ${project.value?.name ?? ""}` });

const today = useToday();
const wbs = computed(() => summarizeWbs(tasks.value, today.value));
const issueSummary = computed(() => summarizeIssues(issues.value, today.value));
const rate = (value: number | null) => (value === null ? "-" : `${value}%`);

/** Whole-row click; modified clicks are left to the title link (new tab etc.). */
function openRow(event: MouseEvent, url: string) {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  void navigateTo(url);
}
</script>

<template>
  <div v-if="project">
    <ProjectNav :project="project" />
    <h1>ダッシュボード</h1>

    <section aria-labelledby="wbs-progress">
      <h2 id="wbs-progress">WBSの進捗</h2>
      <p v-if="tasksError" class="error">WBSタスクを読み込めませんでした</p>
      <template v-else>
        <p v-if="wbs.leafCount === 0" class="empty">WBSタスクがまだありません</p>
        <div class="tiles">
          <StatTile label="末端タスク" :value="wbs.leafCount" testid="leaf-total" />
          <StatTile
            v-for="status in TASK_STATUSES"
            :key="status"
            :label="TASK_STATUS_LABELS[status]"
            :value="wbs.byStatus[status]"
            :testid="`leaf-${status}`"
          />
          <StatTile label="完了率（件数）" :value="rate(wbs.countRate)" testid="count-rate" />
          <StatTile label="完了率（工数）" :value="rate(wbs.hoursRate)" testid="hours-rate" />
        </div>
        <p class="note">集計対象は子タスクを持たない末端タスクです。</p>
      </template>
    </section>

    <section aria-labelledby="delayed-tasks">
      <h2 id="delayed-tasks">遅延タスク</h2>
      <p v-if="tasksError" class="error">WBSタスクを読み込めませんでした</p>
      <p v-else-if="wbs.delayed.length === 0" class="empty">遅延しているタスクはありません</p>
      <table v-else class="table">
        <thead>
          <tr>
            <th>タスク</th>
            <th>担当者</th>
            <th>終了予定日</th>
            <th>遅延日数</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in wbs.delayed" :key="row.task.id" data-testid="delayed-row">
            <td>
              <span class="number">{{ row.number }}</span>
              <span data-testid="delayed-title">{{ row.task.title }}</span>
            </td>
            <td data-testid="delayed-assignee">{{ row.task.assignee ?? "-" }}</td>
            <td data-testid="delayed-end">{{ row.task.plannedEnd }}</td>
            <td data-testid="delayed-days">{{ row.daysLate }}日</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section aria-labelledby="issue-summary">
      <h2 id="issue-summary">課題</h2>
      <p v-if="issuesError" class="error">課題を読み込めませんでした</p>
      <template v-else>
        <div class="tile-groups">
          <div>
            <h3>ステータス別</h3>
            <div class="tiles">
              <StatTile
                v-for="status in ISSUE_STATUSES"
                :key="status"
                :label="ISSUE_STATUS_LABELS[status]"
                :value="issueSummary.byStatus[status]"
                :testid="`issues-${status}`"
              />
            </div>
          </div>
          <div>
            <h3>未解決の優先度別</h3>
            <div class="tiles">
              <StatTile
                v-for="priority in ISSUE_PRIORITIES"
                :key="priority"
                :label="ISSUE_PRIORITY_LABELS[priority]"
                :value="issueSummary.unresolvedByPriority[priority]"
                :testid="`issues-priority-${priority}`"
              />
            </div>
          </div>
        </div>

        <h3>期限切れ課題</h3>
        <p v-if="issueSummary.overdue.length === 0" class="empty">期限切れの課題はありません</p>
        <table v-else class="table">
          <thead>
            <tr>
              <th>タイトル</th>
              <th>担当者</th>
              <th>優先度</th>
              <th>期限日</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="issue in issueSummary.overdue"
              :key="issue.id"
              class="clickable"
              data-testid="overdue-issue-row"
              @click="openRow($event, `/projects/${project.id}/issues/${issue.id}`)"
            >
              <td>
                <NuxtLink
                  :to="`/projects/${project.id}/issues/${issue.id}`"
                  data-testid="overdue-issue-title"
                  @click.stop
                >
                  {{ issue.title }}
                </NuxtLink>
              </td>
              <td data-testid="overdue-issue-assignee">{{ issue.assignee ?? "-" }}</td>
              <td data-testid="overdue-issue-priority">
                {{ ISSUE_PRIORITY_LABELS[issue.priority] }}
              </td>
              <td data-testid="overdue-issue-due">{{ issue.dueDate }}</td>
            </tr>
          </tbody>
        </table>
      </template>
    </section>
  </div>
</template>

<style scoped>
.tiles {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

h3 {
  font-size: 0.95rem;
  margin: 1rem 0 0.5rem;
}

.tile-groups {
  display: flex;
  flex-wrap: wrap;
  gap: 0 2rem;
}

tr.clickable {
  cursor: pointer;
}

tr.clickable:hover {
  background: var(--bg);
}

.note {
  font-size: 0.8rem;
  color: var(--muted);
  margin: 0.5rem 0 0;
}

.number {
  color: var(--muted);
  margin-right: 0.5rem;
  font-variant-numeric: tabular-nums;
}
</style>
