<script setup lang="ts">
/** Picks a registered user as the assignee; "" means unassigned. */
const model = defineModel<string>({ required: true });
const { data: users } = await useUsers();
</script>

<template>
  <select v-model="model">
    <option value="">未設定</option>
    <option v-for="user in users" :key="user.id" :value="String(user.id)">{{ user.name }}</option>
  </select>
</template>
