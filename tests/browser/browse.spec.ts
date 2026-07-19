import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("renders the complete indexed Browse collection with accurate metadata", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  const response = await page.goto("/browse", { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Browse | Game Portal");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "index,follow",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "/browse",
  );
  await expect(
    page.getByRole("heading", { level: 1, name: "Browse" }),
  ).toBeVisible();
  await expect(page.locator(".browse-page__count strong")).toHaveText(
    "2 games",
  );
  await expect(page.locator("[data-browse-game]")).toHaveCount(2);
  await expect(page.getByRole("link", { name: "View Chess" })).toHaveAttribute(
    "href",
    "/games/chess",
  );
  await expect(page.getByRole("link", { name: "View Go" })).toHaveAttribute(
    "href",
    "/games/go",
  );
  await expect(
    page
      .getByRole("navigation", { name: "Primary" })
      .filter({ visible: true })
      .getByRole("link", { name: "Browse", exact: true }),
  ).toHaveAttribute("aria-current", "page");

  const cardText = await page.locator("[data-browse-game]").allTextContents();
  expect(cardText[0]).toContain("Chess");
  expect(cardText[1]).toContain("Go");
  for (const text of cardText) {
    expect(text).toContain("2 players");
    expect(text).toContain("Time not yet published");
    expect(text).toContain("Age guidance not yet published");
    expect(text).toContain("In person");
    expect(text).toContain("Physical instructions");
  }
  await expect(page.locator('a[href^="http"]')).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("reviewedBy");
  const pageOrigin = new URL(page.url()).origin;
  expect(requests.filter((url) => new URL(url).origin !== pageOrigin)).toEqual(
    [],
  );
});

test("provides one meaningful published type route and 404s absent types", async ({
  page,
  request,
}) => {
  await page.goto("/browse/type/abstract-strategy");
  await expect(
    page.getByRole("heading", { level: 1, name: "Abstract strategy games" }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex,follow",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "/browse/type/abstract-strategy",
  );
  expect(await page.locator(".browse-card").allTextContents()).toEqual([
    expect.stringContaining("Chess"),
    expect.stringContaining("Go"),
  ]);
  await expect(
    page.getByRole("link", { name: "Return to Browse" }),
  ).toHaveAttribute("href", "/browse");
  await expect(
    page.getByRole("link", { name: "Browse", exact: true }).last(),
  ).toHaveAttribute("aria-current", "page");
  expect((await request.get("/browse/type/board")).status()).toBe(404);
  expect((await request.get("/browse/type/not-a-type")).status()).toBe(404);
});

test("filters locally, announces concise counts, preserves the query, and clears without focus theft", async ({
  page,
}) => {
  await page.goto("/browse", { waitUntil: "networkidle" });
  await page.locator(".browse-card__image").last().scrollIntoViewIfNeeded();
  await expect(page.locator(".browse-card__image").first()).toHaveJSProperty(
    "complete",
    true,
  );
  await page.evaluate(() => scrollTo(0, 0));
  const search = page.getByRole("search");
  const input = page.getByLabel("Search the collection");
  const status = page.getByRole("status");
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  const initialHistoryLength = await page.evaluate(() => history.length);

  await expect(search).toBeVisible();
  await input.focus();
  await input.fill("chess");
  await expect(input).toBeFocused();
  await expect(page.locator("[data-browse-game]:visible")).toHaveCount(1);
  await expect(status).toHaveText("1 game found.");
  await input.fill("unpublished query");
  await expect(page.locator("[data-browse-game]:visible")).toHaveCount(0);
  await expect(status).toHaveText("0 games found.");
  await expect(
    page.getByText(
      "No games match “unpublished query”. Check the spelling or clear the search.",
    ),
  ).toBeVisible();
  await expect(input).toHaveValue("unpublished query");

  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page.locator("[data-browse-game]:visible")).toHaveCount(2);
  await expect(input).toHaveValue("");
  expect(await page.evaluate(() => history.length)).toBe(initialHistoryLength);
  expect(
    await page.evaluate(() => [localStorage.length, sessionStorage.length]),
  ).toEqual([0, 0]);
  expect(requests).toEqual([]);
});

test("keeps the complete collection available without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/browse");
  await expect(page.getByRole("search")).toBeHidden();
  await expect(page.locator("[data-browse-game]")).toHaveCount(2);
  await expect(
    page.getByRole("link", { name: "Abstract strategy" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "C", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "G", exact: true }),
  ).toBeVisible();
  await context.close();
});

test("keeps sequentially focused alphabet links fully above compact navigation", async ({
  page,
}) => {
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/browse");

    let focusedHref: string | null = null;
    for (let step = 0; step < 20 && focusedHref !== "#letter-c"; step += 1) {
      await page.keyboard.press("Tab");
      focusedHref = await page.evaluate(() =>
        document.activeElement instanceof HTMLAnchorElement
          ? document.activeElement.getAttribute("href")
          : null,
      );
    }
    expect(focusedHref, `${width}px sequential focus did not reach C`).toBe(
      "#letter-c",
    );

    for (const expectedHref of ["#letter-c", "#letter-g"]) {
      if (expectedHref === "#letter-g") await page.keyboard.press("Tab");
      const clearance = await page.evaluate(() => {
        const active = document.activeElement;
        const navigation = document.querySelector("nav.mobile-navigation");
        if (!(active instanceof HTMLAnchorElement) || !navigation) return null;
        const activeBounds = active.getBoundingClientRect();
        const navigationBounds = navigation.getBoundingClientRect();
        const style = getComputedStyle(active);
        const outlineAllowance =
          Number.parseFloat(style.outlineWidth) +
          Number.parseFloat(style.outlineOffset);
        return {
          href: active.getAttribute("href"),
          topWithOutline: activeBounds.top - outlineAllowance,
          bottomWithOutline: activeBounds.bottom + outlineAllowance,
          navigationTop: navigationBounds.top,
        };
      });

      expect(clearance).not.toBeNull();
      expect(clearance!.href).toBe(expectedHref);
      expect(clearance!.topWithOutline).toBeGreaterThanOrEqual(0);
      expect(clearance!.bottomWithOutline).toBeLessThanOrEqual(
        clearance!.navigationTop,
      );
      const focusedLink = page.locator(`a[href="${expectedHref}"]`);
      await expect(focusedLink).toBeFocused();
      await expect(focusedLink).toHaveCSS("outline-style", "solid");
    }

    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
      `${width}px horizontal overflow after sequential focus`,
    ).toBe(true);
  }
});

test("is accessible, reflows at target widths, and clears the mobile navigation", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/browse");
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
      `${width}px horizontal overflow`,
    ).toBe(true);
    const columnCount = await page
      .locator(".browse-grid")
      .first()
      .evaluate(
        (grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length,
      );
    if (width <= 390) expect(columnCount).toBe(1);
    if (width >= 1024) expect(columnCount).toBeGreaterThanOrEqual(2);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/browse");
  const lastLink = page.getByRole("link", { name: "View Go" });
  const mobileNavigation = page.locator("nav.mobile-navigation");
  await lastLink.scrollIntoViewIfNeeded();
  const [lastBox, navigationBox] = await Promise.all([
    lastLink.boundingBox(),
    mobileNavigation.boundingBox(),
  ]);
  expect(lastBox).not.toBeNull();
  expect(navigationBox).not.toBeNull();
  expect(lastBox!.y + lastBox!.height).toBeLessThanOrEqual(navigationBox!.y);

  await page.evaluate(() => {
    const title = document.querySelector(".browse-card h3");
    if (title)
      title.textContent =
        "Un título traducido extraordinariamente largo para verificar el reflujo a doscientos por ciento";
  });
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);

  const ids = await page
    .locator("[id]")
    .evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(new Set(ids).size).toBe(ids.length);
  const targetSizes = await page
    .locator(".browse-index a, .browse-search button")
    .evaluateAll((nodes) =>
      nodes.map((node) => {
        const box = node.getBoundingClientRect();
        return { width: box.width, height: box.height };
      }),
    );
  expect(
    targetSizes.every(({ width, height }) => width >= 44 && height >= 44),
  ).toBe(true);

  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  const input = page.getByLabel("Search the collection");
  await input.focus();
  await expect(input).toHaveCSS("outline-style", "solid");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations.filter(({ impact }) =>
      ["serious", "critical"].includes(impact ?? ""),
    ),
  ).toEqual([]);
});
