# Game Portal — Decision Log

**Last updated:** 2026-07-17  
**Owner:** Product owner  
**Repository target:** `AkshayMantri/GamePortal`

Statuses:

- `CONFIRMED`
- `ASSUMED`
- `RECOMMENDED—AWAITING APPROVAL`
- `PROPOSED—NOT IN SCOPE`
- `BLOCKED`

# Confirmed

| ID | Decision | Rationale / consequence |
|---|---|---|
| D-001 | Product is strictly non-commercial | No ads, payments, affiliate links, paid benefits, or fundraising; source licenses reviewed on that basis |
| D-002 | Anyone may use the application | Core discovery is public and guest-first |
| D-003 | Game Night is not adult-only | Requires age-safe guest/adult-mediated participation and legal review |
| D-004 | Accounts are optional and intended for adults | Core use remains account-free; no child accounts |
| D-005 | Initial catalog is approximately 20 Games | Enables manual verification and static-first delivery |
| D-006 | Product includes Browse as a first-class collection experience | Find and Browse are peer paths |
| D-007 | Domain model is Game → Edition/Variant → Play Mode → Access Option | Prevents false compatibility across adaptations |
| D-008 | Group Vote uses approved Borda variant | Partial-ballot and tie rules are fixed in requirements |
| D-009 | Time filter uses setup/access + teaching + upper play time | Conservative fit interpretation |
| D-010 | Recommendations, Popular, and Game Night ship in initial release | Backlog sequences full vertical slices before launch |
| D-011 | Visual direction is Table Notes | UI must preserve tactile editorial warmth and accessibility |
| D-012 | Recents are 90 days; played is explicit; raw vote retention is 30 days | Data model and retention jobs reflect this |
| D-013 | Popular threshold starts at 1 | Every ranked item exposes count/low-sample status |
| D-014 | Solo build with Codex + ChatGPT Pro and free resources | Architecture prioritizes static content and bounded dynamic work |
| D-015 | Astro + TypeScript, React islands, Cloudflare, D1, GitHub | Approved technical family |
| D-016 | Cloudflare deployment uses Workers with static assets | Current Astro 6 adapter no longer supports the previous Pages on-demand path |
| D-017 | Random is uniform over unique eligible Games | No popularity, personalization, provider, or sponsorship weighting |
| D-018 | Default QR points to canonical Game Portal page | Access Option QR is separate and labeled |
| D-019 | Default matching separates exact, uncertain, near, and excluded | Unknown never silently passes a strict filter |
| D-020 | Public Game Night supports remote and public-venue in-person modes | Private residences and private-home addresses excluded |
| D-021 | No event chat, DMs, public attendee list, ticketing, or payments | Reduces moderation, privacy, and free-tier risk |
| D-022 | Root orchestrator is GPT5.6-Sol at High reasoning | One authoritative agent owns intake, decomposition, synthesis, and final review |
| D-023 | All planning and planning subagents use Sol High | Product, architecture, UX, security, accessibility, migration, and remediation planning cannot be delegated to lower reasoning |
| D-024 | Implementation may use only Luna XHigh, Terra High, Terra XHigh, Sol Medium, or Sol High | The orchestrator routes by risk and coupling; no unapproved implementation model |
| D-025 | Formal tester is a fresh Luna XHigh subagent | Independent acceptance cannot be performed by the implementation context |
| D-026 | Every Git and GitHub action uses a dedicated Luna XHigh Git Steward | Includes read-only status/diff/history, branches/worktrees, commits, pushes, PRs, and checks |
| D-027 | Planning, implementation, formal testing, Sol High review, and Git delivery are separate gates | Prevents self-approval and preserves auditable ownership |
| D-028 | Mandatory model roles cannot be silently substituted or downgraded | Unavailable mandatory lanes are reported as blocked rather than weakened |
| D-029 | Formal verification includes task-level checks and an integrated-candidate regression before push/PR delivery | Prevents individually valid worktrees from producing a broken combined change |

# Assumptions

| ID | Assumption | Validation |
|---|---|---|
| A-001 | English-first UI with localization-ready model | Revisit before adding a second authored language |
| A-002 | Under-13 participation is adult-mediated and does not create a child record | Legal review before public launch |
| A-003 | Ages 13–17 may use bounded guest capabilities | Legal/privacy and usability review |
| A-004 | Public venue means a publicly accessible non-residential location that permits the gathering | Policy and validation design |
| A-005 | Version-controlled catalog is source of truth; D1 holds mutable data | Validate during repository initialization |
| A-006 | A passkey + recovery-code account is viable without paid email | Browser/usability test before account beta |
| A-007 | First-party raw analytics can be retained 30 days | Privacy review and quota observation |
| A-008 | Daily link checking is sufficient for the small destination set | Measure failures and operator needs |
| A-009 | GitHub and Cloudflare free allowances are sufficient for early use | Monitor quotas and recheck terms before launch |

# Recommended—awaiting approval

These are implementation-detail decisions that can be accepted during repository initialization without changing the product definition.

| ID | Recommendation | Tradeoff |
|---|---|---|
| R-001 | Use `pnpm` as package manager | Adds one tool choice but improves disk and lockfile behavior |
| R-002 | Use passkeys with hashed recovery codes for accounts | No paid email/password burden; recovery is less familiar |
| R-003 | Use local JSON/YAML or Astro content collections for catalog | Editorial deploy required for catalog changes |
| R-004 | Keep Find filtering client-side for ~20 Games | Simple/fast now; later migration needed for a much larger catalog |
| R-005 | Use 2–3 second conditional polling for active Vote/Event pages | Simpler than realtime sockets; modest repeated requests |
| R-006 | Retain raw product analytics 30 days and aggregates 13 months | Needs review if data proves unnecessary |
| R-007 | Use Fraunces/Literata + Noto Sans/Source Sans 3 candidates | Final font/license/language testing still required |
| R-008 | Default to bounded task packets, one write owner per file, and at most three parallel implementation agents | Reduces conflicts while retaining useful concurrency |
| R-009 | Use isolated Git worktrees for parallel implementation when tasks are genuinely disjoint | Adds workspace management but protects user changes and integration clarity |

# Bootstrap implementation decisions — 2026-07-17

The explicit implementation authorization accepted the authorized bootstrap defaults and permits low-risk, reversible technical choices. These records resolve R-001 and R-003 for the bootstrap without changing product scope.

| ID | Decision | Rationale / consequence |
|---|---|---|
| I-001 | Use pnpm 11.13.1 and a package-manager-generated lockfile | Resolves R-001 and fixes a reproducible package-manager baseline |
| I-002 | Baseline Node.js 24.18.0, Astro 7.1.0, React 19.2.7, and `@astrojs/cloudflare` 14.1.3 | Current compatible releases under D-015/D-016; exact versions require independent build and Worker verification |
| I-003 | Keep Astro static by default; future dynamic routes opt out of prerendering explicitly | Preserves NFR-06 static degradation and free-tier asset-first behavior |
| I-004 | Use version-controlled JSON catalog records with shared Zod build/runtime validation | Resolves R-003 for cross-entity ownership, invalid fixtures, and fail-closed publication/provenance gates |
| I-005 | Use `wrangler.jsonc` and explicit local/no-provision bootstrap commands | Prevents unauthorized remote resource creation or deployment |
| I-006 | Pin TypeScript 6.0.3 rather than current 7.0.2 | Selected `typescript-eslint` compatibility is `<6.1`; avoids an unsupported lint/type toolchain |
| I-007 | Keep `@astrojs/cloudflare` pinned but inactive while every route is static | Adapter 14.1.3 injected unapproved Session KV and Images bindings when activated; static Workers assets need no adapter, and activation returns to Sol High before the first on-demand route |
| I-008 | Use ESLint 9.39.2 with `eslint-plugin-astro` 1.7.0 and `eslint-plugin-jsx-a11y` 6.10.2 | Astro plugin 3 requires ESLint 10 while JSX-a11y 6.10.2 supports only through ESLint 9; this is the newest mutually declared compatible lint matrix without peer overrides |
| I-009 | Publish only two bootstrap proof records, Chess and Go, and leave the other 18 candidate slots unrepresented | Primary FIDE/BGA sources, original summaries, explicit unknown age/time, and local neutral media prove the full catalog contract without fabricating the target seed slate |
| I-010 | Use a binding-only local D1 database for append-only link observations and a current-status projection | Installed Wrangler 4.111 accepts a binding without a remote ID; all commands require `--local`, and no account, vote, event, or analytics tables are introduced speculatively |
| I-011 | Treat `PACKAGE_MANIFEST.json` and `SHA256SUMS.txt` as a scoped repository authority snapshot | The original archive manifest became stale after authorized decision updates and the AGENTS.md checksum waiver; the repository now verifies the current authority files deterministically without pretending to inventory application code |

# Blocked / launch gates

| ID | Blocker | Resolution owner |
|---|---|---|
| B-001 | Jurisdiction-specific review of minor participation and COPPA implications | Product owner + qualified legal review |
| B-002 | BoardGameGeek non-commercial application authorization if its data is used | Product/content |
| B-003 | Rights verification for every non-original field, image, rule source, and video | Content/rights |
| B-004 | Public-event moderation capacity and response expectations | Product owner/operator |
| B-005 | Passkey recovery usability | Design/engineering test |
| B-006 | Public-venue validation and prohibited-location enforcement | Safety/product |
| B-007 | Seed catalog completeness and access-option verification | Content/engineering |

# Proposed—Not in scope

These proposals remain isolated and must not enter MVP navigation, requirements, or architecture assumptions without approval.

| ID | Proposal | User value | MVP impact | Complexity | Risk | Recommendation |
|---|---|---|---|---:|---|---|
| OP-01 | Saved group setups | Restores common player/device/time constraints | New persistence/UI | M | May retain age or device context | Consider after usage evidence |
| OP-02 | Accessibility play-needs taxonomy | Helps groups find games compatible with sensory/motor/cognitive needs | Requires verified data | L | Incorrect accessibility claims | Research later; high potential value |
| OP-03 | Compare up to three Games | Supports deliberate group choice | New comparison state | M | Metadata density and slowed path | Add only if research shows repeated switching |
| OP-04 | Public user correction reports | Speeds detection of stale data | Abuse/triage workflow | M | Spam and malicious URLs | Consider after operations are staffed |
| OP-05 | Event waitlist/calendar/reminders | Improves event attendance | Expands lifecycle and notification obligations | L | Privacy/deliverability/fatigue | Defer |
| OP-06 | Private invite-only Game Nights | Supports existing groups | Visibility/invite/revocation | M | Link leakage expectations | Consider before broader event expansion |

# Remaining approval checklist

The model-routing and role-separation policy in `AGENTS.md` is confirmed. Before implementation begins, confirm these remaining implementation details:

- [x] `pnpm` package manager — accepted for bootstrap as I-001.
- [ ] Passkey + recovery-code account design.
- [x] Catalog file format — version-controlled JSON plus Zod, accepted for bootstrap as I-004.
- [ ] Exact initial font pair after language/license test.
- [ ] Analytics retention of 30 days.
- [ ] Public-event legal review path.
- [ ] BoardGameGeek use or no-use decision after authorization request.
- [ ] Operator moderation response expectations.

# Change-control rule

Any change to:

- game/access-option ownership,
- filter semantics,
- Borda scoring,
- random weighting,
- Popular signal meaning,
- minor participation,
- private-location policy,
- non-commercial status,
- visual direction,
- free-tier vendor constraint,
- mandatory model routing or reasoning level,
- independent Luna XHigh test ownership,
- Luna XHigh-only Git/GitHub ownership,

requires a dated decision-log update before implementation.
