# Game Portal Planning and Agent-Orchestration Package

**Repository target:** `https://github.com/AkshayMantri/GamePortal.git`  
**Planning baseline date:** 2026-07-16  
**Agent-orchestration update:** 2026-07-17  
**Package status:** Product, technical direction, and agent operating model approved; the Milestone 0/1 foundation has been delivered, and the Milestone 2A shell/navigation candidate is in gated implementation and verification.

This package converts the approved discovery decisions into durable planning documents and a repository-wide agent operating system. The repository now also contains the authorized static Astro scaffold, validated proof catalog, local-only D1 baseline, and deterministic quality gates. It contains no credentials, provisioned vendor resources, remote resource identifiers, or deployment actions.

## Authority order

When documents conflict, use this order:

1. Latest explicit product-owner decision.
2. `DECISION_LOG.md`.
3. Approved requirements and safety rules.
4. Domain and data contracts.
5. UX and UI specifications.
6. Architecture and backlog guidance.
7. Existing implementation and tests, once they exist.
8. Older discovery notes.

`AGENTS.md` controls **execution workflow, model routing, independent verification, and Git ownership**. It cannot override product decisions or promote a recommendation to `CONFIRMED`.

## Approved product baseline

- Strictly non-commercial.
- Responsive web application that anyone can browse and use.
- Accounts remain optional and are intended for adults; discovery remains guest-first.
- Game Night is part of the initial release and is not restricted to adults, but children under 13 participate through an adult rather than creating a child account or submitting child contact information.
- Initial catalog target: approximately 20 curated games.
- The product is both a party-size-first finder and a browseable game collection.
- Domain model: Game → Edition/Variant → Play Mode → Access Option.
- Group Vote: Borda-style consensus scoring with defined partial ballots and tie handling.
- Random: uniform over unique eligible games.
- Total time: access/setup + teaching + upper expected play time.
- Recommendations, Popular, and Game Night ship in the first public release.
- Visual direction: **Table Notes**.
- Popularity minimum sample threshold starts at 1; every low-sample result exposes its signal count.
- Solo implementation using Codex + ChatGPT Pro and free resources only.
- Approved implementation direction: Astro + TypeScript, React islands, Cloudflare Workers static assets and on-demand routes, Cloudflare D1, and GitHub.

## Approved agent baseline

- Root orchestrator: **GPT5.6-Sol High**.
- All planning and planning subagents: **Sol High**.
- Implementation models: **Luna XHigh, Terra High, Terra XHigh, Sol Medium, or Sol High**.
- Formal tester: a fresh, independent **Luna XHigh** subagent.
- Every Git and GitHub action, including read-only inspection: a dedicated **Luna XHigh Git Steward**.
- No silent model substitution or reasoning-level downgrade.
- Planning, implementation, testing, and Git delivery remain separate gates.

## Important architecture correction

Current Astro Cloudflare guidance no longer supports deploying on-demand Astro applications through the old Cloudflare Pages adapter path. The durable plan therefore uses **Cloudflare Workers with static assets**, not Pages Functions. Fully static routes still behave as static assets; dynamic routes use the Worker.

## Document map

| Document | Purpose |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Mandatory model routing, Sol High orchestration, task packets, subagent isolation, Luna XHigh testing, and Luna XHigh Git/GitHub protocol |
| [`PRODUCT.md`](PRODUCT.md) | Product definition, audience situations, promise, principles, scope, non-goals, and outcomes |
| [`REQUIREMENTS.md`](REQUIREMENTS.md) | Stable functional and nonfunctional requirements with acceptance criteria |
| [`UX_FLOWS.md`](UX_FLOWS.md) | Navigation, route map, journeys, recovery behavior, states, and analytics |
| [`GAME_TAXONOMY.md`](GAME_TAXONOMY.md) | Catalog model, filters, matching, ranking, random, vote, popularity, recommendations, and seed slate |
| [`UI_DIRECTION.md`](UI_DIRECTION.md) | Approved Table Notes visual thesis, typography, color, imagery, and motion |
| [`UI_SPEC.md`](UI_SPEC.md) | Screen-level responsive and accessible interaction specification |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Approved technical shape, agent-execution architecture, service boundaries, free-tier constraints, operations, and scaling |
| [`DATA_MODEL.md`](DATA_MODEL.md) | Conceptual schema, invariants, indexes, provenance, retention, and ER diagram |
| [`SAFETY_AND_PRIVACY.md`](SAFETY_AND_PRIVACY.md) | Game Night safety model, minors, privacy, moderation, security, and launch gates |
| [`MVP_BACKLOG.md`](MVP_BACKLOG.md) | Sequenced vertical slices, subagent workflow, dependencies, effort, acceptance, and release gates |
| [`DECISION_LOG.md`](DECISION_LOG.md) | Confirmed product and orchestration decisions, assumptions, recommendations, blockers, and optional proposals |
| [`ITERATION_LOG.md`](ITERATION_LOG.md) | The three requested critique-and-revision passes plus the later orchestration addendum |
| [`SHA256SUMS.txt`](SHA256SUMS.txt) | SHA-256 integrity hashes for every packaged file except the checksum file itself |
| [`PACKAGE_MANIFEST.json`](PACKAGE_MANIFEST.json) | Machine-readable package contents and orchestration metadata |

## How GPT5.6-Sol High should use this package

1. Read `AGENTS.md`, this index, and `DECISION_LOG.md` before planning work.
2. Read the feature-specific documents named by the context matrix in `AGENTS.md`.
3. Inspect repository reality before proposing a change; do not invent files, commands, versions, or APIs.
4. Produce a dependency-aware task graph and bounded task packets in Sol High.
5. Delegate implementation only to the approved model list.
6. Require a fresh Luna XHigh tester for formal acceptance.
7. Delegate every Git/GitHub command and action to the Luna XHigh Git Steward.
8. Synthesize one final result and report exact verification and remaining risk.

Codex or any subagent must not invent a different game model, vote method, ranking rule, event-safety model, visual direction, vendor constraint, or model-routing policy merely because a starter framework or local pattern suggests one.

The first implementation action after explicit authorization should be repository orientation and a planning-only branch/commit/PR containing this package, executed by the Luna XHigh Git Steward. Application initialization remains a separate authorized change.
