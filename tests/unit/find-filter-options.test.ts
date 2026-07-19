import { describe, expect, it } from "vitest";

import catalogValue from "../../catalog/catalog.json";
import completeFixture from "../fixtures/catalog/filter-options-complete.json";
import { buildFindFilterOptions } from "../../src/find/filter-options";
import { validateCatalogValue } from "../../src/catalog/validate";

describe("publication-safe Find option registry", () => {
  it("projects only the current complete production chains", () => {
    const validation = validateCatalogValue(catalogValue);
    expect(validation.success).toBe(true);
    if (!validation.success) return;

    expect(buildFindFilterOptions(validation.data)).toEqual({
      devices: [],
      equipment: [
        { code: "chess_set", label: "Chess set" },
        { code: "go_set", label: "Go set" },
      ],
      regions: [],
      languages: [{ code: "en", label: "English" }],
      hasReviewedAvailability: false,
    });
  });

  it("does not expose catalog notes, sources, URLs, operators, or providers", () => {
    const validation = validateCatalogValue(catalogValue);
    if (!validation.success)
      throw new Error("Production fixture must validate");
    const serialized = JSON.stringify(buildFindFilterOptions(validation.data));
    for (const forbidden of [
      "sourceClaim",
      "canonicalUrl",
      "reviewedBy",
      "operator",
      "Self-provided materials",
      "not_verified",
      "note",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("activates every data-gated section from one complete reviewed fixture", () => {
    const validation = validateCatalogValue(completeFixture);
    expect(validation.success).toBe(true);
    if (!validation.success) return;

    expect(buildFindFilterOptions(validation.data)).toEqual({
      devices: [
        { code: "computer", label: "Computer" },
        { code: "phone", label: "Phone" },
      ],
      equipment: [
        { code: "chess_set", label: "Chess set" },
        { code: "go_set", label: "Go set" },
      ],
      regions: [
        { code: "CA", label: "Canada" },
        { code: "US", label: "United States" },
      ],
      languages: [{ code: "fr-CA", label: "Canadian French" }],
      hasReviewedAvailability: true,
    });
  });

  it("drops values when any owning publication gate is closed", () => {
    const validation = validateCatalogValue(completeFixture);
    if (!validation.success) throw new Error("Complete fixture must validate");
    const hidden = structuredClone(validation.data);
    hidden.accessOptions[0]!.publicationStatus = "draft";
    hidden.accessOptions[0]!.publicationReview = { state: "pending" };
    expect(buildFindFilterOptions(hidden)).toEqual({
      devices: [],
      equipment: [],
      regions: [],
      languages: [],
      hasReviewedAvailability: false,
    });
  });
});
