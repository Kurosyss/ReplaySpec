import type { SpecAssertion } from "../investigations/types";

/**
 * Deterministic compiler: converts validated SpecAssertion objects into Playwright TypeScript source
 * using predefined templates. No arbitrary URLs, no eval, no user code.
 */

const ALLOWED_URL = "http://localhost:3000/demo/bug-01?variant=fixed";

function escapeStringLiteral(s: string): string {
  // Escape for double-quoted JS string literal, validate no injection
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/\$/g, "\\$"); // prevent template injection
}

function compileAssertion(a: SpecAssertion): string {
  const selector = a.selector; // already validated allowlisted
  const escapedSelector = escapeStringLiteral(selector);

  if (a.matcher === "toBeVisible") {
    return `  await expect(page.getByTestId("${escapedSelector}")).toBeVisible(); // from ${a.observationId} @ ${a.timestamp}`;
  }
  if (a.matcher === "toBeHidden") {
    return `  await expect(page.getByTestId("${escapedSelector}")).toBeHidden(); // from ${a.observationId} @ ${a.timestamp}`;
  }
  if (a.matcher === "toHaveText") {
    const text = escapeStringLiteral(a.expectedText ?? "");
    return `  await expect(page.getByTestId("${escapedSelector}")).toHaveText("${text}"); // from ${a.observationId} @ ${a.timestamp}`;
  }
  throw new Error(`Unsupported matcher: ${a.matcher}`);
}

export function compileSpec(assertions: SpecAssertion[], investigationId: string): string {
  if (assertions.length === 0) {
    return `// No assertions yet — add evidence-linked assertions to generate a spec
// Investigation: ${escapeStringLiteral(investigationId)}
`;
  }

  const header = `import { test, expect } from "@playwright/test";

test("BUG-01 postal-code validation — ${escapeStringLiteral(investigationId)}", async ({ page }) => {
  // Fixed allowlisted target — never compiles arbitrary URLs
  await page.goto("${ALLOWED_URL}");

  // Empty-field precondition (from investigation evidence)
  await page.getByTestId("postal-code-input").fill("");
  await expect(page.getByTestId("postal-code-input")).toBeEmpty();

  await page.getByTestId("checkout-submit").click();

`;

  const body = assertions.map(compileAssertion).join("\n");

  const footer = `
});
`;

  return header + body + footer;
}

export function validateCompiledSource(source: string): { ok: true } | { ok: false; error: string } {
  // Ensure no forbidden patterns in compiled source (defense in depth, even though we generate it)
  const forbidden = ["eval", "Function(", "require(", "import(", "process.", "child_process", "execSync", "spawn", "goto(`", "page.evaluate", "page.$$eval"];
  for (const pat of forbidden) {
    if (source.includes(pat)) {
      return { ok: false, error: `Compiled source contains forbidden pattern: ${pat}` };
    }
  }
  // Ensure it only contains allowlisted URL
  if (!source.includes(ALLOWED_URL)) {
    return { ok: false, error: "Compiled source must contain allowlisted URL" };
  }
  if (source.includes("http://localhost:3000/demo/bug-01?variant=buggy")) {
    // For M3.3, we only compile fixed variant (regression verification), not buggy
    return { ok: false, error: "Compiled source contains buggy variant URL — only fixed is allowlisted" };
  }
  return { ok: true };
}
