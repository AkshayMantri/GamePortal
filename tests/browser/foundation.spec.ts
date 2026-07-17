import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const browserErrors = new WeakMap<
  Page,
  { consoleErrors: string[]; pageErrors: string[] }
>();

test.beforeEach(async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  browserErrors.set(page, { consoleErrors, pageErrors });

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/", { waitUntil: "networkidle" });
});

test.afterEach(async ({ page }) => {
  const errors = browserErrors.get(page);
  expect(errors?.consoleErrors, "browser console errors").toEqual([]);
  expect(errors?.pageErrors, "uncaught page errors").toEqual([]);
});

test("renders a semantic static shell without overflow or external assets", async ({
  page,
}) => {
  const resourceRequests: Array<{ type: string; url: string }> = [];
  page.on("request", (request) => {
    resourceRequests.push({ type: request.resourceType(), url: request.url() });
  });

  await page.reload({ waitUntil: "networkidle" });

  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Bring the right game to the table.",
    }),
  ).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);

  await expect(page.locator("astro-island")).toHaveCount(0);
  await expect(page.locator("script")).toHaveCount(0);
  expect(resourceRequests.filter(({ type }) => type === "script")).toEqual([]);

  const pageOrigin = new URL(page.url()).origin;
  const externalFontOrMedia = resourceRequests.filter(({ type, url }) => {
    return (
      ["font", "image", "media"].includes(type) &&
      new URL(url).origin !== pageOrigin
    );
  });
  expect(externalFontOrMedia).toEqual([]);
});

test("exposes a visible keyboard skip link with a valid target", async ({
  page,
}) => {
  const skipLink = page.getByRole("link", { name: "Skip to main content" });

  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toHaveCSS("outline-style", "solid");

  const bounds = await skipLink.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds?.y).toBeGreaterThanOrEqual(0);

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
  await expect(page.locator("#main-content")).toBeVisible();
});

test("has no serious or critical automated accessibility violations", async ({
  page,
}) => {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const blockingViolations = results.violations.filter(({ impact }) =>
    ["serious", "critical"].includes(impact ?? ""),
  );

  expect(blockingViolations).toEqual([]);
});

test("honors reduced-motion and forced-colors browser preferences", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
  ).toBe(true);

  await page.emulateMedia({ forcedColors: "active" });
  expect(
    await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
  ).toBe(true);

  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await skipLink.focus();
  await expect(skipLink).toHaveCSS("outline-style", "solid");
});
