import { expect, test } from "@playwright/test";

const routes = [
  { path: "/find", title: "Find | Game Portal", heading: "Find" },
  { path: "/random", title: "Random | Game Portal", heading: "Random" },
  { path: "/vote", title: "Vote | Game Portal", heading: "Vote" },
  {
    path: "/game-nights",
    title: "Game Night | Game Portal",
    heading: "Game Night",
  },
  { path: "/popular", title: "Popular | Game Portal", heading: "Popular" },
  { path: "/library", title: "Library | Game Portal", heading: "Library" },
  { path: "/account", title: "Account | Game Portal", heading: "Account" },
  { path: "/more", title: "More | Game Portal", heading: "More" },
] as const;

test("every remaining scaffold resolves with honest metadata and no fake feature controls", async ({
  page,
}) => {
  for (const route of routes) {
    const response = await page.goto(route.path);
    expect(response?.status(), route.path).toBe(200);
    await expect(page).toHaveTitle(route.title);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex,follow",
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(
      page.getByRole("heading", { level: 1, name: route.heading }),
    ).toBeVisible();
    await expect(page.locator("main")).toHaveAttribute("id", "main-content");
    await expect(
      page.locator("main button, main input, main select, main form"),
    ).toHaveCount(0);
  }
  expect(new Set(routes.map(({ title }) => title)).size).toBe(routes.length);
});

test("root renders Find directly without a redirect or canonical mismatch", async ({
  page,
}) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  expect(new URL(page.url()).pathname).toBe("/");
  await expect(page).toHaveTitle("Find | Game Portal");
  await expect(
    page.getByRole("heading", { level: 1, name: "Find" }),
  ).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Find", exact: true }).last(),
  ).toHaveAttribute("aria-current", "page");
});

test("all internal shell and More links resolve", async ({ page, request }) => {
  await page.goto("/more");
  const hrefs = await page
    .locator('a[href^="/"]')
    .evaluateAll((links) =>
      Array.from(
        new Set(links.map((link) => (link as HTMLAnchorElement).pathname)),
      ),
    );

  for (const href of hrefs) {
    const response = await request.get(href);
    expect(response.status(), href).toBe(200);
  }
});

test("desktop navigation is complete, current, ordered, and unclipped", async ({
  page,
}) => {
  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/library");

    const desktop = page.locator("nav.desktop-navigation");
    await expect(desktop).toBeVisible();
    await expect(page.locator("nav.mobile-navigation")).toBeHidden();
    await expect(page.locator('nav[aria-label="Primary"]:visible')).toHaveCount(
      1,
    );

    const primaryLabels = await desktop
      .locator(".navigation-list--primary > li > a")
      .allTextContents();
    expect(primaryLabels).toEqual([
      "Find",
      "Browse",
      "Random",
      "Vote",
      "Game Night",
      "Popular",
    ]);
    await expect(
      desktop.locator('.navigation-list--personal a[href="/library"]'),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      desktop.locator('.navigation-list--personal a[href="/account"]'),
    ).toBeVisible();

    const box = await desktop.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
  }
});

test("compact navigation stays singular, accurate, and clear of content", async ({
  page,
}) => {
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/vote");

    const mobile = page.locator("nav.mobile-navigation");
    await expect(mobile).toBeVisible();
    await expect(page.locator("nav.desktop-navigation")).toBeHidden();
    await expect(page.locator('nav[aria-label="Primary"]:visible')).toHaveCount(
      1,
    );
    expect(await mobile.getByRole("link").allTextContents()).toEqual([
      "Find",
      "Browse",
      "Random",
      "More",
    ]);
    await expect(mobile.locator('[aria-current="page"]')).toHaveCount(0);

    const hasOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(hasOverflow, `${width}px horizontal overflow`).toBe(false);

    await page.goto("/more");
    await expect(mobile.getByRole("link", { name: "More" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(await page.locator(".more-links a").allTextContents()).toEqual([
      "Vote→",
      "Game Night→",
      "Popular→",
      "Library→",
      "Account→",
    ]);

    const account = page.locator('.more-links a[href="/account"]');
    await account.focus();
    const [accountBox, navigationBox] = await Promise.all([
      account.boundingBox(),
      mobile.boundingBox(),
    ]);
    expect(accountBox).not.toBeNull();
    expect(navigationBox).not.toBeNull();
    expect(accountBox!.y + accountBox!.height).toBeLessThanOrEqual(
      navigationBox!.y,
    );
  }
});
