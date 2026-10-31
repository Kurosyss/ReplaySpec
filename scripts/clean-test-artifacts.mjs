#!/usr/bin/env node
/** Safe cleanup for disposable Playwright test artifacts — never deletes genuine investigations/recordings */
import fs from "node:fs";
import path from "node:path";

const ROOTS = [
  "test-results/runs",
  "test-results/artifacts",
  "test-results/screenshots-studio",
  "playwright-report",
  "playwright/.cache",
];

const PRESERVE = new Set([
  "test-results/investigations",
  "test-results/recordings",
  "test-results/screenshots-final",
  "test-results/frames-bug01-fixed",
  "test-results/frames-bug01-buggy",
  "test-results/frames-bug01-empty-fixed",
  "test-results/frames-bug01-empty-buggy",
]);

function safeRemove(target) {
  const resolved = path.resolve(target);
  const cwd = path.resolve(process.cwd());
  if (!resolved.startsWith(cwd)) {
    console.warn(`Refuse to delete outside cwd: ${target}`);
    return 0;
  }
  if (PRESERVE.has(target) || [...PRESERVE].some(p => resolved.startsWith(path.resolve(p)))) {
    console.warn(`Refuse to delete preserved: ${target}`);
    return 0;
  }
  if (!fs.existsSync(resolved)) return 0;
  // Extra guard: never delete if path contains investigations or recordings
  if (resolved.includes("investigations") || resolved.includes("recordings")) {
    console.warn(`Refuse to delete genuine data: ${target}`);
    return 0;
  }
  const stat = fs.statSync(resolved);
  let count = 0;
  if (stat.isDirectory()) {
    count = fs.readdirSync(resolved, { recursive: true }).length;
    fs.rmSync(resolved, { recursive: true, force: true });
    console.log(`Cleaned ${target} (${count} entries)`);
  } else {
    fs.unlinkSync(resolved);
    console.log(`Cleaned file ${target}`);
    count = 1;
  }
  return count;
}

let total = 0;
for (const root of ROOTS) {
  total += safeRemove(root);
}
console.log(`Total cleaned: ${total} entries. Preserved: ${[...PRESERVE].join(", ")}`);
console.log("Genuine investigations/recordings preserved at test-results/investigations, test-results/recordings");
