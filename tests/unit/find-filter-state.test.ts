import { describe, expect, it } from "vitest";

import type { FindFilterOptions } from "../../src/find/filter-options";
import {
  activeFilterCount,
  activeNonPartyFilterCount,
  canonicalFindUrl,
  clearFindFilters,
  decodeFindFilters,
  defaultFindFilterState,
  encodeFindFilterState,
  FIND_MAX_PARAMETERS,
  findFilterStatesEqual,
  findFilterSummary,
  normalizeFindFilterState,
  removeFindFilter,
  type FindFilterState,
} from "../../src/find/filter-state";

const options: FindFilterOptions = {
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
  languages: [
    { code: "en", label: "English" },
    { code: "fr-CA", label: "Canadian French" },
  ],
  hasReviewedAvailability: true,
};

const completeState: FindFilterState = {
  partySize: 4,
  playMode: "remote",
  timeBudgetMinutes: 45,
  youngestAge: 8,
  devices: {
    kind: "specified",
    items: [
      { code: "phone", quantity: 2 },
      { code: "computer", quantity: 1 },
    ],
  },
  equipment: { kind: "none" },
  region: "CA",
  playLanguage: "fr-CA",
  accountTolerance: "host_only_or_none",
  installTolerance: "browser_only",
  availabilityPolicy: "recently_checked",
};

describe("canonical Find filter state", () => {
  it("defines the exact default and omits every default from /find", () => {
    const state = defaultFindFilterState();
    expect(state).toEqual({
      partySize: null,
      playMode: "any",
      timeBudgetMinutes: null,
      youngestAge: null,
      devices: { kind: "unconstrained" },
      equipment: { kind: "unconstrained" },
      region: null,
      playLanguage: null,
      accountTolerance: "any",
      installTolerance: "any",
      availabilityPolicy: "include_unknown",
    });
    expect(Object.isFrozen(state)).toBe(true);
    expect(encodeFindFilterState(state, options).toString()).toBe("");
    expect(canonicalFindUrl(state, options)).toBe("/find");
  });

  it("serializes all eleven keys in the frozen order", () => {
    expect(canonicalFindUrl(completeState, options)).toBe(
      "/find?players=4&mode=remote&time=45&age=8&device=computer%3A1&device=phone%3A2&equipment=none&region=CA&lang=fr-CA&accounts=host&install=browser&availability=checked",
    );
  });

  it.each([
    ["players", 1, 99],
    ["time", 1, 1440],
    ["age", 0, 120],
  ] as const)("round trips %s boundaries", (key, minimum, maximum) => {
    for (const value of [minimum, maximum]) {
      const decoded = decodeFindFilters(`${key}=${value}`, options);
      expect(encodeFindFilterState(decoded.state, options).toString()).toBe(
        `${key}=${value}`,
      );
    }
  });

  it("round trips a complete normalized state", () => {
    const normalized = normalizeFindFilterState(completeState, options);
    const encoded = encodeFindFilterState(normalized, options);
    const decoded = decodeFindFilters(encoded, options);
    expect(decoded.state).toEqual(normalized);
    expect(decoded.issues).toEqual([]);
    expect(findFilterStatesEqual(decoded.state, normalized, options)).toBe(
      true,
    );
  });

  it("canonicalizes benign representations and identical duplicates", () => {
    const decoded = decodeFindFilters(
      "lang=FR-ca&players=004&mode=remote&players=4&region=ca&device=phone%3A02&device=phone%3A2",
      options,
    );
    expect(decoded.issues).toEqual([]);
    expect(decoded.canonicalSearch).toBe(
      "players=4&mode=remote&device=phone%3A2&region=CA&lang=fr-CA",
    );
  });

  it("recovers valid siblings while rejecting conflicting scalars", () => {
    const decoded = decodeFindFilters(
      "players=4&players=5&mode=remote&age=8",
      options,
    );
    expect(decoded.state.partySize).toBeNull();
    expect(decoded.state.playMode).toBe("remote");
    expect(decoded.state.youngestAge).toBe(8);
    expect(decoded.issues).toContainEqual({
      code: "conflicting_values",
      key: "players",
    });
    expect(decoded.canonicalSearch).toBe("mode=remote&age=8");
  });

  it.each([
    ["device=none&device=phone%3A1", "inventory_conflict"],
    ["device=phone%3A1&device=phone%3A2", "inventory_conflict"],
    ["device=unknown%3A1", "unsupported_value"],
    ["device=phone", "invalid_value"],
    ["device=phone%3A0", "invalid_value"],
    ["device=phone%3A100", "invalid_value"],
  ] as const)(
    "rejects inventory %s without poisoning siblings",
    (search, code) => {
      const decoded = decodeFindFilters(`${search}&mode=remote`, options);
      expect(decoded.state.devices).toEqual({ kind: "unconstrained" });
      expect(decoded.state.playMode).toBe("remote");
      expect(decoded.issues).toContainEqual({ code, key: "device" });
    },
  );

  it("accepts twenty distinct inventory items and rejects twenty-one", () => {
    const manyOptions: FindFilterOptions = {
      ...options,
      devices: Array.from({ length: 21 }, (_, index) => ({
        code: `device_${String(index).padStart(2, "0")}`,
        label: `Device ${index}`,
      })),
    };
    const twenty = new URLSearchParams();
    for (let index = 0; index < 20; index += 1) {
      twenty.append("device", `device_${String(index).padStart(2, "0")}:1`);
    }
    expect(decodeFindFilters(twenty, manyOptions).issues).toEqual([]);
    twenty.append("device", "device_20:1");
    expect(decodeFindFilters(twenty, manyOptions).issues).toContainEqual({
      code: "too_many_items",
      key: "device",
    });
  });

  it("bounds query count and value length without retaining hostile raw data", () => {
    const excessive = new URLSearchParams();
    excessive.append("mode", "remote");
    for (let index = 0; index <= FIND_MAX_PARAMETERS; index += 1) {
      excessive.append(`unknown-${index}`, "x");
    }
    const decoded = decodeFindFilters(excessive, options);
    expect(decoded.state.playMode).toBe("remote");
    expect(decoded.issues).toContainEqual({
      code: "too_many_parameters",
      key: "unknown",
    });
    expect(JSON.stringify(decoded.issues)).not.toContain("unknown-64");

    const hostile = "<script>alert('private')</script>".repeat(8);
    const oversized = decodeFindFilters(
      `lang=${encodeURIComponent(hostile)}`,
      options,
    );
    expect(oversized.issues).toEqual([{ code: "value_too_long", key: "lang" }]);
    expect(JSON.stringify(oversized)).not.toContain("private");
  });

  it("removes unknown keys and rejects unsupported registry values", () => {
    const decoded = decodeFindFilters(
      "utm_source=private&region=ZZ&lang=de&mode=in-person",
      options,
    );
    expect(decoded.state.playMode).toBe("in_person");
    expect(decoded.state.region).toBeNull();
    expect(decoded.state.playLanguage).toBeNull();
    expect(decoded.canonicalSearch).toBe("mode=in-person");
    expect(decoded.issues).toHaveLength(3);
  });

  it("rejects availability state when no reviewed Destination is applicable", () => {
    const decoded = decodeFindFilters("availability=checked&mode=remote", {
      ...options,
      hasReviewedAvailability: false,
    });
    expect(decoded.state.availabilityPolicy).toBe("include_unknown");
    expect(decoded.state.playMode).toBe("remote");
    expect(decoded.issues).toEqual([
      { code: "invalid_value", key: "availability" },
    ]);
  });
});

describe("summary, count, removal, and clear", () => {
  it("orders a complete summary by canonical URL order", () => {
    const summary = findFilterSummary(completeState, options);
    expect(summary.map(({ key }) => key)).toEqual([
      "partySize",
      "playMode",
      "timeBudgetMinutes",
      "youngestAge",
      "devices",
      "equipment",
      "region",
      "playLanguage",
      "accountTolerance",
      "installTolerance",
      "availabilityPolicy",
    ]);
    expect(summary.map(({ label }) => label)).toEqual([
      "4 players",
      "Remote",
      "Up to 45 minutes",
      "Youngest player: 8",
      "Devices: 1 computer and 2 phones",
      "No equipment available",
      "Region: Canada",
      "Play language: Canadian French",
      "Host account acceptable",
      "Browser only",
      "Recently checked links",
    ]);
    expect(
      summary.every(({ removeLabel }) => removeLabel.startsWith("Remove ")),
    ).toBe(true);
    expect(activeFilterCount(completeState)).toBe(11);
    expect(activeNonPartyFilterCount(completeState)).toBe(10);
  });

  it("removes one field without changing siblings and clears all", () => {
    const removed = removeFindFilter(completeState, "playMode", options);
    expect(removed.playMode).toBe("any");
    expect(removed.partySize).toBe(4);
    expect(activeFilterCount(removed)).toBe(10);
    expect(clearFindFilters()).toEqual(defaultFindFilterState());
  });
});
