# Milestone 2D delivery ledger

**Task:** `GP-2-004C-D` — typed filter state, canonical URL, and workspace  
**Workspace:** `C:\Users\aksha\Documents\GamePortal-GP-2-004`  
**Status:** TASK_VERIFIED — independent integrated regression pending

Only the root orchestrator advances authoritative task state. This document
records implementer evidence and does not self-accept the change.

## Implemented contract

- One readonly DOM-free `FindFilterState` covers all eleven approved filters.
- One bounded decoder, canonical encoder, summary/removal/count model, and
  publication-safe option registry are shared by `/` and `/find`.
- One Astro-rendered form is moved between a desktop editorial workspace and a
  native compact dialog by one framework-neutral controller.
- URL state owns commits; form values remain draft until Update setup.
- Party quick/custom, Apply, removal, Clear all, initial cleanup, Back/Forward,
  reload, malformed-link notice, no-JavaScript content, age privacy, and current
  data-gating follow `docs/ui/FILTER_STATE_AND_URLS.md`.
- No matching or result behavior exists.

## Requirement status

| Requirement               | M2D status                                                                                                           | Explicit remainder                                              |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| FIND-01                   | Party-size placement/control implemented                                                                             | Result-count announcement deferred with results                 |
| FIND-03                   | Typed practical-filter taxonomy and meaningful controls implemented; data-gated controls fixture-proven              | Match effects deferred to M2E                                   |
| FIND-04                   | Canonical serialization, URL restoration, Back/Forward, removal, malformed recovery, and address sharing implemented | Dedicated Copy Link is not required or implemented              |
| FIND-02, FIND-05, FIND-06 | Deferred                                                                                                             | Matching, no-result recovery, and result cards are later slices |

## Baseline and current static evidence

The clean merged M2C baseline reported 13 pages, 24 files, 467,441 bytes, and a
2,429-byte raw / 987-byte gzip inline Find enhancement on each Find page.

The independently verified build on 2026-07-20 produced 13 pages, 26 files, and
497,012 bytes. Vite emitted one shared Find controller module at 19,308 bytes
raw / 5,915 bytes gzip using Node zlib level 9 (5,905 bytes with .NET
`GZipStream` Optimal). Browse retains its 1,131-byte raw / 597-byte Node-zlib
gzip inline enhancement, for 20,439 raw / 6,512 gzip bytes when the distinct
client programs are summed individually. `/` and `/find` each reference the one
shared Find module. There are zero Astro islands, zero React hydrations, no new
dependency or lockfile change, and no font/media/network/D1/Worker change.

The frozen brief referred to an existing integrity generator, but the
repository contained only the strict read-only validator. M2D adds an explicit deterministic
`integrity:refresh` / `--write` mode to that tool while preserving its ordinary
read-only behavior. The refresh preserves all non-file manifest metadata,
regenerates the exact authority allowlist and checksum file with stable UTF-8 LF
output, and verifies its own output. It was invoked after the D-030 and
SAFETY_AND_PRIVACY changes; two consecutive refreshes were byte-identical and
the strict integrity check passed. Generated authority entries were not
hand-edited.

## Verification evidence

- `corepack pnpm check`: passed, zero diagnostics.
- scoped ESLint on changed source: passed.
- focused registry/state/party unit tests: 52/52 passed.
- production build/catalog validation: passed, 13 pages.
- focused Find browser suite: 20/20 across compact and wide projects.
- deterministic authority refresh run twice: passed; second run byte-identical.
- strict read-only authority integrity check after refresh: passed.
- fresh independent task verification: passed and acceptance recommended;
  178/178 unit, 6/6 local-D1, 62/62 configured browser, 106 external codec, and
  74 external production/fixture browser assertions passed with zero
  console/page errors or external requests.
- stable review evidence: all eleven required screenshots and the full formal
  report are external to the repository under `gp2d-task-verification`.

Fresh integrated-candidate regression remains required after the Git Steward
creates the approved local commits.
Genuine Windows Narrator and genuine browser-chrome 200% zoom remain explicitly
NOT RUN pre-release gates unless a fresh tester can execute them.

## Rollback and exclusions

Rollback is source/static only: the Git Steward can revert the scoped M2D
commits. There is no migration, remote resource, persisted user data, or
deployment rollback.

Excluded: game matching, true/false/unknown evaluation, exact/uncertain/near
classification, catalog filtering, result counts/live region, ranking, sorting,
play slips, full Game Pages, external actions/QR, Random, Vote, Library,
recommendations, Popular, Game Night, accounts, analytics, storage outside the
URL, network/server/D1 behavior, catalog expansion, dependencies, CI changes,
and deployment.
