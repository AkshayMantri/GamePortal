export const PARTY_SIZE_MIN = 1;
export const PARTY_SIZE_MAX = 99;
export const PARTY_SIZE_QUICK_CHOICES = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export type PartySizeErrorCode =
  "required" | "not_integer" | "below_minimum" | "above_maximum";

export type PartySizeState =
  | { status: "unset" }
  | { status: "valid"; value: number }
  | { status: "invalid"; input: string; error: PartySizeErrorCode };

const plainSignedInteger = /^-?\d+$/;

function invalid(input: string, error: PartySizeErrorCode): PartySizeState {
  return { status: "invalid", input, error };
}

function validateInteger(value: number, input: string): PartySizeState {
  if (value < PARTY_SIZE_MIN) return invalid(input, "below_minimum");
  if (value > PARTY_SIZE_MAX) return invalid(input, "above_maximum");
  return { status: "valid", value };
}

export function parsePartySize(input: unknown): PartySizeState {
  if (typeof input === "number") {
    if (!Number.isFinite(input) || !Number.isInteger(input)) {
      return invalid(String(input), "not_integer");
    }
    return validateInteger(input, String(input));
  }

  if (typeof input !== "string") {
    return invalid(String(input ?? ""), "not_integer");
  }

  const normalized = input.trim();
  if (normalized === "") return invalid(input, "required");
  if (!plainSignedInteger.test(normalized)) {
    return invalid(input, "not_integer");
  }

  return validateInteger(Number(normalized), input);
}

export function unsetPartySize(): PartySizeState {
  return { status: "unset" };
}

export function partySizeErrorMessage(error: PartySizeErrorCode): string {
  switch (error) {
    case "required":
      return "Enter a party size from 1 to 99.";
    case "not_integer":
      return "Party size must be a whole number from 1 to 99.";
    case "below_minimum":
      return "Party size must be at least 1.";
    case "above_maximum":
      return "Party size must be no more than 99.";
  }
}

export function formatPlayerCount(value: number): string {
  return `${value} ${value === 1 ? "player" : "players"}`;
}

export function partySizeReceipt(state: PartySizeState): string {
  if (state.status === "valid") {
    return `Party size: ${formatPlayerCount(state.value)}.`;
  }
  if (state.status === "invalid") {
    return "Party size not set.";
  }
  return "No party size selected.";
}

export function partySizeAnnouncement(state: PartySizeState): string {
  if (state.status === "valid") {
    return `Party size set to ${formatPlayerCount(state.value)}.`;
  }
  if (state.status === "invalid") {
    return partySizeErrorMessage(state.error);
  }
  return "";
}
