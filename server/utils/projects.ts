import type { H3Event } from "h3";
import { eq } from "drizzle-orm";
import { projects } from "../db/schema";

/** Loads the project in the `id` route param, or throws 404. */
export async function requireProject(event: H3Event, name = "id") {
  const id = requireIdParam(event, name);
  const [project] = await useDb().select().from(projects).where(eq(projects.id, id));
  if (!project) {
    throw createError({ statusCode: 404, statusMessage: "Project not found" });
  }
  return project;
}
