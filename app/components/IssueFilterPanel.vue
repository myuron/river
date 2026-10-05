<script setup lang="ts">
const props = defineProps<{ filter: IssueFilter; assignees: string[] }>();
const emit = defineEmits<{ change: [filter: IssueFilter]; clear: [] }>();

// Not a name the select can produce from the assignee list.
const UNASSIGNED = "__unassigned__";

function toggle<T>(list: T[], value: T, checked: boolean): T[] {
  return checked ? [...list, value] : list.filter((v) => v !== value);
}

function update(patch: Partial<IssueFilter>) {
  emit("change", { ...props.filter, ...patch });
}

const assigneeValue = computed(() =>
  props.filter.assignee.type === "unassigned"
    ? UNASSIGNED
    : props.filter.assignee.type === "name"
      ? props.filter.assignee.name
      : "",
);

function onAssigneeChange(value: string) {
  update({
    assignee:
      value === UNASSIGNED
        ? { type: "unassigned" }
        : value
          ? { type: "name", name: value }
          : { type: "any" },
  });
}

const checked = (event: Event) => (event.target as HTMLInputElement).checked;
</script>

<template>
  <div class="card filters" role="search" aria-label="課題の絞り込み">
    <fieldset>
      <legend>ステータス</legend>
      <label v-for="status in ISSUE_STATUSES" :key="status">
        <input
          type="checkbox"
          :checked="filter.statuses.includes(status)"
          @change="update({ statuses: toggle(filter.statuses, status, checked($event)) })"
        />
        {{ ISSUE_STATUS_LABELS[status] }}
      </label>
    </fieldset>
    <fieldset>
      <legend>優先度</legend>
      <label v-for="priority in ISSUE_PRIORITIES" :key="priority">
        <input
          type="checkbox"
          :checked="filter.priorities.includes(priority)"
          @change="update({ priorities: toggle(filter.priorities, priority, checked($event)) })"
        />
        {{ ISSUE_PRIORITY_LABELS[priority] }}
      </label>
    </fieldset>
    <label class="field">
      <span>担当者</span>
      <select
        :value="assigneeValue"
        @change="onAssigneeChange(($event.target as HTMLSelectElement).value)"
      >
        <option value="">すべて</option>
        <option v-for="name in assignees" :key="name" :value="name">{{ name }}</option>
        <option :value="UNASSIGNED">未割り当て</option>
      </select>
    </label>
    <label class="overdue-only">
      <input
        type="checkbox"
        :checked="filter.overdueOnly"
        @change="update({ overdueOnly: checked($event) })"
      />
      期限切れのみ
    </label>
    <button type="button" class="secondary" @click="emit('clear')">条件をクリア</button>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem 1.5rem;
  margin-bottom: 1rem;
}

fieldset {
  border: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: 0.75rem;
}

legend {
  font-size: 0.85rem;
  color: var(--muted);
  padding: 0;
  margin-bottom: 0.25rem;
}

label {
  white-space: nowrap;
}
</style>
