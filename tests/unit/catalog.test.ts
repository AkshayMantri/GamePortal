import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { DestinationSchema } from "../../src/catalog/schema.ts";
import {
  parseCatalogJson,
  validateCatalogValue,
} from "../../src/catalog/validate.ts";
import type { CatalogValidationResult } from "../../src/catalog/validate.ts";

const fixtureDirectory = resolve(process.cwd(), "tests/fixtures/catalog");
const validFixtureText = readFileSync(
  resolve(fixtureDirectory, "valid-complete-chain.json"),
  "utf8",
);
const validFixture = JSON.parse(validFixtureText) as unknown;

type MutableRecord = Record<string, unknown>;
type LooseCatalog = {
  games: MutableRecord[];
  editions: MutableRecord[];
  playModes: MutableRecord[];
  accessOptions: MutableRecord[];
  requirements: MutableRecord[];
  destinations: MutableRecord[];
  sourceClaims: MutableRecord[];
  mediaAssets: MutableRecord[];
  rulesItems: MutableRecord[];
};

const cloneFixture = () => structuredClone(validFixture) as LooseCatalog;

function expectFailure(
  result: CatalogValidationResult,
  code?: string,
  pathPart?: string,
) {
  expect(result.success).toBe(false);
  if (result.success) return;
  if (code)
    expect(result.issues.some((issue) => issue.code === code)).toBe(true);
  if (pathPart) {
    expect(
      result.issues.some((issue) => issue.path.join(".").includes(pathPart)),
    ).toBe(true);
  }
}

describe("catalog JSON boundary", () => {
  it("accepts a complete test-only published chain", () => {
    const result = parseCatalogJson(
      validFixtureText,
      "valid-complete-chain.json",
    );
    expect(result.success).toBe(true);
  });

  it("accepts the explicitly disclosed contract-only empty production catalog", () => {
    const production = readFileSync(
      resolve(process.cwd(), "catalog/catalog.json"),
      "utf8",
    );
    expect(parseCatalogJson(production, "catalog/catalog.json").success).toBe(
      true,
    );
  });

  it("returns a path-aware issue for non-JSON input", () => {
    const result = parseCatalogJson(
      '{ "catalogVersion": 1,',
      "malformed-input",
    );
    expectFailure(result, "invalid_json");
    if (!result.success)
      expect(result.issues[0]?.source).toBe("malformed-input");
  });

  it("returns a schema path for malformed catalog records", () => {
    const input = readFileSync(
      resolve(fixtureDirectory, "invalid-missing-access-option.json"),
      "utf8",
    );
    const result = parseCatalogJson(
      input,
      "invalid-missing-access-option.json",
    );
    expectFailure(result, undefined, "games.0.editionIds");
  });
});

describe("player support and explicit uncertainty", () => {
  it.each([
    ["zero", { kind: "range", minimum: 0, maximum: 4 }],
    ["negative", { kind: "range", minimum: -1, maximum: 4 }],
    ["reversed", { kind: "range", minimum: 5, maximum: 2 }],
    ["empty set", { kind: "set", values: [] }],
    ["duplicate set", { kind: "set", values: [2, 2] }],
    ["out of range", { kind: "set", values: [2, 100] }],
    [
      "conflicting range/set",
      { kind: "range", minimum: 2, maximum: 4, values: [2] },
    ],
  ])("rejects %s player support", (_name, shape) => {
    const document = cloneFixture();
    document.playModes[0].supportedPlayers = { state: "known", shape };
    expectFailure(
      validateCatalogValue(document),
      undefined,
      "supportedPlayers",
    );
  });

  it("requires published Play Modes to know their supported counts", () => {
    const document = cloneFixture();
    document.playModes[0].supportedPlayers = {
      state: "unknown",
      reason: "not_verified",
    };
    expectFailure(validateCatalogValue(document), "published_players_unknown");
  });

  it("rejects omitted filter-critical state instead of inventing a default", () => {
    const document = cloneFixture();
    delete document.accessOptions[0].languages;
    expectFailure(
      validateCatalogValue(document),
      undefined,
      "accessOptions.0.languages",
    );
  });

  it("permits disclosed unknown age guidance on a published Edition", () => {
    const document = cloneFixture();
    document.editions[0].ageGuidance = {
      state: "unknown",
      reason: "not_verified",
    };
    document.editions[0].provenance = (
      document.editions[0].provenance as MutableRecord[]
    ).map((entry) =>
      entry.fieldPath === "ageGuidance"
        ? { fieldPath: "ageGuidance", basis: { kind: "original" } }
        : entry,
    );
    document.sourceClaims = [];
    expect(validateCatalogValue(document).success).toBe(true);
  });
});

describe("hierarchy and publication gates", () => {
  it("rejects a published Game without an Access Option", () => {
    const document = cloneFixture();
    document.playModes[0].accessOptionIds = [];
    document.accessOptions = [];
    document.requirements = [];
    expectFailure(
      validateCatalogValue(document),
      undefined,
      "playModes.0.accessOptionIds",
    );
  });

  it("rejects duplicate IDs", () => {
    const document = cloneFixture();
    document.games.push(structuredClone(document.games[0]));
    expectFailure(validateCatalogValue(document), "duplicate_id");
  });

  it("rejects dangling and wrong-parent references", () => {
    const document = cloneFixture();
    document.editions[0].gameId = "game_missing";
    expectFailure(validateCatalogValue(document), "dangling_reference");

    const wrongParent = cloneFixture();
    const secondGame = structuredClone(wrongParent.games[0]);
    secondGame.id = "game_other";
    secondGame.slug = "other-fixture-game";
    secondGame.publicationStatus = "draft";
    wrongParent.games.push(secondGame);
    wrongParent.editions[0].gameId = "game_other";
    expectFailure(validateCatalogValue(wrongParent), "wrong_parent");
  });

  it("rejects duplicate public slugs", () => {
    const document = cloneFixture();
    const secondGame = structuredClone(document.games[0]);
    secondGame.id = "game_other";
    secondGame.publicationStatus = "draft";
    document.games.push(secondGame);
    expectFailure(validateCatalogValue(document), "duplicate_slug");
  });

  it("rejects a published child under a draft parent", () => {
    const document = cloneFixture();
    document.games[0].publicationStatus = "draft";
    expectFailure(
      validateCatalogValue(document),
      "published_child_under_unpublished_parent",
    );
  });

  it("rejects flattened access requirements on Game", () => {
    const document = cloneFixture();
    document.games[0].requirements = ["req_fixture_board"];
    expectFailure(validateCatalogValue(document), undefined, "games.0");
  });
});

describe("provenance, rights, and external destinations", () => {
  it("rejects missing required field provenance", () => {
    const document = cloneFixture();
    document.games[0].provenance = (
      document.games[0].provenance as MutableRecord[]
    ).filter((entry) => entry.fieldPath !== "summary");
    expectFailure(validateCatalogValue(document), "missing_provenance");
  });

  it.each(["sortTitle", "tags"])(
    "requires Game %s provenance when published",
    (fieldPath) => {
      const document = cloneFixture();
      document.games[0].provenance = (
        document.games[0].provenance as MutableRecord[]
      ).filter((entry) => entry.fieldPath !== fieldPath);
      expectFailure(validateCatalogValue(document), "missing_provenance");
    },
  );

  it("rejects an invented provenance field", () => {
    const document = cloneFixture();
    (document.games[0].provenance as MutableRecord[]).push({
      fieldPath: "inventedFact",
      basis: { kind: "original" },
    });
    expectFailure(validateCatalogValue(document), "invalid_provenance_field");
  });

  it("rejects an invented Source Claim field", () => {
    const document = cloneFixture();
    const target = document.sourceClaims[0].target as MutableRecord;
    target.fieldPath = "inventedFact";
    expectFailure(validateCatalogValue(document), "invalid_claim_field");
  });

  it("rejects a claim for an optional field absent from its target", () => {
    const document = cloneFixture();
    const claim = structuredClone(document.sourceClaims[0]);
    claim.id = "claim_fixture_absent_notes";
    claim.target = {
      entityType: "requirement",
      entityId: "req_fixture_board",
      fieldPath: "notes",
    };
    document.sourceClaims.push(claim);
    expectFailure(validateCatalogValue(document), "claim_target_absent_field");
  });

  it("requires provenance for an optional substantive field when present", () => {
    const document = cloneFixture();
    document.requirements[0].notes = "Test-only equipment note.";
    expectFailure(validateCatalogValue(document), "missing_provenance");
  });

  it("rejects a dangling Source Claim", () => {
    const document = cloneFixture();
    document.sourceClaims = [];
    expectFailure(validateCatalogValue(document), "dangling_claim");
  });

  it("rejects an unapproved claim supporting a published field", () => {
    const document = cloneFixture();
    document.sourceClaims[0].verificationState = "pending";
    delete document.sourceClaims[0].verifiedAt;
    delete document.sourceClaims[0].verifiedBy;
    expectFailure(validateCatalogValue(document), "claim_not_approved");
  });

  it("rejects a Source Claim targeting the wrong entity", () => {
    const document = cloneFixture();
    const target = document.sourceClaims[0].target as MutableRecord;
    target.entityId = "edition_other";
    expectFailure(validateCatalogValue(document), "invalid_claim_target");
    expectFailure(validateCatalogValue(document), "claim_target_mismatch");
  });

  it("rejects BoardGameGeek as a blocked source", () => {
    const document = cloneFixture();
    document.sourceClaims[0].canonicalUrl = "https://boardgamegeek.com/example";
    expectFailure(validateCatalogValue(document), "blocked_source");
  });

  it("permits a published physical-instructions option with no external destination", () => {
    const result = validateCatalogValue(cloneFixture());
    expect(result.success).toBe(true);
  });

  it("rejects an unreviewed external destination", () => {
    const document = cloneFixture();
    document.accessOptions[0].destination = {
      state: "external",
      destinationId: "dest_fixture",
    };
    document.accessOptions[0].provider = {
      state: "known",
      value: "Example Provider",
    };
    document.destinations.push({
      id: "dest_fixture",
      url: "https://play.example.com/game",
      destinationType: "official_play",
      provider: "Example Provider",
      publicDisplayDomain: "example.com",
      reviewState: "pending",
      redirectPolicy: "same_domain",
      publicationStatus: "published",
      provenance: [
        { fieldPath: "url", basis: { kind: "original" } },
        { fieldPath: "destinationType", basis: { kind: "original" } },
        { fieldPath: "provider", basis: { kind: "original" } },
        { fieldPath: "publicDisplayDomain", basis: { kind: "original" } },
        { fieldPath: "redirectPolicy", basis: { kind: "original" } },
      ],
    });
    expectFailure(validateCatalogValue(document), "destination_not_approved");
  });

  it.each([
    [
      "mediaAsset",
      "mediaAssets",
      "media_fixture",
      "claim_fixture_media_rights",
    ],
    ["rulesItem", "rulesItems", "rules_fixture", "claim_fixture_rules_rights"],
  ] as const)(
    "accepts an exact %s.rights Source Claim target",
    (entityType, collection, entityId, claimId) => {
      const document = cloneFixture();
      const claim = structuredClone(document.sourceClaims[0]);
      claim.id = claimId;
      claim.target = { entityType, entityId, fieldPath: "rights" };
      document.sourceClaims.push(claim);
      document[collection][0].rights = { kind: "source_claim", claimId };
      expect(validateCatalogValue(document).success).toBe(true);
    },
  );
});

describe("media and rules location safety", () => {
  it("fails closed instead of throwing for a malformed Destination URL", () => {
    const parse = () =>
      DestinationSchema.safeParse({
        id: "dest_malformed",
        url: "/relative",
        destinationType: "other",
        provider: "Fixture Provider",
        publicDisplayDomain: "example.com",
        reviewState: "pending",
        redirectPolicy: "no_redirects",
        publicationStatus: "draft",
        provenance: [],
      });
    expect(parse).not.toThrow();
    expect(parse().success).toBe(false);
  });

  it.each([
    { kind: "local", path: "images/fixture.svg" },
    { kind: "local", path: "/images/./fixture.svg" },
    { kind: "local", path: "/images/../secret.svg" },
    { kind: "local", path: "/images\\fixture.svg" },
    { kind: "local", path: "https://example.com/fixture.svg" },
    { kind: "local", url: "https://example.com/fixture.svg" },
    { kind: "external_reference", url: "http://example.com/fixture.svg" },
    { kind: "external_embed", url: "https://user:pass@example.com/video" },
    { kind: "external_reference", url: "/images/fixture.svg" },
  ])("rejects unsafe or mismatched media location %#", (location) => {
    const document = cloneFixture();
    document.mediaAssets[0].location = location;
    expectFailure(
      validateCatalogValue(document),
      undefined,
      "mediaAssets.0.location",
    );
  });

  it("accepts credential-free HTTPS external media", () => {
    const document = cloneFixture();
    document.mediaAssets[0].location = {
      kind: "external_reference",
      url: "https://media.example.com/fixture.svg",
    };
    expect(validateCatalogValue(document).success).toBe(true);
  });

  it.each([
    { kind: "external_reference", url: "http://example.com/rules" },
    { kind: "external_reference", url: "https://user:pass@example.com/rules" },
    { kind: "external_reference", url: "/rules/fixture" },
    { kind: "external_reference", url: "C:\\rules\\fixture.txt" },
    { kind: "external_reference", text: "Not a URL" },
  ])("rejects unsafe or mismatched rules reference %#", (content) => {
    const document = cloneFixture();
    document.rulesItems[0].content = content;
    expectFailure(
      validateCatalogValue(document),
      undefined,
      "rulesItems.0.content",
    );
  });

  it("keeps an original rules summary as authored text and accepts safe HTTPS references", () => {
    const original = cloneFixture();
    original.rulesItems[0].content = {
      kind: "original_summary",
      text: "Move one test piece, then pass the turn.",
    };
    expect(validateCatalogValue(original).success).toBe(true);

    const external = cloneFixture();
    external.rulesItems[0].content = {
      kind: "external_reference",
      url: "https://rules.example.com/fixture",
    };
    expect(validateCatalogValue(external).success).toBe(true);
  });
});

describe("publication review evidence", () => {
  it.each([
    "games",
    "editions",
    "playModes",
    "accessOptions",
    "requirements",
    "mediaAssets",
    "rulesItems",
  ] as const)(
    "requires approved review evidence for published %s",
    (collection) => {
      const missing = cloneFixture();
      delete missing[collection][0].publicationReview;
      expectFailure(
        validateCatalogValue(missing),
        undefined,
        `${collection}.0.publicationReview`,
      );

      const pending = cloneFixture();
      pending[collection][0].publicationReview = { state: "pending" };
      expectFailure(
        validateCatalogValue(pending),
        "publication_review_required",
      );
    },
  );

  it.each(["draft", "review"])(
    "allows pending review evidence for %s records",
    (publicationStatus) => {
      const document = cloneFixture();
      document.mediaAssets[0].publicationStatus = publicationStatus;
      document.mediaAssets[0].publicationReview = { state: "pending" };
      expect(validateCatalogValue(document).success).toBe(true);
    },
  );
});

describe("catalog CLI", () => {
  it("passes the production catalog and exits nonzero for an invalid fixture", () => {
    const valid = spawnSync(process.execPath, ["scripts/validate-catalog.ts"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    expect(valid.status).toBe(0);
    expect(valid.stdout).toContain("Catalog validation passed");

    const invalid = spawnSync(
      process.execPath,
      [
        "scripts/validate-catalog.ts",
        "--file",
        resolve(fixtureDirectory, "invalid-missing-access-option.json"),
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    expect(invalid.status).not.toBe(0);
    expect(invalid.stderr).toContain("schema.too_small");
  });
});
