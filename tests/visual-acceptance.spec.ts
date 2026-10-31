import { test, expect } from "@playwright/test";

/**
 * Visual acceptance — real browser computed styles, not just HTTP 200
 * Verifies Linear tokens actually affect rendered elements
 */
test.describe("Visual acceptance — computed styles", () => {
  test("body uses Inter, not mono, and canvas resolves", async ({ page }) => {
    await page.goto("/investigations", { waitUntil: "networkidle" });
    const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(bodyFont.toLowerCase()).toContain("inter");
    expect(bodyFont.toLowerCase()).not.toMatch(/jetbrains.*inter/); // not mono as primary
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).not.toBe("rgba(0, 0, 0, 0)");
    const canvas = await page.evaluate(() => getComputedStyle(document.body).getPropertyValue("--canvas").trim().toLowerCase());
    expect(["#ffffff", "#fff", "#08090a"].includes(canvas)).toBeTruthy();
  });

  test("monospace metadata uses JetBrains Mono", async ({ page }) => {
    await page.goto("/investigations/bug-01", { waitUntil: "networkidle" });
    const mono = await page.evaluate(() => {
      const el = document.querySelector(".font-mono");
      return el ? getComputedStyle(el).fontFamily : "";
    });
    expect(mono.toLowerCase()).toContain("jetbrains");
  });

  test("grid/flex layout not fallback", async ({ page }) => {
    await page.goto("/demo/bug-01?variant=fixed", { waitUntil: "networkidle" });
    const main = await page.evaluate(() => {
      const m = document.querySelector("main.mx-auto.grid");
      return m ? getComputedStyle(m).display : "";
    });
    expect(main).toBe("grid");
    const cols = await page.evaluate(() => {
      const m = document.querySelector("main");
      return m ? getComputedStyle(m).gridTemplateColumns : "";
    });
    expect(cols).toContain("380px");
  });

  test("header dimensions and sidebar width", async ({ page }) => {
    await page.goto("/investigations/bug-01", { waitUntil: "networkidle" });
    const topBar = await page.evaluate(() => {
      const h = document.querySelector("header");
      return h ? h.offsetHeight : 0;
    });
    expect(topBar).toBeGreaterThanOrEqual(35);
    expect(topBar).toBeLessThanOrEqual(48); // 40px spec
    const leftRail = await page.evaluate(() => {
      const lr = document.querySelector("nav[aria-label='Investigation sections']");
      return lr ? { w: (lr as HTMLElement).offsetWidth, display: getComputedStyle(lr).display } : null;
    });
    expect(leftRail).not.toBeNull();
    expect(leftRail!.display).toBe("flex");
    expect(leftRail!.w).toBe(200);
  });

  test("FrameViewer dimensions 800x450", async ({ page }) => {
    await page.goto("/investigations/bug-01", { waitUntil: "networkidle" });
    const meta = await page.evaluate(() => {
      const el = document.querySelector("[data-testid='active-frame-meta']");
      return el?.textContent || "";
    });
    expect(meta).toContain("800×450");
    const img = await page.getByTestId("frame-viewer-image");
    await expect(img).toBeVisible();
  });

  test("checkout columns and order summary placement", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/demo/bug-01?variant=fixed", { waitUntil: "networkidle" });
    const order = await page.evaluate(() => {
      const a = document.querySelector("aside");
      return a ? getComputedStyle(a).order : "";
    });
    expect(order).toBe("2"); // right column on desktop
    const checkout = await page.evaluate(() => {
      const m = document.querySelector("main");
      return m ? getComputedStyle(m).gridTemplateColumns : "";
    });
    expect(checkout).toContain("380px");
  });

  test("buttons and inputs have intended styles", async ({ page }) => {
    await page.goto("/demo/bug-01?variant=fixed", { waitUntil: "networkidle" });
    const btnBg = await page.evaluate(() => {
      const b = document.querySelector("[data-testid='checkout-submit']") as HTMLElement;
      return b ? getComputedStyle(b).backgroundColor : "";
    });
    expect(btnBg).not.toBe("rgba(0, 0, 0, 0)");
    const inputBorder = await page.evaluate(() => {
      const i = document.querySelector("[data-testid='postal-code-input']") as HTMLElement;
      return i ? getComputedStyle(i).borderColor : "";
    });
    expect(inputBorder).toBeTruthy();
  });

  test("theme variables resolve correctly", async ({ page }) => {
    await page.goto("/investigations", { waitUntil: "networkidle" });
    await page.evaluate(() => {
      localStorage.setItem("replayspec-theme", "dark");
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
    });
    await page.reload();
    const darkCanvas = await page.evaluate(() => getComputedStyle(document.body).getPropertyValue("--canvas").trim().toLowerCase());
    expect(darkCanvas).toBe("#08090a");
    await page.evaluate(() => {
      localStorage.setItem("replayspec-theme", "light");
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.classList.remove("dark");
    });
    await page.reload();
    const lightCanvas = await page.evaluate(() => getComputedStyle(document.body).getPropertyValue("--canvas").trim().toLowerCase());
    expect(["#ffffff", "#fff", "white"].includes(lightCanvas)).toBeTruthy();
  });

  test("mobile layout functional 390x844", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/investigations/bug-01", { waitUntil: "networkidle" });
    const w = await page.evaluate(() => window.innerWidth);
    expect(w).toBe(390);
    await expect(page.getByTestId("active-timestamp")).toBeVisible();
  });
});
