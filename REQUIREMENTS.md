# Game Portal — Requirements

**Status:** Approved baseline, with explicitly marked assumptions and legal launch gates  
**Requirement style:** Observable behavior and acceptance criteria  
**Scope:** First public release unless stated otherwise

## Requirement conventions

- `MUST` is release-blocking.
- `SHOULD` is expected unless a documented decision explains the exception.
- Exact results never contain a known incompatibility.
- Unknown data is represented, not silently treated as compatible.
- All protected actions authenticate or validate a capability token and authorize the specific object server-side.

# FIND — Find and Browse

### FIND-01 — Party-size-first entry

The first meaningful Find view MUST expose party-size selection without requiring marketing-page scrolling.

**Acceptance**
- Quick choices support common groups and a direct numeric input supports larger groups.
- Keyboard, touch, and pointer users can complete the control.
- Result count is announced without moving focus.

### FIND-02 — Exact party-size compatibility

An exact result MUST have at least one active Access Option whose supported player set includes the selected party size.

**Acceptance**
- A game with only a 2-player digital option does not match 4 players merely because a physical edition supports 4.
- Unknown player count cannot enter the exact tier.
- The qualifying Access Option is shown on the result card.

### FIND-03 — Practical filters

Find MUST support play mode, total time, youngest player age, devices, equipment, region, language, accounts, installation, and availability policy using the semantics in `GAME_TAXONOMY.md`.

### FIND-04 — Shareable state

All non-sensitive filter state MUST serialize to a canonical, readable URL.

**Acceptance**
- Browser back/forward restores state.
- Malformed values are rejected or normalized safely.
- No age birth date, contact data, event secret, account ID, or free-text personal information is placed in the URL.

### FIND-05 — No-result recovery

When no exact result exists, the product MUST keep the selected constraints and explain the blocking conditions.

**Acceptance**
- No filter is silently relaxed.
- Uncertain and near matches are visually and semantically separate.
- A user may explicitly remove or change a constraint.

### FIND-06 — Result-card content

A result card MUST show title, exact player fit, total expected time, age guidance, best matching access form, material requirements, and availability state without relying on color alone.

### FIND-07 — Browse collection

Browse MUST allow collection exploration without selecting party size.

**Acceptance**
- Users may browse by game type and alphabetically.
- Browse does not claim compatibility until party size or another situational constraint is supplied.
- Browse cards still show summarized playable forms.

### FIND-08 — Sorting separation

Filtering and sorting MUST remain conceptually separate.

**Acceptance**
- Default sorting cannot use hidden popularity, sponsorship, or personalization.
- Any explicit Popular or recommended ordering is labeled.

# GAME — Game Page and External Access

### GAME-01 — Game/access separation

The Game Page MUST distinguish game-wide information from Edition/Variant, Play Mode, and Access Option information.

### GAME-02 — Access-option detail

Each published Access Option MUST identify, where applicable:

- provider,
- play mode,
- supported counts,
- region,
- play/interface language,
- devices and equipment with quantity/scope,
- account and installation requirements,
- price classification if known,
- destination type,
- latest availability observation.

Unknown values MUST be labeled unknown.

### GAME-03 — Information hierarchy

The page MUST prioritize immediate fit and the best qualifying Access Option before editorial background.

### GAME-04 — External-link safety

External destinations MUST disclose the provider/domain and use safe navigation behavior.

**Acceptance**
- No unreviewed open redirect.
- Confirmed unavailable destinations are not primary actions.
- A stale or unknown observation is disclosed before handoff.
- Event-specific access secrets never appear on the public Game Page.

### GAME-05 — Rules and media rights

Descriptions and rules summaries MUST be original editorial content unless a recorded license permits reuse. Hosted or embedded media MUST have a documented use basis.

### GAME-06 — QR behavior

The default QR MUST encode the canonical Game Portal page. A separately labeled Access Option QR MAY encode the selected destination and MUST disclose its provider and freshness.

# VOTE — Group Vote

### VOTE-01 — Candidate preparation

A host MUST be able to select catalog games or enter 2–12 text candidates. Candidate labels are normalized for duplicate detection and escaped on output.

### VOTE-02 — Candidate freeze

Candidate set and order MUST freeze when voting opens. Editing requires cancelling and replacing the session.

### VOTE-03 — Voter capabilities

The host MUST issue a specified number of high-entropy one-time voter passes. Each pass may have at most one active ballot.

### VOTE-04 — Accessible ranking

A voter MAY rank all or some candidates.

**Acceptance**
- Ranking supports keyboard buttons and direct position controls; drag is never the only method.
- Current positions are announced.
- The ballot explains partial-ballot scoring.

### VOTE-05 — Approved Borda scoring

For `C` candidates, rank `r` receives `C-r` points. If only `k<C` candidates are ranked, each unranked candidate receives `(C-k-1)/2`.

### VOTE-06 — Finalization and tie handling

Closing is idempotent and irreversible. Ties resolve by:

1. head-to-head preference among tied candidates,
2. most first-place rankings,
3. cryptographically secure random draw, visibly labeled and audit-recorded.

The result MUST show totals, participation, method, and tie steps.

### VOTE-07 — Ballot privacy

Hosts MAY see submission status but MUST NOT see individual rankings. Ballot contents MUST NOT enter URLs, analytics, or routine logs.

# RAND — Random Game

### RAND-01 — Eligibility reuse

Random MUST use the same hard-filter and availability semantics as Find.

### RAND-02 — Uniform game-level sampling

Each unique eligible Game MUST have equal probability. Multiple Access Options MUST NOT multiply a game’s chance.

### RAND-03 — No repeat before exhaustion

A session MUST sample without replacement until every eligible game has appeared, then require an explicit reset.

### RAND-04 — Explainability

The result MUST show active constraints, pool size, and the Access Option that qualified the game.

### RAND-05 — Pool invalidation

If an Access Option becomes confirmed unavailable or the user changes a hard filter, the pool MUST be recalculated and the change disclosed.

# ACCT — Accounts, Library, and Recommendations

### ACCT-01 — Guest-first use

Find, Browse, Game Pages, Random, Vote participation, and eligible Game Night participation MUST work without account creation.

### ACCT-02 — Adult accounts

Accounts are intended for users aged 18 or older. A child under 13 MUST NOT create an account or independently submit child contact information.

### ACCT-03 — Favorites

Favorites MUST be unique per account/game, reversible, and available in Library. A guest MAY maintain local-only favorites.

### ACCT-04 — Recent and played distinction

- `Recently viewed`: last 30 distinct Game Pages meaningfully opened in the rolling 90 days.
- `Played`: only an explicit user action or later approved attendance confirmation.

An outbound click MUST NOT automatically mark a game played.

### ACCT-05 — Local/account merge

Account creation or sign-in MUST ask before merging local Library data and MUST explain the result.

### ACCT-06 — Explainable recommendations

Recommendations MUST be subordinate to active hard filters and include a plain-language reason.

**Acceptance**
- Users can hide a recommendation.
- Users can remove contributing activity or reset recommendation data.
- Sensitive traits and cross-site activity are not inferred.

### ACCT-07 — Export and deletion

An account holder MUST be able to request export and deletion. Retained anti-abuse or moderation records require a documented purpose and retention period.

# EVENT — Game Night

### EVENT-01 — Supported event modes

The first release supports:

- remote events using a reviewed Access Option,
- in-person events at public venues.

Private residences and undisclosed private locations are prohibited.

### EVENT-02 — Age-participation model

Anyone may participate subject to event rules, but:

- registered accounts remain adult-only,
- participants aged 13–17 use guest participation or an adult organizer,
- children under 13 participate through an adult’s participant slot and do not submit their own name, contact information, or persistent identifier.

This rule is a pre-launch legal-review gate.

### EVENT-03 — Required event data

An event MUST include game, Access Option, event title, host display name, mode, start time, duration/end, originating IANA time zone, language, capacity, host-seat treatment, join cutoff, requirements, age band, and conduct acknowledgement.

For in-person events, it MUST include a public venue name and address. For remote events, the public view MUST NOT expose the event-specific room secret.

### EVENT-04 — Transactional capacity

Join and leave operations MUST be idempotent and transactionally enforce capacity. Concurrent requests cannot overfill an event.

### EVENT-05 — Privacy by default

Public event pages MUST NOT expose participant names, contact data, attendee lists, remote room secrets, or host private contact details.

### EVENT-06 — Lifecycle

Events use `DRAFT → OPEN → FULL → CLOSED → COMPLETED/EXPIRED`, with cancellation and moderation-removal paths. Closed or cancelled events cannot accept new participants.

### EVENT-07 — Safety controls

Hosts MUST be able to cancel, close, remove a participant, and revoke an access token. Participants MUST be able to leave and report an event or host.

### EVENT-08 — MVP communication boundary

The first release MUST NOT include direct messaging, event chat, public comments, or participant-to-participant contact exchange.

# POP — Popular

### POP-01 — Honest naming

The area MUST be labeled as Game Portal activity, not objective global popularity.

### POP-02 — Qualifying signals

The first-release score uses disclosed internal events. Default signal order:

1. joined Game Night,
2. explicit played,
3. outbound access intent,
4. favorite,
5. meaningful Game Page view.

The implementation MAY use a simplified subset if the UI names it accurately.

### POP-03 — Window and threshold

The default window is rolling 28 days. The minimum publishing threshold is 1 qualifying signal.

### POP-04 — Sample disclosure

Every ranked item MUST expose its qualifying signal count or a clear low-sample label. A one-signal item cannot be presented as a strong trend.

### POP-05 — Abuse controls

Repeated refreshes, staff/test activity, known bots, and duplicate user/session events MUST NOT directly inflate rank.

### POP-06 — Regional behavior

Regional lists appear only when region data is explicit and the interface names the population. The product MUST NOT infer precise location from IP for ranking.

# OPS — Enabling Operations

### OPS-01 — Catalog review

Protected operations MUST support draft, review, publish, unpublish, and correction for catalog entities.

### OPS-02 — Provenance and rights

Every imported/non-original field and media asset MUST record source, retrieval time, permission/license basis, attribution duty, verification state, and correction path.

### OPS-03 — Link health

The system MUST retain append-only availability observations and a reviewed current classification. Link checks MUST be bounded and protected against SSRF.

### OPS-04 — Moderation

Reports and actions MUST be role-controlled, reason-coded, auditable, and reversible where appropriate.

### OPS-05 — Retention jobs

Scheduled or operator-triggered jobs MUST enforce raw vote, recent-view, analytics, expired-event, session, and deletion retention policies.

### OPS-06 — Backup and recovery

Catalog data MUST remain recoverable from version control. D1 export and restore procedures MUST be documented and exercised before public launch.

### OPS-07 — Non-commercial guardrail

The product MUST NOT introduce ads, payment collection, affiliate tracking, sponsored placement, or paid benefits without a new product-owner decision and data-license review.

# NFR — Nonfunctional Requirements

### NFR-01 — Accessibility

WCAG 2.2 AA is the release baseline, including keyboard operation, visible/unobscured focus, non-drag alternatives, target sizing, reduced motion, reflow, and accessible authentication.

### NFR-02 — Responsive support

Required test widths: 390px, tablet, 1024px laptop, and 1440px desktop, including long titles and translated strings.

### NFR-03 — Performance

Public static pages SHOULD target p75 LCP ≤2.5s, INP ≤200ms, and CLS ≤0.1. Dynamic islands MUST be bounded and loaded only where needed.

### NFR-04 — Authorization

Every protected operation MUST validate the actor or capability and authorize the target object server-side, denying by default.

### NFR-05 — Boundary validation

Untrusted input MUST be schema-validated and normalized. Output MUST be encoded for its context. SQL MUST be parameterized.

### NFR-06 — Graceful degradation

Static catalog pages remain readable when dynamic services fail. Dynamic status becomes stale/unknown rather than fabricating success.

### NFR-07 — Privacy-aware observability

Logs MUST exclude credentials, tokens, raw ballots, event secrets, child data, and unnecessary personal data.

### NFR-08 — Internationalization

Dates, time zones, languages, numbers, pluralization, and fallback behavior MUST be explicit.

### NFR-09 — Free-tier fit

The first release MUST operate within the approved free-tier architecture under expected early usage. Quotas and failure behavior MUST be visible to the operator.

### NFR-10 — Security baseline

Release gates include content-security policy, secure cookies, CSRF protection where relevant, rate limiting, session rotation, secret scanning, dependency review, and SSRF defenses.
