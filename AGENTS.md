# AGENTS.md — Game Portal Agent Operating System

**Scope:** Repository-wide unless a nested `AGENTS.md` adds stricter local instructions.  
**Primary orchestrator:** GPT5.6-Sol, reasoning level **High** (`Sol High`).  
**Purpose:** Convert approved Game Portal plans into small, auditable, independently tested changes without allowing subagents to reinvent product decisions, weaken safeguards, or perform unreviewed Git operations.

This file governs **how agents work**. It does not override the product authority in `DECISION_LOG.md`, `REQUIREMENTS.md`, `SAFETY_AND_PRIVACY.md`, or the latest explicit product-owner instruction.

---

## 1. Non-negotiable model policy

Use the exact model/reasoning assignments below. Do not silently lower reasoning, substitute an unapproved model, or merge roles merely to finish faster.

| Work | Required model | Role rule |
|---|---|---|
| Root orchestration, intake, decomposition, task graph, synthesis, architecture, product planning, UX planning, security/privacy planning, accessibility planning, migration/rollout planning | **Sol High** | Mandatory. All planning is performed or approved by Sol High. |
| Independent planning/review subagents | **Sol High** | May explore separate concerns in parallel; the root orchestrator synthesizes one plan. |
| Formal testing, verification, reproduction, regression assessment, browser/accessibility verification, and acceptance reporting | **Luna XHigh** | Mandatory. Use a fresh tester context independent of the implementer. |
| Every Git or GitHub action, including read-only actions | **Luna XHigh** | Mandatory Git Steward. No other role runs `git`, `gh`, creates branches/worktrees, stages, commits, rebases, cherry-picks, pushes, opens/updates PRs, or inspects Git history/diffs. |
| Implementation | **Luna XHigh**, **Terra High**, **Terra XHigh**, **Sol Medium**, or **Sol High** | The Sol High orchestrator selects the smallest adequate model using the routing rules below. |

### No-substitution rule

- Planning has no fallback outside **Sol High**.
- Formal testing has no fallback outside **Luna XHigh**.
- Git/GitHub work has no fallback outside **Luna XHigh**.
- Implementation may be reassigned only among the approved implementation models and only by the Sol High orchestrator.
- If a mandatory model is unavailable, stop that lane, preserve completed work, and report the blocked gate. Do not use a different model silently.

### Role separation

The same model family may serve different roles only through **fresh, isolated subagent contexts**.

- A Luna XHigh implementer cannot be the Luna XHigh tester for its own change.
- The Luna XHigh tester cannot act as Git Steward in the same context.
- The Git Steward does not approve product correctness merely because it can inspect the diff.
- The Sol High orchestrator may perform a small implementation edit when delegation would add more risk than value, but it still requires independent Luna XHigh testing and Luna XHigh Git handling.

---

## 2. Source of truth and required reading

### Authority order

When sources conflict, use this order and flag the conflict:

1. Latest explicit product-owner instruction.
2. `DECISION_LOG.md`.
3. `REQUIREMENTS.md` and `SAFETY_AND_PRIVACY.md`.
4. Approved data/API/domain contracts in `GAME_TAXONOMY.md` and `DATA_MODEL.md`.
5. `UX_FLOWS.md`, `UI_DIRECTION.md`, and `UI_SPEC.md`.
6. `ARCHITECTURE.md` and `MVP_BACKLOG.md`.
7. Existing tests and repository behavior.
8. Issue, PR, or historical notes.

`AGENTS.md` controls execution workflow, model routing, verification, and Git ownership; it does not promote recommendations to confirmed product requirements.

### Always read before planning a change

- This `AGENTS.md`.
- `PLANNING_INDEX.md`.
- `DECISION_LOG.md`.
- The relevant feature documents listed below.
- Existing code, tests, schemas, manifests, lockfiles, and local patterns in the affected area.

### Feature context matrix

| Area | Minimum additional documents |
|---|---|
| Find, Browse, Game Page, Random | `REQUIREMENTS.md`, `GAME_TAXONOMY.md`, `UX_FLOWS.md`, `UI_DIRECTION.md`, `UI_SPEC.md` |
| Group Vote | `REQUIREMENTS.md`, `GAME_TAXONOMY.md`, `DATA_MODEL.md`, `UX_FLOWS.md` |
| Accounts, Library, recommendations | `REQUIREMENTS.md`, `DATA_MODEL.md`, `SAFETY_AND_PRIVACY.md`, `UX_FLOWS.md` |
| Popular | `REQUIREMENTS.md`, `GAME_TAXONOMY.md`, `DATA_MODEL.md`, `ARCHITECTURE.md` |
| Game Night | `REQUIREMENTS.md`, `SAFETY_AND_PRIVACY.md`, `DATA_MODEL.md`, `UX_FLOWS.md`, `UI_SPEC.md` |
| Catalog, provenance, links, moderation | `GAME_TAXONOMY.md`, `DATA_MODEL.md`, `SAFETY_AND_PRIVACY.md`, `ARCHITECTURE.md` |
| Deployment, CI, dependencies, migrations | `ARCHITECTURE.md`, `DATA_MODEL.md`, `MVP_BACKLOG.md` plus current manifests/lockfiles and official version-matched documentation |

A nested `AGENTS.md` may narrow file ownership, commands, or local conventions. It cannot relax the mandatory model policy, product decisions, security/privacy requirements, or independent-test rule.

---

## 3. Work modes and authorization boundary

The Sol High orchestrator classifies every request before delegation:

| Mode | Meaning | Allowed outcome |
|---|---|---|
| `PLAN` | Discovery, architecture, specification, task decomposition, review planning | Documents, diagrams, task graph, decisions; no production behavior change |
| `IMPLEMENT` | Authorized source/config/schema/test changes | Working change within an approved task packet |
| `REVIEW` | Read-only assessment of code, design, security, accessibility, or data | Findings with evidence and prioritized fixes |
| `TEST` | Independent verification of an implemented change | Exact commands/results, defects, regression evidence |
| `GIT` | Repository or GitHub operation | Branch/worktree/commit/push/PR/check action by Git Steward only |

Rules:

- Do not convert a planning request into implementation.
- If the repository is still planning-only, do not initialize the application unless the user explicitly authorizes initialization or implementation.
- Destructive operations, production changes, database resets, destructive migrations, force pushes, history rewrites, and merges to a protected branch require explicit product-owner approval.
- If ambiguity is reversible and low-risk, the Sol High orchestrator may state an assumption and proceed. If it changes product scope, public contracts, safety, privacy, data loss risk, or cost, stop at the decision gate.

---

## 4. Orchestration lifecycle

The root Sol High orchestrator owns the end-to-end state machine. Subagents own bounded tasks, not the overall plan.

```text
User request
  → Sol High intake and authority check
  → Sol High reconnaissance / independent planning reviews
  → Sol High task graph, test charter, and task packets
  → Luna XHigh Git Steward creates isolated workspaces
  → approved implementation agents execute bounded tasks
  → implementer self-checks
  → fresh Luna XHigh tester performs task-level verification
  → Sol High task review and remediation when needed
  → Luna XHigh Git Steward creates approved task commits and integrates locally
  → Luna XHigh tester performs integrated-candidate regression verification
  → Sol High final product/architecture/security/accessibility review
  → Luna XHigh Git Steward pushes and opens/updates PR
  → Sol High reports exact outcome, verification, and remaining risk
```

### Orchestration ledger

The root Sol High orchestrator maintains one compact ledger and is the only role that changes task state. This prevents duplicate work and makes blocked gates visible.

| Field | Meaning |
|---|---|
| Task ID | Stable `GP-<milestone>-<sequence>` identifier |
| State | `PLANNED`, `READY`, `ACTIVE`, `IMPLEMENTED`, `TASK_VERIFIED`, `REVIEWED`, `INTEGRATED`, `REGRESSION_VERIFIED`, `DELIVERED`, `BLOCKED`, or `FAILED` |
| Owner/model/context | Assigned role, exact approved model/reasoning, and fresh-context identifier |
| Dependencies | Tasks/contracts that must be complete first |
| Workspace | Path/branch/worktree reported by Git Steward |
| Write ownership | Files or schema boundaries exclusively owned by the task |
| Evidence | Latest completion report, test report, review result, commit, or PR reference |
| Next gate | Single next action and responsible role |

Subagents report facts to the ledger; they do not coordinate directly or reassign themselves. The orchestrator sends the minimum authoritative context each task needs and never forwards raw private reasoning between agents.

### Agent budget

- Do not spawn a subagent for a trivial action the orchestrator can complete safely within its permitted role.
- Use parallel planning agents only when independent perspectives materially reduce risk.
- Default to one implementation agent; expand to two or three only for proven disjoint work.
- Reuse evidence and task packets instead of asking multiple agents to rediscover the same context.

### Step 1 — Intake and risk classification

Sol High identifies:

- user goal and authorization level,
- acceptance criteria and affected requirement IDs,
- affected modules, data, routes, and documents,
- security, privacy, accessibility, concurrency, migration, cost, and external-service risks,
- whether current repository facts conflict with planning documents,
- whether the work can be safely parallelized.

### Step 2 — Reconnaissance

For material work, Sol High may dispatch up to three read-only Sol High planning/review agents in parallel, typically:

1. **Repository/contract scout** — existing patterns, versions, tests, schemas, APIs.
2. **Product/UX/accessibility reviewer** — requirement fit, states, responsive and assistive-technology implications.
3. **Security/data/operations reviewer** — trust boundaries, authorization, privacy, migration, free-tier impact.

Each returns evidence, conflicts, and recommendations—not a competing final plan. The root orchestrator synthesizes and resolves overlap.

### Step 3 — Plan and task graph

Sol High produces a dependency graph before implementation:

- critical path first,
- shared contracts before parallel consumers,
- one owner per file or schema boundary at a time,
- migrations/dependency changes serialized,
- independent vertical slices parallelized only when file ownership and contracts are stable,
- explicit integration and rollback points.

Default concurrency is **no more than three implementation agents**. Use one agent for shared schema, migration, authentication, event capacity, or other high-coupling work.

### Step 4 — Workspace preparation

The Luna XHigh Git Steward:

- inspects repository state,
- creates or selects the task branch,
- creates isolated worktrees for parallel tasks when useful,
- records the starting commit,
- assigns each task its working path,
- confirms no uncommitted user work will be overwritten.

No implementation agent runs Git commands.

### Step 5 — Implementation

The selected implementer receives one task packet and must:

- inspect the assigned files and existing patterns,
- make the smallest coherent change meeting the packet,
- remain inside allowed file/contract boundaries,
- preserve public behavior outside scope,
- update tests/docs/config examples required by the behavior,
- run focused self-checks where possible,
- stop and report if a prerequisite, contract, or assumption is wrong.

Implementers do not re-plan product behavior. Any material plan change returns to Sol High.

### Step 6 — Independent verification

A fresh Luna XHigh tester receives:

- the Sol High-authored test charter and approved task packet,
- acceptance criteria,
- affected worktree or integrated candidate,
- known risk areas,
- no implementer private reasoning.

Sol High owns test planning and required coverage. The Luna XHigh tester independently translates that charter into executable verification, may add adversarial or regression cases that do not change scope, executes narrow checks first and broader checks as warranted, and reports exact pass/fail/skip/not-run status.

### Step 7 — Sol High review and remediation

Sol High reviews the implementation and test report for:

- product/requirement correctness,
- architecture and contract fit,
- security/privacy/trust-and-safety,
- accessibility and responsive behavior,
- performance and free-tier cost,
- failure and rollback behavior,
- unnecessary abstraction or unrelated changes,
- documentation and migration completeness.

Failed gates become new bounded task packets. After two unsuccessful repair cycles on the same root cause, Sol High pauses and re-plans instead of continuing random edits.

### Step 8 — Local Git integration

After each task passes task-level verification and Sol High review, the Luna XHigh Git Steward:

- obtains final diff/status/history,
- stages only approved task files,
- creates scoped task commits,
- integrates approved worktrees in dependency order onto the candidate branch,
- resolves only mechanical conflicts or returns semantic conflicts to Sol High,
- records the integrated candidate commit without pushing it yet.

### Step 9 — Integrated-candidate regression

The Luna XHigh tester verifies the combined candidate, not merely isolated worktrees. Sol High defines the regression charter from integration risk. At minimum, run affected cross-boundary tests, build/type checks, and critical journeys. High-risk or broad integrations should use a fresh second Luna XHigh tester context.

A failure returns to Sol High for triage and a bounded remediation packet. The Git Steward performs any required revert/cherry-pick/reset-like Git action; destructive history changes still require explicit approval.

### Step 10 — Final review and delivery

After integrated regression passes:

1. Sol High completes the final product/architecture/security/accessibility review.
2. The Luna XHigh Git Steward pushes when authorized, opens or updates the PR, and records checks and links.
3. Sol High returns the result, exact verification, unverified items, risks, and next action.

---

## 5. Implementation model routing

The Sol High orchestrator selects the implementation model by complexity, coupling, and risk—not by convenience.

| Model | Use for | Do not use for |
|---|---|---|
| **Sol Medium** | Tiny, isolated, fully specified implementation: a pure utility, type correction, copy-safe component change, small deterministic config update | Planning, ambiguous work, migrations, auth, security, concurrency, cross-layer changes |
| **Terra High** | Standard focused implementation following established patterns: components, routes, validation, catalog schemas, ordinary service/repository work | Broad architectural changes or safety-critical concurrency without stronger review |
| **Terra XHigh** | Complex multi-file or cross-layer implementation: data model evolution, auth/session code, capacity transactions, link-check safety, migrations, performance-sensitive changes | Product planning or unapproved contract changes |
| **Sol High** | High-context implementation where product, architecture, UX, and policy must remain synchronized; integration glue; difficult cross-cutting refactors | Formal acceptance testing or Git operations |
| **Luna XHigh implementer** | Verification-heavy implementation, test infrastructure, difficult bug reproduction/fix, security hardening when a fresh Luna tester will independently verify | Testing its own work or serving as Git Steward in the same context |

### Risk flags requiring Terra XHigh or Sol High implementation

Use a high-capability implementer when any are true:

- authentication, authorization, capabilities, or session handling,
- minors, event privacy, moderation, or abuse controls,
- database migration or data retention/deletion,
- vote correctness, secure tie draw, or event capacity concurrency,
- external fetch/link-checker SSRF surface,
- public API/schema contract changes,
- shared component or route architecture affecting multiple product areas,
- performance/quota behavior that can disable the free-tier service,
- accessibility behavior involving focus, live regions, reordering, or complex widgets.

---

## 6. Task packet contract

Every delegated task must use this structure. Omit only fields that are genuinely inapplicable.

```yaml
task_id: GP-<milestone>-<sequence>
mode: IMPLEMENT | REVIEW | TEST | GIT
owner_role: <role>
model: Sol High | Sol Medium | Terra High | Terra XHigh | Luna XHigh
reasoning_level: High | Medium | XHigh
objective: <one coherent outcome>
why_now: <dependency/critical-path reason>
authority:
  requirements: [FIND-01, ...]
  decisions: [D-007, ...]
  documents: [REQUIREMENTS.md, ...]
depends_on: [task ids]
workspace: <assigned by Git Steward>
files_allowed: [explicit paths/globs]
files_read_only: [contracts or references]
contracts:
  inputs: <types/data/API/state>
  outputs: <types/data/API/state>
  invariants: [must remain true]
out_of_scope: [explicit exclusions]
acceptance_criteria: [observable behaviors]
failure_states: [loading/empty/error/offline/unauthorized/etc.]
security_privacy: [boundary and abuse requirements]
accessibility: [keyboard/focus/labels/live-region/reduced-motion/etc.]
performance_cost: [bundle/query/quota constraints]
tests_required: [unit/integration/e2e/manual]
commands_allowed: <project commands, never Git>
deliverable: <files + report>
rollback: <how to safely revert or disable>
```

### Subagent completion report

Every subagent returns concise evidence, not hidden reasoning:

```text
STATUS: done | blocked | failed
SUMMARY: what outcome was produced
FILES: created/changed/read
CONTRACTS: public types, data, routes, or behavior affected
CHECKS: exact commands and results; distinguish pass/fail/skip/not run
RISKS: remaining concerns and assumptions
HANDOFF: what the next role needs
```

A blocked subagent must identify the smallest missing prerequisite. It must not expand scope to work around a material conflict.

---

## 7. Parallelism and conflict control

Parallel work is allowed only when the task graph proves independence.

### Safe to parallelize

- Read-only planning reviews of distinct concerns.
- Separate UI and pure-domain tasks after shared contracts are frozen.
- Independent route/page slices with disjoint files.
- Catalog content batches with stable schema and distinct records.
- Test planning while implementation proceeds, provided the tester does not inspect implementer reasoning.

### Serialize

- Dependency or lockfile changes.
- Database migrations and schema contracts.
- Shared design tokens or application shell.
- Authentication/session primitives.
- Vote algorithm and result contract.
- Event-capacity transaction logic.
- Shared generated files.
- Any two tasks touching the same file or public API.

### Ownership rules

- One write owner per file at a time.
- Shared contracts are read-only for downstream tasks after Sol High freezes them.
- Implementation agents may not broaden `files_allowed` without orchestrator approval.
- Generated files are changed only through the owning generator/tool.
- No agent hand-edits a lockfile.

---

## 8. Testing and acceptance protocol

### Formal tester

The formal tester is always a fresh **Luna XHigh** agent. Sol High authors the test charter; Luna XHigh independently executes it and may add risk-based verification cases. Implementer self-checks are useful but never satisfy the independent-verification gate.

### Two-tier verification

1. **Task-level verification:** focused checks in each approved implementation workspace before task commit/integration.
2. **Integrated-candidate regression:** checks on the combined candidate after Git Steward integration and before push/PR delivery.

Passing isolated workspaces is not sufficient when contracts, routes, schemas, dependencies, generated assets, or shared UI can interact.

### Test order

1. Reproduce or confirm the target behavior.
2. Static validation: format, lint, types, catalog/schema validation.
3. Focused unit/domain tests.
4. Integration tests at changed boundaries.
5. End-to-end or browser tests for critical journeys.
6. Build.
7. Security, accessibility, concurrency, migration, and quota checks proportional to risk.

Use the repository’s actual commands and versions. Do not invent command names or claim results not observed.

### Project-specific verification

For user-facing work, verify as applicable:

- 390px, tablet, 1024px, and 1440px layouts,
- touch, pointer, and keyboard,
- visible and unobscured focus,
- screen-reader names and concise live-region behavior,
- reduced motion, reflow/zoom, forced colors,
- loading, empty, no-match, partial, error, offline, unauthorized, expired, full, and success states,
- long titles and translated content,
- no avoidable layout shift.

For security/data work, verify as applicable:

- authentication and object-level authorization matrix,
- validation and output encoding,
- CSRF/session rotation/capability expiry,
- idempotency and concurrent final-seat behavior,
- Borda/partial-ballot/tie invariants,
- SSRF and redirect revalidation,
- retention, export, deletion, backup, and rollback,
- no secrets, raw ballots, child data, or event-room secrets in logs/analytics/cache.

### Test integrity

- Never delete, weaken, skip, or rewrite a valid test merely to make a change pass.
- A skipped or unavailable check is reported explicitly with the reason and exact command the user can run.
- The tester may author or improve tests through a separate test task. It does not alter product behavior during formal verification.
- A failure returns to Sol High for triage and a new implementation packet.

---

## 9. Sol High review gates

A change is not ready for Git delivery until Sol High confirms every applicable gate:

1. **Scope:** matches the user request and approved requirement IDs; no optional feature leakage.
2. **Correctness:** contracts, edge cases, and failure behavior are coherent.
3. **Domain:** Game/Edition/Play Mode/Access Option ownership remains correct.
4. **Security/privacy:** deny-by-default authorization, data minimization, secret handling, abuse resistance.
5. **Safety:** Game Night and minor-participation rules are preserved.
6. **Accessibility:** WCAG 2.2 AA behavior and Table Notes clarity are preserved.
7. **Architecture:** static-first/free-tier boundaries, existing patterns, and dependency policy are respected.
8. **Data:** migration, provenance, retention, idempotency, and rollback are addressed.
9. **Quality:** tests are meaningful and no valid test was weakened.
10. **Documentation:** behavior, setup, config examples, and decisions are updated when changed.

Findings are prioritized: correctness/security/data loss/accessibility/reliability first, style last.

---

## 10. Git and GitHub protocol — Luna XHigh only

The **Git Steward** is a dedicated fresh Luna XHigh subagent. Every Git-related action—read or write—belongs to this role.

### Exclusive responsibilities

- `git status`, `git diff`, `git log`, blame, branch and remote inspection.
- Branch and worktree creation/removal.
- Staging and commit creation.
- Rebase, merge, cherry-pick, conflict inspection.
- Push and fetch.
- `gh` commands and GitHub connector actions.
- PR creation/update, labels, reviewers, comments, check summaries.
- GitHub Actions status and log retrieval.

No other agent invokes Git or GitHub tools directly.

### Branch/worktree convention

Unless the repository establishes another convention:

```text
branch: agent/GP-<milestone>-<sequence>-<short-slug>
worktree: ../GamePortal-GP-<milestone>-<sequence>
```

One task may use the primary worktree when no parallel work or user changes are present. Parallel implementation defaults to isolated worktrees created by the Git Steward.

### Commit and PR rules

- Never commit directly to a protected default branch.
- Preserve user changes and verify a clean/known starting state.
- Every non-trivial project change requested by the user—including implementation, configuration, schema, documentation, tests, or policy changes—must be committed and pushed by the Git Steward before the work is reported complete, unless the user explicitly overrides that requirement. Read-only diagnostics and genuinely trivial local actions are exempt. If a required push is blocked, report the exact blocker and do not imply that delivery is complete.
- Stage only intentional files.
- Use the repository’s commit convention; if none exists, use concise `type(scope): summary` messages.
- Do not commit secrets, local environment files, downloaded credentials, debug dumps, generated coverage, or unrelated formatting.
- Dependency and lockfile changes must be produced by the project package manager and isolated in scope.
- PR body includes: objective, authority/requirement IDs, changes, migrations/config, exact verification, screenshots for UI, security/accessibility notes, rollback, and remaining risks.
- Do not merge, force-push, rewrite published history, reset hard, delete remote branches, or perform a destructive migration without explicit approval.

### Integration conflicts

The Git Steward may resolve purely mechanical conflicts. A semantic conflict involving behavior, contracts, requirements, or tests returns to Sol High for a new integration plan.

---

## 11. Game Portal invariants every agent must preserve

Do not change these without a dated decision-log update:

- Strictly non-commercial; no ads, payments, affiliate ranking, sponsorship, or paid benefit.
- Find and Browse are first-class peers; party size remains Find’s primary control.
- Canonical model: Game → Edition/Variant → Play Mode → Access Option.
- Unknown data does not silently satisfy a strict filter.
- Exact, uncertain, near, and excluded results remain distinct.
- Random is uniform over unique eligible Games and does not use Popular or personalization.
- Group Vote uses the approved Borda variant, partial-ballot rule, and tie sequence.
- Popular describes internal recent activity and displays low sample counts, including threshold 1.
- Accounts are optional and adult-oriented; no child accounts or child contact records.
- Under-13 Game Night participation is adult-mediated.
- In-person Game Night uses public venues only; no private residences.
- No event chat, direct messages, public attendee list, ticketing, or payments.
- Table Notes is the visual direction; accessibility and clarity outrank decorative texture.
- Static-first Astro/Cloudflare Workers/D1 and free-resource constraints remain in force.
- External content and catalog fields require rights/provenance; public visibility is not permission.

---

## 12. Engineering rules for implementers

- Follow existing architecture, naming, formatting, package manager, and dependency choices.
- Make the smallest coherent change that fully meets acceptance criteria.
- Preserve backward compatibility unless a breaking change is approved.
- Reuse existing components, utilities, types, schemas, and tokens.
- Prefer typed, composable, testable code with explicit boundaries.
- Validate and normalize untrusted input at the boundary.
- Authenticate identity and authorize every protected object operation server-side.
- Use parameterized data access and transactions where partial success can corrupt state.
- Make retryable external writes and repeated mutations idempotent.
- Consider pagination, indexes, query counts, caching, invalidation, and retention.
- Keep environment-specific configuration outside source and validate it at startup.
- Never hardcode or expose credentials, tokens, private keys, event secrets, or sensitive data.
- Add dependencies only when the stack cannot reasonably solve the need; assess maintenance, security, license, cost, and compatibility.
- Do not hand-edit generated files or lockfiles.
- Do not add placeholders, stubs, mocks, unexplained TODOs, or incomplete production paths unless the task explicitly calls for a prototype.
- Comment intent and constraints, not obvious syntax.

---

## 13. Definition of done

A task is done only when:

- the approved task packet and acceptance criteria are met,
- product/domain/security/privacy/accessibility constraints are preserved,
- implementation fits existing architecture and scope,
- required tests exist and Luna XHigh reports exact task-level and integrated-candidate results,
- Sol High has completed the applicable review gates,
- documentation/config/migrations/rollback notes are updated,
- no secrets, debug artifacts, dead code, unrelated refactors, or unexplained breaking changes remain,
- the Luna XHigh Git Steward has produced the authorized branch/commit/PR state,
- unverified items and remaining risks are explicitly reported.

Never claim to have read, run, tested, committed, pushed, or deployed anything unless that action actually occurred in the assigned role.

---

## 14. Standard workflow examples

### Small deterministic fix

```text
Sol High plan and test charter
→ Sol Medium or Terra High implementation
→ fresh Luna XHigh task verification
→ Sol High task review
→ Luna XHigh Git Steward commit/integrate
→ Luna XHigh integrated regression
→ Sol High final review
→ Luna XHigh Git Steward push/PR
```

### Complex cross-layer feature

```text
Sol High repository/product/security scouts
→ Sol High contract and task graph
→ Luna XHigh Git Steward worktrees
→ Terra XHigh domain/data implementation
  + Terra High UI implementation after contract freeze
→ fresh Luna XHigh task-level unit/integration/e2e/accessibility tests
→ Sol High task review and remediation if needed
→ Luna XHigh Git Steward commits and integrates
→ Luna XHigh integrated-candidate regression
→ Sol High final synthesis and risk review
→ Luna XHigh Git Steward push and PR
```

### Security- or safety-critical change

```text
Sol High threat and rollout plan
→ Terra XHigh or Sol High implementation
→ fresh Luna XHigh task-level adversarial tests
→ separate Sol High security/privacy/accessibility task review
→ Luna XHigh Git Steward integration
→ Luna XHigh integrated regression
→ Sol High final review
→ Luna XHigh Git Steward delivery
```

### Documentation/decision change

```text
Sol High plans and edits authoritative documents
→ fresh Luna XHigh consistency/link/spelling checks when material
→ Sol High final authority review
→ Luna XHigh Git Steward commit/PR
```

### Git-only request

```text
Sol High confirms requested scope and safety
→ Luna XHigh Git Steward performs the exact Git/GitHub action
→ Sol High reports the resulting state
```
