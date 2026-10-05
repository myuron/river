<script setup lang="ts">
const props = defineProps<{ tasks: Task[] }>();

const today = useToday();
const gantt = computed(() => buildGantt(props.tasks, today.value));

const dayOfMonth = (day: string) => Number(day.slice(8));
/** Month label on the first day of the axis and on the 1st of each month. */
const monthLabel = (day: string, index: number) =>
  index === 0 || dayOfMonth(day) === 1 ? `${Number(day.slice(5, 7))}月` : "";
const isWeekend = (day: string) => {
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
  return weekday === 0 || weekday === 6;
};

const barStyle = (bar: GanttBar) => ({
  left: `calc(${bar.offset} * var(--day-width))`,
  width: `calc(${bar.length} * var(--day-width))`,
});
</script>

<template>
  <p v-if="!gantt" class="empty">日程が設定されたタスクがありません</p>
  <div v-else class="gantt-wrap">
    <div class="legend">
      <span><i class="swatch planned" />予定</span>
      <span><i class="swatch actual" />実績</span>
    </div>
    <div class="gantt" :style="{ '--days': gantt.days.length }">
      <div class="gantt-line gantt-head">
        <div class="label">タスク</div>
        <div class="timeline">
          <div
            v-for="(day, i) in gantt.days"
            :key="day"
            class="day"
            :class="{ weekend: isWeekend(day) }"
            data-testid="gantt-day"
            :data-date="day"
          >
            <span class="month">{{ monthLabel(day, i) }}</span>
            <span>{{ dayOfMonth(day) }}</span>
          </div>
        </div>
      </div>
      <div v-for="row in gantt.rows" :key="row.task.id" class="gantt-line" data-testid="gantt-row">
        <div class="label" :style="{ paddingLeft: `calc(0.5rem + ${row.depth} * 1rem)` }">
          <span class="number" data-testid="gantt-number">{{ row.number }}</span>
          <span class="title" data-testid="gantt-title" :title="row.task.title">
            {{ row.task.title }}
          </span>
        </div>
        <div class="timeline">
          <div
            v-if="row.planned"
            class="bar planned"
            data-testid="gantt-planned"
            :data-start="row.planned.start"
            :data-end="row.planned.end"
            :title="`予定 ${row.planned.start}〜${row.planned.end}`"
            :style="barStyle(row.planned)"
          />
          <div
            v-if="row.actual"
            class="bar actual"
            data-testid="gantt-actual"
            :data-start="row.actual.start"
            :data-end="row.actual.end"
            :title="`実績 ${row.actual.start}〜${row.actual.end}`"
            :style="barStyle(row.actual)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gantt-wrap {
  --day-width: 28px;
  --planned: var(--accent);
  --actual: #d9822b;
}

.legend {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--muted);
  margin-bottom: 0.5rem;
}

.swatch {
  display: inline-block;
  width: 1.5rem;
  height: 0.6rem;
  margin-right: 0.35rem;
  border-radius: 2px;
}

.swatch.planned {
  background: var(--planned);
}

.swatch.actual {
  background: var(--actual);
}

.gantt {
  overflow-x: auto;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.gantt-line {
  display: grid;
  grid-template-columns: 16rem calc(var(--days) * var(--day-width));
  min-width: max-content;
  border-bottom: 1px solid var(--border);
}

.gantt-line:last-child {
  border-bottom: none;
}

.label {
  position: sticky;
  left: 0;
  z-index: 1;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.35rem 0.5rem;
  background: var(--surface);
  border-right: 1px solid var(--border);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.number {
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.timeline {
  position: relative;
  display: flex;
  min-height: 2.25rem;
  background-image: repeating-linear-gradient(
    to right,
    transparent 0 calc(var(--day-width) - 1px),
    var(--border) calc(var(--day-width) - 1px) var(--day-width)
  );
}

.gantt-head .label,
.day {
  font-size: 0.75rem;
  color: var(--muted);
}

.day {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: var(--day-width);
  flex: none;
  line-height: 1.2;
  padding: 0.2rem 0;
}

.day.weekend {
  background: var(--bg);
}

.month {
  white-space: nowrap;
  min-height: 0.9rem;
  font-weight: 600;
}

.bar {
  position: absolute;
  border-radius: 3px;
}

.bar.planned {
  top: 0.4rem;
  height: 0.7rem;
  background: var(--planned);
}

.bar.actual {
  top: 1.25rem;
  height: 0.5rem;
  background: var(--actual);
}
</style>
