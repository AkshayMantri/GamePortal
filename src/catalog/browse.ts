import type { CatalogDocument } from "./schema.ts";

export const BROWSE_GAME_TYPES = [
  { key: "board", slug: "board", label: "Board" },
  { key: "card", slug: "card", label: "Card" },
  { key: "word", slug: "word", label: "Word" },
  { key: "party", slug: "party", label: "Party" },
  { key: "social", slug: "social", label: "Social" },
  {
    key: "abstract_strategy",
    slug: "abstract-strategy",
    label: "Abstract strategy",
  },
  { key: "other", slug: "other", label: "Other" },
] as const;

export type BrowseGameType = (typeof BROWSE_GAME_TYPES)[number]["key"];
export type BrowseType = (typeof BROWSE_GAME_TYPES)[number];

const ACCESS_KIND_LABELS = {
  physical_instructions: "Physical instructions",
  browser: "Browser",
  mobile_app: "Mobile app",
  desktop_app: "Desktop app",
  console: "Console",
  store: "Store",
  other: "Other",
} as const;

const ACCESS_KIND_ORDER = Object.keys(ACCESS_KIND_LABELS) as Array<
  keyof typeof ACCESS_KIND_LABELS
>;

const MODE_LABELS = {
  in_person: "In person",
  remote: "Remote",
} as const;

type PublicationReview = { state: "pending" } | { state: "approved" };

type Publishable = {
  publicationStatus: "draft" | "review" | "published";
  publicationReview: PublicationReview;
};

export type BrowseRequirement = {
  id: string;
  requirementType: CatalogDocument["requirements"][number]["requirementType"];
  itemCode: string;
  minimumQuantity: number;
  scope: CatalogDocument["requirements"][number]["scope"];
  mandatory: boolean;
};

export type BrowseAccessOption = {
  id: string;
  accessKind: keyof typeof ACCESS_KIND_LABELS;
  accessLabel: string;
  requirements: BrowseRequirement[];
};

export type BrowsePlayMode = {
  id: string;
  mode: keyof typeof MODE_LABELS;
  modeLabel: string;
  supportedPlayerCounts: number[];
  totalMinutesMaximum: number | null;
  accessOptions: BrowseAccessOption[];
};

export type BrowseEdition = {
  id: string;
  title: string;
  ageMinimumYears: number | null;
  playModes: BrowsePlayMode[];
};

export type BrowseMedia = {
  id: string;
  path: string;
  altText: string;
  width: number;
  height: number;
};

export type BrowseGame = {
  id: string;
  slug: string;
  title: string;
  sortTitle: string;
  summary: string;
  gameType: BrowseGameType;
  typeSlug: BrowseType["slug"];
  typeLabel: string;
  letter: string;
  playersSummary: string;
  timeSummary: string;
  ageSummary: string;
  modesSummary: string;
  formsSummary: string;
  searchText: string;
  media: BrowseMedia | null;
  editions: BrowseEdition[];
};

export type BrowseLetterGroup = {
  letter: string;
  anchor: string;
  games: BrowseGame[];
};

export type BrowseTypeGroup = BrowseType & {
  count: number;
  games: BrowseGame[];
};

export type BrowseCollection = {
  games: BrowseGame[];
  letters: BrowseLetterGroup[];
  types: BrowseTypeGroup[];
};

function isPublishedApproved(value: Publishable): boolean {
  return (
    value.publicationStatus === "published" &&
    value.publicationReview.state === "approved"
  );
}

export function normalizeBrowseText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFC");
}

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function compareGames(left: BrowseGame, right: BrowseGame): number {
  return (
    compareText(
      normalizeBrowseText(left.sortTitle),
      normalizeBrowseText(right.sortTitle),
    ) || compareText(left.id, right.id)
  );
}

function alphabetLetter(sortTitle: string): string {
  const first = normalizeBrowseText(sortTitle).at(0)?.toUpperCase();
  return first && /^[A-Z]$/.test(first) ? first : "#";
}

function expandPlayerCounts(
  support: CatalogDocument["playModes"][number]["supportedPlayers"],
): number[] {
  if (support.state !== "known") return [];
  const shape = support.shape;
  if (shape.kind === "set") return [...shape.values];
  return Array.from(
    { length: shape.maximum - shape.minimum + 1 },
    (_, index) => shape.minimum + index,
  );
}

function joinAlternatives(parts: string[]): string {
  if (parts.length < 2) return parts[0] ?? "";
  if (parts.length === 2) return `${parts[0]} or ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, or ${parts.at(-1)}`;
}

export function summarizePlayerCounts(counts: readonly number[]): string {
  const unique = [...new Set(counts)].sort((left, right) => left - right);
  if (unique.length === 0) return "Player count not yet published";

  const runs: Array<{ start: number; end: number }> = [];
  for (const count of unique) {
    const previous = runs.at(-1);
    if (previous && count === previous.end + 1) previous.end = count;
    else runs.push({ start: count, end: count });
  }

  const parts = runs.map(({ start, end }) =>
    start === end ? String(start) : `${start}–${end}`,
  );
  const noun = unique.length === 1 && unique[0] === 1 ? "player" : "players";
  return `${joinAlternatives(parts)} ${noun}`;
}

function totalMinutesMaximum(
  time: CatalogDocument["playModes"][number]["time"],
): number | null {
  if (
    time.setupOrAccess.state !== "known" ||
    time.teaching.state !== "known" ||
    time.play.state !== "known"
  ) {
    return null;
  }
  return time.setupOrAccess.minutes + time.teaching.minutes + time.play.maximum;
}

function formatMinutes(minutes: number): string {
  return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
}

export function summarizeTimes(totals: readonly (number | null)[]): string {
  if (totals.length === 0 || totals.some((total) => total === null)) {
    return "Time not yet published";
  }
  const known = [...new Set(totals as number[])].sort(
    (left, right) => left - right,
  );
  if (known.length === 1) return formatMinutes(known[0]);
  return `${known[0]}–${known.at(-1)} minutes`;
}

export function summarizeAges(minimums: readonly (number | null)[]): string {
  if (minimums.length === 0 || minimums.every((minimum) => minimum === null)) {
    return "Age guidance not yet published";
  }
  if (minimums.some((minimum) => minimum === null)) {
    return "Age guidance varies";
  }
  const known = [...new Set(minimums as number[])];
  return known.length === 1 ? `Ages ${known[0]}+` : "Age guidance varies";
}

function summarizeModes(modes: readonly BrowsePlayMode[]): string {
  const available = (["in_person", "remote"] as const).filter((mode) =>
    modes.some((candidate) => candidate.mode === mode),
  );
  return available.map((mode) => MODE_LABELS[mode]).join(" and ");
}

function summarizeForms(modes: readonly BrowsePlayMode[]): string {
  const kinds = new Set(
    modes.flatMap((mode) =>
      mode.accessOptions.map((accessOption) => accessOption.accessKind),
    ),
  );
  return ACCESS_KIND_ORDER.filter((kind) => kinds.has(kind))
    .map((kind) => ACCESS_KIND_LABELS[kind])
    .join(", ");
}

export function buildBrowseCollection(
  catalog: CatalogDocument,
): BrowseCollection {
  const editionsById = new Map(
    catalog.editions.map((edition) => [edition.id, edition]),
  );
  const playModesById = new Map(
    catalog.playModes.map((playMode) => [playMode.id, playMode]),
  );
  const accessOptionsById = new Map(
    catalog.accessOptions.map((accessOption) => [
      accessOption.id,
      accessOption,
    ]),
  );
  const requirementsById = new Map(
    catalog.requirements.map((requirement) => [requirement.id, requirement]),
  );
  const mediaById = new Map(
    catalog.mediaAssets.map((media) => [media.id, media]),
  );

  const games = catalog.games
    .filter(isPublishedApproved)
    .flatMap((game): BrowseGame[] => {
      const type = BROWSE_GAME_TYPES.find(({ key }) => key === game.gameType);
      if (!type) return [];

      const editions: BrowseEdition[] = game.editionIds.flatMap((editionId) => {
        const edition = editionsById.get(editionId);
        if (
          !edition ||
          edition.gameId !== game.id ||
          !isPublishedApproved(edition)
        ) {
          return [];
        }

        const playModes: BrowsePlayMode[] = edition.playModeIds.flatMap(
          (playModeId) => {
            const playMode = playModesById.get(playModeId);
            if (
              !playMode ||
              playMode.editionId !== edition.id ||
              !isPublishedApproved(playMode) ||
              playMode.supportedPlayers.state !== "known"
            ) {
              return [];
            }

            const accessOptions: BrowseAccessOption[] =
              playMode.accessOptionIds.flatMap((accessOptionId) => {
                const accessOption = accessOptionsById.get(accessOptionId);
                if (
                  !accessOption ||
                  accessOption.playModeId !== playMode.id ||
                  !accessOption.playable ||
                  !isPublishedApproved(accessOption)
                ) {
                  return [];
                }

                const requirements = accessOption.requirementIds.flatMap(
                  (requirementId): BrowseRequirement[] => {
                    const requirement = requirementsById.get(requirementId);
                    if (
                      !requirement ||
                      requirement.accessOptionId !== accessOption.id ||
                      !isPublishedApproved(requirement)
                    ) {
                      return [];
                    }
                    return [
                      {
                        id: requirement.id,
                        requirementType: requirement.requirementType,
                        itemCode: requirement.itemCode,
                        minimumQuantity: requirement.minimumQuantity,
                        scope: requirement.scope,
                        mandatory: requirement.mandatory,
                      },
                    ];
                  },
                );

                return [
                  {
                    id: accessOption.id,
                    accessKind: accessOption.accessKind,
                    accessLabel: ACCESS_KIND_LABELS[accessOption.accessKind],
                    requirements,
                  },
                ];
              });

            if (accessOptions.length === 0) return [];
            return [
              {
                id: playMode.id,
                mode: playMode.mode,
                modeLabel: MODE_LABELS[playMode.mode],
                supportedPlayerCounts: expandPlayerCounts(
                  playMode.supportedPlayers,
                ),
                totalMinutesMaximum: totalMinutesMaximum(playMode.time),
                accessOptions,
              },
            ];
          },
        );

        if (playModes.length === 0) return [];
        return [
          {
            id: edition.id,
            title: edition.title,
            ageMinimumYears:
              edition.ageGuidance.state === "known"
                ? edition.ageGuidance.minimumYears
                : null,
            playModes,
          },
        ];
      });

      if (editions.length === 0) return [];

      const allModes = editions.flatMap((edition) => edition.playModes);
      const media = game.mediaAssetIds
        .map((mediaId) => mediaById.get(mediaId))
        .filter(
          (candidate) =>
            candidate &&
            candidate.gameId === game.id &&
            candidate.location.kind === "local" &&
            isPublishedApproved(candidate),
        )
        .sort((left, right) => compareText(left!.id, right!.id))[0];
      const playerCounts = allModes.flatMap(
        (playMode) => playMode.supportedPlayerCounts,
      );
      const title = game.canonicalTitle;
      const typeLabel = type.label;

      return [
        {
          id: game.id,
          slug: game.slug,
          title,
          sortTitle: game.sortTitle,
          summary: game.summary,
          gameType: game.gameType,
          typeSlug: type.slug,
          typeLabel,
          letter: alphabetLetter(game.sortTitle),
          playersSummary: summarizePlayerCounts(playerCounts),
          timeSummary: summarizeTimes(
            allModes.map((playMode) => playMode.totalMinutesMaximum),
          ),
          ageSummary: summarizeAges(
            editions.map((edition) => edition.ageMinimumYears),
          ),
          modesSummary: summarizeModes(allModes),
          formsSummary: summarizeForms(allModes),
          searchText: normalizeBrowseText(`${title} ${typeLabel}`),
          media:
            media?.location.kind === "local"
              ? {
                  id: media.id,
                  path: media.location.path,
                  altText: media.altText,
                  width: media.intrinsicWidth,
                  height: media.intrinsicHeight,
                }
              : null,
          editions,
        },
      ];
    })
    .sort(compareGames);

  const letters = [...new Set(games.map((game) => game.letter))]
    .sort((left, right) => {
      if (left === "#") return 1;
      if (right === "#") return -1;
      return compareText(left, right);
    })
    .map((letter) => ({
      letter,
      anchor:
        letter === "#"
          ? "letter-number-symbol"
          : `letter-${letter.toLowerCase()}`,
      games: games.filter((game) => game.letter === letter),
    }));

  const types = BROWSE_GAME_TYPES.flatMap((type): BrowseTypeGroup[] => {
    const typeGames = games.filter((game) => game.gameType === type.key);
    return typeGames.length === 0
      ? []
      : [{ ...type, count: typeGames.length, games: typeGames }];
  });

  return { games, letters, types };
}

export function findBrowseGameBySlug(
  collection: BrowseCollection,
  slug: string,
): BrowseGame | undefined {
  return collection.games.find((game) => game.slug === slug);
}

export function findBrowseTypeBySlug(
  collection: BrowseCollection,
  slug: string,
): BrowseTypeGroup | undefined {
  return collection.types.find((type) => type.slug === slug);
}
