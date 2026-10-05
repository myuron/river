// PreToolUse hook: block force-pushes and pushes to main.
// Exit code 2 blocks the Bash call and tells Claude why.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8"));
const command = input.tool_input?.command ?? "";

const block = (reason) => {
  process.stderr.write(`Blocked: ${reason}`);
  process.exit(2);
};

for (const segment of command.split(/&&|\|\||;|\n/)) {
  if (!/\bgit\s+push\b/.test(segment)) continue;

  if (/(?:^|\s)(?:-f|--force|--force-with-lease)(?:[=\s]|$)|\s\+\S/.test(segment)) {
    block("force-push is not allowed. Push a new commit instead.");
  }
  if (/[\s:](?:main|master)(?:\s|$)/.test(segment)) {
    block("pushing to main is not allowed. Push a feature branch and open a PR.");
  }

  let branch = "";
  try {
    branch = execSync("git branch --show-current", { cwd: input.cwd, encoding: "utf8" }).trim();
  } catch {
    // Not a git repo or detached HEAD: let git itself decide.
  }
  if (branch === "main" || branch === "master") {
    block(`current branch is ${branch}. Create a feature branch before pushing.`);
  }
}
