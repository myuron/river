// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/test-utils/module"],
  typescript: {
    // Type-check node-environment unit tests (test/nuxt is covered by the app tsconfig)
    nodeTsConfig: {
      include: ["../test/unit/**/*"],
    },
  },
});
