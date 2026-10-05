// PostToolUse hook: run oxlint on a JS/TS/Vue file right after Claude edits it.
// Exit code 2 feeds the lint errors back to Claude so it fixes them immediately.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8"));
const file = input.tool_input?.file_path;

if (!file || !/\.(?:[cm]?[jt]sx?|vue)$/.test(file) || file.includes("/node_modules/")) {
  process.exit(0);
}

const result = spawnSync("pnpm", ["exec", "oxlint", file], {
  cwd: input.cwd,
  encoding: "utf8",
});

if (result.status !== 0) {
  process.stderr.write(`oxlint failed for ${file}:\n${result.stdout}${result.stderr}`);
  process.exit(2);
}
