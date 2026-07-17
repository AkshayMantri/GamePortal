# Game Portal — Safety, Privacy, and Security Plan

**Status:** Required launch controls  
**Highest-risk area:** Public Game Night across age groups  
**Legal note:** This is product/security planning, not jurisdiction-specific legal advice.

# Safety interpretation of approved decisions

The product owner approved:

- anyone may use the app,
- Game Night is not restricted to adults,
- accounts remain 18+.

The implementation resolves these together as follows:

1. Catalog browsing and non-account discovery are open to everyone.
2. Accounts remain adult-only.
3. Participants aged 13–17 may use a bounded guest participation capability or an adult organizer.
4. Children under 13 participate through an adult’s participant slot. They do not create an account, receive a persistent child capability, or submit their name/contact information.
5. The service avoids knowingly collecting child personal information.
6. This model requires legal review before public launch because children’s privacy laws vary and the FTC amended the COPPA Rule in 2025.

Official reference: https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy

# Game Night launch boundary

## Supported

- Remote events using a reviewed Access Option.
- In-person events at a public venue.
- Adult hosts with accounts.
- Adult participants with accounts.
- 13+ guest participation through one-time capabilities.
- Adult-mediated child seats.
- Finite capacity.
- Join, leave, close, cancel, remove, and report.
- Private remote access details after joining.

## Prohibited

- Private residences.
- Exact private-home address or host contact information.
- Direct messaging.
- Event chat.
- Public attendee lists.
- Participant contact exchange.
- Ticketing, payment, donations, or commerce.
- Unmoderated free-text public comments.
- Child accounts.
- Government-ID or safety-verification claims.
- Events involving illegal activity, gambling for value, sexual content, hate, harassment, weapons, or unsafe instructions.
- “Verified host” badge unless a real verification program is implemented.

# Public-venue policy

A public venue is a location intended to receive members of the public during stated hours, such as a library, community center, café, or game store.

Requirements:

- Host confirms the venue permits the gathering.
- Venue name and public address are supplied.
- Residential address patterns are rejected and manually reviewable.
- The product states it does not verify venue permission.
- Event copy must not reveal a host or participant home location.
- Children attend only with the supervision expected by the organizer/guardian and venue; the platform does not provide childcare or supervision.

# Remote-event policy

- Public page shows provider and requirements, not the event-specific room secret.
- Joined capability reveals the secret only while participation is active.
- Host can rotate/revoke the secret or event participation instructions.
- No in-platform chat or participant directory.
- External provider terms and safety controls still apply.
- The product discloses that leaving Game Portal means using another provider.

# Event age bands

Suggested controlled values:

- All ages with adult responsibility.
- 13+.
- 16+.
- 18+.
- Custom stricter game/provider minimum.

The strictest of Game guidance, provider legal minimum, host-selected band, and venue rule governs. Age guidance is not identity verification.

# Required conduct rules

Short public code:

- Treat participants respectfully.
- Do not harass, threaten, discriminate, or share private information.
- Do not pressure anyone to move to a private channel or location.
- Follow venue and provider rules.
- Hosts must accurately state requirements, mode, time, capacity, and location.
- Report unsafe or misleading events.
- Immediate danger should be directed to local emergency services, not platform support.

# Reporting and moderation

## Report targets

- Event.
- Host.
- Access link or misleading requirements.
- Participant conduct, reported to the host and platform without exposing an attendee directory.
- Rights/content complaint.

## Categories

- harassment or threat,
- hate/discrimination,
- sexual or exploitative behavior,
- child safety,
- private-location or personal-data exposure,
- misleading/scam/spam,
- unsafe/illegal activity,
- external-link concern,
- rights/content issue,
- other.

## Workflow

```text
Submitted
→ acknowledged
→ triaged
→ temporary restriction when needed
→ reviewed
→ action / no action
→ closed
```

High-risk reports may automatically unpublish an event pending review. Every action is reason-coded and audited.

## Solo-operator reality

The application must not promise 24/7 moderation. Before launch:

- publish realistic response expectations,
- provide emergency guidance,
- rate-limit event creation,
- cap concurrent active events if report capacity is uncertain,
- include a global switch to pause new events,
- make cancellation/unpublish fast,
- keep policy text short enough to enforce consistently.

If moderation volume exceeds capacity, the correct response is to restrict or pause public event creation, not to leave reports unattended.

# Privacy data inventory

| Data | Purpose | Avoid/minimize |
|---|---|---|
| Account display name | Host attribution and Library | No legal name requirement |
| Passkey public credential | Authentication | No password, no biometric data stored by app |
| Session token | Account continuity | Store hash, rotate, expire |
| Guest capability | Vote/event access | High entropy, hash at rest, short retention |
| Favorites/played/recents | Library/recommendations | User can remove/reset |
| Event venue | In-person coordination | Public venues only; no home |
| Event remote secret | Join coordination | Private to active participants |
| Product events | Outcome/Popular | Pseudonymous, bounded, short raw retention |
| Reports | Safety response | Avoid unnecessary personal detail |
| Link observations | Availability | No user personal data needed |

Do not store:

- precise IP location for discovery,
- contact lists,
- advertising IDs,
- cross-site trackers,
- child birth dates,
- child contact data,
- raw WebAuthn biometrics (the platform never receives these),
- ballot contents in analytics/logs,
- full external-page content from link checks.

# Children and privacy

- No child accounts.
- No “enter your child’s age/name” profile.
- Youngest-age filter is a transient number and is not persisted by default.
- Under-13 event participation is represented as an adult-mediated seat, not a child record.
- Event copy instructs adults not to enter a child’s name or contact details.
- Analytics must not infer or retain a child identity.
- Any future child account, school mode, direct child messaging, push notification, or child profile requires a separate legal/product approval.

# Security threat model

| Risk | Control |
|---|---|
| Broken object authorization | Authorize every vote, event, Library, report, and admin object |
| Token guessing | At least 128 bits of entropy, hashing, expiry, rate limit |
| Token leakage | Exchange URL token for HttpOnly cookie; redact logs/referrers |
| Ballot disclosure | Aggregate host view; no raw ranking in logs/analytics |
| Candidate tampering | Freeze on open; version and audit |
| Capacity race | Transaction/atomic conditional write; idempotency |
| Event secret exposure | Separate protected record; never public/cacheable |
| Open redirect | Reviewed destinations and fixed allowlist/IDs |
| XSS | Schema validation, contextual encoding, strict CSP, no arbitrary HTML |
| CSRF | SameSite cookies and anti-CSRF for cookie-authenticated writes |
| Account takeover | Passkeys, session rotation, recovery codes, rate limits |
| SSRF in link checker | Network/range denial, DNS/redirect revalidation, bounds |
| Spam events | Adult host account, velocity limits, active-event cap |
| Harassment | Remove/leave/report, no chat/DM/attendee list |
| Staff/operator misuse | Least privilege and immutable audit trail |
| Dependency compromise | Minimal dependencies, lockfile, review, secret scanning |
| Quota denial | Endpoint limits, pagination, dedupe, static fallback |

# External-link safety

- Display destination provider/domain.
- Use `rel="noopener noreferrer"` where appropriate.
- Do not append affiliate or tracking parameters.
- Block `javascript:`, data URLs, embedded credentials, and unreviewed schemes.
- Validate redirects in the server-side checker.
- Show stale/unknown status as uncertainty.
- Provide a user report path for a broken or unsafe link.

# Link-checker SSRF requirements

The checker is a high-risk server-side fetcher:

- allowlist known destination hosts where practical,
- parse canonical host and scheme,
- resolve DNS and reject private/loopback/link-local/metadata ranges,
- guard against DNS rebinding,
- revalidate every redirect,
- limit redirects, bytes, time, and content handling,
- do not render arbitrary HTML in the application,
- do not forward user cookies or secrets.

OWASP reference:
https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html

# Account privacy and recovery

- Accounts are optional.
- Passkeys avoid passwords and paid email.
- Recovery codes are one-time, hashed, and downloadable.
- Losing all authenticators/recovery codes may make an account unrecoverable; this must be explained before enrollment.
- Account merge from local Library requires consent.
- Export and deletion are self-service or operator-assisted with status.
- Deletion does not silently remove safety records that have an approved retention basis; retained records are de-identified where possible.

# Retention summary

- Raw votes: 30 days.
- Recent views: 90 days, maximum 30 distinct Games.
- Raw product analytics: recommended 30 days.
- Expired guest capabilities: remove after a short event/dispute period.
- Event public records: retain only as needed for history/moderation; do not maintain public participant history.
- Reports/actions: defined policy period and annual review.
- Security logs: short, purpose-limited, and secret-free.

# Launch gates

The following must pass before public Game Night:

- legal review of age-participation design,
- public-venue validation and copy,
- report workflow exercised end to end,
- global event-creation pause switch,
- role/authorization matrix tests,
- final-seat concurrency test,
- private event detail access test,
- token leakage review,
- event cancellation/removal communication,
- clear code of conduct and emergency guidance,
- operator capacity and response expectations,
- rights and external-link review.

# Incident response

Minimum playbook:

1. Preserve relevant audit data without copying unnecessary personal content.
2. Restrict exposed event/link/account capability.
3. Remove unsafe public content.
4. Notify affected users when appropriate and lawful.
5. Rotate secrets and invalidate sessions.
6. Document scope, cause, action, and prevention.
7. Review whether event creation or the affected feature must be paused.
