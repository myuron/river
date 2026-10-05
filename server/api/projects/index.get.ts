import { asc } from "drizzle-orm";
import { projects } from "../../db/schema";

export default defineEventHandler(() => useDb().select().from(projects).orderBy(asc(projects.id)));
