import { expect, test } from "@playwright/test";
import { createIssue, createProject, gotoHydrated, isoDate, createUsers } from "./support/app";

test("filters issues, keeps the filter in the URL and clears it", async ({
  page,
  request,
  playwright,
}) => {
  const [sato, suzuki] = await createUsers(playwright, "佐藤", "鈴木");
  const projectId = await createProject(request);
  await createIssue(request, projectId, {
    title: "A 未対応 佐藤 高",
    assigneeId: sato.id,
    priority: "high",
  });
  await createIssue(request, projectId, {
    title: "B 対応中 鈴木 低 期限切れ",
    status: "in_progress",
    assigneeId: suzuki.id,
    priority: "low",
    dueDate: isoDate(-2),
  });
  await createIssue(request, projectId, {
    title: "C 解決済み 佐藤",
    status: "resolved",
    assigneeId: sato.id,
  });
  await createIssue(request, projectId, { title: "D 未対応 未割り当て" });

  const titles = page.getByTestId("issue-title");
  const count = page.getByTestId("issue-count");

  await gotoHydrated(page, `/projects/${projectId}/issues`);
  await expect(titles).toHaveText([
    "D 未対応 未割り当て",
    "B 対応中 鈴木 低 期限切れ",
    "A 未対応 佐藤 高",
  ]);
  await expect(count).toHaveText("3件");

  const filters = page.getByRole("search", { name: "課題の絞り込み" });
  await filters.getByLabel("解決済み").check();
  await filters.getByLabel("担当者").selectOption({ label: sato.name });
  await expect(titles).toHaveText(["C 解決済み 佐藤", "A 未対応 佐藤 高"]);
  await filters.getByLabel("高", { exact: true }).check();
  await expect(titles).toHaveText(["A 未対応 佐藤 高"]);
  await expect(count).toHaveText("1件");

  await page.reload();
  await expect(titles).toHaveText(["A 未対応 佐藤 高"]);
  await expect(filters.getByLabel("担当者")).toHaveValue(String(sato.id));

  // The same URL reproduces the result in a fresh page.
  const shared = await page.context().newPage();
  await shared.goto(page.url());
  await expect(shared.getByTestId("issue-title")).toHaveText(["A 未対応 佐藤 高"]);
  await shared.close();

  await filters.getByLabel("担当者").selectOption({ label: "未割り当て" });
  await expect(page.getByText("条件に一致する課題はありません")).toBeVisible();
  await expect(count).toHaveText("0件");

  await filters.getByRole("button", { name: "条件をクリア" }).click();
  await expect(count).toHaveText("4件");
  for (const label of ["未対応", "対応中", "解決済み"]) {
    await expect(filters.getByLabel(label)).toBeChecked();
  }

  await filters.getByLabel("期限切れのみ").check();
  await expect(titles).toHaveText(["B 対応中 鈴木 低 期限切れ"]);
});
