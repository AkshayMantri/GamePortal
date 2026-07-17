# Browse collection contract

**Milestone:** 2B  
**Decision authority:** D-006, I-003, I-012  
**Requirements:** FIND-07, FIND-08, GAME-01, GAME-02, GAME-05, NFR-01, NFR-02, NFR-03, NFR-06, NFR-09  
**Status:** Implementation contract; independent verification and integrated regression remain separate gates

## Publication-safe read model

`src/catalog/browse-loader.ts` imports the version-controlled production catalog and passes it through the existing semantic Zod validator before building any route. Invalid catalog data fails the static build. `src/catalog/browse.ts` then creates a deliberately smaller public projection.

A Game enters Browse only through this complete chain:

```text
published + approved Game
  → published + approved Edition
  → published + approved Play Mode with known player support
  → published + approved playable Access Option
```

Linked Requirements enter the projection only when published, approved, and owned by that Access Option. Media is limited to referenced, published, approved, local assets with catalog alt text, dimensions, and validator-approved rights. Browse exposes no Destination, URL, provider, source claim, provenance, review operator, tag, draft note, or availability assertion.

The hierarchy stays explicit in the projection as Edition → Play Mode → Access Option → Requirement. Summaries are derived from eligible branches; they do not flatten a fact from one variant into a universal Game claim and do not select a “best” option.

## Summary rules

- Ordering uses normalized explicit `sortTitle`, then stable Game ID. It does not use locale defaults, popularity, sponsorship, personalization, or provider count.
- Alphabet groups use the normalized first `sortTitle` character for A–Z. Numeric, symbolic, and non-Latin starts use the explicit `#` group. Empty groups are never linked.
- Player sets and ranges are expanded, unioned, and compressed only across contiguous counts. `2` plus `4–6` remains “2 or 4–6 players.”
- Time is setup/access + teaching + maximum play time only when every component is known. Differing complete totals render a range; any incomplete eligible mode renders “Time not yet published.”
- One coherent verified age minimum renders as `Ages N+`. Mixed or differing guidance renders “Age guidance varies.” All missing guidance renders “Age guidance not yet published.”
- Play mode is derived only from eligible `in_person` and `remote` modes.
- Playable forms are controlled labels derived only from eligible `accessKind` values. They are not actions or availability claims.

## Static routes and indexing

- `/browse` is the indexable, self-canonical collection page.
- A type route is generated only for a type represented by the published projection. The current proof set generates `/browse/type/abstract-strategy`; it is self-canonical and `noindex,follow` to avoid a thin duplicate index.
- A neutral `/games/:slug` scaffold is generated only for each published projected Game. It is self-canonical and `noindex,follow` until the complete Game Page hierarchy is implemented.
- Unknown type and Game slugs have no generated path and return 404.

The proof catalog therefore produces 13 HTML pages: the ten Milestone 2A pages, one represented type, and two Game scaffolds.

## Browse enhancement

Without JavaScript, every Game, type, letter, and internal Game link remains present. The search form stays hidden rather than presenting a nonfunctional control.

On `/browse` only, one framework-neutral inline module reveals a visibly labeled native search field and clear button. Matching normalizes compatibility forms, case, diacritics, punctuation, and whitespace, then checks query terms against only:

- canonical Game title; and
- the controlled public game-type label.

The enhancement never searches summary, tags, notes, URLs, provenance, or source metadata. It does not rank, fuzzily substitute, request data, move focus, update history, persist state, log, or emit analytics. A polite status reports the filtered count, and a zero-result message preserves the entered query and suggests checking spelling or clearing search.

## Layout and accessibility

Browse uses semantic navigation, lists, articles, headings, definition lists, one H1, unique anchors, intrinsic image dimensions, visible labels, a polite live region, native controls, and uniquely named `View Game` links. Interactive targets retain the shell’s 2.75rem minimum and visible focus treatment.

The collection grid uses content-fit columns: one column on narrow compact screens and additional columns as space permits. Long titles wrap, the layout reflows without horizontal scrolling, and existing body clearance keeps the final Game above compact bottom navigation. Forced-colors and reduced-motion behavior extend the Milestone 2A shell contract.

On compact Browse, focusable links and controls use a local logical-end scroll margin derived from the existing bottom-navigation, safe-area, and focus-outline tokens. Native sequential focus scrolling therefore keeps each target and its complete outline above the fixed navigation without moving focus in script or changing pointer and touch layout. Browser regression coverage tabs through the real C and G alphabet links at 320px, 390px, and 768px and compares their outlined bounds with the navigation boundary.

## Scope boundary

This slice does not implement party size, Find matching, URL filter state, ranking, play slips, full Game Pages, external actions, Destinations, QR, favorites, D1/API behavior, Random, Vote, Library, Popular, Game Night, accounts, analytics, or deployment. The production catalog and dependency graph are unchanged.

## Verified static output

The independently verified candidate generates 13 HTML pages in 24 output files totaling 449,675 bytes. It emits no JavaScript asset files, no Astro islands, and no React runtime. Browse alone includes one inline progressive-enhancement script: 1,131 UTF-8 bytes raw and 597 bytes with gzip. The generated Browse page contains no external URL or runtime request, and the remediation adds no JavaScript. No font, media, package, lockfile, D1, migration, Worker, or deployment change is part of this slice.

## Known limitations and catalog work

The collection is deliberately small because only two production records currently satisfy the complete reviewed publication chain: `game_chess` (`/games/chess`) and `game_go` (`/games/go`). Both currently have unknown published time and age guidance, one in-person mode, and one physical-instructions access form. More types, letters, modes, forms, and useful summaries require separately reviewed catalog seeds with rights/provenance evidence; this milestone does not fabricate them.

The generated Game routes remain honest `noindex,follow` scaffolds rather than full Game Pages. Genuine Windows Narrator and browser-chrome 200% zoom were not available in the automated environment and remain pre-release gates. The next proposed product slice is Milestone 2C party-size-first Find control; Browse continues to make no compatibility or matching claim.
