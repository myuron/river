<script setup lang="ts">
const props = defineProps<{ projectId: number; tasks: Task[] }>();
const emit = defineEmits<{ changed: [] }>();

const rows = computed(() => flattenWbsTree(buildWbsTree(props.tasks)));

const newTitle = ref("");
const newError = ref("");
const childParentId = ref<number | null>(null);
const childTitle = ref("");
const childError = ref("");
const submitting = ref(false);

async function addTask(
  parentId: number | null,
  title: string,
  setError: (message: string) => void,
) {
  setError("");
  if (!normalizeRequiredText(title)) {
    setError("タイトルを入力してください");
    return false;
  }
  submitting.value = true;
  try {
    await $fetch(`/api/projects/${props.projectId}/tasks`, {
      method: "POST",
      body: { title, parentId },
    });
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
  if (await addTask(null, newTitle.value, (m) => (newError.value = m))) {
    newTitle.value = "";
  }
}

function openChildForm(parentId: number) {
  childParentId.value = parentId;
  childTitle.value = "";
  childError.value = "";
}

async function addChild() {
  if (childParentId.value === null) return;
  if (await addTask(childParentId.value, childTitle.value, (m) => (childError.value = m))) {
    childParentId.value = null;
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
          <button type="button" class="secondary small" @click="openChildForm(row.task.id)">
            子タスクを追加
          </button>
        </div>
        <form
          v-if="childParentId === row.task.id"
          class="form-row child-form"
          @submit.prevent="addChild"
        >
          <input v-model="childTitle" name="child-title" type="text" aria-label="子タスク名" />
          <button type="submit" :disabled="submitting">追加</button>
          <button type="button" class="secondary" @click="childParentId = null">キャンセル</button>
        </form>
        <p v-if="childParentId === row.task.id && childError" class="error" role="alert">
          {{ childError }}
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

.child-form {
  margin-top: 0.5rem;
}

button.small {
  padding: 0.15rem 0.5rem;
  font-size: 0.85rem;
}
</style>
