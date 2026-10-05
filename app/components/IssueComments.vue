<script setup lang="ts">
const props = defineProps<{ projectId: number; issueId: number }>();

const url = computed(() => `/api/projects/${props.projectId}/issues/${props.issueId}/comments`);
const {
  data: comments,
  error: loadError,
  refresh,
} = await useFetch<IssueComment[]>(url, { default: () => [] });

const author = ref("");
const body = ref("");
const error = ref("");
const posting = ref(false);

async function post() {
  error.value = "";
  if (isBlank(body.value)) {
    error.value = "コメントを入力してください";
    return;
  }
  posting.value = true;
  try {
    await $fetch<IssueComment>(url.value, {
      method: "POST",
      body: { author: author.value, body: body.value },
    });
    body.value = "";
    await refresh();
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    posting.value = false;
  }
}
</script>

<template>
  <section class="comments">
    <h2>コメント</h2>
    <p v-if="loadError" class="error">コメントを読み込めませんでした</p>
    <p v-else-if="comments.length === 0" class="empty">コメントはまだありません</p>
    <ol v-else class="comment-list">
      <li v-for="comment in comments" :key="comment.id" class="card" data-testid="comment">
        <div class="comment-meta">
          <strong data-testid="comment-author">{{ comment.author ?? "匿名" }}</strong>
          <DateTime :value="comment.createdAt" />
        </div>
        <div class="comment-body" data-testid="comment-body">{{ comment.body }}</div>
      </li>
    </ol>

    <form class="comment-form" @submit.prevent="post">
      <label class="field">
        <span>投稿者名</span>
        <input v-model="author" name="author" type="text" />
      </label>
      <label class="field">
        <span>コメント</span>
        <textarea v-model="body" name="body" rows="3" />
      </label>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <div>
        <button type="submit" :disabled="posting">コメントを投稿</button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.comment-list {
  list-style: none;
  margin: 0 0 1rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.comment-meta {
  display: flex;
  gap: 0.75rem;
  align-items: baseline;
  font-size: 0.85rem;
  color: var(--muted);
}

.comment-meta strong {
  color: var(--text);
}

.comment-body {
  white-space: pre-wrap;
  margin-top: 0.25rem;
}

.comment-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 40rem;
}
</style>
