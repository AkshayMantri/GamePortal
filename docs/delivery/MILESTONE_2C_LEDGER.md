# Milestone 2C delivery ledger

**Task:** `GP-2-003` — Party-size-first Find control  
**State:** REGRESSION_VERIFIED — draft PR delivery pending

## Scope

The shared Find experience on `/` and `/find` now provides native quick choices
1–8 and a direct 1–99 whole-number path. A framework-neutral TypeScript parser
and bounded client enhancement own transient state, validation, visible receipt,
and polite announcements.

Matching, filters, result counts/cards, canonical URL state, persistence,
analytics, D1, accounts, catalog changes, and external actions remain deferred.

## Gates

- Baseline before implementation: 13 pages, 24 files, 449,675 bytes, zero
  JavaScript assets, and one Browse-only inline script.
- Root self-checks: 154/154 unit tests, focused 26/26 browser tests, format,
  lint, Astro/type checks, and build passed.
- Fresh independent task verification: format, lint, Astro/type, integrity,
  catalog, 154/154 unit, 26/26 focused browser, and 54/54 full browser
  regression checks passed. Automated accessibility found no serious or critical
  violations.
- Static artifact audit: 13 pages, 24 files, 467,441 bytes (17,766 bytes over
  the merged baseline), zero emitted JavaScript assets, and inline scripts only
  on Browse, `/`, and `/find`. Each Find script is 2,429 bytes raw / 987 bytes
  gzip; root and `/find` are byte-identical.
- Sol scope/product/architecture/security/privacy/accessibility review: passed.
- Git Steward task commit: `6998b6e8b26a628253f20df19063314fd6d422ac`.
- Fresh integrated-candidate regression: `corepack pnpm verify:ci` passed in
  138.5 seconds; 154/154 unit and 54/54 browser tests passed with no failures or
  skips. The generated `/` and `/find` documents were byte-identical.
- Draft PR and hosted CI: pending.

Manual screen-reader narration and genuine browser-zoom 200% checks remain
pre-release gates if they cannot be completed in the automated environment; they
do not block the draft PR when explicitly reported as not run.
