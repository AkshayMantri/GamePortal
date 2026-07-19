import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const browserErrors = new WeakMap<
  Page,
  { consoleErrors: string[]; pageErrors: string[] }
>();

async function listFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? listFiles(path) : [path];
    }),
  );
  return files.flat();
}

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
      name: "Find",
    }),
  ).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);

  await expect(page.locator("astro-island")).toHaveCount(0);
  await expect(page.locator("script")).toHaveCount(1);
  expect(
    resourceRequests
      .filter(({ type }) => type === "script")
      .every(({ url }) => new URL(url).origin === new URL(page.url()).origin),
  ).toBe(true);

  const pageOrigin = new URL(page.url()).origin;
  const externalFontOrMedia = resourceRequests.filter(({ type, url }) => {
    return (
      ["font", "image", "media"].includes(type) &&
      new URL(url).origin !== pageOrigin
    );
  });
  expect(externalFontOrMedia).toEqual([]);
});

test("keeps client code bounded to Browse and the two shared Find routes", async () => {
  const distRoot = resolve(process.cwd(), "dist");
  const files = await listFiles(distRoot);
  const javascriptAssets = files.filter((path) => /\.(?:c|m)?js$/i.test(path));
  expect(javascriptAssets).toHaveLength(1);
  expect(javascriptAssets[0].replaceAll("\\", "/")).toMatch(
    /\/dist\/_astro\/[^/]+\.js$/,
  );

  const htmlFiles = files.filter((path) => path.endsWith(".html"));
  expect(htmlFiles).toHaveLength(13);
  const htmlDocuments = await Promise.all(
    htmlFiles.map(async (path) => ({
      path,
      html: await readFile(path, "utf8"),
    })),
  );
  const scriptedPages = htmlDocuments
    .filter(({ html }) => /<script\b/i.test(html))
    .map(({ path }) => path.replaceAll("\\", "/"));
  expect(scriptedPages).toEqual(
    ["dist/browse/index.html", "dist/find/index.html", "dist/index.html"].map(
      (path) => resolve(process.cwd(), path).replaceAll("\\", "/"),
    ),
  );

  const externalScriptReferences = htmlDocuments.flatMap(({ path, html }) =>
    Array.from(
      html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi),
      ([, source]) => ({
        path: path.replaceAll("\\", "/"),
        source,
      }),
    ),
  );
  expect(externalScriptReferences).toHaveLength(2);
  expect(externalScriptReferences.map(({ path }) => path)).toEqual(
    ["dist/find/index.html", "dist/index.html"].map((path) =>
      resolve(process.cwd(), path).replaceAll("\\", "/"),
    ),
  );
  expect(
    new Set(externalScriptReferences.map(({ source }) => source)).size,
  ).toBe(1);
  const [findControllerSource] = externalScriptReferences.map(
    ({ source }) => source,
  );
  expect(findControllerSource).toMatch(/^\/_astro\/[^/]+\.js$/);
  expect(resolve(distRoot, `.${findControllerSource}`)).toBe(
    javascriptAssets[0],
  );

  for (const { path, html } of htmlDocuments) {
    expect(html).not.toMatch(/<astro-island\b/i);
    expect(html).not.toMatch(/react(?:-dom)?|__REACT/i);
    expect(html).not.toMatch(
      /<script\b[^>]*\bsrc=["'](?:https?:)?\/\/[^"']+["']/i,
    );

    const scriptSources = Array.from(
      html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi),
      ([, source]) => source,
    );
    const normalizedPath = path.replaceAll("\\", "/");
    if (
      normalizedPath ===
        resolve(process.cwd(), "dist/index.html").replaceAll("\\", "/") ||
      normalizedPath ===
        resolve(process.cwd(), "dist/find/index.html").replaceAll("\\", "/")
    ) {
      expect(scriptSources).toEqual([findControllerSource]);
    } else {
      expect(scriptSources).toEqual([]);
    }
  }
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
  await expect(page.locator("#main-content")).toBeFocused();
});

test("loads the self-hosted English-first font pair without synthetic weights", async ({
  page,
}) => {
  const coverage = await page.evaluate(async () => {
    const sample =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 &!?–—’“”";
    const faces = [
      '400 48px "Fraunces"',
      '600 48px "Fraunces"',
      '400 18px "Source Sans 3"',
      '600 18px "Source Sans 3"',
      '700 18px "Source Sans 3"',
    ];
    await Promise.all(faces.map((face) => document.fonts.load(face, sample)));
    return {
      faces: faces.map((face) => document.fonts.check(face, sample)),
      headingFamily: getComputedStyle(document.querySelector("h1")!).fontFamily,
      bodyFamily: getComputedStyle(document.body).fontFamily,
    };
  });

  expect(coverage.faces).toEqual([true, true, true, true, true]);
  expect(coverage.headingFamily).toContain("Fraunces");
  expect(coverage.bodyFamily).toContain("Source Sans 3");
});

test("keeps the Find scaffold readable when JavaScript is disabled", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const noScriptPage = await context.newPage();
  await noScriptPage.goto("/");
  await expect(
    noScriptPage.getByRole("heading", { level: 1, name: "Find" }),
  ).toBeVisible();
  await expect(
    noScriptPage.getByRole("link", { name: "Browse", exact: true }).first(),
  ).toBeVisible();
  await expect(noScriptPage.locator("form[data-find-filter-form]")).toHaveCount(
    1,
  );
  await expect(
    noScriptPage.getByRole("group", { name: "1. Together or remote?" }),
  ).toBeVisible();
  await expect(
    noScriptPage.getByRole("group", { name: "3. Youngest player" }),
  ).toBeVisible();
  await expect(
    noScriptPage.getByText(
      "A later milestone will separate exact compatibility from uncertain data.",
      { exact: false },
    ),
  ).toBeVisible();
  await expect(
    noScriptPage.getByRole("button", { name: "Apply party size" }),
  ).toBeVisible();
  await context.close();
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
