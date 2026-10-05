<script setup lang="ts">
const props = defineProps<{ projectId: number; issue: Issue }>();
const emit = defineEmits<{ saved: []; cancel: [] }>();

const form = reactive({
  title: props.issue.title,
  body: props.issue.body,
  status: props.issue.status,
  assigneeId: props.issue.assignee ? String(props.issue.assignee.id) : "",
  priority: props.issue.priority,
  dueDate: props.issue.dueDate ?? "",
});
const error = ref("");
const saving = ref(false);

async function save() {
  error.value = "";
  const parsed = parseIssueFields({ ...form });
  if (!parsed.ok) {
    error.value = parsed.message;
    return;
  }
  saving.value = true;
  try {
    await $fetch<Issue>(`/api/projects/${props.projectId}/issues/${props.issue.id}`, {
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
  <form class="card edit-form" @submit.prevent="save">
    <label class="field">
      <span>タイトル</span>
      <input v-model="form.title" type="text" />
    </label>
    <label class="field">
      <span>本文</span>
      <textarea v-model="form.body" rows="5" />
    </label>
    <div class="grid">
      <label class="field">
        <span>ステータス</span>
        <select v-model="form.status">
          <option v-for="status in ISSUE_STATUSES" :key="status" :value="status">
            {{ ISSUE_STATUS_LABELS[status] }}
          </option>
        </select>
      </label>
      <label class="field">
        <span>担当者</span>
        <AssigneeSelect v-model="form.assigneeId" />
      </label>
      <label class="field">
        <span>優先度</span>
        <select v-model="form.priority">
          <option v-for="priority in ISSUE_PRIORITIES" :key="priority" :value="priority">
            {{ ISSUE_PRIORITY_LABELS[priority] }}
          </option>
        </select>
      </label>
      <label class="field">
        <span>期限日</span>
        <input v-model="form.dueDate" type="date" />
      </label>
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <div class="form-row">
      <button type="submit" :disabled="saving">保存</button>
      <button type="button" class="secondary" @click="emit('cancel')">キャンセル</button>
    </div>
  </form>
</template>

<style scoped>
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  gap: 0.5rem 0.75rem;
}
</style>
