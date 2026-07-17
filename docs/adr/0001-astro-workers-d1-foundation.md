# ADR 0001: Static-first Astro on Cloudflare Workers and D1

- Status: accepted for bootstrap
- Date: 2026-07-17
- Authority: D-014, D-015, D-016; A-005; NFR-03, NFR-06, NFR-09

## Context

Game Portal begins with a small, curated, version-controlled catalog and must remain usable within free-resource limits. Mutable accounts, votes, events, availability observations, and aggregates need relational storage later, while public catalog pages should remain readable during dynamic-service failure.

Current Astro and Cloudflare guidance supports deployment to Cloudflare Workers with static assets. Wrangler can automatically provision resources during deployment, which is outside the authorized bootstrap boundary.

## Decision

- Use Node.js 24.18.0, pnpm 11.13.1, Astro 7.1.0, React 19.2.7, and `@astrojs/cloudflare` 14.1.3 as the bootstrap baseline.
- Keep Astro output static by default. Only future routes that need mutable state may opt out of prerendering explicitly.
- Use React only for bounded interactive islands; do not hydrate whole pages.
- Use `wrangler.jsonc` and asset-first routing (`run_worker_first` false/default). Keep `@astrojs/cloudflare` pinned but inactive while all routes are static: activating version 14.1.3 injected Session KV and Images bindings that violate the bootstrap's storage and provisioning boundaries. Reconsider activation before the first authorized on-demand route.
- Every bootstrap D1 command must be explicitly local and disable automatic provisioning. No deploy, remote-development, login, resource-creation, or production identifier belongs in this delivery.
- Store catalog records as version-controlled JSON validated by shared Zod schemas. This representation supports cross-entity and fail-closed publication/provenance checks more directly than treating each entity as an independent content entry.
- Use a binding-only local D1 configuration with `remote: false` and no database identifier. The first forward-only migration stores append-only link-health observations and a mutable current-status projection; every repository command names `--local`.
- Pin TypeScript 6.0.3 because the selected lint toolchain does not yet support TypeScript 7.0.2.
- Do not use Astro Sessions' automatic KV storage; account/session storage remains a later explicit D1 contract.

## Consequences

Static requests avoid Worker quota when an asset matches, and catalog content remains available during dynamic outages. Dynamic routes, local D1 migrations, and Cloudflare-specific tests remain possible. Exact dependency pins require deliberate upgrades and regression checks. Catalog edits require review and a build/deploy cycle.

Installed Wrangler 4.111 marks a D1 database identifier optional and successfully applies binding-only local migrations, although current Cloudflare examples still show remote identifiers. Remote D1 remains unsupported until a separately authorized resource exists.

## Version and platform evidence

- [pnpm live package record](https://registry.npmjs.org/pnpm/latest) (`11.13.1` when this decision was recorded)
- [Astro installation requirements](https://docs.astro.build/en/install-and-setup/)
- [Astro Cloudflare integration](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Cloudflare Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Cloudflare D1 local development](https://developers.cloudflare.com/d1/best-practices/local-development/)

## Alternatives rejected for bootstrap

- Cloudflare Pages Functions: superseded by the approved Workers direction for on-demand Astro behavior.
- Server output for every route: conflicts with static-first availability and free-tier goals.
- Whole-page React hydration: unnecessary bundle and runtime cost.
- Remote D1 provisioning: explicitly unauthorized.
- Astro Sessions backed by automatically provisioned KV: adds an unapproved storage service.
- Activating the Cloudflare adapter for an all-static build: currently adds unapproved Session KV and Images bindings without providing bootstrap value.
- TypeScript 7.0.2: outside the supported range of the selected lint parser.

## Rollback

Before public contracts exist, the Git Steward can revert the scaffold commit and remove generated local-only state. After dynamic routes exist, change the adapter, storage, or catalog representation only through a new ADR, migration plan, export/backup where applicable, and integrated regression verification.
