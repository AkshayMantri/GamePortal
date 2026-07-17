import { CatalogDocumentSchema, entityIdSchemas } from "./schema.ts";
import type { CatalogDocument, SourceClaim } from "./schema.ts";

export type CatalogIssue = {
  code: string;
  path: (string | number)[];
  message: string;
  source: string;
};

export type CatalogValidationResult =
  | { success: true; data: CatalogDocument; issues: [] }
  | { success: false; issues: CatalogIssue[] };

type EntityType = SourceClaim["target"]["entityType"];
type ProvenancedEntityType = Exclude<EntityType, "mediaAsset" | "rulesItem">;

// IDs, relationship references, publication workflow fields, slugs, and update
// timestamps are technical metadata. The lists below cover the authored or
// externally asserted top-level facts that may carry provenance.
const ALLOWED_PROVENANCE_FIELDS: Record<EntityType, readonly string[]> = {
  game: ["canonicalTitle", "sortTitle", "gameType", "summary", "tags"],
  edition: [
    "title",
    "variantKind",
    "publisherOrTradition",
    "ageGuidance",
    "languages",
    "regions",
  ],
  playMode: ["mode", "synchrony", "supportedPlayers", "time", "teamStructure"],
  accessOption: [
    "accessKind",
    "playable",
    "provider",
    "accountRequirement",
    "installationRequirement",
    "priceClassification",
    "regions",
    "languages",
    "destination",
  ],
  requirement: [
    "requirementType",
    "itemCode",
    "minimumQuantity",
    "scope",
    "mandatory",
    "notes",
  ],
  destination: [
    "url",
    "destinationType",
    "provider",
    "publicDisplayDomain",
    "redirectPolicy",
  ],
  mediaAsset: ["rights"],
  rulesItem: ["rights"],
};

const REQUIRED_PROVENANCE: Record<ProvenancedEntityType, readonly string[]> = {
  game: ["canonicalTitle", "sortTitle", "gameType", "summary", "tags"],
  edition: [
    "title",
    "variantKind",
    "publisherOrTradition",
    "ageGuidance",
    "languages",
    "regions",
  ],
  playMode: ["mode", "synchrony", "supportedPlayers", "time", "teamStructure"],
  accessOption: [
    "accessKind",
    "playable",
    "provider",
    "accountRequirement",
    "installationRequirement",
    "priceClassification",
    "regions",
    "languages",
    "destination",
  ],
  requirement: [
    "requirementType",
    "itemCode",
    "minimumQuantity",
    "scope",
    "mandatory",
  ],
  destination: [
    "url",
    "destinationType",
    "provider",
    "publicDisplayDomain",
    "redirectPolicy",
  ],
};

const OPTIONAL_PROVENANCE_FIELDS: Partial<
  Record<EntityType, readonly string[]>
> = {
  requirement: ["notes"],
};

export function parseCatalogJson(
  input: string,
  source = "<catalog>",
): CatalogValidationResult {
  let json: unknown;
  try {
    json = JSON.parse(input) as unknown;
  } catch (error) {
    return {
      success: false,
      issues: [
        {
          code: "invalid_json",
          path: [],
          message:
            error instanceof Error ? error.message : "Input is not valid JSON.",
          source,
        },
      ],
    };
  }

  return validateCatalogValue(json, source);
}

export function validateCatalogValue(
  input: unknown,
  source = "<catalog>",
): CatalogValidationResult {
  const parsed = CatalogDocumentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      issues: parsed.error.issues.map((issue) => ({
        code: `schema.${issue.code}`,
        path: issue.path.map((segment) =>
          typeof segment === "symbol"
            ? (segment.description ?? segment.toString())
            : segment,
        ),
        message: issue.message,
        source,
      })),
    };
  }

  const issues = validateCatalogSemantics(parsed.data, source);
  if (issues.length > 0) {
    return { success: false, issues };
  }

  return { success: true, data: parsed.data, issues: [] };
}

function validateCatalogSemantics(
  data: CatalogDocument,
  source: string,
): CatalogIssue[] {
  const issues: CatalogIssue[] = [];
  const add = (code: string, path: (string | number)[], message: string) => {
    issues.push({ code, path, message, source });
  };

  const collections = {
    game: data.games,
    edition: data.editions,
    playMode: data.playModes,
    accessOption: data.accessOptions,
    requirement: data.requirements,
    destination: data.destinations,
    sourceClaim: data.sourceClaims,
    mediaAsset: data.mediaAssets,
    rulesItem: data.rulesItems,
  } as const;

  for (const [name, collection] of Object.entries(collections)) {
    const seen = new Map<string, number>();
    collection.forEach((entity, index) => {
      const previous = seen.get(entity.id);
      if (previous !== undefined) {
        add(
          "duplicate_id",
          [`${name}s`, index, "id"],
          `Duplicate ${name} ID ${entity.id}; first used at index ${previous}.`,
        );
      } else {
        seen.set(entity.id, index);
      }
    });
  }

  const games = new Map(data.games.map((entity) => [entity.id, entity]));
  const editions = new Map(data.editions.map((entity) => [entity.id, entity]));
  const playModes = new Map(
    data.playModes.map((entity) => [entity.id, entity]),
  );
  const accessOptions = new Map(
    data.accessOptions.map((entity) => [entity.id, entity]),
  );
  const requirements = new Map(
    data.requirements.map((entity) => [entity.id, entity]),
  );
  const destinations = new Map(
    data.destinations.map((entity) => [entity.id, entity]),
  );
  const claims = new Map(
    data.sourceClaims.map((entity) => [entity.id, entity]),
  );
  const mediaAssets = new Map(
    data.mediaAssets.map((entity) => [entity.id, entity]),
  );
  const rulesItems = new Map(
    data.rulesItems.map((entity) => [entity.id, entity]),
  );

  const seenSlugs = new Map<string, number>();
  data.games.forEach((game, index) => {
    const previous = seenSlugs.get(game.slug);
    if (previous !== undefined) {
      add(
        "duplicate_slug",
        ["games", index, "slug"],
        `Duplicate Game slug ${game.slug}; first used at index ${previous}.`,
      );
    } else {
      seenSlugs.set(game.slug, index);
    }
  });

  const contentCount =
    data.games.length +
    data.editions.length +
    data.playModes.length +
    data.accessOptions.length +
    data.requirements.length +
    data.destinations.length +
    data.sourceClaims.length +
    data.mediaAssets.length +
    data.rulesItems.length;
  if (contentCount === 0 && data.contentState.kind !== "contract_only_empty") {
    add(
      "content_state_mismatch",
      ["contentState"],
      "An empty catalog must explicitly use contract_only_empty.",
    );
  }
  if (contentCount > 0 && data.contentState.kind !== "populated") {
    add(
      "content_state_mismatch",
      ["contentState"],
      "A catalog containing records must use the populated content state.",
    );
  }

  const reviewedCollections: Array<
    [
      string,
      readonly {
        publicationStatus: "draft" | "review" | "published";
        publicationReview: { state: "pending" | "approved" };
      }[],
    ]
  > = [
    ["games", data.games],
    ["editions", data.editions],
    ["playModes", data.playModes],
    ["accessOptions", data.accessOptions],
    ["requirements", data.requirements],
    ["mediaAssets", data.mediaAssets],
    ["rulesItems", data.rulesItems],
  ];
  reviewedCollections.forEach(([collectionName, entities]) => {
    entities.forEach((entity, index) => {
      if (
        entity.publicationStatus === "published" &&
        entity.publicationReview.state !== "approved"
      ) {
        add(
          "publication_review_required",
          [collectionName, index, "publicationReview"],
          "Published records require approved publication review evidence.",
        );
      }
    });
  });

  data.games.forEach((game, gameIndex) => {
    game.editionIds.forEach((editionId, referenceIndex) => {
      const edition = editions.get(editionId);
      if (!edition) {
        add(
          "dangling_reference",
          ["games", gameIndex, "editionIds", referenceIndex],
          `Unknown Edition ${editionId}.`,
        );
      } else if (edition.gameId !== game.id) {
        add(
          "wrong_parent",
          ["games", gameIndex, "editionIds", referenceIndex],
          `Edition ${editionId} belongs to ${edition.gameId}, not ${game.id}.`,
        );
      }
    });

    checkLinkedChildren(
      game.mediaAssetIds,
      mediaAssets,
      game.id,
      "gameId",
      ["games", gameIndex, "mediaAssetIds"],
      add,
    );
    checkLinkedChildren(
      game.rulesItemIds,
      rulesItems,
      game.id,
      "gameId",
      ["games", gameIndex, "rulesItemIds"],
      add,
    );

    if (game.publicationStatus === "published") {
      const hasPlayableChain = game.editionIds.some((editionId) => {
        const edition = editions.get(editionId);
        return (
          edition?.publicationStatus === "published" &&
          edition.playModeIds.some((modeId) => {
            const mode = playModes.get(modeId);
            return (
              mode?.publicationStatus === "published" &&
              mode.supportedPlayers.state === "known" &&
              mode.accessOptionIds.some((accessId) => {
                const access = accessOptions.get(accessId);
                return (
                  access?.publicationStatus === "published" && access.playable
                );
              })
            );
          })
        );
      });
      if (!hasPlayableChain) {
        add(
          "missing_playable_chain",
          ["games", gameIndex],
          "A published Game requires a complete published Edition → Play Mode → playable Access Option chain.",
        );
      }
    }
  });

  data.editions.forEach((edition, editionIndex) => {
    const parent = games.get(edition.gameId);
    checkParent(
      parent,
      edition.publicationStatus,
      ["editions", editionIndex, "gameId"],
      edition.gameId,
      "Game",
      add,
    );
    if (parent && !parent.editionIds.includes(edition.id)) {
      add(
        "unlisted_child",
        ["editions", editionIndex, "gameId"],
        `Parent Game ${parent.id} does not list ${edition.id}.`,
      );
    }
    edition.playModeIds.forEach((modeId, referenceIndex) => {
      const mode = playModes.get(modeId);
      if (!mode) {
        add(
          "dangling_reference",
          ["editions", editionIndex, "playModeIds", referenceIndex],
          `Unknown Play Mode ${modeId}.`,
        );
      } else if (mode.editionId !== edition.id) {
        add(
          "wrong_parent",
          ["editions", editionIndex, "playModeIds", referenceIndex],
          `Play Mode ${modeId} belongs to ${mode.editionId}, not ${edition.id}.`,
        );
      }
    });
    if (
      edition.publicationStatus === "published" &&
      !edition.playModeIds.some(
        (modeId) => playModes.get(modeId)?.publicationStatus === "published",
      )
    ) {
      add(
        "missing_published_play_mode",
        ["editions", editionIndex, "playModeIds"],
        "A published Edition requires at least one published Play Mode.",
      );
    }
    if (
      edition.publicationStatus === "published" &&
      edition.ageGuidance.state === "known"
    ) {
      validateClaimReference(
        edition.ageGuidance.sourceClaimId,
        "edition",
        edition.id,
        "ageGuidance",
        ["editions", editionIndex, "ageGuidance", "sourceClaimId"],
        claims,
        add,
      );
    }
  });

  data.playModes.forEach((mode, modeIndex) => {
    const parent = editions.get(mode.editionId);
    checkParent(
      parent,
      mode.publicationStatus,
      ["playModes", modeIndex, "editionId"],
      mode.editionId,
      "Edition",
      add,
    );
    if (parent && !parent.playModeIds.includes(mode.id)) {
      add(
        "unlisted_child",
        ["playModes", modeIndex, "editionId"],
        `Parent Edition ${parent.id} does not list ${mode.id}.`,
      );
    }
    mode.accessOptionIds.forEach((accessId, referenceIndex) => {
      const access = accessOptions.get(accessId);
      if (!access) {
        add(
          "dangling_reference",
          ["playModes", modeIndex, "accessOptionIds", referenceIndex],
          `Unknown Access Option ${accessId}.`,
        );
      } else if (access.playModeId !== mode.id) {
        add(
          "wrong_parent",
          ["playModes", modeIndex, "accessOptionIds", referenceIndex],
          `Access Option ${accessId} belongs to ${access.playModeId}, not ${mode.id}.`,
        );
      }
    });
    if (
      mode.publicationStatus === "published" &&
      mode.supportedPlayers.state !== "known"
    ) {
      add(
        "published_players_unknown",
        ["playModes", modeIndex, "supportedPlayers"],
        "Published Play Modes require explicit supported player counts.",
      );
    }
    if (
      mode.publicationStatus === "published" &&
      !mode.accessOptionIds.some((accessId) => {
        const access = accessOptions.get(accessId);
        return access?.publicationStatus === "published" && access.playable;
      })
    ) {
      add(
        "missing_playable_access_option",
        ["playModes", modeIndex, "accessOptionIds"],
        "A published Play Mode requires at least one published, playable Access Option.",
      );
    }
  });

  data.accessOptions.forEach((access, accessIndex) => {
    const parent = playModes.get(access.playModeId);
    checkParent(
      parent,
      access.publicationStatus,
      ["accessOptions", accessIndex, "playModeId"],
      access.playModeId,
      "Play Mode",
      add,
    );
    if (parent && !parent.accessOptionIds.includes(access.id)) {
      add(
        "unlisted_child",
        ["accessOptions", accessIndex, "playModeId"],
        `Parent Play Mode ${parent.id} does not list ${access.id}.`,
      );
    }
    access.requirementIds.forEach((requirementId, referenceIndex) => {
      const requirement = requirements.get(requirementId);
      if (!requirement) {
        add(
          "dangling_reference",
          ["accessOptions", accessIndex, "requirementIds", referenceIndex],
          `Unknown Requirement ${requirementId}.`,
        );
      } else if (requirement.accessOptionId !== access.id) {
        add(
          "wrong_parent",
          ["accessOptions", accessIndex, "requirementIds", referenceIndex],
          `Requirement ${requirementId} belongs to ${requirement.accessOptionId}, not ${access.id}.`,
        );
      } else if (
        access.publicationStatus === "published" &&
        requirement.publicationStatus !== "published"
      ) {
        add(
          "unpublished_requirement",
          ["accessOptions", accessIndex, "requirementIds", referenceIndex],
          `Published Access Option ${access.id} cannot depend on unpublished Requirement ${requirementId}.`,
        );
      }
    });
    if (access.publicationStatus === "published" && !access.playable) {
      add(
        "published_access_not_playable",
        ["accessOptions", accessIndex, "playable"],
        "A published Access Option must be playable.",
      );
    }
    if (access.destination.state === "external") {
      const destination = destinations.get(access.destination.destinationId);
      if (!destination) {
        add(
          "dangling_reference",
          ["accessOptions", accessIndex, "destination", "destinationId"],
          `Unknown Destination ${access.destination.destinationId}.`,
        );
      } else if (access.publicationStatus === "published") {
        if (
          destination.publicationStatus !== "published" ||
          destination.reviewState !== "approved"
        ) {
          add(
            "destination_not_approved",
            ["accessOptions", accessIndex, "destination"],
            "A published external Access Option requires a published, approved Destination.",
          );
        }
        if (
          access.provider.state !== "known" ||
          access.provider.value !== destination.provider
        ) {
          add(
            "destination_provider_mismatch",
            ["accessOptions", accessIndex, "provider"],
            "The Access Option must disclose the approved Destination provider.",
          );
        }
      }
    }
  });

  data.requirements.forEach((requirement, requirementIndex) => {
    const parent = accessOptions.get(requirement.accessOptionId);
    checkParent(
      parent,
      requirement.publicationStatus,
      ["requirements", requirementIndex, "accessOptionId"],
      requirement.accessOptionId,
      "Access Option",
      add,
    );
    if (parent && !parent.requirementIds.includes(requirement.id)) {
      add(
        "unlisted_child",
        ["requirements", requirementIndex, "accessOptionId"],
        `Parent Access Option ${parent.id} does not list ${requirement.id}.`,
      );
    }
  });

  data.destinations.forEach((destination, destinationIndex) => {
    if (
      destination.publicationStatus === "published" &&
      destination.reviewState !== "approved"
    ) {
      add(
        "destination_not_approved",
        ["destinations", destinationIndex, "reviewState"],
        "Published Destinations must be approved.",
      );
    }
  });

  data.mediaAssets.forEach((media, index) => {
    const parent = games.get(media.gameId);
    checkParent(
      parent,
      media.publicationStatus,
      ["mediaAssets", index, "gameId"],
      media.gameId,
      "Game",
      add,
    );
    if (media.publicationStatus === "published") {
      validateRights(
        media.rights,
        "mediaAsset",
        media.id,
        ["mediaAssets", index, "rights"],
        claims,
        add,
      );
    }
  });

  data.rulesItems.forEach((rules, index) => {
    const parent = games.get(rules.gameId);
    checkParent(
      parent,
      rules.publicationStatus,
      ["rulesItems", index, "gameId"],
      rules.gameId,
      "Game",
      add,
    );
    if (rules.publicationStatus === "published") {
      validateRights(
        rules.rights,
        "rulesItem",
        rules.id,
        ["rulesItems", index, "rights"],
        claims,
        add,
      );
    }
  });

  const provenanceEntities = [
    ["game", data.games],
    ["edition", data.editions],
    ["playMode", data.playModes],
    ["accessOption", data.accessOptions],
    ["requirement", data.requirements],
    ["destination", data.destinations],
  ] as const;

  for (const [entityType, entities] of provenanceEntities) {
    entities.forEach((entity, index) => {
      const entries = new Map(
        entity.provenance.map((entry) => [entry.fieldPath, entry.basis]),
      );
      const allowedFields = ALLOWED_PROVENANCE_FIELDS[entityType];
      entity.provenance.forEach((entry, provenanceIndex) => {
        if (!allowedFields.includes(entry.fieldPath)) {
          add(
            "invalid_provenance_field",
            [
              `${entityType}s`,
              index,
              "provenance",
              provenanceIndex,
              "fieldPath",
            ],
            `${entry.fieldPath} is not an allowed provenance field for ${entityType}.`,
          );
        } else if (
          (OPTIONAL_PROVENANCE_FIELDS[entityType] ?? []).includes(
            entry.fieldPath,
          ) &&
          !Object.prototype.hasOwnProperty.call(entity, entry.fieldPath)
        ) {
          add(
            "provenance_field_absent",
            [
              `${entityType}s`,
              index,
              "provenance",
              provenanceIndex,
              "fieldPath",
            ],
            `Provenance field ${entry.fieldPath} is absent from ${entity.id}.`,
          );
        }
        if (entry.basis.kind === "source_claim") {
          validateClaimReference(
            entry.basis.claimId,
            entityType,
            entity.id,
            entry.fieldPath,
            [`${entityType}s`, index, "provenance", provenanceIndex],
            claims,
            add,
            entity.publicationStatus === "published",
          );
        }
      });

      if (entity.publicationStatus !== "published") return;
      const requiredFields = [
        ...REQUIRED_PROVENANCE[entityType],
        ...(OPTIONAL_PROVENANCE_FIELDS[entityType] ?? []).filter((fieldPath) =>
          Object.prototype.hasOwnProperty.call(entity, fieldPath),
        ),
      ];
      requiredFields.forEach((fieldPath) => {
        if (!entries.has(fieldPath)) {
          add(
            "missing_provenance",
            [`${entityType}s`, index, "provenance"],
            `Published ${entityType} ${entity.id} lacks provenance for ${fieldPath}.`,
          );
        }
      });
    });
  }

  data.sourceClaims.forEach((claim, index) => {
    const targetCollection = getTargetCollection(claim.target.entityType, {
      games,
      editions,
      playModes,
      accessOptions,
      requirements,
      destinations,
      mediaAssets,
      rulesItems,
    });
    const expectedId = entityIdSchemas[claim.target.entityType].safeParse(
      claim.target.entityId,
    );
    const targetRecord = targetCollection.get(claim.target.entityId);
    if (!expectedId.success || targetRecord === undefined) {
      add(
        "invalid_claim_target",
        ["sourceClaims", index, "target", "entityId"],
        `Claim target ${claim.target.entityId} does not resolve as ${claim.target.entityType}.`,
      );
    }
    const allowedClaimFields =
      ALLOWED_PROVENANCE_FIELDS[claim.target.entityType];
    if (!allowedClaimFields.includes(claim.target.fieldPath)) {
      add(
        "invalid_claim_field",
        ["sourceClaims", index, "target", "fieldPath"],
        `${claim.target.fieldPath} is not an allowed claim field for ${claim.target.entityType}.`,
      );
    } else if (
      (OPTIONAL_PROVENANCE_FIELDS[claim.target.entityType] ?? []).includes(
        claim.target.fieldPath,
      ) &&
      targetRecord !== null &&
      typeof targetRecord === "object" &&
      !Object.prototype.hasOwnProperty.call(
        targetRecord,
        claim.target.fieldPath,
      )
    ) {
      add(
        "claim_target_absent_field",
        ["sourceClaims", index, "target", "fieldPath"],
        `Claim field ${claim.target.fieldPath} is absent from target ${claim.target.entityId}.`,
      );
    }
    if (
      claim.publicationStatus === "published" &&
      claim.verificationState !== "approved"
    ) {
      add(
        "claim_not_approved",
        ["sourceClaims", index, "verificationState"],
        "Published Source Claims must be approved.",
      );
    }
    const sourceHost = new URL(claim.canonicalUrl).hostname.toLowerCase();
    if (
      sourceHost === "boardgamegeek.com" ||
      sourceHost.endsWith(".boardgamegeek.com") ||
      /board\s*game\s*geek/i.test(claim.sourceName)
    ) {
      add(
        "blocked_source",
        ["sourceClaims", index, "canonicalUrl"],
        "BoardGameGeek data is blocked and cannot be used.",
      );
    }
  });

  return issues;
}

function checkParent(
  parent: { publicationStatus: "draft" | "review" | "published" } | undefined,
  childStatus: "draft" | "review" | "published",
  path: (string | number)[],
  parentId: string,
  parentLabel: string,
  add: (code: string, path: (string | number)[], message: string) => void,
) {
  if (!parent) {
    add("dangling_reference", path, `Unknown ${parentLabel} ${parentId}.`);
  } else if (
    childStatus === "published" &&
    parent.publicationStatus !== "published"
  ) {
    add(
      "published_child_under_unpublished_parent",
      path,
      `A published child cannot belong to a non-published ${parentLabel}.`,
    );
  }
}

function checkLinkedChildren<T extends { id: string }>(
  ids: string[],
  collection: Map<string, T>,
  parentId: string,
  parentKey: keyof T,
  path: (string | number)[],
  add: (code: string, path: (string | number)[], message: string) => void,
) {
  ids.forEach((id, index) => {
    const child = collection.get(id);
    if (!child) {
      add(
        "dangling_reference",
        [...path, index],
        `Unknown linked entity ${id}.`,
      );
    } else if (child[parentKey] !== parentId) {
      add(
        "wrong_parent",
        [...path, index],
        `Linked entity ${id} belongs to a different parent.`,
      );
    }
  });
}

function validateClaimReference(
  claimId: string,
  entityType: EntityType,
  entityId: string,
  fieldPath: string,
  path: (string | number)[],
  claims: Map<string, SourceClaim>,
  add: (code: string, path: (string | number)[], message: string) => void,
  requireApproved = true,
) {
  const claim = claims.get(claimId);
  if (!claim) {
    add("dangling_claim", path, `Unknown Source Claim ${claimId}.`);
    return;
  }
  if (
    claim.target.entityType !== entityType ||
    claim.target.entityId !== entityId ||
    claim.target.fieldPath !== fieldPath
  ) {
    add(
      "claim_target_mismatch",
      path,
      `Source Claim ${claimId} does not target ${entityType} ${entityId}.${fieldPath}.`,
    );
  }
  if (
    requireApproved &&
    (claim.verificationState !== "approved" ||
      claim.publicationStatus !== "published")
  ) {
    add(
      "claim_not_approved",
      path,
      `Source Claim ${claimId} is not approved and published.`,
    );
  }
}

function validateRights(
  rights: { kind: "original" } | { kind: "source_claim"; claimId: string },
  entityType: "mediaAsset" | "rulesItem",
  entityId: string,
  path: (string | number)[],
  claims: Map<string, SourceClaim>,
  add: (code: string, path: (string | number)[], message: string) => void,
) {
  if (rights.kind === "source_claim") {
    validateClaimReference(
      rights.claimId,
      entityType,
      entityId,
      "rights",
      path,
      claims,
      add,
    );
  }
}

function getTargetCollection(
  entityType: EntityType,
  maps: {
    games: Map<string, unknown>;
    editions: Map<string, unknown>;
    playModes: Map<string, unknown>;
    accessOptions: Map<string, unknown>;
    requirements: Map<string, unknown>;
    destinations: Map<string, unknown>;
    mediaAssets: Map<string, unknown>;
    rulesItems: Map<string, unknown>;
  },
): Map<string, unknown> {
  const byType = {
    game: maps.games,
    edition: maps.editions,
    playMode: maps.playModes,
    accessOption: maps.accessOptions,
    requirement: maps.requirements,
    destination: maps.destinations,
    mediaAsset: maps.mediaAssets,
    rulesItem: maps.rulesItems,
  } satisfies Record<EntityType, Map<string, unknown>>;
  return byType[entityType];
}
