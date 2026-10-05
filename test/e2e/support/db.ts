import postgres from "postgres";

/** Direct DB access for assertions the API can't show (e.g. stored password hashes). */
export async function withDb<T>(run: (sql: postgres.Sql) => Promise<T>): Promise<T> {
  try {
    process.loadEnvFile();
  } catch {
    // no .env file; CI sets the env directly
  }
  const sql = postgres(process.env.NUXT_DATABASE_URL!, { max: 1 });
  try {
    return await run(sql);
  } finally {
    await sql.end();
  }
}
