<script setup lang="ts">
useHead({ title: "プロジェクト一覧" });

const {
  data: projects,
  error: loadError,
  refresh,
} = await useFetch("/api/projects", { default: () => [] });

const name = ref("");
const error = ref("");
const submitting = ref(false);

async function createProject() {
  error.value = "";
  if (!normalizeRequiredText(name.value)) {
    error.value = "プロジェクト名を入力してください";
    return;
  }
  submitting.value = true;
  try {
    await $fetch("/api/projects", { method: "POST", body: { name: name.value } });
    name.value = "";
    await refresh();
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div>
    <h1>プロジェクト</h1>

    <form class="form-row" @submit.prevent="createProject">
      <label class="field">
        <span>プロジェクト名</span>
        <input v-model="name" name="name" type="text" />
      </label>
      <button type="submit" :disabled="submitting">作成</button>
    </form>
    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <h2>一覧</h2>
    <p v-if="loadError" class="error">プロジェクトを読み込めませんでした</p>
    <p v-else-if="projects.length === 0" class="empty">プロジェクトがまだありません</p>
    <ul v-else class="list">
      <li v-for="project in projects" :key="project.id">
        <NuxtLink :to="`/projects/${project.id}`">{{ project.name }}</NuxtLink>
      </li>
    </ul>
  </div>
</template>
