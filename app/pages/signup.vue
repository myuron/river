<script setup lang="ts">
useHead({ title: "ユーザー登録" });

const { setUser } = useAuth();

const form = reactive({ name: "", email: "", password: "" });
const error = ref("");
const submitting = ref(false);

async function signup() {
  error.value = "";
  const parsed = parseSignup(form);
  if (!parsed.ok) {
    error.value = parsed.message;
    return;
  }
  submitting.value = true;
  try {
    const { user } = await $fetch<{ user: SessionUser }>("/api/auth/signup", {
      method: "POST",
      body: parsed.value,
    });
    setUser(user);
    await navigateTo("/");
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="auth-page">
    <h1>ユーザー登録</h1>
    <form class="card auth-form" @submit.prevent="signup">
      <label class="field">
        <span>表示名</span>
        <input v-model="form.name" name="name" type="text" autocomplete="nickname" />
      </label>
      <label class="field">
        <span>メールアドレス</span>
        <input
          v-model="form.email"
          name="email"
          type="text"
          inputmode="email"
          autocomplete="email"
        />
      </label>
      <label class="field">
        <span>パスワード（8文字以上）</span>
        <input
          v-model="form.password"
          name="password"
          type="password"
          autocomplete="new-password"
        />
      </label>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button type="submit" :disabled="submitting">登録</button>
    </form>
    <p>登録済みの方は <NuxtLink to="/login">ログイン</NuxtLink></p>
  </div>
</template>
