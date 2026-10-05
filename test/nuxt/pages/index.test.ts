import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { createError, setResponseStatus, type H3Event } from "h3";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearNuxtData } from "#imports";
import IndexPage from "~/pages/index.vue";

let projects: { id: number; name: string }[] = [];
let listFails = false;
const createProject = vi.fn();

registerEndpoint("/api/projects", {
  method: "GET",
  handler: () => {
    if (listFails) throw createError({ statusCode: 500 });
    return projects;
  },
});
registerEndpoint("/api/projects", { method: "POST", handler: createProject });

describe("project list page", () => {
  beforeEach(() => {
    clearNuxtData();
    projects = [];
    listFails = false;
    createProject.mockReset();
  });

  it("shows an empty message when there are no projects", async () => {
    const wrapper = await mountSuspended(IndexPage);
    expect(wrapper.text()).toContain("プロジェクトがまだありません");
  });

  it("shows a load error instead of the empty message when the list fails", async () => {
    listFails = true;
    const wrapper = await mountSuspended(IndexPage);
    expect(wrapper.text()).toContain("プロジェクトを読み込めませんでした");
    expect(wrapper.text()).not.toContain("プロジェクトがまだありません");
  });

  it("lists projects linking to their detail pages", async () => {
    projects = [
      { id: 1, name: "Alpha" },
      { id: 2, name: "Beta" },
    ];
    const wrapper = await mountSuspended(IndexPage);
    const links = wrapper.findAll("a");
    expect(links.map((a) => a.text())).toEqual(["Alpha", "Beta"]);
    expect(links[1]!.attributes("href")).toBe("/projects/2");
    expect(wrapper.text()).not.toContain("プロジェクトがまだありません");
  });

  it("rejects a blank name without calling the API", async () => {
    const wrapper = await mountSuspended(IndexPage);
    await wrapper.find("input[name=name]").setValue("   ");
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(wrapper.find("[role=alert]").text()).toBe("プロジェクト名を入力してください");
    expect(createProject).not.toHaveBeenCalled();
  });

  it("creates a project, clears the input and refreshes the list", async () => {
    createProject.mockImplementation(() => {
      projects = [{ id: 1, name: "New" }];
      return projects[0];
    });
    const wrapper = await mountSuspended(IndexPage);
    await wrapper.find("input[name=name]").setValue("New");
    await wrapper.find("form").trigger("submit");
    await vi.waitFor(() => expect(wrapper.find("a").text()).toBe("New"));
    expect(createProject).toHaveBeenCalledOnce();
    expect((wrapper.find("input[name=name]").element as HTMLInputElement).value).toBe("");
  });

  it("shows the server's error message when creation fails", async () => {
    // Same body shape as a real h3 error response (registerEndpoint drops `message` from thrown errors).
    createProject.mockImplementation((event: H3Event) => {
      setResponseStatus(event, 400);
      return { statusCode: 400, message: "サーバー側のエラー" };
    });
    const wrapper = await mountSuspended(IndexPage);
    await wrapper.find("input[name=name]").setValue("New");
    await wrapper.find("form").trigger("submit");
    await vi.waitFor(() => expect(wrapper.find("[role=alert]").text()).toBe("サーバー側のエラー"));
  });
});
