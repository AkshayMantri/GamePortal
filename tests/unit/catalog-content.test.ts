import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseCatalogJson } from "../../src/catalog/validate.ts";

const catalogPath = resolve(process.cwd(), "catalog/catalog.json");
const catalogResult = parseCatalogJson(
  readFileSync(catalogPath, "utf8"),
  "catalog/catalog.json",
);

if (!catalogResult.success) {
  throw new Error(
    catalogResult.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n"),
  );
}

const catalog = catalogResult.data;
const reviewRole = "GP-1-004 catalog review";

describe("production catalog proof set", () => {
  it("contains exactly two unique published Games and the expected records", () => {
    expect(catalog.contentState).toEqual({ kind: "populated" });
    expect(catalog.games.map((game) => game.canonicalTitle)).toEqual([
      "Chess",
      "Go",
    ]);
    expect(new Set(catalog.games.map((game) => game.id)).size).toBe(2);
    expect(
      catalog.games.every((game) => game.publicationStatus === "published"),
    ).toBe(true);
  });

  it("has one complete published physical chain per Game", () => {
    expect(catalog.editions).toHaveLength(2);
    expect(catalog.playModes).toHaveLength(2);
    expect(catalog.accessOptions).toHaveLength(2);
    expect(catalog.requirements).toHaveLength(2);

    for (const game of catalog.games) {
      const edition = catalog.editions.find(
        (candidate) => candidate.id === game.editionIds[0],
      );
      const mode = catalog.playModes.find(
        (candidate) => candidate.id === edition?.playModeIds[0],
      );
      const access = catalog.accessOptions.find(
        (candidate) => candidate.id === mode?.accessOptionIds[0],
      );
      const requirement = catalog.requirements.find(
        (candidate) => candidate.id === access?.requirementIds[0],
      );

      expect(edition?.publicationStatus).toBe("published");
      expect(edition?.variantKind).toBe("traditional");
      expect(mode?.publicationStatus).toBe("published");
      expect(mode?.mode).toBe("in_person");
      expect(mode?.synchrony).toBe("synchronous");
      expect(access?.publicationStatus).toBe("published");
      expect(access?.accessKind).toBe("physical_instructions");
      expect(access?.playable).toBe(true);
      expect(access?.provider).toEqual({
        state: "known",
        value: "Self-provided materials",
      });
      expect(access?.destination).toEqual({
        state: "none",
        reason: "not_required",
      });
      expect(requirement).toMatchObject({
        requirementType: "equipment",
        minimumQuantity: 1,
        scope: "per_group",
        mandatory: true,
        publicationStatus: "published",
      });
    }
  });

  it("supports only two players and keeps unverified age and time explicit", () => {
    for (const mode of catalog.playModes) {
      expect(mode.supportedPlayers).toEqual({
        state: "known",
        shape: { kind: "set", values: [2] },
      });
      expect(mode.time.setupOrAccess).toMatchObject({
        state: "unknown",
        reason: "not_verified",
      });
      expect(mode.time.teaching).toMatchObject({
        state: "unknown",
        reason: "not_verified",
      });
      expect(mode.time.play).toMatchObject({
        state: "unknown",
        reason: "not_verified",
      });
    }
    for (const edition of catalog.editions) {
      expect(edition.ageGuidance).toMatchObject({
        state: "unknown",
        reason: "not_verified",
      });
    }
  });

  it("publishes no Destinations or blocked source and keeps rule links safe", () => {
    expect(catalog.destinations).toEqual([]);
    expect(JSON.stringify(catalog).toLowerCase()).not.toContain(
      "boardgamegeek",
    );

    for (const rulesItem of catalog.rulesItems) {
      expect(rulesItem.content.kind).toBe("external_reference");
      if (rulesItem.content.kind !== "external_reference") continue;
      const url = new URL(rulesItem.content.url);
      expect(url.protocol).toBe("https:");
      expect(url.username).toBe("");
      expect(url.password).toBe("");
      expect(rulesItem.rights.kind).toBe("source_claim");
      if (rulesItem.rights.kind !== "source_claim") continue;
      const rightsClaimId = rulesItem.rights.claimId;
      const claim = catalog.sourceClaims.find(
        (candidate) => candidate.id === rightsClaimId,
      );
      expect(claim?.target).toEqual({
        entityType: "rulesItem",
        entityId: rulesItem.id,
        fieldPath: "rights",
      });
      expect(claim?.verificationState).toBe("approved");
    }
  });

  it("uses one authored neutral placeholder with game-specific alt text", () => {
    expect(catalog.mediaAssets).toHaveLength(2);
    expect(
      new Set(
        catalog.mediaAssets.map((media) =>
          media.location.kind === "local" ? media.location.path : "external",
        ),
      ),
    ).toEqual(new Set(["/media/placeholders/game-card.svg"]));

    for (const media of catalog.mediaAssets) {
      expect(media.altText).toContain(
        media.gameId === "game_chess" ? "Chess" : "Go",
      );
      expect(media.altText).toContain("does not depict gameplay");
      expect(media.intrinsicWidth).toBe(1200);
      expect(media.intrinsicHeight).toBe(800);
      expect(media.rights).toMatchObject({
        kind: "original",
        rightsBasis: "authored",
        attributionDuty: "none",
      });
    }
  });

  it("has transparent approved review and source verification evidence", () => {
    const reviewed = [
      ...catalog.games,
      ...catalog.editions,
      ...catalog.playModes,
      ...catalog.accessOptions,
      ...catalog.requirements,
      ...catalog.mediaAssets,
      ...catalog.rulesItems,
    ];
    expect(reviewed).toHaveLength(14);
    for (const entity of reviewed) {
      expect(entity.publicationReview).toMatchObject({
        state: "approved",
        reviewedBy: reviewRole,
      });
    }
    for (const claim of catalog.sourceClaims) {
      expect(claim).toMatchObject({
        verificationState: "approved",
        verifiedBy: reviewRole,
        publicationStatus: "published",
      });
      expect(claim.retrievedAt.startsWith("2026-07-17T")).toBe(true);
      expect(claim.rightsOrPermissionBasis.toLowerCase()).toContain(
        "reference-only",
      );
    }
  });

  it("documents all 18 unrepresented candidate slots", () => {
    const status = readFileSync(
      resolve(process.cwd(), "docs/catalog/SEED_STATUS.md"),
      "utf8",
    );
    const remaining = [
      "Checkers / Draughts",
      "Backgammon",
      "Nine Men’s Morris",
      "Ludo",
      "Snakes and Ladders",
      "Hearts",
      "Spades",
      "Euchre",
      "Crazy Eights",
      "Go Fish",
      "Gin Rummy",
      "Cribbage",
      "Charades",
      "Twenty Questions",
      "Telephone",
      "Categories",
      "Word Chain",
      "Two Truths and a Lie",
    ];
    for (const candidate of remaining) expect(status).toContain(candidate);
    expect(status).toContain("unverified and not represented");
    expect(catalog.games).toHaveLength(20 - remaining.length);
  });
});
