import { describe, expect, it } from "vitest";

import {
  getMoreNavigationItems,
  getNavigationProjection,
  getRouteOwner,
  isCurrentRoute,
  navigationItems,
  normalizePathname,
} from "../../src/navigation/routes";

const keys = (items: readonly { key: string }[]) => items.map(({ key }) => key);

describe("navigation route ownership", () => {
  it.each([
    ["/", "find"],
    ["/find", "find"],
    ["/find/", "find"],
    ["/find/advanced", "find"],
    ["/browse?type=strategy#collection", "browse"],
    ["/random/history", "random"],
    ["/vote/session-1", "vote"],
    ["/game-nights/event-1", "game-night"],
    ["/popular/recent", "popular"],
    ["/library/favorites", "library"],
    ["/account/privacy", "account"],
    ["/more", "more"],
  ])("assigns %s to %s", (path, owner) => {
    expect(getRouteOwner(path)?.key).toBe(owner);
  });

  it.each(["/finding", "/browsers", "/votes", "/games/chess", "/unknown"])(
    "does not invent an owner for %s",
    (path) => {
      expect(getRouteOwner(path)).toBeUndefined();
    },
  );

  it("normalizes root, leading slashes, trailing slashes, queries, and hashes", () => {
    expect(normalizePathname("")).toBe("/");
    expect(normalizePathname("find/")).toBe("/find");
    expect(normalizePathname("/vote///?from=find#ballot")).toBe("/vote");
  });

  it("uses segment boundaries and longest matching ownership", () => {
    expect(getRouteOwner("/game-nights/new")?.href).toBe("/game-nights");
    expect(getRouteOwner("/game-night")).toBeUndefined();
    expect(getRouteOwner("/more/details")).toBeUndefined();
  });
});

describe("navigation projections", () => {
  it("keeps desktop primary and personal destinations in deterministic order", () => {
    expect(keys(getNavigationProjection("desktop-primary"))).toEqual([
      "find",
      "browse",
      "random",
      "vote",
      "game-night",
      "popular",
    ]);
    expect(keys(getNavigationProjection("desktop-personal"))).toEqual([
      "library",
      "account",
    ]);
  });

  it("keeps the compact projection and More membership exact", () => {
    expect(keys(getNavigationProjection("mobile-primary"))).toEqual([
      "find",
      "browse",
      "random",
      "more",
    ]);
    expect(keys(getMoreNavigationItems())).toEqual([
      "vote",
      "game-night",
      "popular",
      "library",
      "account",
    ]);
  });

  it("marks More current only on /more, never for a grouped destination", () => {
    const more = navigationItems.find(({ key }) => key === "more");
    const vote = navigationItems.find(({ key }) => key === "vote");
    expect(more).toBeDefined();
    expect(vote).toBeDefined();
    expect(isCurrentRoute(more!, "/more")).toBe(true);
    expect(isCurrentRoute(more!, "/vote")).toBe(false);
    expect(isCurrentRoute(vote!, "/vote/session-1")).toBe(true);
  });

  it("provides localization-ready label keys and unique deterministic order", () => {
    expect(
      navigationItems.every(({ labelKey }) =>
        labelKey.startsWith("navigation."),
      ),
    ).toBe(true);
    expect(new Set(navigationItems.map(({ order }) => order)).size).toBe(
      navigationItems.length,
    );
  });
});
