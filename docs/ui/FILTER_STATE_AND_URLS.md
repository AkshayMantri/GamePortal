# Find filter state and canonical URLs

**Milestone:** 2D  
**Authority:** FIND-01, FIND-03, FIND-04, GAME-01, GAME-02, NFR-01, NFR-02,
NFR-03, NFR-05, NFR-06, NFR-08, NFR-09; D-007, D-009, D-011, D-014,
D-015, D-016, D-019, D-030  
**Boundary:** Setup state only. Matching and every result behavior remain M2E.

## Canonical typed state

`src/find/filter-state.ts` owns one DOM-free readonly contract:

```ts
type FindFilterState = Readonly<{
  partySize: number | null;
  playMode: "any" | "in_person" | "remote";
  timeBudgetMinutes: number | null;
  youngestAge: number | null;
  devices: InventoryConstraint;
  equipment: InventoryConstraint;
  region: string | null;
  playLanguage: string | null;
  accountTolerance: "any" | "none" | "host_only_or_none";
  installTolerance: "any" | "browser_only" | "host_only_or_browser";
  availabilityPolicy: "include_unknown" | "recently_checked" | "show_all";
}>;
```

`InventoryConstraint` distinguishes `unconstrained`, explicit `none`, and a
sorted unique list of `{code, quantity}` items. Quantities are 1–99 and each
category accepts at most 20 distinct reviewed codes.

## Canonical query table

Serialization always targets `/find`, omits defaults, never leaves a trailing
`?`, and writes keys in this exact order:

| Order | Key            | Canonical value                           | Default omitted   |
| ----: | -------------- | ----------------------------------------- | ----------------- |
|     1 | `players`      | integer 1–99                              | unset             |
|     2 | `mode`         | `in-person` or `remote`                   | `any`             |
|     3 | `time`         | whole minutes 1–1440                      | unset             |
|     4 | `age`          | whole years 0–120                         | unset             |
|     5 | `device`       | `none` or repeated `<public-code>:<1–99>` | unconstrained     |
|     6 | `equipment`    | `none` or repeated `<public-code>:<1–99>` | unconstrained     |
|     7 | `region`       | supported uppercase two-letter code       | unset             |
|     8 | `lang`         | supported canonical BCP 47 tag            | unset             |
|     9 | `accounts`     | `none` or `host`                          | `any`             |
|    10 | `install`      | `browser` or `host`                       | `any`             |
|    11 | `availability` | `checked` or `all`                        | `include_unknown` |

Repeated inventory entries sort by public code. `URLSearchParams` performs
encoding. The codec maintains both invariants:

- decoding an encoded normalized state returns the same state;
- encoding decoded input returns its one canonical representation.

## Untrusted input and malformed shared links

The decoder bounds input at 64 parameters, 128 characters per value, and 20
distinct items per inventory. It allowlists keys, enums, public codes, numbers,
regions, and languages. Identical normalized scalar duplicates deduplicate;
conflicting duplicates invalidate only their field. Inventory rejects unknown
codes, malformed tuples, conflicting quantities, `none` mixed with items, and
excessive distinct entries. Valid sibling fields survive.

Structured issues contain only stable codes and a recognized field key (or the
generic `unknown` key); raw hostile values are never retained. Unknown query
keys are removed. Initial cleanup uses `replaceState` and shows one dismissible,
non-blocking notice without moving focus or reflecting raw input.

`/` without a query may remain `/`. Any deliberate commit targets `/find`.
Root queries, reordered keys, default values, casing, leading zeroes, identical
duplicates, and invalid values are replace-normalized to `/find`. Both routes
keep canonical metadata at unfiltered `/find` and remain `noindex,follow`.

## Public option registry

`src/find/filter-options.ts` walks only a complete published-and-approved
Game → Edition → Play Mode → playable Access Option chain. Requirements must be
published, approved, linked, and owned by that option. Availability appears
only when the option links to a published, reviewed Destination. The projection
contains only reviewed public codes and labels; it omits notes, sources,
provenance, URLs, provider internals, operators, drafts, and availability-check
internals.

Current production output is:

- equipment: `chess_set` (Chess set), `go_set` (Go set);
- language: `en` (English);
- no device choices;
- no region choices because both options are unrestricted;
- no availability policy because no reviewed Destination exists.

Party size, play mode, time, youngest age, equipment, play language, accounts,
and installation remain visible. Devices, region, and availability are
data-gated. The complete catalog fixture activates all three without a component
redesign and proves publication gating. Play mode, time, age, accounts, and
installation are fixed meaningful controls independent of current diversity.

## Draft, history, and responsive workspace

The URL is committed state. The one non-party form is draft state:

- opening/cancel/close copies or discards against committed state;
- Reset filters changes draft only;
- validation keeps entered values and the mobile sheet open;
- Update setup commits all valid draft constraints once;
- party quick/custom commits and summary removal commit immediately;
- unchanged commits do not add history;
- Back/Forward restores every control and summary, clears stale validation,
  never writes history, never moves focus, and announces one `Setup restored.`;
- reload restores a canonical filtered URL.

The same semantic form is moved by the single controller. It is an editorial
section at 64rem and wider and a native modal dialog below 64rem. `showModal`
provides background inertness and focus containment; Escape, visible Close,
Cancel, safe-area padding, and trigger focus restoration are implemented. There
is never a second focusable form copy or an Astro/React hydration island.

## Accessibility, privacy, and no JavaScript

The page has one H1, native fieldsets/legends/labels, associated errors, real
summary-removal buttons, a concise polite status, forced-colors support,
reduced-motion behavior, 44px targets, and 320–1440 reflow. The status never
announces a game count.

Under D-030, youngest age is a deliberately entered whole-years URL constraint.
It is not a birth date, identity, inference, account/Profile/Library field,
cookie, local/session storage value, D1/server record, log, or analytic. The UI
states that applied age appears in the shareable address; clearing removes it.

Without JavaScript, the H1, party fieldset, Browse peer, filter labels/help, and
exact-versus-uncertain explanation remain readable. The page makes no applied
state claim. A `noscript` note explains that applying/restoring shareable setup
requires JavaScript and links to Browse.

## M2E integration contract

Milestone 2E consumes the normalized `FindFilterState` and the validated catalog
as inputs. It must evaluate constraints at their owning Edition, Play Mode,
Access Option, Requirement, and Destination levels; it must not flatten facts to
Game. It adds true/false/unknown predicates and exact/uncertain/near/excluded
classification without changing the M2D URL vocabulary or defaults unless a
new change-controlled decision is recorded.

M2D does not filter the catalog, evaluate an Access Option, count Games, rank,
select a provider, render a result or play slip, show no-result recovery, change
Browse/Random, or create a result live region.
