import type { APIRequestContext, Page } from "@playwright/test";

/** Navigates and waits until Vue has hydrated, so form handlers are attached. */
export async function gotoHydrated(page: Page, url: string) {
  const response = await page.goto(url);
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
  return response;
}

/** A name that won't collide with data left by other runs in the shared DB. */
export function uniqueName(prefix: string) {
  return `${prefix} ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Creates a project through the API and returns its id. */
export async function createProject(request: APIRequestContext, name = uniqueName("PJ")) {
  const response = await request.post("/api/projects", { data: { name } });
  if (!response.ok()) throw new Error(`createProject failed: ${response.status()}`);
  return ((await response.json()) as { id: number }).id;
}
