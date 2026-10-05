import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { defineComponent, h } from "vue";
import { todayIsoDate, useState, useToday } from "#imports";

describe("useToday", () => {
  it("replaces the server-rendered date with the browser's date after mount", async () => {
    // Simulate a server in another time zone having rendered a different day.
    useState("today").value = "2000-01-01";
    const wrapper = await mountSuspended(
      defineComponent({
        setup() {
          const today = useToday();
          return () => h("span", today.value);
        },
      }),
    );
    expect(wrapper.text()).toBe(todayIsoDate());
  });
});
