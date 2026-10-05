import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

let instance: ReturnType<typeof createDb> | undefined;

function createDb(url: string) {
  return drizzle(postgres(url), { schema });
}

/** Shared Drizzle client, created lazily from `runtimeConfig.databaseUrl`. */
export function useDb() {
  if (!instance) {
    const { databaseUrl } = useRuntimeConfig();
    if (!databaseUrl) {
      throw new Error("NUXT_DATABASE_URL is not set");
    }
    instance = createDb(databaseUrl);
  }
  return instance;
}
