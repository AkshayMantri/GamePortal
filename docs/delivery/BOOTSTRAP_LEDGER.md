# Bootstrap orchestration ledger

Runtime model identities are unverified under the product owner's explicit waiver. Intended AGENTS.md model/reasoning assignments and role separation still apply.

| Task | State | Owner / intended model / context | Dependencies | Workspace and write ownership | Evidence | Next gate |
|---|---|---|---|---|---|---|
| GP-0-001 Repository/package orientation | IMPLEMENTED | Root Sol High `/root`; Sol High scouts; Luna XHigh Git Steward `/root/git_steward_orientation` | None | Primary read-only; Git metadata only; graph outputs outside repository | Package present; `AGENTS.md` hash explicitly waived; `main` clean at `7def44c`; isolated worktree created | GP-0-002 verification |
| GP-0-002 Repository governance | INTEGRATED | Sol High `/root` after Terra High context stalled | GP-0-001 | README, contributing guide, ADR, PR template, ledger, decision log | Verification and review passed; commit `8260afbc` | GP-1-001 verification |
| GP-1-001 Application scaffold | REVIEWED | Sol High `/root/scaffold_impl`; fresh Luna XHigh tester `/root/scaffold_tester` | GP-0-002 | Package/lockfile via pnpm; Astro/Workers shell and runtime config | Frozen install, check, static build, env rejection, Wrangler no-binding, HTTP and static accessibility checks passed; interactive Browser checks not run because no backend was available | Git Steward commit; Playwright closes deferred browser checks in GP-1-002 |
| GP-1-002 Quality and test foundation | READY | Terra High implementer; fresh Luna XHigh tester | GP-1-001 | Format/lint/unit/browser/CI config and serialized scripts/docs | Exact compatible Vitest/Workers-pool/Playwright baseline frozen; browser deferral from GP-1-001 included in charter | Git Steward commits GP-1-001, then implementation starts |
| GP-1-003 Catalog schema and validation | PLANNED | Terra XHigh context TBD | GP-1-001, GP-1-002 | Catalog schema, validator, invalid fixtures, focused tests | Canonical ownership and publication contract frozen | Test runner available |
| GP-1-004 Initial catalog proof set | PLANNED | Terra High content context TBD | GP-1-003 | Disjoint catalog records and source manifest only | Primary-source research begun; no records authored | Schema frozen and verified |
| GP-1-005 Local D1 baseline | PLANNED | Terra XHigh context TBD | GP-1-001, GP-1-002; shared config serialized after GP-1-003 | Migrations, local scripts/tests, D1 documentation | Local/no-provision contract frozen | Shared config ownership released |
| GP-1-006 Integrated documentation and delivery | PLANNED | Root Sol High; fresh Luna XHigh tester; Luna XHigh Git Steward | GP-0-002, GP-1-001–005 | Serialized setup/docs/checksums and PR metadata | Formal charter refined by reconnaissance | All task-level gates pass |
