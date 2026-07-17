# Game Portal — MVP Backlog and Delivery Sequence

**Scope decision:** All named product areas are included in the first public release.  
**Delivery method:** Sequenced vertical slices, not simultaneous partial implementation.  
**Team:** One product owner/developer, orchestrated by GPT5.6-Sol High with bounded implementation subagents, a fresh Luna XHigh tester, and a separate Luna XHigh Git Steward.

# Agent execution policy

Every backlog slice follows the repository `AGENTS.md` contract:

```text
Sol High intake, plan, and test charter
→ Sol High freezes contracts and issues bounded task packets
→ Luna XHigh Git Steward prepares branches/worktrees
→ approved implementation agents execute disjoint tasks
→ fresh Luna XHigh tester performs task-level verification
→ Sol High performs task review
→ Luna XHigh Git Steward commits and integrates locally
→ Luna XHigh tester performs integrated-candidate regression
→ Sol High performs final review
→ Luna XHigh Git Steward pushes and delivers PR state
```

Implementation may use only **Luna XHigh, Terra High, Terra XHigh, Sol Medium, or Sol High**. All planning is **Sol High**. Formal testing and every Git/GitHub action are **Luna XHigh**. No agent formally accepts or publishes its own implementation.

## Per-slice task design

- Prefer one vertical outcome over layers that cannot be exercised independently.
- Freeze shared types, schema, API, state, and accessibility contracts before parallel work.
- Assign one write owner per file at a time.
- Serialize migrations, dependencies/lockfiles, authentication, vote-result contracts, event capacity, and shared application shell changes.
- Default to no more than three concurrent implementers.
- Each packet names requirement IDs, allowed files, non-goals, failure states, security/privacy, accessibility, tests, and rollback.
- A failed formal test becomes a new Sol High remediation packet; agents do not patch randomly.

## Model routing by backlog risk

| Work shape | Default implementation model |
|---|---|
| Tiny deterministic utility/config/type change | Sol Medium |
| Standard component, route, schema, or service using established patterns | Terra High |
| Complex cross-layer/data/auth/concurrency/security change | Terra XHigh |
| High-context integration requiring product/architecture/UX synthesis | Sol High |
| Verification-heavy test infrastructure or difficult bug hardening | Luna XHigh implementer plus a different fresh Luna XHigh tester |

# Critical path

```text
Planning files + safety rules
→ repository/tooling baseline
→ catalog schema + 20 verified Games
→ static Browse/Find/Game Pages
→ matching + Random
→ Vote
→ accounts + Library + recommendations
→ Popular aggregation
→ Game Night + moderation
→ link health + operations
→ accessibility/security/performance release gates
```

Catalog rights and Game Night safety are the highest schedule risks.

# Effort scale

- **S:** focused change, low cross-cutting risk.
- **M:** multiple screens/services or material domain rules.
- **L:** broad vertical slice with integration and operational work.
- **XL:** highest-risk cross-domain slice.

# Milestone 0 — Durable foundation

**Effort:** M  
**Goal:** Convert approved planning into repository authority before application code.

Tasks:

- Add the complete planning package and root `AGENTS.md`.
- Validate that model routing, formal-test independence, and Git ownership are understood before implementation.
- Add contribution and decision-change rules.
- Record architecture decision for Astro/Workers/D1.
- Define issue labels and pull-request checklist.
- Establish no-secrets and non-commercial guardrails.
- Recheck current free-tier and data-license terms.

Exit:

- Documents reviewed.
- No recommendation incorrectly marked confirmed.
- Implementation authorization is explicit.

# Milestone 1 — Project and catalog foundation

**Effort:** L  
**Dependencies:** Milestone 0

Vertical slice:

- Initialize Astro/TypeScript project only after approval.
- Configure Cloudflare Worker local runtime and D1 local database.
- Set formatting, linting, type checking, unit testing, accessibility smoke testing.
- Define version-controlled catalog schemas.
- Add stable IDs and source/rights manifest.
- Curate and verify the first 20 Games.
- Build static catalog validation.
- Create neutral placeholder media system.
- Add basic operations read view for data completeness.

Acceptance:

- Build fails on invalid or incomplete published catalog records.
- Every published field/asset has original status or source claim.
- At least one Access Option per Game.
- No external destination is published without review.
- Static output works with JavaScript disabled.

# Milestone 2 — Browse, Find, and Game Pages

**Effort:** XL  
**Dependencies:** Catalog foundation

Vertical slices:

1. Application shell and responsive navigation.
2. Browse collection.
3. Party-size control.
4. Filter taxonomy and URL state.
5. Exact/uncertain/near matching.
6. Deterministic ranking.
7. Play-slip cards.
8. Game Page and Access Option hierarchy.
9. External-link disclosure.
10. QR behavior.
11. loading/offline/no-result/unavailable states.

Acceptance:

- A 390px user can select party size and open an exact Game Page.
- Browse works without party size.
- No silent filter relaxation.
- Game/access-option distinction is visible.
- Static content remains readable during API failure.
- Keyboard, screen reader, reflow, and reduced-motion tests pass.

# Milestone 3 — Random and Group Vote

**Effort:** L  
**Dependencies:** Matching library and Game Page

Random:

- eligible pool reuse,
- uniform unique-game sampling,
- no repeat,
- pool explanation and invalidation.

Vote:

- catalog/text candidates,
- expected voter count,
- one-time passes,
- accessible ranking,
- approved Borda function,
- partial ballots,
- closure and tie chain,
- result transparency,
- 30-day raw retention.

Acceptance:

- Property-based/domain tests cover scoring and tie cases.
- Statistical test shows no game-level provider bias.
- Host cannot see individual rankings.
- Candidate set cannot mutate after open.
- Repeat submissions are idempotent.

# Milestone 4 — Accounts, Library, and Recommendations

**Effort:** L  
**Dependencies:** D1 and Game Pages

Vertical slices:

- local guest recents/favorites/played,
- passkey registration/sign-in,
- recovery codes,
- account sessions,
- consented local merge,
- synced favorites/recents/played,
- explainable recommendations,
- hide/reset,
- export/deletion request.

Acceptance:

- Core use remains account-free.
- No birth date or child account.
- “Played” is never inferred from outbound click.
- Recommendation reason maps to explicit inputs.
- User can reset/delete contributing activity.
- Session rotation and authorization tests pass.

# Milestone 5 — Popular

**Effort:** M  
**Dependencies:** Product events and Library/actions

Vertical slices:

- minimal product event schema,
- actor/day/game deduplication,
- staff/test/bot exclusion,
- daily aggregate,
- rolling 28-day query,
- threshold 1 behavior,
- sample count disclosure,
- no-activity state.

Acceptance:

- A one-signal Game is labeled early/low-sample.
- Rank is reproducible from qualified events.
- Refresh spam does not inflate count.
- Raw events expire under policy.
- Popular never affects Random or default Find ordering.

# Milestone 6 — Game Night and Trust Operations

**Effort:** XL  
**Dependencies:** Accounts, catalog Access Options, safety plan, reporting

Vertical slices:

1. Adult host account authorization.
2. Event create/review/publish.
3. Remote event private detail.
4. Public-venue in-person event.
5. Adult, 13+ guest, and adult-mediated child participation models.
6. Transactional capacity.
7. Join/leave/close/cancel/remove.
8. Event list/detail states.
9. Report flow and moderation queue.
10. Audit log and global creation pause.
11. Expiry and retention.
12. External-link/Access Option invalidation.

Acceptance:

- No private residence is accepted.
- Public page exposes no participant list, contact data, or room secret.
- Concurrent final-seat test never overfills.
- Under-13 participant creates no child account or child data record.
- Report can unpublish/restrict an event.
- Operator can pause new events globally.
- No chat or direct messaging exists.
- Legal/safety launch gate is signed off.

# Milestone 7 — Link health and operations

**Effort:** L  
**Dependencies:** Reviewed destinations and D1

Vertical slices:

- bounded checker,
- SSRF defenses,
- observation history,
- current classification,
- manual recheck/override,
- daily schedule,
- rights expiry queue,
- data completeness queue,
- D1 export/restore instructions,
- retention jobs,
- health/quota page.

Acceptance:

- Private and metadata IP targets are blocked.
- Redirect destinations are revalidated.
- HEAD fallback behavior is tested.
- User-visible copy says “checked,” not “guaranteed.”
- Repeated failure does not erase history.
- Restore drill succeeds.

# Milestone 8 — Release hardening

**Effort:** L  
**Dependencies:** All feature milestones

- Full authorization matrix.
- Threat-model review.
- Dependency and secret scans.
- Accessibility manual review.
- Core Web Vitals and bundle review.
- 390/tablet/1024/1440 browser matrix.
- Offline/static fallback.
- Data export/deletion exercise.
- Event incident drill.
- Catalog/source/legal recheck.
- Free-tier quota load test.
- Policy/help/about pages.
- Production rollback instructions.

Release exit criteria:

- No unresolved critical security, safety, data-loss, or accessibility issue.
- Catalog of approximately 20 verified Games.
- Primary destination freshness meets policy or shows unknown.
- Vote and capacity concurrency tests pass.
- Static pages remain usable during dynamic outage.
- D1 backup/restore is exercised.
- Moderation capacity and event pause mechanism are ready.
- Product-owner acceptance of golden flows.

# Cross-cutting test matrix

| Capability | Unit | Integration | End-to-end |
|---|---|---|---|
| Matching | Truth tables/property tests | Catalog validation | Exact/no-result/near journey |
| Random | Uniform/no-repeat | Pool with availability | Draw through exhaustion |
| Vote | Borda/tie/partial | Pass and closure transaction | Complete guest vote |
| Account | Recommendation rules | Passkey/session/merge | Register, merge, export/delete |
| Popular | Dedup/window | Aggregate job | One-signal disclosure |
| Game Night | State/capacity rules | Transaction/auth/report | Create/join/cancel/report |
| Link health | Classifier | Network safety harness | Status shown on Game Page |
| Accessibility | Component semantics | Page scans | Keyboard/screen reader flows |

# Agent-gated definition of done for every implementation slice

A slice is complete only when:

- Sol High confirms the task stayed within approved scope and contracts.
- The assigned implementer reports exact files and self-checks.
- Luna XHigh reports exact task-level and integrated-candidate pass/fail/skip/not-run results.
- Security, privacy, safety, accessibility, failure states, and free-tier implications are reviewed proportionally to risk.
- Required docs, migrations, config examples, and rollback notes are updated.
- No valid test was weakened and no unrelated refactor, secret, debug artifact, or dead code remains.
- The Luna XHigh Git Steward performs the authorized branch/commit/push/PR work only after gates pass.

# Deliberately excluded

- Monetization of any kind.
- User-submitted catalog.
- Public comments, chat, or direct messages.
- Private-home Game Nights.
- Waitlists, calendar integrations, reminders, recurring events.
- Social graph.
- Paid search/auth/email/analytics.
- Opaque ML recommendations.
- Native mobile apps.
- Dark theme in the first release.
- Hosted copies of third-party games, rulebooks, or videos.

# Product metrics

- median time to first viable Game Page,
- party-size selection completion,
- exact/no-result/near-match rates,
- Game Page to access-intent rate,
- Random acceptance by draw ordinal,
- Vote invitation/ballot/close completion,
- favorites/played and return behavior,
- recommendation open/hide/reset,
- Popular signal counts and sample classes,
- Game Night publish/join/fill/cancel/report,
- link freshness and failure rate.

# Operational metrics

- Worker requests/day,
- D1 rows read/written and storage,
- cron success/failure,
- catalog validation failures,
- unverified source/right count,
- destination status distribution,
- report volume and response time,
- capacity consistency errors,
- account export/deletion completion,
- accessibility regressions,
- restore drill status.
