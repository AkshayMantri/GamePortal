import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildBrowseCollection,
  normalizeBrowseText,
  summarizeAges,
  summarizePlayerCounts,
  summarizeTimes,
} from "../../src/catalog/browse.ts";
import type { CatalogDocument } from "../../src/catalog/schema.ts";
import { parseCatalogJson } from "../../src/catalog/validate.ts";
import { matchesBrowseSearch } from "../../src/scripts/browse-search.ts";

const parsed = parseCatalogJson(
  readFileSync(resolve(process.cwd(), "catalog/catalog.json"), "utf8"),
  "catalog/catalog.json",
);

if (!parsed.success) throw new Error("Production catalog fixture is invalid.");
const productionCatalog = parsed.data;

type GameType = CatalogDocument["games"][number]["gameType"];

type ChainSpec = {
  suffix: string;
  title: string;
  sortTitle?: string;
  gameType?: GameType;
};

function chainCatalog(specs: ChainSpec[]): CatalogDocument {
  const catalog = structuredClone(productionCatalog);
  const gameTemplate = structuredClone(productionCatalog.games[0]);
  const editionTemplate = structuredClone(productionCatalog.editions[0]);
  const modeTemplate = structuredClone(productionCatalog.playModes[0]);
  const accessTemplate = structuredClone(productionCatalog.accessOptions[0]);
  const requirementTemplate = structuredClone(
    productionCatalog.requirements[0],
  );
  const mediaTemplate = structuredClone(productionCatalog.mediaAssets[0]);

  catalog.games = [];
  catalog.editions = [];
  catalog.playModes = [];
  catalog.accessOptions = [];
  catalog.requirements = [];
  catalog.mediaAssets = [];

  for (const spec of specs) {
    const safe = spec.suffix
      .toLocaleLowerCase("en-US")
      .replace(/[^a-z0-9]+/g, "_");
    const slug = safe.replace(/_/g, "-");
    const gameId = `game_${safe}`;
    const editionId = `edition_${safe}`;
    const modeId = `mode_${safe}`;
    const accessId = `access_${safe}`;
    const requirementId = `req_${safe}`;
    const mediaId = `media_${safe}`;

    const game = structuredClone(gameTemplate);
    Object.assign(game, {
      id: gameId,
      slug,
      canonicalTitle: spec.title,
      sortTitle: spec.sortTitle ?? spec.title,
      gameType: spec.gameType ?? "board",
      editionIds: [editionId],
      mediaAssetIds: [mediaId],
      rulesItemIds: [],
    });
    const edition = structuredClone(editionTemplate);
    Object.assign(edition, {
      id: editionId,
      gameId,
      title: `${spec.title} edition`,
      playModeIds: [modeId],
    });
    const mode = structuredClone(modeTemplate);
    Object.assign(mode, {
      id: modeId,
      editionId,
      accessOptionIds: [accessId],
    });
    const access = structuredClone(accessTemplate);
    Object.assign(access, {
      id: accessId,
      playModeId: modeId,
      requirementIds: [requirementId],
    });
    const requirement = structuredClone(requirementTemplate);
    Object.assign(requirement, {
      id: requirementId,
      accessOptionId: accessId,
      itemCode: `${safe}_set`,
    });
    const media = structuredClone(mediaTemplate);
    Object.assign(media, {
      id: mediaId,
      gameId,
      altText: `Neutral placeholder for ${spec.title}.`,
    });

    catalog.games.push(game);
    catalog.editions.push(edition);
    catalog.playModes.push(mode);
    catalog.accessOptions.push(access);
    catalog.requirements.push(requirement);
    catalog.mediaAssets.push(media);
  }
  return catalog;
}

describe("Browse publication projection", () => {
  it("projects only the two complete production chains without private or destination fields", () => {
    const collection = buildBrowseCollection(productionCatalog);
    expect(
      collection.games.map(({ id, slug, title }) => ({ id, slug, title })),
    ).toEqual([
      { id: "game_chess", slug: "chess", title: "Chess" },
      { id: "game_go", slug: "go", title: "Go" },
    ]);
    expect(
      collection.types.map(({ slug, count }) => ({ slug, count })),
    ).toEqual([{ slug: "abstract-strategy", count: 2 }]);
    expect(collection.letters.map(({ letter }) => letter)).toEqual(["C", "G"]);
    expect(collection.games[0]).toMatchObject({
      playersSummary: "2 players",
      timeSummary: "Time not yet published",
      ageSummary: "Age guidance not yet published",
      modesSummary: "In person",
      formsSummary: "Physical instructions",
    });

    const publicJson = JSON.stringify(collection);
    expect(publicJson).not.toMatch(
      /canonicalUrl|destination|provider|provenance|reviewedBy|sourceName|tags/,
    );
    expect(publicJson).not.toContain("https://");
  });

  it.each([
    [
      "Game",
      (catalog: CatalogDocument): void => {
        catalog.games[0].publicationStatus = "draft";
      },
    ],
    [
      "Edition",
      (catalog: CatalogDocument): void => {
        catalog.editions[0].publicationStatus = "review";
      },
    ],
    [
      "Play Mode",
      (catalog: CatalogDocument): void => {
        catalog.playModes[0].publicationReview = { state: "pending" };
      },
    ],
    [
      "known players",
      (catalog: CatalogDocument): void => {
        catalog.playModes[0].supportedPlayers = {
          state: "unknown",
          reason: "not_verified",
        };
      },
    ],
    [
      "playable Access Option",
      (catalog: CatalogDocument): void => {
        catalog.accessOptions[0].playable = false;
      },
    ],
    [
      "approved Access Option",
      (catalog: CatalogDocument): void => {
        catalog.accessOptions[0].publicationReview = { state: "pending" };
      },
    ],
  ] as const)(
    "omits a chain without its published %s gate",
    (_label, mutate) => {
      const catalog = chainCatalog([{ suffix: "only", title: "Only" }]);
      mutate(catalog);
      expect(buildBrowseCollection(catalog).games).toEqual([]);
    },
  );

  it("filters unpublished linked requirements and media without leaking their fields", () => {
    const catalog = chainCatalog([{ suffix: "only", title: "Only" }]);
    catalog.requirements[0].publicationStatus = "draft";
    catalog.requirements[0].notes = "operator-only draft note";
    catalog.mediaAssets[0].publicationReview = { state: "pending" };
    const [game] = buildBrowseCollection(catalog).games;
    expect(game.media).toBeNull();
    expect(game.editions[0].playModes[0].accessOptions[0].requirements).toEqual(
      [],
    );
    expect(JSON.stringify(game)).not.toContain("operator-only draft note");
  });

  it("never exposes an external destination even when the source chain references one", () => {
    const catalog = chainCatalog([{ suffix: "only", title: "Only" }]);
    catalog.accessOptions[0].destination = {
      state: "external",
      destinationId: "dest_fixture",
    };
    catalog.destinations.push({
      id: "dest_fixture",
      url: "https://play.example.com/game",
      destinationType: "official_play",
      provider: "Example",
      publicDisplayDomain: "example.com",
      reviewState: "approved",
      reviewedAt: "2026-07-17T12:00:00+05:30",
      reviewedBy: "Fixture",
      redirectPolicy: "no_redirects",
      publicationStatus: "published",
      provenance: [],
    });
    const publicJson = JSON.stringify(buildBrowseCollection(catalog));
    expect(publicJson).not.toContain("play.example.com");
    expect(publicJson).not.toContain("dest_fixture");
  });
});

describe("Browse summaries and deterministic organization", () => {
  it("compresses only truly contiguous player counts", () => {
    expect(summarizePlayerCounts([2, 4, 5, 6])).toBe("2 or 4–6 players");
    expect(summarizePlayerCounts([1])).toBe("1 player");
    expect(summarizePlayerCounts([])).toBe("Player count not yet published");
  });

  it("uses conservative known time totals and honest unknown/varies age states", () => {
    expect(summarizeTimes([45])).toBe("45 minutes");
    expect(summarizeTimes([30, 60])).toBe("30–60 minutes");
    expect(summarizeTimes([30, null])).toBe("Time not yet published");
    expect(summarizeAges([])).toBe("Age guidance not yet published");
    expect(summarizeAges([null, null])).toBe("Age guidance not yet published");
    expect(summarizeAges([8])).toBe("Ages 8+");
    expect(summarizeAges([8, null])).toBe("Age guidance varies");
    expect(summarizeAges([8, 10])).toBe("Age guidance varies");
  });

  it("derives both modes, distinct forms, discontinuous players, and differing totals", () => {
    const catalog = chainCatalog([{ suffix: "mixed", title: "Mixed" }]);
    const firstMode = catalog.playModes[0];
    firstMode.supportedPlayers = {
      state: "known",
      shape: { kind: "set", values: [2] },
    };
    firstMode.time = {
      setupOrAccess: { state: "known", minutes: 5 },
      teaching: { state: "known", minutes: 10 },
      play: { state: "known", minimum: 20, maximum: 30 },
    };
    const secondMode = structuredClone(firstMode);
    secondMode.id = "mode_mixed_remote";
    secondMode.mode = "remote";
    secondMode.supportedPlayers = {
      state: "known",
      shape: { kind: "range", minimum: 4, maximum: 6 },
    };
    secondMode.time.play = { state: "known", minimum: 30, maximum: 45 };
    secondMode.accessOptionIds = ["access_mixed_browser"];
    const secondAccess = structuredClone(catalog.accessOptions[0]);
    secondAccess.id = "access_mixed_browser";
    secondAccess.playModeId = secondMode.id;
    secondAccess.accessKind = "browser";
    secondAccess.requirementIds = [];
    catalog.editions[0].playModeIds.push(secondMode.id);
    catalog.playModes.push(secondMode);
    catalog.accessOptions.push(secondAccess);

    expect(buildBrowseCollection(catalog).games[0]).toMatchObject({
      playersSummary: "2 or 4–6 players",
      timeSummary: "45–60 minutes",
      modesSummary: "In person and Remote",
      formsSummary: "Physical instructions, Browser",
    });
  });

  it("sorts by explicit normalized sortTitle then stable Game ID and groups non-Latin/numeric titles under #", () => {
    const catalog = chainCatalog([
      { suffix: "zulu", title: "Zulu", sortTitle: "Alpha" },
      { suffix: "alpha_b", title: "Duplicate", sortTitle: "Same" },
      { suffix: "alpha_a", title: "Duplicate", sortTitle: "Same" },
      { suffix: "accent", title: "Éclair" },
      { suffix: "numeric", title: "2048" },
      { suffix: "nihon", title: "囲碁" },
    ]);
    const collection = buildBrowseCollection(catalog);
    expect(collection.games.map(({ id }) => id)).toEqual([
      "game_numeric",
      "game_zulu",
      "game_accent",
      "game_alpha_a",
      "game_alpha_b",
      "game_nihon",
    ]);
    expect(collection.letters.map(({ letter }) => letter)).toEqual([
      "A",
      "E",
      "S",
      "#",
    ]);
    expect(collection.letters.map(({ anchor }) => anchor)).toEqual([
      "letter-a",
      "letter-e",
      "letter-s",
      "letter-number-symbol",
    ]);
  });

  it.each([0, 1, 2, 21])("keeps %i-record collections coherent", (count) => {
    const specs = Array.from({ length: count }, (_, index) => ({
      suffix: `game_${index + 1}`,
      title: `Game ${String(index + 1).padStart(2, "0")}`,
    }));
    const collection = buildBrowseCollection(chainCatalog(specs));
    expect(collection.games).toHaveLength(count);
    expect(collection.types[0]?.count ?? 0).toBe(count);
    expect(new Set(collection.games.map(({ id }) => id)).size).toBe(count);
  });

  it("preserves long translated titles and original summaries", () => {
    const title =
      "Un juego de estrategia con un título deliberadamente largo — édition spéciale";
    const catalog = chainCatalog([{ suffix: "long", title }]);
    catalog.games[0].summary =
      "Resumen original aprobado para una prueba de presentación larga.";
    expect(buildBrowseCollection(catalog).games[0]).toMatchObject({
      title,
      summary:
        "Resumen original aprobado para una prueba de presentación larga.",
      letter: "U",
    });
  });
});

describe("Browse search", () => {
  it("normalizes case, compatibility forms, diacritics, punctuation, and whitespace", () => {
    expect(normalizeBrowseText("  ÉCLAIR—Ｃｈｅｓｓ!!  ")).toBe("eclair chess");
  });

  it("matches title/type terms without fuzzy substitution", () => {
    const publicText = normalizeBrowseText("Chess Abstract strategy");
    expect(matchesBrowseSearch(publicText, "chess")).toBe(true);
    expect(matchesBrowseSearch(publicText, "strategy chess")).toBe(true);
    expect(matchesBrowseSearch(publicText, "ches")).toBe(true);
    expect(matchesBrowseSearch(publicText, "checkers")).toBe(false);
  });

  it("keeps search text scoped to canonical title and public type label", () => {
    const catalog = chainCatalog([{ suffix: "hidden", title: "Public title" }]);
    catalog.games[0].summary = "Secret summary needle";
    catalog.games[0].tags = ["secret_tag_needle"];
    const [game] = buildBrowseCollection(catalog).games;
    expect(game.searchText).toBe("public title board");
    expect(matchesBrowseSearch(game.searchText, "secret")).toBe(false);
  });
});
