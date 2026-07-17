# Game Portal — Product Definition

**Status:** Approved product baseline  
**Working title:** Game Portal  
**Operating model:** Strictly non-commercial  
**Initial release:** All named product areas, delivered through sequenced vertical slices

## Executive definition

Game Portal is a browseable collection and group-decision utility for finding a game that people can actually play under their current constraints.

It connects four activities that are usually fragmented:

1. **Browse** a coherent collection of games.
2. **Find** options compatible with the exact group and situation.
3. **Decide** through comparison, random selection, or ranked group voting.
4. **Access or organize** the right playable form or Game Night.

The product is not merely a database of titles. It models the difference between an abstract game and the physical or digital access option that a group can use.

## Product promise

> Find, browse, decide on, and reach a game that fits the people, time, mode, equipment, devices, language, and access conditions available right now.

## Primary value loops

### Immediate discovery

```text
Choose party size
      ↓
Add only relevant practical constraints
      ↓
See exact, uncertain, and explained near matches
      ↓
Open a Game Page and select a viable access option
      ↓
Play, share, save, or organize a Game Night
```

### Browse and return

```text
Browse the collection or open Library
      ↓
Explore a Game Page
      ↓
Favorite, mark played, share, vote, randomize, or create/join an event
      ↓
Return through recents, favorites, recommendations, or Popular
```

## Product areas in the first public release

| Area | User value |
|---|---|
| Find | Fast party-size-first discovery with practical constraints |
| Browse | Explore the catalog without first constructing a filter query |
| Game Page | Understand the game and compare playable forms and access options |
| Random | Resolve choice overload without hidden weighting |
| Group Vote | Reach a transparent consensus among ranked preferences |
| Library | Retain favorites, recent views, explicit played records, and recommendations |
| Popular | See recent Game Portal activity with visible sample counts |
| Game Night | Create or join a capacity-limited remote or public-venue event |
| Operations | Maintain catalog quality, sources, rights, link health, reports, and auditability |

## Target situations and jobs

These are usage situations, not demographic personas.

| Situation | Job to be done | Product failure to prevent |
|---|---|---|
| Friends in one room | “Find something all of us can play with the equipment and time we have.” | Suggesting an incompatible player count or missing equipment |
| Friends connecting remotely | “Find a game that works across our available devices without a setup ordeal.” | Hiding installs, per-person devices, accounts, region limits, or stale links |
| Family with age constraints | “Find something appropriate for the youngest participant.” | Treating age guidance as a safety certification or silently passing unknown age data |
| Host organizing a larger gathering | “Publish a viable game session and fill seats safely.” | Exposing private locations, room links, or participant information |
| Group that cannot agree | “Turn our preferences into a decision that feels fair.” | Opaque scoring, mutable candidates, duplicate ballots, or leaked rankings |
| User who wants to play immediately | “Give me one viable option now.” | Randomizing over ineligible games or repeating the same result |
| Returning user | “Help me resume games I liked or find a related option.” | Treating a page view or outbound click as proof of play |

## Product principles

1. **Viability before abundance.** A small catalog with trustworthy access data is better than a large catalog of ambiguous titles.
2. **Party size is an answer, not a hint.** Exact supported player count is a hard compatibility condition unless the user explicitly chooses a flexible mode.
3. **Browse and Find are peers.** Users may explore the collection or begin with constraints; neither path should feel secondary.
4. **A game is not its destination.** Physical editions and digital adaptations may have different counts, time, price, devices, accounts, languages, regions, and availability.
5. **Unknown is not compatible.** Unknown values are disclosed and cannot silently satisfy a strict filter.
6. **Decision tools are auditable.** Vote scores, tie handling, random pools, and Popular definitions must be explainable.
7. **Guest-first, account-optional.** Core discovery and participation do not require account creation.
8. **Safety is part of the feature.** Public Game Night cannot be a seat counter plus an unrestricted URL.
9. **Personalization is subordinate to user intent.** Hard filters always win; recommendation reasons and reset controls are visible.
10. **Rights and provenance are catalog data.** Every imported field, image, video, rules source, and availability claim needs an origin and use basis.
11. **Joy must improve orientation.** Table Notes warmth and tactile cues may guide attention but must not obscure state or content.
12. **Free-tier operation is a design constraint.** Static delivery, bounded data, explicit retention, and operational simplicity are product requirements for the solo build.

## Confirmed decisions

- Strictly non-commercial; no ads, payments, affiliate ranking, paid benefits, or fundraising inside the product.
- Anyone may browse and use core product functions.
- Game Night is not restricted to adults; the safety model uses adult-mediated participation for children under 13 rather than child accounts.
- Accounts are optional and intended for adults.
- Approximately 20 games form the first curated collection.
- Use Game → Edition/Variant → Play Mode → Access Option.
- Group Vote uses the approved Borda consensus variant.
- Total available time includes normal setup/access, teaching, and the upper expected play duration.
- Recommendations, Popular, and Game Night are included from launch.
- Table Notes is the approved visual direction.
- Recently viewed records use a rolling 90-day definition.
- Played requires an explicit action.
- Raw vote data has a 30-day dispute window.
- Popularity may publish with one qualifying signal, but the sample count and signal definition must be visible.
- Astro/TypeScript + React islands + Cloudflare Workers/D1 is the approved technical direction.

## Inferred enabling requirements

These are not optional user-facing additions.

- Protected catalog administration and review.
- Field-level source and rights provenance.
- Link-health observations and correction workflow.
- Moderation report intake and auditable actions.
- Rate limiting, object-level authorization, and abuse controls.
- Data export, account deletion, retention jobs, and backup/restore instructions.
- Minimal first-party analytics for product outcomes and Popular.
- Accessibility regression checks and manual review.
- Safe external-link handling and link-checker SSRF controls.

## Assumptions

- English is the initial authored interface language; the model and layouts are localization-ready.
- Initial Game Night supports remote sessions and in-person sessions at public venues; private-home locations are excluded.
- No direct messaging, public attendee list, event chat, ticketing, or payments.
- An adult may organize participation for a child under 13 without creating a child account or publishing the child’s name/contact details.
- The initial catalog source of truth is version-controlled editorial data.
- Mutable activity, votes, events, accounts, link observations, and aggregates use D1.
- The public repository may be empty until implementation authorization; this planning package does not initialize it.

## Blockers and required pre-launch validations

| Blocker | Required resolution |
|---|---|
| Legal treatment of minors and public events | Review the adult-mediated under-13 model and jurisdictional obligations before public launch |
| BoardGameGeek authorization | Register the non-commercial application before using its XML API or data |
| Content rights | Verify every image, video, rules source, and imported field before publication |
| Event moderation capacity | Define operator availability, report response expectations, and emergency wording |
| Account recovery | Validate passkey and recovery-code experience before accounts leave beta |
| Venue policy | Approve public-venue definition and prohibited location types |
| Seed data completeness | Verify every published access option and every filter-critical field |

## Explicit non-goals for the first release

- Hosting or emulating third-party games.
- Monetization, advertising, donations, affiliate links, sponsorship, or paid placement.
- User-submitted catalog entries.
- Reviews, public ratings, comments, chat, or direct messages.
- Social graph, followers, friend lists, or public profiles.
- Private-home in-person Game Nights.
- Tickets, payments, waitlists, recurring events, calendar integrations, or generalized reminders.
- Government-ID verification or a claim that identities are verified.
- Child accounts or collection of child contact information.
- Opaque collaborative filtering or cross-site tracking.
- A claim that an automated link check guarantees successful entry or play.
- Copying publisher descriptions, rulebooks, art, screenshots, or video files without permission.

## Product outcomes

| Outcome | Initial measurement |
|---|---|
| Reach a viable result quickly | Median time from first render to first exact Game Page |
| Understand constraints | Party-size completion and filter-removal behavior |
| Avoid dead ends | Exact no-result rate and near-match recovery rate |
| Trust access information | Outbound success reports and link-observation freshness |
| Resolve disagreement | Vote session completion and result comprehension |
| Reduce choice overload | Random result accepted before the third draw |
| Create return value | Favorites, explicit played actions, and 7/28-day return |
| Make Popular honest | Ranked items always expose sample count and window |
| Operate Game Night safely | Join completion, cancellation, reports, and capacity consistency |
| Protect free-tier viability | Worker requests, D1 rows read/written, storage, and scheduled job health |

## Definition of success for the first public release

The release is successful when a first-time user can browse or choose a party size, identify a viable playable form, understand its requirements and freshness, and complete one of the intended outcomes—open, share, save, vote, randomize, or join/create a Game Night—without an account gate or hidden compatibility assumption.
