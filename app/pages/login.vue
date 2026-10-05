<script setup lang="ts">
useHead({ title: "ログイン" });

const route = useRoute();
const { setUser } = useAuth();

const email = ref("");
const password = ref("");
const error = ref("");
const submitting = ref(false);

async function login() {
  error.value = "";
  submitting.value = true;
  try {
    const { user } = await $fetch<{ user: SessionUser }>("/api/auth/login", {
      method: "POST",
      body: { email: email.value, password: password.value },
    });
    setUser(user);
    await navigateTo(safeRedirect(route.query.redirect));
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="auth-page">
    <h1>ログイン</h1>
    <form class="card auth-form" @submit.prevent="login">
      <label class="field">
        <span>メールアドレス</span>
        <input v-model="email" name="email" type="email" autocomplete="username" />
      </label>
      <label class="field">
        <span>パスワード</span>
        <input v-model="password" name="password" type="password" autocomplete="current-password" />
      </label>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button type="submit" :disabled="submitting">ログイン</button>
    </form>
    <p>
      アカウントをお持ちでない方は
      <NuxtLink to="/signup">ユーザー登録</NuxtLink>
    </p>
  </div>
</template>
