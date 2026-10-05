import { expect, type Page, test } from "@playwright/test";
import { createProject, createTask, createUsers, gotoHydrated, isoDate } from "./support/app";

async function showGantt(page: Page, projectId: number) {
  await gotoHydrated(page, `/projects/${projectId}`);
  await page.getByRole("button", { name: "ガントチャート" }).click();
}

function ganttRow(page: Page, title: string) {
  return page.getByTestId("gantt-row").filter({
    has: page.getByTestId("gantt-title").getByText(title, { exact: true }),
  });
}

test("shows planned and actual bars on a daily axis in WBS order", async ({
  page,
  request,
  playwright,
}) => {
  const [sato] = await createUsers(playwright, "佐藤");
  const projectId = await createProject(request);
  const design = await createTask(request, projectId, {
    title: "設計",
    assigneeId: sato.id,
    plannedStart: "2026-05-04",
    plannedEnd: "2026-05-08",
    actualStart: "2026-05-05",
    actualEnd: "2026-05-11",
  });
  await createTask(request, projectId, { title: "レビュー", parentId: design });
  await createTask(request, projectId, {
    title: "実装",
    plannedStart: "2026-05-01",
    plannedEnd: "2026-05-02",
  });

  await showGantt(page, projectId);
  await expect(page.getByTestId("gantt-number")).toHaveText(["1", "1.1", "2"]);
  await expect(page.getByTestId("gantt-title")).toHaveText(["設計", "レビュー", "実装"]);
  await expect(page.getByTestId("gantt-assignee")).toHaveText([sato.name, "-", "-"]);

  const days = page.getByTestId("gantt-day");
  await expect(days).toHaveCount(11);
  await expect(days.first()).toHaveAttribute("data-date", "2026-05-01");
  await expect(days.last()).toHaveAttribute("data-date", "2026-05-11");

  const planned = ganttRow(page, "設計").getByTestId("gantt-planned");
  await expect(planned).toHaveAttribute("data-start", "2026-05-04");
  await expect(planned).toHaveAttribute("data-end", "2026-05-08");
  const actual = ganttRow(page, "設計").getByTestId("gantt-actual");
  await expect(actual).toHaveAttribute("data-end", "2026-05-11");

  // Both ends inclusive: 5 days wide, starting 3 days into the axis
  const dayBox = (await days.first().boundingBox())!;
  const plannedBox = (await planned.boundingBox())!;
  expect(plannedBox.width).toBeCloseTo(dayBox.width * 5, 0);
  expect(plannedBox.x - dayBox.x).toBeCloseTo(dayBox.width * 3, 0);

  await expect(ganttRow(page, "レビュー")).toBeVisible();
  await expect(ganttRow(page, "レビュー").locator(".bar")).toHaveCount(0);

  await page.getByRole("button", { name: "ツリー" }).click();
  await expect(page.getByTestId("wbs-row")).toHaveCount(3);
});

test("an actual bar without an end date runs to today", async ({ page, request }) => {
  const projectId = await createProject(request);
  await createTask(request, projectId, { title: "進行中", actualStart: isoDate(-3) });
  await showGantt(page, projectId);
  const actual = ganttRow(page, "進行中").getByTestId("gantt-actual");
  await expect(actual).toHaveAttribute("data-start", isoDate(-3));
  await expect(actual).toHaveAttribute("data-end", isoDate(0));
});

test("shows a message when no task has dates", async ({ page, request }) => {
  const projectId = await createProject(request);
  await createTask(request, projectId, { title: "日付なし" });
  await showGantt(page, projectId);
  await expect(page.getByText("日程が設定されたタスクがありません")).toBeVisible();
});
