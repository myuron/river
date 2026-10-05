import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import App from "~/app.vue";

registerEndpoint("/api/projects", () => []);

describe("App", () => {
  it("renders the header", async () => {
    const wrapper = await mountSuspended(App);
    expect(wrapper.find("header").text()).toContain("river");
  });
});
