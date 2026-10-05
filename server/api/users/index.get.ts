import { asc } from "drizzle-orm";
import { users } from "../../db/schema";

/** Registered users for assignee pickers (no emails). */
export default defineEventHandler(() =>
  useDb()
    .select({ id: users.id, name: users.name })
    .from(users)
    .orderBy(asc(users.name), asc(users.id)),
);
