<script setup lang="ts">
const route = useRoute();
const [{ project }, { data: tasks, refresh: refreshTasks }] = await Promise.all([
  useProject(),
  useFetch<Task[]>(() => `/api/projects/${String(route.params.id)}/tasks`, { default: () => [] }),
]);

useHead({ title: () => project.value?.name ?? "" });

const view = ref<"tree" | "gantt">("tree");
</script>

<template>
  <div v-if="project">
    <ProjectNav :project="project" />
    <h1>{{ project.name }}</h1>

    <div class="wbs-head">
      <h2>WBS</h2>
      <div class="toggle" role="group" aria-label="表示切り替え">
        <button
          type="button"
          :class="{ secondary: view !== 'tree' }"
          :aria-pressed="view === 'tree'"
          @click="view = 'tree'"
        >
          ツリー
        </button>
        <button
          type="button"
          :class="{ secondary: view !== 'gantt' }"
          :aria-pressed="view === 'gantt'"
          @click="view = 'gantt'"
        >
          ガントチャート
        </button>
      </div>
    </div>
    <WbsTree
      v-if="view === 'tree'"
      :project-id="project.id"
      :tasks="tasks"
      @changed="refreshTasks"
    />
    <GanttChart v-else :tasks="tasks" />
  </div>
</template>

<style scoped>
.wbs-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.toggle {
  display: flex;
}

.toggle button:first-child {
  border-radius: var(--radius) 0 0 var(--radius);
}

.toggle button:last-child {
  border-radius: 0 var(--radius) var(--radius) 0;
}
</style>
