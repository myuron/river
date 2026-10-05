<script setup lang="ts">
const route = useRoute();
const [{ project }, { data: tasks, error: tasksError }] = await Promise.all([
  useProject(),
  useFetch<Task[]>(() => `/api/projects/${String(route.params.id)}/tasks`, { default: () => [] }),
]);

useHead({ title: () => `ダッシュボード - ${project.value?.name ?? ""}` });

const today = useToday();
const wbs = computed(() => summarizeWbs(tasks.value, today.value));
const rate = (value: number | null) => (value === null ? "-" : `${value}%`);
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
  </div>
</template>

<style scoped>
.tiles {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
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
