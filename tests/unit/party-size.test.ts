import { describe, expect, it } from "vitest";

import {
  formatPlayerCount,
  parsePartySize,
  partySizeAnnouncement,
  partySizeErrorMessage,
  partySizeReceipt,
  PARTY_SIZE_QUICK_CHOICES,
  unsetPartySize,
} from "../../src/find/party-size";

describe("party-size parsing", () => {
  it("keeps the quick choices exact and ordered", () => {
    expect(PARTY_SIZE_QUICK_CHOICES).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it.each([1, 8, 9, 25, 99])("accepts integer number %s", (input) => {
    expect(parsePartySize(input)).toEqual({ status: "valid", value: input });
  });

  it.each([
    [" 09 ", 9],
    ["25", 25],
    ["099", 99],
  ])("normalizes plain decimal string %j", (input, value) => {
    expect(parsePartySize(input)).toEqual({ status: "valid", value });
  });

  it.each([
    ["", "required"],
    ["   ", "required"],
    [0, "below_minimum"],
    ["-4", "below_minimum"],
    [100, "above_maximum"],
    ["100", "above_maximum"],
    [1.5, "not_integer"],
    ["1.5", "not_integer"],
    ["1e2", "not_integer"],
    ["+4", "not_integer"],
    ["four", "not_integer"],
    [Number.NaN, "not_integer"],
    [Number.POSITIVE_INFINITY, "not_integer"],
    [undefined, "not_integer"],
  ] as const)("rejects %j with stable code %s", (input, error) => {
    expect(parsePartySize(input)).toMatchObject({ status: "invalid", error });
  });
});

describe("party-size presentation state", () => {
  it("starts honestly unset and never invents a default", () => {
    const state = unsetPartySize();
    expect(state).toEqual({ status: "unset" });
    expect(partySizeReceipt(state)).toBe("No party size selected.");
    expect(partySizeAnnouncement(state)).toBe("");
  });

  it("formats singular and plural receipts and announcements", () => {
    expect(formatPlayerCount(1)).toBe("1 player");
    expect(formatPlayerCount(25)).toBe("25 players");
    expect(partySizeReceipt(parsePartySize(1))).toBe("Party size: 1 player.");
    expect(partySizeAnnouncement(parsePartySize(25))).toBe(
      "Party size set to 25 players.",
    );
  });

  it.each([
    ["required", "Enter a party size from 1 to 99."],
    ["not_integer", "Party size must be a whole number from 1 to 99."],
    ["below_minimum", "Party size must be at least 1."],
    ["above_maximum", "Party size must be no more than 99."],
  ] as const)("maps %s to stable user-facing copy", (code, message) => {
    expect(partySizeErrorMessage(code)).toBe(message);
  });
});
