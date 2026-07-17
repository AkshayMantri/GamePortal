import { z } from "zod";

const idTail = "[a-z0-9]+(?:_[a-z0-9]+)*";

export const entityIdSchemas = {
  game: z.string().regex(new RegExp(`^game_${idTail}$`)),
  edition: z.string().regex(new RegExp(`^edition_${idTail}$`)),
  playMode: z.string().regex(new RegExp(`^mode_${idTail}$`)),
  accessOption: z.string().regex(new RegExp(`^access_${idTail}$`)),
  requirement: z.string().regex(new RegExp(`^req_${idTail}$`)),
  destination: z.string().regex(new RegExp(`^dest_${idTail}$`)),
  sourceClaim: z.string().regex(new RegExp(`^claim_${idTail}$`)),
  mediaAsset: z.string().regex(new RegExp(`^media_${idTail}$`)),
  rulesItem: z.string().regex(new RegExp(`^rules_${idTail}$`)),
} as const;

export const PublicationStatusSchema = z.enum(["draft", "review", "published"]);
export const UnknownReasonSchema = z.enum([
  "not_provided",
  "not_verified",
  "not_applicable",
  "varies_by_provider",
]);

const UnknownSchema = z
  .object({
    state: z.literal("unknown"),
    reason: UnknownReasonSchema,
    note: z.string().trim().min(1).optional(),
  })
  .strict();

const nonNegativeInteger = z.number().int().min(0);
const positiveInteger = z.number().int().min(1);

export const KnownStringSchema = z.discriminatedUnion("state", [
  z
    .object({ state: z.literal("known"), value: z.string().trim().min(1) })
    .strict(),
  UnknownSchema,
]);

export const KnownEnumSchema = <T extends readonly [string, ...string[]]>(
  values: T,
) =>
  z.discriminatedUnion("state", [
    z.object({ state: z.literal("known"), value: z.enum(values) }).strict(),
    UnknownSchema,
  ]);

export const LanguageStateSchema = z.discriminatedUnion("state", [
  z
    .object({
      state: z.literal("known"),
      tags: z
        .array(z.string().regex(/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/))
        .min(1)
        .refine(
          (tags) =>
            new Set(tags.map((tag) => tag.toLowerCase())).size === tags.length,
          {
            message: "Language tags must be unique (case-insensitive).",
          },
        ),
    })
    .strict(),
  UnknownSchema,
]);

export const RegionStateSchema = z.union([
  z
    .object({ state: z.literal("known"), scope: z.literal("unrestricted") })
    .strict(),
  z
    .object({
      state: z.literal("known"),
      scope: z.enum(["allowlist", "blocklist"]),
      regions: z
        .array(z.string().regex(/^[A-Z]{2}$/))
        .min(1)
        .refine((regions) => new Set(regions).size === regions.length, {
          message: "Region codes must be unique.",
        }),
    })
    .strict(),
  UnknownSchema,
]);

const PlayerRangeSchema = z
  .object({
    kind: z.literal("range"),
    minimum: positiveInteger.max(99),
    maximum: positiveInteger.max(99),
  })
  .strict()
  .refine((range) => range.minimum <= range.maximum, {
    message: "Player range minimum cannot exceed maximum.",
    path: ["maximum"],
  });

const PlayerSetSchema = z
  .object({
    kind: z.literal("set"),
    values: z
      .array(positiveInteger.max(99))
      .min(1)
      .refine((values) => new Set(values).size === values.length, {
        message: "Explicit player counts must be unique.",
      }),
  })
  .strict();

export const PlayerSupportSchema = z.discriminatedUnion("state", [
  z
    .object({
      state: z.literal("known"),
      shape: z.union([PlayerRangeSchema, PlayerSetSchema]),
    })
    .strict(),
  UnknownSchema,
]);

const KnownMinutesSchema = z
  .object({ state: z.literal("known"), minutes: nonNegativeInteger })
  .strict();

const KnownPlayMinutesSchema = z
  .object({
    state: z.literal("known"),
    minimum: nonNegativeInteger,
    maximum: nonNegativeInteger,
  })
  .strict()
  .refine((time) => time.minimum <= time.maximum, {
    message: "Play-time minimum cannot exceed maximum.",
    path: ["maximum"],
  });

export const TimeComponentsSchema = z
  .object({
    setupOrAccess: z.discriminatedUnion("state", [
      KnownMinutesSchema,
      UnknownSchema,
    ]),
    teaching: z.discriminatedUnion("state", [
      KnownMinutesSchema,
      UnknownSchema,
    ]),
    play: z.discriminatedUnion("state", [
      KnownPlayMinutesSchema,
      UnknownSchema,
    ]),
  })
  .strict();

export const AgeGuidanceSchema = z.discriminatedUnion("state", [
  z
    .object({
      state: z.literal("known"),
      minimumYears: nonNegativeInteger.max(99),
      sourceClaimId: entityIdSchemas.sourceClaim,
    })
    .strict(),
  UnknownSchema,
]);

const ProvenanceBasisSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("original") }).strict(),
  z
    .object({
      kind: z.literal("source_claim"),
      claimId: entityIdSchemas.sourceClaim,
    })
    .strict(),
]);

export const FieldProvenanceSchema = z
  .object({
    fieldPath: z.string().trim().min(1),
    basis: ProvenanceBasisSchema,
  })
  .strict();

const provenanceList = z
  .array(FieldProvenanceSchema)
  .refine(
    (items) =>
      new Set(items.map((item) => item.fieldPath)).size === items.length,
    {
      message: "Field provenance paths must be unique per entity.",
    },
  );

export const PublicationReviewSchema = z.discriminatedUnion("state", [
  z.object({ state: z.literal("pending") }).strict(),
  z
    .object({
      state: z.literal("approved"),
      reviewedAt: z.iso.datetime({ offset: true }),
      reviewedBy: z.string().trim().min(1),
    })
    .strict(),
]);

const ProvenancedEntityShape = {
  publicationStatus: PublicationStatusSchema,
  provenance: provenanceList,
};

const ReviewedProvenancedEntityShape = {
  ...ProvenancedEntityShape,
  publicationReview: PublicationReviewSchema,
};

export const GameSchema = z
  .object({
    id: entityIdSchemas.game,
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    canonicalTitle: z.string().trim().min(1),
    sortTitle: z.string().trim().min(1),
    gameType: z.enum([
      "board",
      "card",
      "word",
      "party",
      "social",
      "abstract_strategy",
      "other",
    ]),
    summary: z.string().trim().min(1),
    tags: z.array(z.string().regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/)),
    editionIds: z.array(entityIdSchemas.edition).min(1),
    mediaAssetIds: z.array(entityIdSchemas.mediaAsset),
    rulesItemIds: z.array(entityIdSchemas.rulesItem),
    contentUpdatedAt: z.iso.datetime({ offset: true }),
    ...ReviewedProvenancedEntityShape,
  })
  .strict();

export const EditionSchema = z
  .object({
    id: entityIdSchemas.edition,
    gameId: entityIdSchemas.game,
    title: z.string().trim().min(1),
    variantKind: z.enum([
      "traditional",
      "published_edition",
      "regional_variant",
      "adaptation",
    ]),
    publisherOrTradition: KnownStringSchema,
    ageGuidance: AgeGuidanceSchema,
    languages: LanguageStateSchema,
    regions: RegionStateSchema,
    playModeIds: z.array(entityIdSchemas.playMode).min(1),
    ...ReviewedProvenancedEntityShape,
  })
  .strict();

export const PlayModeSchema = z
  .object({
    id: entityIdSchemas.playMode,
    editionId: entityIdSchemas.edition,
    mode: z.enum(["in_person", "remote"]),
    synchrony: z.enum(["synchronous", "asynchronous"]),
    supportedPlayers: PlayerSupportSchema,
    time: TimeComponentsSchema,
    teamStructure: KnownStringSchema,
    accessOptionIds: z.array(entityIdSchemas.accessOption).min(1),
    ...ReviewedProvenancedEntityShape,
  })
  .strict();

const DestinationReferenceSchema = z.discriminatedUnion("state", [
  z
    .object({ state: z.literal("none"), reason: z.literal("not_required") })
    .strict(),
  z
    .object({
      state: z.literal("external"),
      destinationId: entityIdSchemas.destination,
    })
    .strict(),
]);

export const AccessOptionSchema = z
  .object({
    id: entityIdSchemas.accessOption,
    playModeId: entityIdSchemas.playMode,
    accessKind: z.enum([
      "physical_instructions",
      "browser",
      "mobile_app",
      "desktop_app",
      "console",
      "store",
      "other",
    ]),
    playable: z.boolean(),
    provider: KnownStringSchema,
    accountRequirement: KnownEnumSchema(["none", "host_only", "each_player"]),
    installationRequirement: KnownEnumSchema([
      "none",
      "host_only",
      "each_player",
    ]),
    priceClassification: KnownEnumSchema([
      "free",
      "paid",
      "physical_owned",
      "varies",
    ]),
    regions: RegionStateSchema,
    languages: LanguageStateSchema,
    requirementIds: z.array(entityIdSchemas.requirement),
    destination: DestinationReferenceSchema,
    ...ReviewedProvenancedEntityShape,
  })
  .strict();

export const RequirementSchema = z
  .object({
    id: entityIdSchemas.requirement,
    accessOptionId: entityIdSchemas.accessOption,
    requirementType: z.enum([
      "device",
      "equipment",
      "account",
      "installation",
      "other",
    ]),
    itemCode: z.string().regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/),
    minimumQuantity: positiveInteger.max(99),
    scope: z.enum(["per_group", "host_only", "per_person", "per_team"]),
    mandatory: z.boolean(),
    notes: z.string().trim().min(1).optional(),
    ...ReviewedProvenancedEntityShape,
  })
  .strict();

const safeHttpsUrl = z.url().refine(
  (value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password;
    } catch {
      return false;
    }
  },
  { message: "URL must use HTTPS and must not contain credentials." },
);

export const DestinationSchema = z
  .object({
    id: entityIdSchemas.destination,
    url: safeHttpsUrl,
    destinationType: z.enum([
      "official_play",
      "app_store",
      "rules",
      "store",
      "other",
    ]),
    provider: z.string().trim().min(1),
    publicDisplayDomain: z.string().regex(/^[a-z0-9.-]+$/),
    reviewState: z.enum(["pending", "approved", "rejected"]),
    reviewedAt: z.iso.datetime({ offset: true }).optional(),
    reviewedBy: z.string().trim().min(1).optional(),
    redirectPolicy: z.enum([
      "same_domain",
      "reviewed_allowlist",
      "no_redirects",
    ]),
    ...ProvenancedEntityShape,
  })
  .strict()
  .superRefine((destination, context) => {
    if (
      destination.reviewState === "approved" &&
      (!destination.reviewedAt || !destination.reviewedBy)
    ) {
      context.addIssue({
        code: "custom",
        message: "Approved destinations require reviewedAt and reviewedBy.",
        path: ["reviewState"],
      });
    }

    let hostname: string;
    try {
      hostname = new URL(destination.url).hostname.toLowerCase();
    } catch {
      return;
    }
    const displayDomain = destination.publicDisplayDomain.toLowerCase();
    if (hostname !== displayDomain && !hostname.endsWith(`.${displayDomain}`)) {
      context.addIssue({
        code: "custom",
        message: "publicDisplayDomain must match the destination URL hostname.",
        path: ["publicDisplayDomain"],
      });
    }
  });

export const ClaimEntityTypeSchema = z.enum([
  "game",
  "edition",
  "playMode",
  "accessOption",
  "requirement",
  "destination",
  "mediaAsset",
  "rulesItem",
]);

export const SourceClaimSchema = z
  .object({
    id: entityIdSchemas.sourceClaim,
    target: z
      .object({
        entityType: ClaimEntityTypeSchema,
        entityId: z.string().min(1),
        fieldPath: z.string().trim().min(1),
      })
      .strict(),
    sourceName: z.string().trim().min(1),
    sourceType: z.enum([
      "official",
      "standards_body",
      "publisher",
      "license",
      "other",
    ]),
    canonicalUrl: safeHttpsUrl,
    sourceLocator: z.string().trim().min(1),
    retrievedAt: z.iso.datetime({ offset: true }),
    rightsOrPermissionBasis: z.string().trim().min(1),
    attributionDuty: z.enum(["none", "required"]),
    attributionText: z.string().trim().min(1).optional(),
    verificationState: z.enum(["pending", "approved", "rejected"]),
    verifiedAt: z.iso.datetime({ offset: true }).optional(),
    verifiedBy: z.string().trim().min(1).optional(),
    correctionPath: z.string().trim().min(1),
    publicationStatus: PublicationStatusSchema,
  })
  .strict()
  .superRefine((claim, context) => {
    if (claim.attributionDuty === "required" && !claim.attributionText) {
      context.addIssue({
        code: "custom",
        message: "Required attribution must include attributionText.",
        path: ["attributionText"],
      });
    }
    if (
      claim.verificationState === "approved" &&
      (!claim.verifiedAt || !claim.verifiedBy)
    ) {
      context.addIssue({
        code: "custom",
        message: "Approved claims require verifiedAt and verifiedBy.",
        path: ["verificationState"],
      });
    }
  });

const OriginalRightsSchema = z
  .object({
    kind: z.literal("original"),
    rightsBasis: z.enum(["authored", "owned", "public_domain"]),
    attributionDuty: z.enum(["none", "required"]),
    attributionText: z.string().trim().min(1).optional(),
    correctionPath: z.string().trim().min(1),
  })
  .strict()
  .refine(
    (rights) =>
      rights.attributionDuty === "none" || Boolean(rights.attributionText),
    {
      message: "Required attribution must include attributionText.",
      path: ["attributionText"],
    },
  );

const RightsReferenceSchema = z.discriminatedUnion("kind", [
  OriginalRightsSchema,
  z
    .object({
      kind: z.literal("source_claim"),
      claimId: entityIdSchemas.sourceClaim,
    })
    .strict(),
]);

export const MediaAssetSchema = z
  .object({
    id: entityIdSchemas.mediaAsset,
    gameId: entityIdSchemas.game,
    assetKind: z.enum(["image", "video", "diagram", "other"]),
    location: z.discriminatedUnion("kind", [
      z
        .object({
          kind: z.literal("local"),
          path: z
            .string()
            .regex(/^\/(?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]+$/)
            .refine(
              (path) =>
                !path.includes("\\") &&
                !path
                  .split("/")
                  .some((segment) => segment === "." || segment === ".."),
              {
                message:
                  "Local media paths must be normalized root-relative paths without backslashes or parent segments.",
              },
            ),
        })
        .strict(),
      z
        .object({ kind: z.literal("external_embed"), url: safeHttpsUrl })
        .strict(),
      z
        .object({ kind: z.literal("external_reference"), url: safeHttpsUrl })
        .strict(),
    ]),
    altText: z.string().trim().min(1),
    intrinsicWidth: positiveInteger,
    intrinsicHeight: positiveInteger,
    rights: RightsReferenceSchema,
    publicationStatus: PublicationStatusSchema,
    publicationReview: PublicationReviewSchema,
  })
  .strict();

export const RulesItemSchema = z
  .object({
    id: entityIdSchemas.rulesItem,
    gameId: entityIdSchemas.game,
    title: z.string().trim().min(1),
    content: z.discriminatedUnion("kind", [
      z
        .object({
          kind: z.literal("original_summary"),
          text: z.string().trim().min(1),
        })
        .strict(),
      z
        .object({ kind: z.literal("external_reference"), url: safeHttpsUrl })
        .strict(),
    ]),
    rights: RightsReferenceSchema,
    publicationStatus: PublicationStatusSchema,
    publicationReview: PublicationReviewSchema,
  })
  .strict();

export const CatalogDocumentSchema = z
  .object({
    catalogVersion: z.literal(1),
    contentState: z.discriminatedUnion("kind", [
      z
        .object({
          kind: z.literal("contract_only_empty"),
          note: z.string().trim().min(1),
        })
        .strict(),
      z.object({ kind: z.literal("populated") }).strict(),
    ]),
    games: z.array(GameSchema),
    editions: z.array(EditionSchema),
    playModes: z.array(PlayModeSchema),
    accessOptions: z.array(AccessOptionSchema),
    requirements: z.array(RequirementSchema),
    destinations: z.array(DestinationSchema),
    sourceClaims: z.array(SourceClaimSchema),
    mediaAssets: z.array(MediaAssetSchema),
    rulesItems: z.array(RulesItemSchema),
  })
  .strict();

export type CatalogDocument = z.infer<typeof CatalogDocumentSchema>;
export type PublicationStatus = z.infer<typeof PublicationStatusSchema>;
export type SourceClaim = z.infer<typeof SourceClaimSchema>;
