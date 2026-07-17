# Game Portal — UI and Interaction Specification

**Visual direction:** Table Notes  
**Accessibility baseline:** WCAG 2.2 AA  
**Required widths:** 390px, tablet, 1024px, 1440px

# Layout system

## Wide desktop

- Maximum readable application width approximately 1440px, with fluid outer margins.
- 8-column editorial grid.
- Find may use a narrow filter column and wider result field.
- Browse uses a contents/index opening followed by a responsive game grid.
- Cards size from content and maintain consistent row heights only when it improves scanability.

## Laptop

- Filter rail may narrow or collapse into a sheet.
- Result cards use two or three columns based on available card width, not a fixed device label.
- Page title, party size, and active constraints remain visible without dominating vertical space.

## Tablet

- Filter sheet or inline expandable region.
- Two-column game cards when content remains readable; otherwise one column.
- Navigation may remain top or switch to compact mode based on measured fit.

## 390px mobile

- Sticky compact context strip.
- One-column cards.
- Bottom navigation.
- Full-height filter sheet.
- No decorative overlap.
- Touch targets and focus outlines remain unobscured.

# Golden screen

## Find/Browse hybrid — 4 players

The first high-fidelity system screen must include:

- top navigation,
- Table Notes editorial title treatment,
- hero-level party-size selector set to 4,
- a visible Browse entry that does not require filters,
- active constraints: remote, ≤45 minutes, browser-only, host account acceptable,
- exact result count,
- at least three play-slip cards,
- one explicit uncertain-state example,
- one availability label with checked time,
- filter control,
- Popular and Library entry points without overwhelming Find.

Create paired 1440px and 390px designs in the same approval round.

# Core UI primitives

These are conceptual roles, not a generic component library mandate.

| Primitive | Responsibility |
|---|---|
| Application rail | Primary navigation and account/local state |
| Party-size control | Quick counts, direct number entry, validation, announcement |
| Constraint summary | Human-readable active filter sentence and removable controls |
| Filter sheet/rail | Structured filter groups, Apply/Reset, preserved input |
| Game play slip | Result summary and canonical Game Page link |
| Access Option block | Provider, mode, requirements, status, destination |
| Status label | Text + icon + optional checked time |
| Editorial note | Noncritical explanation or recommendation reason |
| Ranked ballot row | Candidate, current rank, move controls |
| Event invitation | Event fit, mode, time, seats, requirements, host |
| Confirmation stamp | One-time success feedback; never sole status |
| Empty/recovery panel | Explanation and next available action without false urgency |

# Find screen

## Initial state

Order:

1. Page title and one-sentence value statement.
2. Party-size selector.
3. Browse-the-collection alternative.
4. Optional common constraint shortcuts.
5. A small explanation of exact versus uncertain data.

No marketing carousel or account prompt precedes party size.

## Result state

Order:

1. Compact party-size context.
2. Active-constraint sentence.
3. Exact result count and Sort.
4. Exact play slips.
5. Uncertain results, clearly separated.
6. Near matches only after exact/uncertain content or when no exact result exists.

### Result update behavior

- Preserve focus.
- Preserve entered filter values after recoverable errors.
- Announce count once.
- Use skeletons only when a dynamic fetch is actually pending; static catalog filtering should feel immediate.
- Do not reshuffle results without a cause visible to the user.

# Browse screen

Opening resembles a notebook contents page:

- alphabetic index,
- game types,
- optional curated “start here” collection,
- complete collection list.

Each category uses headings and a simple grid/list, not a card around the entire category.

Browse search:

- label visible,
- results update without focus theft,
- no results suggests spelling or clearing type filter,
- no fuzzy substitution that silently changes the query.

# Game Page

Information order:

1. Game identity and variant context.
2. Immediate fit statement.
3. Best matching Access Option.
4. Other Access Options.
5. Requirements with quantities and scope.
6. What play is like: original summary and restrained taxonomy.
7. Time breakdown.
8. Age guidance and source context.
9. Learn: original rules summary, official source, approved embed.
10. Share and QR.
11. Source/freshness information where useful.

## External action

Button label names the action and provider, such as “Open on Provider Name.” Before navigation, the surrounding content states account/install/device requirements and current observation.

# Random screen

- Reuses current party size and filters.
- Displays eligible pool size before drawing.
- One primary “Draw a game” action.
- Result uses normal play-slip/Game Page hierarchy.
- “Draw again” remains secondary.
- Draw history is visible in a simple list after multiple draws.
- Pool exhaustion requires explicit reset.
- Motion is one short reveal; reduced motion is immediate.

# Vote screens

## Create

- Candidate source: catalog selection or text list.
- Candidate count 2–12.
- Expected voter count.
- Plain-language explanation of Borda and partial ballots.
- Preview before Open.
- Open action freezes candidates.

## Ballot

Each row includes:

- rank number,
- candidate label,
- Move up,
- Move down,
- Move to top,
- Remove from ranking / Add to ranking.

Optional drag handle may exist but is not required. On small screens, buttons remain full-label or have accessible names and tooltips that are not hover-only.

## Result

- Winning candidate.
- Total points for all candidates.
- Voter participation count.
- Method summary.
- Tie steps if used.
- No individual ballot reveal.
- Random tie-break is explicitly labeled.

# Library

Tabs or headings:

- Favorites
- Recently viewed
- Played
- Recommendations

Guest state has a visible “Saved on this device” note. Account sign-in is optional. Recommendation cards include `Because…` reasons and Hide/Reset controls.

# Popular

- Window and signal definition appear near the heading.
- Every card or row shows its signal count.
- One-signal entries use “Early activity” or equivalent language.
- Empty state explains that the collection has not accumulated activity yet.
- No podium, trophy, flames, or “trending globally” claim.

# Game Night

## Event list

Filters may include mode, date, language, party size/seats, and age band. Cards show:

- event title,
- game,
- remote/public venue,
- local start time and originating time zone,
- duration,
- available seats,
- age band,
- key requirements,
- host display name,
- status.

## Create event

Form sections:

1. Game and Access Option.
2. Remote or public venue.
3. Date/time/time zone/duration.
4. Capacity and whether host uses a seat.
5. Language and age band.
6. Derived requirements.
7. Conduct and safety confirmation.
8. Review and publish.

Private residences are rejected. The system must not imply that venue, host, or participants are verified unless they actually are.

## Join

- Review requirements and conduct.
- Choose participant model:
  - adult account,
  - 13+ guest capability,
  - adult-mediated child seat.
- Claim seat.
- Show joined details and private remote access only after success.
- Provide Leave and Report.

No attendee directory or chat.

# State content patterns

## Loading

Describe what is loading. Avoid indefinite shimmer. Static catalog content should load without dynamic blocking.

## No exact results

Example:

> No exact match supports 6 players, remote play, and browser-only access under 30 minutes. Two games match everything except the time limit.

Actions modify one named constraint.

## Unknown availability

> We have not checked this destination recently. Review the provider and requirements before continuing.

## Unavailable

> This play option is currently unavailable. Another option for the same game is available.

## Offline

Static game content remains readable. Dynamic actions are disabled with preserved input and clear retry.

## Full event

Show status, no false countdown, and return to event list. Waitlist is not in scope.

# Content design

- Say “players,” not “users,” in game-fit contexts.
- Say “checked,” not “guaranteed available.”
- Say “age guidance,” not “safe for.”
- Say “Popular in Game Portal,” not “most popular in the world.”
- Say “public venue,” not “verified venue.”
- Avoid “anonymous” when a capability can still be associated with server records; use “guest.”
- Error messages explain what happened and what can be done without exposing internal details.

# Accessibility acceptance

- Logical heading hierarchy.
- Every form control has a visible label and error association.
- Focus is visible and not obscured by sticky UI.
- No color-only state.
- No drag-only operation.
- Target sizing and spacing meet WCAG 2.2 expectations.
- Reflow works at 320 CSS px and 200% zoom.
- Screen-reader names for repeated Game links are unique.
- Live regions are concise and do not repeat polling updates.
- Captions and text summaries accompany approved video.
- Forced colors and reduced motion are tested.
- Passkey/account flow supports platform authentication without memory puzzles.

# Performance and media behavior

- Reserve image dimensions to avoid layout shift.
- Prefer build-time optimized original or licensed assets.
- Use neutral placeholders when rights are absent.
- Do not autoplay video.
- Use click-to-load embeds with provider disclosure.
- Keep React islands limited to interaction boundaries rather than whole pages.
