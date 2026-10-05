<script setup lang="ts">
const props = defineProps<{ projectId: number; task: Task; hasChildren: boolean }>();
const emit = defineEmits<{ saved: []; cancel: [] }>();

const form = reactive({
  plannedStart: props.task.plannedStart ?? "",
  plannedEnd: props.task.plannedEnd ?? "",
  actualStart: props.task.actualStart ?? "",
  actualEnd: props.task.actualEnd ?? "",
  assignee: props.task.assignee ?? "",
  status: props.task.status,
  estimateHours: props.task.estimateHours === null ? "" : String(props.task.estimateHours),
});
const error = ref("");
const saving = ref(false);

async function save() {
  error.value = "";
  const parsed = parseTaskDetails({ ...form });
  if (!parsed.ok) {
    error.value = parsed.message;
    return;
  }
  const dateError = checkTaskDateOrder({ ...props.task, ...parsed.value });
  if (dateError) {
    error.value = dateError;
    return;
  }
  saving.value = true;
  try {
    await $fetch<Task>(`/api/projects/${props.projectId}/tasks/${props.task.id}`, {
      method: "PATCH",
      body: parsed.value,
    });
    emit("saved");
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <form class="details-form" @submit.prevent="save">
    <div class="details-grid">
      <label class="field">
        <span>開始予定日</span>
        <input v-model="form.plannedStart" type="date" />
      </label>
      <label class="field">
        <span>終了予定日</span>
        <input v-model="form.plannedEnd" type="date" />
      </label>
      <label class="field">
        <span>開始日</span>
        <input v-model="form.actualStart" type="date" />
      </label>
      <label class="field">
        <span>終了日</span>
        <input v-model="form.actualEnd" type="date" />
      </label>
      <label class="field">
        <span>担当者</span>
        <input v-model="form.assignee" type="text" />
      </label>
      <label class="field">
        <span>ステータス</span>
        <select v-model="form.status">
          <option v-for="status in TASK_STATUSES" :key="status" :value="status">
            {{ TASK_STATUS_LABELS[status] }}
          </option>
        </select>
      </label>
      <label class="field">
        <span>見積工数（時間）</span>
        <input
          v-model="form.estimateHours"
          type="text"
          inputmode="decimal"
          :disabled="hasChildren"
          aria-describedby="estimate-hint"
        />
        <small v-if="hasChildren" id="estimate-hint" class="hint"
          >子タスクの合計が表示されます</small
        >
      </label>
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <div class="form-row">
      <button type="submit" :disabled="saving">詳細を保存</button>
      <button type="button" class="secondary" @click="emit('cancel')">キャンセル</button>
    </div>
  </form>
</template>

<style scoped>
.details-form {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: var(--bg);
  border-radius: var(--radius);
}

.hint {
  color: var(--muted);
  font-size: 0.75rem;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  gap: 0.5rem 0.75rem;
  margin-bottom: 0.5rem;
}
</style>
