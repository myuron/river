import { defineConfig } from "drizzle-kit";

// drizzle-kit does not load .env on its own
try {
  process.loadEnvFile();
} catch {
  // no .env file; rely on the environment
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./server/db/schema.ts",
  out: "./server/db/migrations",
  dbCredentials: {
    url: process.env.NUXT_DATABASE_URL!,
  },
});
