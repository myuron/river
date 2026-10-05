<script setup lang="ts">
const props = defineProps<{ projectId: number; tasks: Task[] }>();
const emit = defineEmits<{ changed: [] }>();

const rows = computed(() => flattenWbsTree(buildWbsTree(props.tasks)));

const newTitle = ref("");
const newError = ref("");
const submitting = ref(false);

/** The row whose inline form is open: adding a child or editing the title. */
const inline = ref<{ mode: "child" | "edit"; taskId: number } | null>(null);
const inlineTitle = ref("");
const inlineError = ref("");
const rowError = ref<{ taskId: number; message: string } | null>(null);
const deletingId = ref<number | null>(null);

// Drop state that points at tasks which no longer exist.
watch(
  () => props.tasks,
  (tasks) => {
    const ids = new Set(tasks.map((t) => t.id));
    if (inline.value && !ids.has(inline.value.taskId)) inline.value = null;
    if (rowError.value && !ids.has(rowError.value.taskId)) rowError.value = null;
  },
);

const tasksUrl = computed(() => `/api/projects/${props.projectId}/tasks`);

async function submit(
  title: string,
  setError: (message: string) => void,
  send: () => Promise<unknown>,
) {
  setError("");
  if (!normalizeRequiredText(title)) {
    setError("タイトルを入力してください");
    return false;
  }
  submitting.value = true;
  try {
    await send();
    emit("changed");
    return true;
  } catch (e) {
    setError(errorMessage(e));
    return false;
  } finally {
    submitting.value = false;
  }
}

async function addTopLevel() {
  const title = newTitle.value;
  const ok = await submit(
    title,
    (m) => (newError.value = m),
    () => $fetch(tasksUrl.value, { method: "POST", body: { title, parentId: null } }),
  );
  if (ok) newTitle.value = "";
}

function openInline(mode: "child" | "edit", task: Task) {
  rowError.value = null;
  inline.value = { mode, taskId: task.id };
  inlineTitle.value = mode === "edit" ? task.title : "";
  inlineError.value = "";
}

async function submitInline() {
  const current = inline.value;
  if (!current) return;
  const title = inlineTitle.value;
  const ok = await submit(
    title,
    (m) => (inlineError.value = m),
    () =>
      current.mode === "child"
        ? $fetch(tasksUrl.value, { method: "POST", body: { title, parentId: current.taskId } })
        : $fetch(`${tasksUrl.value}/${current.taskId}`, { method: "PATCH", body: { title } }),
  );
  if (ok) inline.value = null;
}

async function deleteTask(node: WbsNode<Task>) {
  if (deletingId.value !== null) return;
  const descendants = countDescendants(node);
  const message =
    descendants > 0
      ? `「${node.task.title}」を削除しますか？\n配下のタスク${descendants}件もすべて削除されます。`
      : `「${node.task.title}」を削除しますか？`;
  if (!window.confirm(message)) return;

  rowError.value = null;
  deletingId.value = node.task.id;
  try {
    await $fetch(`${tasksUrl.value}/${node.task.id}`, { method: "DELETE" });
    inline.value = null;
  } catch (e) {
    rowError.value = { taskId: node.task.id, message: errorMessage(e) };
  } finally {
    deletingId.value = null;
    // Refresh on failure too: the task may already be gone (404).
    emit("changed");
  }
}
</script>

<template>
  <div>
    <form class="form-row" @submit.prevent="addTopLevel">
      <label class="field">
        <span>タスク名</span>
        <input v-model="newTitle" name="title" type="text" />
      </label>
      <button type="submit" :disabled="submitting">タスクを追加</button>
    </form>
    <p v-if="newError" class="error" role="alert">{{ newError }}</p>

    <p v-if="rows.length === 0" class="empty">タスクがまだありません</p>
    <ul v-else class="wbs">
      <li
        v-for="row in rows"
        :key="row.task.id"
        class="wbs-row"
        data-testid="wbs-row"
        :style="{ '--depth': row.depth }"
      >
        <div class="wbs-line">
          <span class="wbs-number" data-testid="wbs-number">{{ row.number }}</span>
          <span class="wbs-title" data-testid="wbs-title">{{ row.task.title }}</span>
          <span class="wbs-actions">
            <button type="button" class="secondary small" @click="openInline('edit', row.task)">
              編集
            </button>
            <button
              type="button"
              class="danger small"
              :disabled="deletingId !== null"
              @click="deleteTask(row)"
            >
              削除
            </button>
            <button type="button" class="secondary small" @click="openInline('child', row.task)">
              子タスクを追加
            </button>
          </span>
        </div>
        <form
          v-if="inline?.taskId === row.task.id"
          class="form-row inline-form"
          @submit.prevent="submitInline"
        >
          <input
            v-model="inlineTitle"
            name="inline-title"
            type="text"
            :aria-label="inline.mode === 'child' ? '子タスク名' : '新しいタイトル'"
          />
          <button type="submit" :disabled="submitting">
            {{ inline.mode === "child" ? "追加" : "保存" }}
          </button>
          <button type="button" class="secondary" @click="inline = null">キャンセル</button>
        </form>
        <p v-if="inline?.taskId === row.task.id && inlineError" class="error" role="alert">
          {{ inlineError }}
        </p>
        <p v-if="rowError?.taskId === row.task.id" class="error" role="alert">
          {{ rowError.message }}
        </p>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.wbs {
  list-style: none;
  margin: 1rem 0 0;
  padding: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.wbs-row + .wbs-row {
  border-top: 1px solid var(--border);
}

.wbs-row {
  padding: 0.5rem 1rem 0.5rem calc(1rem + var(--depth) * 1.5rem);
}

.wbs-line {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.wbs-number {
  min-width: 3rem;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.wbs-title {
  flex: 1;
}

.wbs-actions {
  display: flex;
  gap: 0.25rem;
}

.inline-form {
  margin-top: 0.5rem;
}

button.small {
  padding: 0.15rem 0.5rem;
  font-size: 0.85rem;
}
</style>
