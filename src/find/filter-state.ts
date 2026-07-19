import { formatPlayerCount, parsePartySize } from "./party-size.ts";
import {
  canonicalizeLanguageTag,
  optionLabel,
  type FindFilterOptions,
  type PublicFilterOption,
} from "./filter-options.ts";

export const FIND_QUERY_KEYS = [
  "players",
  "mode",
  "time",
  "age",
  "device",
  "equipment",
  "region",
  "lang",
  "accounts",
  "install",
  "availability",
] as const;

export const FIND_MAX_PARAMETERS = 64;
export const FIND_MAX_VALUE_LENGTH = 128;
export const FIND_MAX_INVENTORY_ITEMS = 20;

export type FindQueryKey = (typeof FIND_QUERY_KEYS)[number];
export type PlayMode = "any" | "in_person" | "remote";
export type AccountTolerance = "any" | "none" | "host_only_or_none";
export type InstallTolerance = "any" | "browser_only" | "host_only_or_browser";
export type AvailabilityPolicy =
  "include_unknown" | "recently_checked" | "show_all";

export type InventoryItem = Readonly<{ code: string; quantity: number }>;
export type InventoryConstraint =
  | Readonly<{ kind: "unconstrained" }>
  | Readonly<{ kind: "none" }>
  | Readonly<{ kind: "specified"; items: readonly InventoryItem[] }>;

export type FindFilterState = Readonly<{
  partySize: number | null;
  playMode: PlayMode;
  timeBudgetMinutes: number | null;
  youngestAge: number | null;
  devices: InventoryConstraint;
  equipment: InventoryConstraint;
  region: string | null;
  playLanguage: string | null;
  accountTolerance: AccountTolerance;
  installTolerance: InstallTolerance;
  availabilityPolicy: AvailabilityPolicy;
}>;

export type FindFilterKey = keyof FindFilterState;

export type FindParseIssueCode =
  | "unknown_parameter"
  | "too_many_parameters"
  | "value_too_long"
  | "conflicting_values"
  | "invalid_value"
  | "unsupported_value"
  | "inventory_conflict"
  | "too_many_items";

export type FindParseIssue = Readonly<{
  code: FindParseIssueCode;
  key: FindQueryKey | "unknown";
}>;

export type DecodedFindFilters = Readonly<{
  state: FindFilterState;
  issues: readonly FindParseIssue[];
  canonicalSearch: string;
}>;

export type FindSummaryItem = Readonly<{
  key: FindFilterKey;
  label: string;
  removeLabel: string;
}>;

const UNCONSTRAINED: InventoryConstraint = Object.freeze({
  kind: "unconstrained",
});
const NONE: InventoryConstraint = Object.freeze({ kind: "none" });

function freezeInventory(inventory: InventoryConstraint): InventoryConstraint {
  if (inventory.kind !== "specified") return inventory;
  return Object.freeze({
    kind: "specified",
    items: Object.freeze(
      inventory.items
        .map(({ code, quantity }) => Object.freeze({ code, quantity }))
        .sort((left, right) => left.code.localeCompare(right.code, "en")),
    ),
  });
}

export function defaultFindFilterState(): FindFilterState {
  return Object.freeze({
    partySize: null,
    playMode: "any",
    timeBudgetMinutes: null,
    youngestAge: null,
    devices: UNCONSTRAINED,
    equipment: UNCONSTRAINED,
    region: null,
    playLanguage: null,
    accountTolerance: "any",
    installTolerance: "any",
    availabilityPolicy: "include_unknown",
  });
}

function validInteger(
  value: unknown,
  minimum: number,
  maximum: number,
): number | null {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= minimum &&
    value <= maximum
    ? value
    : null;
}

function normalizeInventory(
  value: InventoryConstraint,
  options: readonly PublicFilterOption[],
): InventoryConstraint {
  if (value.kind === "none") return NONE;
  if (value.kind !== "specified") return UNCONSTRAINED;

  const supported = new Set(options.map(({ code }) => code));
  const items = new Map<string, number>();
  for (const item of value.items) {
    if (
      !supported.has(item.code) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99 ||
      items.has(item.code)
    ) {
      return UNCONSTRAINED;
    }
    items.set(item.code, item.quantity);
  }
  if (items.size === 0 || items.size > FIND_MAX_INVENTORY_ITEMS) {
    return UNCONSTRAINED;
  }
  return freezeInventory({
    kind: "specified",
    items: [...items].map(([code, quantity]) => ({ code, quantity })),
  });
}

export function normalizeFindFilterState(
  value: FindFilterState,
  options: FindFilterOptions,
): FindFilterState {
  const party =
    value.partySize === null ? null : parsePartySize(value.partySize);
  const language =
    value.playLanguage === null
      ? null
      : canonicalizeLanguageTag(value.playLanguage);
  const languages = new Set(options.languages.map(({ code }) => code));
  const region = value.region?.toUpperCase() ?? null;
  const regions = new Set(options.regions.map(({ code }) => code));

  return Object.freeze({
    partySize: party?.status === "valid" ? party.value : null,
    playMode: ["any", "in_person", "remote"].includes(value.playMode)
      ? value.playMode
      : "any",
    timeBudgetMinutes:
      value.timeBudgetMinutes === null
        ? null
        : validInteger(value.timeBudgetMinutes, 1, 1440),
    youngestAge:
      value.youngestAge === null
        ? null
        : validInteger(value.youngestAge, 0, 120),
    devices: normalizeInventory(value.devices, options.devices),
    equipment: normalizeInventory(value.equipment, options.equipment),
    region: region && regions.has(region) ? region : null,
    playLanguage: language && languages.has(language) ? language : null,
    accountTolerance: ["any", "none", "host_only_or_none"].includes(
      value.accountTolerance,
    )
      ? value.accountTolerance
      : "any",
    installTolerance: ["any", "browser_only", "host_only_or_browser"].includes(
      value.installTolerance,
    )
      ? value.installTolerance
      : "any",
    availabilityPolicy: [
      "include_unknown",
      "recently_checked",
      "show_all",
    ].includes(value.availabilityPolicy)
      ? value.availabilityPolicy
      : "include_unknown",
  });
}

function integerFromUrl(
  value: string,
  minimum: number,
  maximum: number,
): number | null {
  if (!/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= minimum && number <= maximum
    ? number
    : null;
}

type ScalarResult<T> =
  | { status: "absent" }
  | { status: "valid"; value: T }
  | { status: "invalid"; code: FindParseIssueCode };

function scalar<T>(
  values: readonly string[],
  parse: (value: string) => T | null,
): ScalarResult<T> {
  if (values.length === 0) return { status: "absent" };
  if (values.some((value) => value.length > FIND_MAX_VALUE_LENGTH)) {
    return { status: "invalid", code: "value_too_long" };
  }
  const parsed = values.map(parse);
  if (parsed.some((value) => value === null)) {
    return { status: "invalid", code: "invalid_value" };
  }
  const normalized = parsed as T[];
  if (normalized.some((value) => value !== normalized[0])) {
    return { status: "invalid", code: "conflicting_values" };
  }
  return { status: "valid", value: normalized[0]! };
}

function enumParser<T extends string>(mapping: Readonly<Record<string, T>>) {
  return (value: string): T | null => mapping[value] ?? null;
}

function parseSupportedCode(
  value: string,
  options: readonly PublicFilterOption[],
  normalize: (value: string) => string | null,
): string | null {
  const normalized = normalize(value);
  return normalized && options.some(({ code }) => code === normalized)
    ? normalized
    : null;
}

function parseInventory(
  values: readonly string[],
  options: readonly PublicFilterOption[],
): ScalarResult<InventoryConstraint> {
  if (values.length === 0) return { status: "absent" };
  if (values.some((value) => value.length > FIND_MAX_VALUE_LENGTH)) {
    return { status: "invalid", code: "value_too_long" };
  }
  if (values.includes("none")) {
    return values.every((value) => value === "none")
      ? { status: "valid", value: NONE }
      : { status: "invalid", code: "inventory_conflict" };
  }

  const supported = new Set(options.map(({ code }) => code));
  const items = new Map<string, number>();
  for (const value of values) {
    const match = /^([a-z0-9]+(?:_[a-z0-9]+)*):(\d+)$/.exec(value);
    if (!match) return { status: "invalid", code: "invalid_value" };
    const code = match[1]!;
    const quantity = integerFromUrl(match[2]!, 1, 99);
    if (quantity === null) return { status: "invalid", code: "invalid_value" };
    if (!supported.has(code)) {
      return { status: "invalid", code: "unsupported_value" };
    }
    const previous = items.get(code);
    if (previous !== undefined && previous !== quantity) {
      return { status: "invalid", code: "inventory_conflict" };
    }
    items.set(code, quantity);
  }
  if (items.size > FIND_MAX_INVENTORY_ITEMS) {
    return { status: "invalid", code: "too_many_items" };
  }
  return {
    status: "valid",
    value: freezeInventory({
      kind: "specified",
      items: [...items].map(([code, quantity]) => ({ code, quantity })),
    }),
  };
}

export function decodeFindFilters(
  input: URLSearchParams | string,
  options: FindFilterOptions,
): DecodedFindFilters {
  const params =
    typeof input === "string"
      ? new URLSearchParams(input.startsWith("?") ? input.slice(1) : input)
      : input;
  const entries = [...params.entries()];
  const issues: FindParseIssue[] = [];
  const boundedEntries = entries.slice(0, FIND_MAX_PARAMETERS);
  if (entries.length > FIND_MAX_PARAMETERS) {
    issues.push({ code: "too_many_parameters", key: "unknown" });
  }

  const allowed = new Set<string>(FIND_QUERY_KEYS);
  const values = new Map<FindQueryKey, string[]>();
  for (const [key, value] of boundedEntries) {
    if (!allowed.has(key)) {
      issues.push({ code: "unknown_parameter", key: "unknown" });
      continue;
    }
    const typedKey = key as FindQueryKey;
    const list = values.get(typedKey) ?? [];
    list.push(value);
    values.set(typedKey, list);
  }

  const defaults = defaultFindFilterState();
  const draft: FindFilterState = {
    ...defaults,
    devices: defaults.devices,
    equipment: defaults.equipment,
  };

  const apply = <T>(
    key: FindQueryKey,
    result: ScalarResult<T>,
    assign: (value: T) => void,
  ) => {
    if (result.status === "valid") assign(result.value);
    if (result.status === "invalid") issues.push({ code: result.code, key });
  };

  apply(
    "players",
    scalar(values.get("players") ?? [], (value) => {
      const parsed = parsePartySize(value);
      return parsed.status === "valid" ? parsed.value : null;
    }),
    (value) => Object.assign(draft, { partySize: value }),
  );
  apply(
    "mode",
    scalar(
      values.get("mode") ?? [],
      enumParser({ "in-person": "in_person", remote: "remote" }),
    ),
    (value) => Object.assign(draft, { playMode: value }),
  );
  apply(
    "time",
    scalar(values.get("time") ?? [], (value) => integerFromUrl(value, 1, 1440)),
    (value) => Object.assign(draft, { timeBudgetMinutes: value }),
  );
  apply(
    "age",
    scalar(values.get("age") ?? [], (value) => integerFromUrl(value, 0, 120)),
    (value) => Object.assign(draft, { youngestAge: value }),
  );
  apply(
    "device",
    parseInventory(values.get("device") ?? [], options.devices),
    (value) => Object.assign(draft, { devices: value }),
  );
  apply(
    "equipment",
    parseInventory(values.get("equipment") ?? [], options.equipment),
    (value) => Object.assign(draft, { equipment: value }),
  );
  apply(
    "region",
    scalar(values.get("region") ?? [], (value) =>
      parseSupportedCode(value, options.regions, (candidate) => {
        const normalized = candidate.toUpperCase();
        return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
      }),
    ),
    (value) => Object.assign(draft, { region: value }),
  );
  apply(
    "lang",
    scalar(values.get("lang") ?? [], (value) =>
      parseSupportedCode(value, options.languages, canonicalizeLanguageTag),
    ),
    (value) => Object.assign(draft, { playLanguage: value }),
  );
  apply(
    "accounts",
    scalar(
      values.get("accounts") ?? [],
      enumParser({ none: "none", host: "host_only_or_none" }),
    ),
    (value) => Object.assign(draft, { accountTolerance: value }),
  );
  apply(
    "install",
    scalar(
      values.get("install") ?? [],
      enumParser({
        browser: "browser_only",
        host: "host_only_or_browser",
      }),
    ),
    (value) => Object.assign(draft, { installTolerance: value }),
  );
  apply(
    "availability",
    scalar(values.get("availability") ?? [], (value) =>
      options.hasReviewedAvailability
        ? enumParser({ checked: "recently_checked", all: "show_all" })(value)
        : null,
    ),
    (value) => Object.assign(draft, { availabilityPolicy: value }),
  );

  const state = normalizeFindFilterState(draft, options);
  return Object.freeze({
    state,
    issues: Object.freeze(issues.map((issue) => Object.freeze(issue))),
    canonicalSearch: encodeFindFilterState(state, options).toString(),
  });
}

function appendInventory(
  params: URLSearchParams,
  key: "device" | "equipment",
  inventory: InventoryConstraint,
): void {
  if (inventory.kind === "none") params.append(key, "none");
  if (inventory.kind === "specified") {
    for (const item of inventory.items) {
      params.append(key, `${item.code}:${item.quantity}`);
    }
  }
}

export function encodeFindFilterState(
  input: FindFilterState,
  options: FindFilterOptions,
): URLSearchParams {
  const state = normalizeFindFilterState(input, options);
  const params = new URLSearchParams();
  if (state.partySize !== null)
    params.append("players", String(state.partySize));
  if (state.playMode !== "any") {
    params.append(
      "mode",
      state.playMode === "in_person" ? "in-person" : "remote",
    );
  }
  if (state.timeBudgetMinutes !== null) {
    params.append("time", String(state.timeBudgetMinutes));
  }
  if (state.youngestAge !== null)
    params.append("age", String(state.youngestAge));
  appendInventory(params, "device", state.devices);
  appendInventory(params, "equipment", state.equipment);
  if (state.region !== null) params.append("region", state.region);
  if (state.playLanguage !== null) params.append("lang", state.playLanguage);
  if (state.accountTolerance !== "any") {
    params.append(
      "accounts",
      state.accountTolerance === "none" ? "none" : "host",
    );
  }
  if (state.installTolerance !== "any") {
    params.append(
      "install",
      state.installTolerance === "browser_only" ? "browser" : "host",
    );
  }
  if (state.availabilityPolicy !== "include_unknown") {
    params.append(
      "availability",
      state.availabilityPolicy === "recently_checked" ? "checked" : "all",
    );
  }
  return params;
}

export function canonicalFindUrl(
  state: FindFilterState,
  options: FindFilterOptions,
): string {
  const search = encodeFindFilterState(state, options).toString();
  return search ? `/find?${search}` : "/find";
}

export function findFilterStatesEqual(
  left: FindFilterState,
  right: FindFilterState,
  options: FindFilterOptions,
): boolean {
  return (
    encodeFindFilterState(left, options).toString() ===
    encodeFindFilterState(right, options).toString()
  );
}

export function activeFilterCount(state: FindFilterState): number {
  return (
    Number(state.partySize !== null) +
    Number(state.playMode !== "any") +
    Number(state.timeBudgetMinutes !== null) +
    Number(state.youngestAge !== null) +
    Number(state.devices.kind !== "unconstrained") +
    Number(state.equipment.kind !== "unconstrained") +
    Number(state.region !== null) +
    Number(state.playLanguage !== null) +
    Number(state.accountTolerance !== "any") +
    Number(state.installTolerance !== "any") +
    Number(state.availabilityPolicy !== "include_unknown")
  );
}

export function activeNonPartyFilterCount(state: FindFilterState): number {
  return activeFilterCount(state) - Number(state.partySize !== null);
}

function inventorySummary(
  label: "Devices" | "Equipment",
  value: InventoryConstraint,
  options: readonly PublicFilterOption[],
): string | null {
  if (value.kind === "unconstrained") return null;
  if (value.kind === "none") return `No ${label.toLowerCase()} available`;
  const items = [...value.items]
    .sort((left, right) => left.code.localeCompare(right.code, "en"))
    .map((item) => {
      const name = optionLabel(options, item.code) ?? "Item";
      const normalizedName = name.toLocaleLowerCase("en-US");
      return `${item.quantity} ${
        item.quantity === 1 ? normalizedName : `${normalizedName}s`
      }`;
    });
  return `${label}: ${items.join(items.length === 2 ? " and " : ", ")}`;
}

export function findFilterSummary(
  state: FindFilterState,
  options: FindFilterOptions,
): readonly FindSummaryItem[] {
  const items: FindSummaryItem[] = [];
  const add = (key: FindFilterKey, label: string) => {
    items.push({ key, label, removeLabel: `Remove ${label} filter` });
  };
  if (state.partySize !== null)
    add("partySize", formatPlayerCount(state.partySize));
  if (state.playMode !== "any") {
    add(
      "playMode",
      state.playMode === "in_person" ? "Together in person" : "Remote",
    );
  }
  if (state.timeBudgetMinutes !== null) {
    add("timeBudgetMinutes", `Up to ${state.timeBudgetMinutes} minutes`);
  }
  if (state.youngestAge !== null) {
    add("youngestAge", `Youngest player: ${state.youngestAge}`);
  }
  const devices = inventorySummary("Devices", state.devices, options.devices);
  if (devices) add("devices", devices);
  const equipment = inventorySummary(
    "Equipment",
    state.equipment,
    options.equipment,
  );
  if (equipment) add("equipment", equipment);
  if (state.region !== null) {
    add(
      "region",
      `Region: ${optionLabel(options.regions, state.region) ?? "Selected region"}`,
    );
  }
  if (state.playLanguage !== null) {
    add(
      "playLanguage",
      `Play language: ${optionLabel(options.languages, state.playLanguage) ?? "Selected language"}`,
    );
  }
  if (state.accountTolerance !== "any") {
    add(
      "accountTolerance",
      state.accountTolerance === "none"
        ? "No accounts"
        : "Host account acceptable",
    );
  }
  if (state.installTolerance !== "any") {
    add(
      "installTolerance",
      state.installTolerance === "browser_only"
        ? "Browser only"
        : "Host installation acceptable",
    );
  }
  if (state.availabilityPolicy !== "include_unknown") {
    add(
      "availabilityPolicy",
      state.availabilityPolicy === "recently_checked"
        ? "Recently checked links"
        : "Show all link statuses",
    );
  }
  return Object.freeze(items.map((item) => Object.freeze(item)));
}

export function removeFindFilter(
  state: FindFilterState,
  key: FindFilterKey,
  options: FindFilterOptions,
): FindFilterState {
  const defaults = defaultFindFilterState();
  return normalizeFindFilterState({ ...state, [key]: defaults[key] }, options);
}

export function clearFindFilters(): FindFilterState {
  return defaultFindFilterState();
}
