import type { APIRequestContext, Page, PlaywrightWorkerArgs } from "@playwright/test";
import { addDays, todayIsoDate } from "../../../shared/utils/dates";
import { LOGGED_OUT, uniqueEmail } from "./auth";

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

/** Creates a task through the API (optionally with detail fields) and returns its id. */
export async function createTask(
  request: APIRequestContext,
  projectId: number,
  data: { title: string; parentId?: number } & Record<string, unknown>,
) {
  const { title, parentId, ...details } = data;
  const response = await request.post(`/api/projects/${projectId}/tasks`, {
    data: { title, parentId: parentId ?? null },
  });
  if (!response.ok()) throw new Error(`createTask failed: ${response.status()}`);
  const id = ((await response.json()) as { id: number }).id;
  if (Object.keys(details).length > 0) {
    const patched = await request.patch(`/api/projects/${projectId}/tasks/${id}`, {
      data: details,
    });
    if (!patched.ok()) throw new Error(`updating task failed: ${patched.status()}`);
  }
  return id;
}

/** Local "YYYY-MM-DD", offset by `days` from today. */
export function isoDate(days = 0) {
  return addDays(todayIsoDate(), days);
}

/** Creates an issue through the API (optionally updating other fields) and returns its id. */
export async function createIssue(
  request: APIRequestContext,
  projectId: number,
  data: { title: string; body?: string } & Record<string, unknown>,
) {
  const { title, body, ...fields } = data;
  const response = await request.post(`/api/projects/${projectId}/issues`, {
    data: { title, body },
  });
  if (!response.ok()) throw new Error(`createIssue failed: ${response.status()}`);
  const id = ((await response.json()) as { id: number }).id;
  if (Object.keys(fields).length > 0) {
    const patched = await request.patch(`/api/projects/${projectId}/issues/${id}`, {
      data: fields,
    });
    if (!patched.ok()) throw new Error(`updating issue failed: ${patched.status()}`);
  }
  return id;
}

/**
 * Signs up users in a throwaway context (signing up through the test's own
 * `request` would replace its session). Names get a unique suffix because the
 * e2e database keeps every user ever created.
 */
type TestUser = { id: number; name: string };

export async function createUsers<const P extends string[]>(
  playwright: PlaywrightWorkerArgs["playwright"],
  ...prefixes: P
): Promise<{ [K in keyof P]: TestUser }> {
  // Explicitly logged out: newContext() inherits the shared storageState, and signing up
  // from it would end the session every other spec uses.
  const context = await playwright.request.newContext({
    baseURL: "http://localhost:3000",
    storageState: LOGGED_OUT,
  });
  try {
    const users: TestUser[] = [];
    for (const prefix of prefixes) {
      const response = await context.post("/api/auth/signup", {
        data: { name: uniqueName(prefix), email: uniqueEmail(), password: "password123" },
      });
      if (!response.ok()) throw new Error(`createUsers failed: ${response.status()}`);
      users.push(((await response.json()) as { user: TestUser }).user);
    }
    return users as { [K in keyof P]: TestUser };
  } finally {
    await context.dispose();
  }
}
