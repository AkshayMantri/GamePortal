import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const path of ["/", "/find"] as const) {
  test(`${path} exposes the shared party-size-first experience`, async ({
    page,
  }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle("Find | Game Portal");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex,follow",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(
      page.getByRole("heading", { level: 1, name: "Find" }),
    ).toBeVisible();
    await expect(
      page.getByRole("group", { name: "How many are playing?" }),
    ).toBeVisible();
    await expect(page.getByRole("radio")).toHaveCount(9);
    await expect(page.getByRole("radio").first()).toHaveValue("1");
    const customInput = page.getByLabel("Party size", { exact: true });
    await expect(customInput).toHaveAttribute("min", "1");
    await expect(customInput).toHaveAttribute("max", "99");
    await expect(customInput).toHaveAttribute("step", "1");
    await expect(page.getByText("No party size selected.")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Browse the collection" }),
    ).toHaveAttribute("href", "/browse");
    await expect(page.locator("body")).not.toContainText("games found");
  });
}

test("commits quick and custom values through one honest state", async ({
  page,
}) => {
  await page.goto("/");
  const control = page.locator("[data-party-size-control]");
  const one = page.getByRole("radio", { name: "1", exact: true });
  await one.click();
  await expect(control).toHaveAttribute("data-party-size-state", "valid");
  await expect(control).toHaveAttribute("data-party-size-value", "1");
  await expect(page.getByText("Party size: 1 player.")).toBeVisible();
  await expect(page.getByRole("status")).toHaveText(
    "Party size set to 1 player.",
  );

  await one.focus();
  await page.keyboard.press("ArrowRight");
  const two = page.getByRole("radio", { name: "2", exact: true });
  await expect(two).toBeFocused();
  await expect(two).toBeChecked();
  await expect(control).toHaveAttribute("data-party-size-value", "2");
  await expect(page.getByRole("status")).toHaveText(
    "Party size set to 2 players.",
  );

  const input = page.getByLabel("Party size", { exact: true });
  await input.fill("25");
  await expect(
    page.getByRole("radio", { name: "Another number" }),
  ).toBeChecked();
  await expect(one).not.toBeChecked();
  await expect(control).toHaveAttribute("data-party-size-state", "unset");
  await expect(page.getByText("No party size selected.")).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("");

  await page.getByRole("button", { name: "Apply party size" }).click();
  await expect(control).toHaveAttribute("data-party-size-value", "25");
  await expect(page.getByText("Party size: 25 players.")).toBeVisible();

  await input.fill("0");
  await input.press("Enter");
  await expect(input).toBeFocused();
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("[data-party-size-error]")).toHaveText(
    "Party size must be at least 1.",
  );
  await expect(control).toHaveAttribute("data-party-size-state", "invalid");
  await expect(input).toHaveValue("0");

  const eight = page.getByRole("radio", { name: "8", exact: true });
  await eight.click();
  await expect(eight).toBeChecked();
  await expect(input).not.toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("[data-party-size-error]")).toBeHidden();
  await expect(page.getByText("Party size: 8 players.")).toBeVisible();
});

test("keeps state transient and performs no request or URL mutation", async ({
  page,
}) => {
  await page.goto("/find");
  const initialUrl = page.url();
  const initialHistoryLength = await page.evaluate(() => history.length);
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));

  await page.getByLabel("Party size", { exact: true }).fill("99");
  await page.getByRole("button", { name: "Apply party size" }).click();
  await page.getByRole("radio", { name: "4", exact: true }).click();

  expect(page.url()).toBe(initialUrl);
  expect(await page.evaluate(() => history.length)).toBe(initialHistoryLength);
  expect(
    await page.evaluate(() => [localStorage.length, sessionStorage.length]),
  ).toEqual([0, 0]);
  expect(requests).toEqual([]);
});

test("keeps honest native controls and Browse available without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("radio")).toHaveCount(9);
  await expect(page.getByLabel("Party size", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Apply party size" }),
  ).toBeVisible();
  await expect(page.getByText("No party size selected.")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Browse the collection" }),
  ).toBeVisible();
  await page.getByRole("radio", { name: "4", exact: true }).check();
  await expect(page.getByText("No party size selected.")).toBeVisible();
  await context.close();
});

test("reflows, clears compact navigation, and passes the automated a11y gate", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
      `${width}px horizontal overflow`,
    ).toBe(true);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const browse = page.getByRole("link", { name: "Browse the collection" });
  await browse.focus();
  const [browseBox, navigationBox] = await Promise.all([
    browse.boundingBox(),
    page.locator("nav.mobile-navigation").boundingBox(),
  ]);
  expect(browseBox).not.toBeNull();
  expect(navigationBox).not.toBeNull();
  expect(browseBox!.y + browseBox!.height).toBeLessThanOrEqual(
    navigationBox!.y,
  );

  const targets = await page
    .locator(
      ".party-size-option, [data-party-size-custom-input], [data-party-size-apply]",
    )
    .evaluateAll((nodes) =>
      nodes.map((node) => {
        const bounds = node.getBoundingClientRect();
        return { width: bounds.width, height: bounds.height };
      }),
    );
  expect(
    targets.every(({ width, height }) => width >= 44 && height >= 44),
  ).toBe(true);

  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  const input = page.getByLabel("Party size", { exact: true });
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
