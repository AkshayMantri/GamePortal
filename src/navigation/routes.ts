export type NavigationPlacement =
  "desktop-primary" | "desktop-personal" | "mobile-primary";

export type MatchMode = "exact" | "nested";

type RouteAlias = {
  href: string;
  match: MatchMode;
};

export type NavigationItem = {
  key:
    | "find"
    | "browse"
    | "random"
    | "vote"
    | "game-night"
    | "popular"
    | "library"
    | "account"
    | "more";
  labelKey: `navigation.${string}`;
  label: string;
  href: `/${string}`;
  match: MatchMode;
  aliases?: readonly RouteAlias[];
  placements: readonly NavigationPlacement[];
  inMore: boolean;
  order: number;
};

export const navigationItems: readonly NavigationItem[] = [
  {
    key: "find",
    labelKey: "navigation.find",
    label: "Find",
    href: "/find",
    match: "nested",
    aliases: [{ href: "/", match: "exact" }],
    placements: ["desktop-primary", "mobile-primary"],
    inMore: false,
    order: 10,
  },
  {
    key: "browse",
    labelKey: "navigation.browse",
    label: "Browse",
    href: "/browse",
    match: "nested",
    placements: ["desktop-primary", "mobile-primary"],
    inMore: false,
    order: 20,
  },
  {
    key: "random",
    labelKey: "navigation.random",
    label: "Random",
    href: "/random",
    match: "nested",
    placements: ["desktop-primary", "mobile-primary"],
    inMore: false,
    order: 30,
  },
  {
    key: "vote",
    labelKey: "navigation.vote",
    label: "Vote",
    href: "/vote",
    match: "nested",
    placements: ["desktop-primary"],
    inMore: true,
    order: 40,
  },
  {
    key: "game-night",
    labelKey: "navigation.gameNight",
    label: "Game Night",
    href: "/game-nights",
    match: "nested",
    placements: ["desktop-primary"],
    inMore: true,
    order: 50,
  },
  {
    key: "popular",
    labelKey: "navigation.popular",
    label: "Popular",
    href: "/popular",
    match: "nested",
    placements: ["desktop-primary"],
    inMore: true,
    order: 60,
  },
  {
    key: "library",
    labelKey: "navigation.library",
    label: "Library",
    href: "/library",
    match: "nested",
    placements: ["desktop-personal"],
    inMore: true,
    order: 70,
  },
  {
    key: "account",
    labelKey: "navigation.account",
    label: "Account",
    href: "/account",
    match: "nested",
    placements: ["desktop-personal"],
    inMore: true,
    order: 80,
  },
  {
    key: "more",
    labelKey: "navigation.more",
    label: "More",
    href: "/more",
    match: "exact",
    placements: ["mobile-primary"],
    inMore: false,
    order: 90,
  },
];

export function normalizePathname(input: string): string {
  const withoutHash = input.trim().split("#", 1)[0] ?? "";
  const withoutQuery = withoutHash.split("?", 1)[0] ?? "";
  const withLeadingSlash = withoutQuery.startsWith("/")
    ? withoutQuery
    : `/${withoutQuery}`;
  return withLeadingSlash.replace(/\/+$/, "") || "/";
}

function matchesRoute(pathname: string, href: string, match: MatchMode) {
  const normalizedHref = normalizePathname(href);
  if (pathname === normalizedHref) return true;
  return match === "nested" && pathname.startsWith(`${normalizedHref}/`);
}

export function getRouteOwner(path: string): NavigationItem | undefined {
  const pathname = normalizePathname(path);
  const matches = navigationItems.flatMap((item) => {
    const patterns: readonly RouteAlias[] = [
      { href: item.href, match: item.match },
      ...(item.aliases ?? []),
    ];
    return patterns
      .filter(({ href, match }) => matchesRoute(pathname, href, match))
      .map(({ href }) => ({
        item,
        specificity: normalizePathname(href).length,
      }));
  });

  return matches.sort((a, b) => b.specificity - a.specificity)[0]?.item;
}

export function isCurrentRoute(item: NavigationItem, path: string) {
  return getRouteOwner(path)?.key === item.key;
}

export function getNavigationProjection(placement: NavigationPlacement) {
  return navigationItems
    .filter((item) =>
      (item.placements as readonly NavigationPlacement[]).includes(placement),
    )
    .sort((a, b) => a.order - b.order);
}

export function getMoreNavigationItems() {
  return navigationItems
    .filter((item) => item.inMore)
    .sort((a, b) => a.order - b.order);
}
