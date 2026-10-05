// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/test-utils/module"],
  runtimeConfig: {
    // Server-only; set via NUXT_DATABASE_URL
    databaseUrl: "",
  },
  typescript: {
    // Type-check node-side tests: unit and Playwright e2e (test/nuxt is covered by the app tsconfig)
    nodeTsConfig: {
      include: ["../test/unit/**/*", "../test/e2e/**/*", "../playwright.config.ts"],
    },
  },
});
