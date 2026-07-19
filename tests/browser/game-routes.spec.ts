import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const game of [
  { slug: "chess", title: "Chess", type: "Abstract strategy" },
  { slug: "go", title: "Go", type: "Abstract strategy" },
] as const) {
  test(`${game.title} has a neutral, publication-safe generated scaffold`, async ({
    page,
  }) => {
    const response = await page.goto(`/games/${game.slug}`);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(`${game.title} | Game Portal`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex,follow",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `/games/${game.slug}`,
    );
    await expect(
      page.getByRole("heading", { level: 1, name: game.title }),
    ).toBeVisible();
    await expect(page.getByText(game.type, { exact: true })).toBeVisible();
    await expect(
      page.getByText("Physical instructions", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Time not yet published", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Age guidance not yet published", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Return to Browse" }),
    ).toHaveAttribute("href", "/browse");
    await expect(page.locator("script, astro-island")).toHaveCount(0);
    await expect(page.locator('a[href^="http"]')).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText("reviewedBy");
    await expect(page.locator("body")).not.toContainText("https://");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations.filter(({ impact }) =>
        ["serious", "critical"].includes(impact ?? ""),
      ),
    ).toEqual([]);
  });
}

test("does not generate an unpublished or unknown Game route", async ({
  request,
}) => {
  expect((await request.get("/games/not-published")).status()).toBe(404);
});
