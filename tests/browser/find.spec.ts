import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function openFilters(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: /^More filters/ }).click();
  await expect(
    page.getByRole("dialog", { name: "More filters" }),
  ).toBeVisible();
}

for (const path of ["/", "/find"] as const) {
  test(`${path} exposes the canonical setup workspace without matching`, async ({
    page,
  }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle("Find | Game Portal");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex,follow",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "/find",
    );
    await expect(
      page.getByRole("heading", { level: 1, name: "Find" }),
    ).toBeVisible();
    await expect(
      page.getByRole("group", { name: "How many are playing?" }),
    ).toBeVisible();
    await expect(page.locator("[data-find-filter-form]")).toHaveCount(1);
    await expect(page.getByText("No filters are active yet.")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Browse the collection" }),
    ).toHaveAttribute("href", "/browse");
    await expect(page.locator("body")).not.toContainText(/games? found/i);
    await expect(page.locator("body")).not.toContainText(/exact matches/i);
    await expect(page.locator("body")).not.toContainText("Chess is compatible");
  });
}

test("production registry shows meaningful controls and omits empty sections", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/find");
  await expect(
    page.getByRole("group", { name: "Together or remote?" }),
  ).toBeVisible();
  await expect(
    page.getByRole("group", { name: /How much time/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("group", { name: "Youngest player" }),
  ).toBeVisible();
  await expect(
    page.getByRole("group", { name: /Equipment available/ }),
  ).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Chess set" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Go set" })).toBeVisible();
  await expect(
    page.getByRole("group", { name: "Play language" }),
  ).toBeVisible();
  await expect(page.getByRole("group", { name: "Accounts" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Installation" })).toBeVisible();
  await expect(
    page.getByRole("group", { name: "Devices available" }),
  ).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Available in" })).toHaveCount(
    0,
  );
  await expect(page.getByRole("group", { name: "Link status" })).toHaveCount(0);
});

test("party quick and custom commits use one canonical URL state", async ({
  page,
}) => {
  await page.goto("/");
  const initialLength = await page.evaluate(() => history.length);
  await page.getByRole("radio", { name: "4", exact: true }).click();
  await expect(page).toHaveURL(/\/find\?players=4$/);
  await expect(
    page.getByRole("button", { name: "Remove 4 players filter" }),
  ).toBeVisible();
  expect(await page.evaluate(() => history.length)).toBe(initialLength + 1);

  const input = page.getByLabel("Party size", { exact: true });
  await input.fill("25");
  await expect(page).toHaveURL(/players=4$/);
  await page.getByRole("button", { name: "Apply party size" }).click();
  await expect(page).toHaveURL(/\/find\?players=25$/);
  await expect(
    page.getByRole("button", { name: "Remove 25 players filter" }),
  ).toBeVisible();

  const lengthBeforeUnchanged = await page.evaluate(() => history.length);
  await page.getByRole("button", { name: "Apply party size" }).click();
  expect(await page.evaluate(() => history.length)).toBe(lengthBeforeUnchanged);

  await input.fill("0");
  await input.press("Enter");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("[data-party-size-error]")).toHaveText(
    "Party size must be at least 1.",
  );
  await expect(page).toHaveURL(/players=25$/);
});

test("initial cleanup replaces root queries and restores valid partial state", async ({
  page,
}) => {
  await page.goto(
    "/?age=8&players=004&mode=remote&players=4&utm_source=%3Cscript%3Eprivate%3C%2Fscript%3E&lang=invalid",
  );
  await expect(page).toHaveURL("/find?players=4&mode=remote&age=8");
  await expect(
    page.getByText(/Some settings in this shared link/),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText("private");
  await expect(
    page.getByRole("button", { name: "Remove 4 players filter" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Remove Remote filter" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Remove Youngest player: 8 filter" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Dismiss notice" }).click();
  await expect(
    page.getByText(/Some settings in this shared link/),
  ).toBeHidden();
});

test("draft Cancel, Reset, Apply, Back, Forward, and reload preserve the contract", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/find?players=4");
  await openFilters(page);
  await page.getByRole("radio", { name: "Remote" }).check();
  await page.getByLabel("Time limit").selectOption("45");
  await page.getByLabel("Age in whole years").fill("8");
  await expect(page).toHaveURL(/players=4$/);
  await page.getByRole("button", { name: "Cancel" }).click();

  await openFilters(page);
  await expect(
    page.getByRole("radio", { name: "Any", exact: true }),
  ).toBeChecked();
  await expect(page.getByLabel("Time limit")).toHaveValue("");
  await page.getByRole("radio", { name: "Remote" }).check();
  await page.getByLabel("Time limit").selectOption("45");
  await page.getByLabel("Age in whole years").fill("8");
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(
    page.getByRole("radio", { name: "Any", exact: true }),
  ).toBeChecked();
  await expect(page).toHaveURL(/players=4$/);
  await page.getByRole("radio", { name: "Remote" }).check();
  await page.getByLabel("Time limit").selectOption("45");
  await page.getByLabel("Age in whole years").fill("8");
  await page.getByRole("button", { name: "Update setup" }).click();
  await expect(page).toHaveURL("/find?players=4&mode=remote&time=45&age=8");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "More filters, 3 selected" }),
  ).toBeFocused();
  await expect(page.getByRole("status")).toHaveText("Setup updated.");

  await page.goBack();
  await expect(page).toHaveURL("/find?players=4");
  await expect(
    page.getByRole("button", { name: "Remove Remote filter" }),
  ).toHaveCount(0);
  await page.goForward();
  await expect(page).toHaveURL("/find?players=4&mode=remote&time=45&age=8");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Remove Remote filter" }),
  ).toBeVisible();
});

test("validation preserves the mobile draft and native dialog restores focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/find");
  await openFilters(page);
  await page.getByLabel("Time limit").selectOption("custom");
  await page.getByLabel("Custom minutes").fill("0");
  await page.getByLabel("Age in whole years").fill("121");
  await page.getByRole("button", { name: "Update setup" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByLabel("Custom minutes")).toHaveValue("0");
  await expect(page.getByLabel("Custom minutes")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.locator("#time-error")).toHaveText(
    "Enter a whole number from 1 to 1,440 minutes.",
  );
  await expect(page).toHaveURL(/\/find$/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "More filters" }),
  ).toBeFocused();
});

test("summary removal and Clear all commit only the selected changes", async ({
  page,
}) => {
  await page.goto("/find?players=4&mode=remote&time=45&equipment=none");
  const time = page.getByRole("button", {
    name: "Remove Up to 45 minutes filter",
  });
  await time.click();
  await expect(page).toHaveURL("/find?players=4&mode=remote&equipment=none");
  await expect(
    page.getByRole("button", { name: "Remove Remote filter" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(page).toHaveURL("/find");
  await expect(page.getByRole("button", { name: "Clear all" })).toHaveCount(0);
  await expect(page.getByText("No filters are active yet.")).toBeVisible();
});

test("JavaScript-disabled page remains readable and makes no applied claim", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/find?players=4&mode=remote");
  await expect(
    page.getByRole("radio", { name: "4", exact: true }),
  ).not.toBeChecked();
  await expect(
    page.getByRole("group", { name: "Together or remote?" }),
  ).toBeVisible();
  await expect(page.getByText("No filters are active yet.")).toBeVisible();
  await expect(
    page.getByText(
      /Applying and restoring a shareable setup requires JavaScript/,
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "browse the collection", exact: true }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/games? found/i);
  await context.close();
});

test("reflows, protects privacy, and passes the automated accessibility gate", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/find?players=4&equipment=chess_set%3A1");
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
  await page.goto("/find");
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.getByRole("radio", { name: "4", exact: true }).click();
  await openFilters(page);
  await page.getByLabel("Age in whole years").fill("8");
  await page.getByRole("button", { name: "Update setup" }).click();
  expect(
    await page.evaluate(() => [
      localStorage.length,
      sessionStorage.length,
      document.cookie,
    ]),
  ).toEqual([0, 0, ""]);
  expect(requests).toEqual([]);
  await expect(page).toHaveURL("/find?players=4&age=8");
  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations.filter(({ impact }) =>
      ["serious", "critical"].includes(impact ?? ""),
    ),
  ).toEqual([]);
});
