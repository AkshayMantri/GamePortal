import type { CatalogDocument } from "../catalog/schema.ts";

export type PublicFilterOption = Readonly<{
  code: string;
  label: string;
}>;

export type FindFilterOptions = Readonly<{
  devices: readonly PublicFilterOption[];
  equipment: readonly PublicFilterOption[];
  regions: readonly PublicFilterOption[];
  languages: readonly PublicFilterOption[];
  hasReviewedAvailability: boolean;
}>;

type Publishable = {
  publicationStatus: "draft" | "review" | "published";
  publicationReview: { state: "pending" } | { state: "approved" };
};

const DEVICE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  computer: "Computer",
  phone: "Phone",
  shared_display: "Shared display",
  tablet: "Tablet",
});

const EQUIPMENT_LABELS: Readonly<Record<string, string>> = Object.freeze({
  chess_set: "Chess set",
  go_set: "Go set",
  paper_and_pencil: "Paper and pencil",
  standard_deck: "Standard deck of cards",
});

const REGION_LABELS: Readonly<Record<string, string>> = Object.freeze({
  CA: "Canada",
  GB: "United Kingdom",
  IN: "India",
  US: "United States",
});

function isPublishedApproved(value: Publishable): boolean {
  return (
    value.publicationStatus === "published" &&
    value.publicationReview.state === "approved"
  );
}

export function canonicalizeLanguageTag(value: string): string | null {
  try {
    const canonical = Intl.getCanonicalLocales(value);
    return canonical.length === 1 ? (canonical[0] ?? null) : null;
  } catch {
    return null;
  }
}

function languageLabel(code: string): string | null {
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? null;
  } catch {
    return null;
  }
}

function toOptions(
  codes: ReadonlySet<string>,
  labels: Readonly<Record<string, string>>,
): readonly PublicFilterOption[] {
  return Object.freeze(
    [...codes]
      .flatMap((code) => {
        const label = labels[code];
        return label ? [{ code, label }] : [];
      })
      .sort((left, right) => left.code.localeCompare(right.code, "en"))
      .map((option) => Object.freeze(option)),
  );
}

export function buildFindFilterOptions(
  catalog: CatalogDocument,
): FindFilterOptions {
  const editions = new Map(catalog.editions.map((item) => [item.id, item]));
  const modes = new Map(catalog.playModes.map((item) => [item.id, item]));
  const accessOptions = new Map(
    catalog.accessOptions.map((item) => [item.id, item]),
  );
  const requirements = new Map(
    catalog.requirements.map((item) => [item.id, item]),
  );
  const destinations = new Map(
    catalog.destinations.map((item) => [item.id, item]),
  );

  const deviceCodes = new Set<string>();
  const equipmentCodes = new Set<string>();
  const regionCodes = new Set<string>();
  const languageCodes = new Set<string>();
  let hasReviewedAvailability = false;

  for (const game of catalog.games.filter(isPublishedApproved)) {
    for (const editionId of game.editionIds) {
      const edition = editions.get(editionId);
      if (
        !edition ||
        edition.gameId !== game.id ||
        !isPublishedApproved(edition)
      ) {
        continue;
      }

      for (const modeId of edition.playModeIds) {
        const mode = modes.get(modeId);
        if (
          !mode ||
          mode.editionId !== edition.id ||
          !isPublishedApproved(mode)
        ) {
          continue;
        }

        for (const accessOptionId of mode.accessOptionIds) {
          const accessOption = accessOptions.get(accessOptionId);
          if (
            !accessOption ||
            accessOption.playModeId !== mode.id ||
            !accessOption.playable ||
            !isPublishedApproved(accessOption)
          ) {
            continue;
          }

          for (const requirementId of accessOption.requirementIds) {
            const requirement = requirements.get(requirementId);
            if (
              !requirement ||
              requirement.accessOptionId !== accessOption.id ||
              !isPublishedApproved(requirement)
            ) {
              continue;
            }
            if (
              requirement.requirementType === "device" &&
              DEVICE_LABELS[requirement.itemCode]
            ) {
              deviceCodes.add(requirement.itemCode);
            }
            if (
              requirement.requirementType === "equipment" &&
              EQUIPMENT_LABELS[requirement.itemCode]
            ) {
              equipmentCodes.add(requirement.itemCode);
            }
          }

          if (
            accessOption.regions.state === "known" &&
            accessOption.regions.scope === "allowlist"
          ) {
            for (const code of accessOption.regions.regions) {
              if (REGION_LABELS[code]) regionCodes.add(code);
            }
          }

          if (
            edition.languages.state === "known" &&
            accessOption.languages.state === "known"
          ) {
            const accessLanguages = new Set(
              accessOption.languages.tags
                .map(canonicalizeLanguageTag)
                .filter((tag): tag is string => tag !== null),
            );
            for (const tag of edition.languages.tags) {
              const canonical = canonicalizeLanguageTag(tag);
              if (
                canonical &&
                accessLanguages.has(canonical) &&
                languageLabel(canonical)
              ) {
                languageCodes.add(canonical);
              }
            }
          }

          if (accessOption.destination.state === "external") {
            const destination = destinations.get(
              accessOption.destination.destinationId,
            );
            if (
              destination?.publicationStatus === "published" &&
              destination.reviewState === "approved"
            ) {
              hasReviewedAvailability = true;
            }
          }
        }
      }
    }
  }

  const languages = Object.freeze(
    [...languageCodes]
      .map((code) => ({ code, label: languageLabel(code)! }))
      .sort((left, right) => left.code.localeCompare(right.code, "en"))
      .map((option) => Object.freeze(option)),
  );

  return Object.freeze({
    devices: toOptions(deviceCodes, DEVICE_LABELS),
    equipment: toOptions(equipmentCodes, EQUIPMENT_LABELS),
    regions: toOptions(regionCodes, REGION_LABELS),
    languages,
    hasReviewedAvailability,
  });
}

export function optionLabel(
  options: readonly PublicFilterOption[],
  code: string,
): string | null {
  return options.find((option) => option.code === code)?.label ?? null;
}
