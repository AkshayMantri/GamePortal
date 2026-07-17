# Game Portal — Game Taxonomy, Matching, and Decision Algorithms

## Canonical domain model

```text
Game
  └─ Edition or Variant
       └─ Play Mode
            └─ Access Option
                 ├─ Requirements
                 ├─ Destinations
                 └─ Availability Observations
```

| Entity | Meaning | Owns |
|---|---|---|
| Game | Abstract recognizable game identity | Canonical title, game type, original summary, broad concepts |
| Edition/Variant | Published, localized, or adapted expression | Edition title, publisher/source, age guidance, language context |
| Play Mode | A supported way to play that edition | In-person/remote, synchronous/asynchronous, player range, time |
| Access Option | Concrete way a group obtains or enters the mode | Provider, devices, equipment, accounts, installation, region, destination |
| Requirement | Mandatory or optional prerequisite | Item, quantity, scope, notes |
| Destination | External URL or app/store destination | URL, type, provider, review state |
| Availability Observation | Time-stamped check result | Method, status, redirect, confidence, checked time |
| Media/Rules Source | Referenced or hosted content with rights metadata | Source, use basis, attribution, expiry |

A filter qualifies an **Access Option**, not a Game in isolation. The Game appears once, using its best qualifying Access Option.

# Game types

Initial collection types:

- Board
- Card
- Word
- Party
- Social
- Abstract strategy
- Other

Types support Browse organization. They do not affect eligibility unless the user explicitly chooses one.

Tags should be limited to meaningful descriptive dimensions such as cooperative, team-based, deduction, bluffing, memory, drawing, trivia, dexterity, or simultaneous. Avoid decorative tag clouds.

# Formal filter taxonomy

| Field | Label | Type / allowed values | Owner | Default | Exact behavior | Unknown behavior |
|---|---|---|---|---|---|---|
| `party_size` | How many are playing? | integer 1–99 | Play Mode / Access Option override | unset in Browse; required in Find result mode | selected number must be explicitly supported | cannot be exact |
| `play_mode` | Together or remote? | any, in_person, remote | Play Mode | any | selected enum must match | cannot be exact |
| `time_budget_minutes` | How much time do you have? | positive integer; presets 15/30/45/60/90/120 | Play Mode / Access Option | unset | setup/access + teach + play max ≤ budget | uncertain if any mandatory component unknown |
| `youngest_age` | Youngest player | integer years | Edition/Play Mode + provider legal constraint | unset | selected age meets all known minima | uncertain when active |
| `devices` | Devices available | normalized item + quantity | Requirement | unset | all mandatory quantities/scopes satisfiable | uncertain |
| `equipment` | Equipment available | normalized item + quantity | Requirement | unset | all mandatory quantities/scopes satisfiable | uncertain |
| `region` | Available in | ISO market/country or unrestricted | Access Option | unset/user-selected | supported or unrestricted | uncertain |
| `play_language` | Play language | BCP 47 tag | Edition/Play Mode/Access Option | unset | required rules/interface/content language covered | uncertain |
| `account_tolerance` | Accounts | any, none, host_only_or_none | Access Option | any | requirement no stricter than tolerance | uncertain |
| `install_tolerance` | Installation | any, browser_only, host_only_or_browser | Access Option | any | requirement no stricter than tolerance | uncertain |
| `availability_policy` | Link status | recently_checked, include_unknown, show_all | Latest Observation | include_unknown | option meets freshness/status policy | explicit unknown tier |
| `game_type` | Game type | controlled type | Game | any | type membership | not applicable |

## Time semantics

Store separately:

- access/setup minutes,
- teaching minutes,
- play minimum,
- play maximum.

Default total:

```text
total_upper_bound =
  access_or_setup_minutes
  + teaching_minutes
  + play_minutes_max
```

The conservative upper bound answers “can our group reasonably finish?” The Game Page also shows the breakdown.

## Requirement semantics

```text
requirement_type
item
minimum_quantity
scope = per_group | host_only | per_person | per_team
mandatory
notes
source_claim
```

Examples:

- one browser-capable device per person,
- one host computer,
- one shared display per group,
- one standard deck per group,
- pencil and paper per person.

# Matching

Each active predicate evaluates an Access Option as:

- `TRUE`: verified compatible,
- `FALSE`: verified incompatible,
- `UNKNOWN`: insufficient or stale data.

## Result tiers

1. **Exact, recently verified** — every active predicate true and status fresh enough.
2. **Exact with uncertainty** — no false predicate, at least one unknown.
3. **Near match** — exactly one relaxable false predicate, all others true.
4. **Excluded** — multiple false predicates or one non-relaxable legal/region/age failure.

Near matches are a recovery view, never a silent filter relaxation.

## Stable default ranking

Within the same tier:

1. highest availability confidence,
2. most recent qualifying observation,
3. fewest unknown fields,
4. smallest nonnegative time slack when time is active,
5. text relevance when title search is active,
6. locale-aware title order.

Default ranking excludes Popular, personal history, provider count, sponsorship, and editorial promotion.

# Browse behavior

Browse may organize by:

- game type,
- alphabet,
- short/medium/long time band,
- in-person/remote availability,
- curated editorial collection.

Browse labels describe the catalog and do not imply current group compatibility. Once party size or hard constraints are added, the surface can transition into Find semantics.

# Random

Eligible pool:

```text
eligible_games =
  distinct Game IDs with at least one Access Option
  passing current hard-filter policy
```

Sampling:

```text
P(game) = 1 / count(eligible_games)
```

- Sample without replacement per session.
- Select the displayed Access Option deterministically using normal ranking.
- Popularity, recommendation history, provider count, and sponsorship do not affect probability.
- Changing a hard filter resets the pool.
- Confirmed unavailability invalidates the pool and is disclosed.

# Group Vote

## Approved scoring

For `C` candidates, a ranked candidate in position `r` receives:

```text
points = C - r
```

For a partial ballot ranking `k<C` candidates, each unranked candidate receives:

```text
unranked_points = (C - k - 1) / 2
```

This preserves the same total point budget per ballot and treats all omitted candidates as tied below ranked choices.

### Example

Four candidates; voter ranks two:

- first = 3,
- second = 2,
- each unranked = 0.5.

## Tie sequence

1. Head-to-head preference among tied candidates.
2. Most first-place rankings.
3. Cryptographically secure random draw, recorded and labeled.

## Privacy and integrity

- Candidates freeze when voting opens.
- One high-entropy voter capability per expected voter.
- One active ballot per capability.
- Host sees submission state, not rankings.
- Raw ballot data retained 30 days, then deleted or irreversibly de-linked.
- No IP fingerprint is treated as voter identity.
- Host can revoke and reissue a pass before closure.

# Popular

## Name and meaning

Use “Popular in Game Portal” or “Popular right now,” with explanatory copy:

> Based on recent activity inside Game Portal, not a global ranking.

## Initial window and threshold

- Rolling 28 days.
- Minimum signal threshold: 1.
- Every ranked item shows count or low-sample status.
- A one-signal item is explicitly weak evidence.

## Initial signal model

For implementation simplicity, launch with clearly named counts rather than an opaque composite where possible:

- event joins,
- explicit played actions,
- outbound access intent,
- favorites,
- meaningful Game Page views.

A composite may be introduced only if its weights are documented and the UI explains what “Popular” means. Deduplicate by user or guest session per game per day. Exclude staff/test/bot activity.

# Recommendations

## Guest

Use:

- current hard filters,
- current-session views,
- local favorites,
- local explicit played records,
- explicit language/region.

## Account

Use transparent content similarity over:

- favorites and played,
- viewed game types and mechanics,
- duration,
- play modes,
- requirement profile,
- language/region,
- hides/dislikes.

Hard filters always win. Each item states a reason and supports hide/reset.

No cross-site tracking, protected-trait inference, paid placement, or “people like you” collaborative filtering in the first release.

# Initial 20-game editorial seed slate

This is a **candidate verification list**, not imported catalog truth. Names and traditional rules may be broadly known, but each Game, variant, description, image, and Access Option still requires source and rights review.

| Candidate | Primary type | Why it tests the model | Publication gate |
|---|---|---|---|
| Chess | Abstract strategy | 2-player, physical and multiple digital forms | Verify neutral imagery and reviewed online option |
| Checkers / Draughts | Abstract strategy | Regional naming and rule variants | Model variant naming and source |
| Go | Abstract strategy | Board size variants and digital providers | Avoid implying one ruleset covers all variants |
| Backgammon | Board | Physical/digital forms and dice equipment | Verify online option and terminology |
| Nine Men’s Morris | Abstract strategy | Traditional, compact requirements | Original rules summary |
| Ludo | Board | Family play and regional variants | Verify naming and variant distinctions |
| Snakes and Ladders | Board | Family age/time and regional naming | Neutral art only |
| Hearts | Card | 4-player remote/in-person comparison | Standard-deck requirement and digital option |
| Spades | Card | Team scope and scoring variants | Variant definition |
| Euchre | Card | Exact 4-player/team requirement | Regional rules note |
| Crazy Eights | Card | Family-friendly traditional game | Original rules summary |
| Go Fish | Card | Younger age guidance | Avoid child data; source age carefully |
| Gin Rummy | Card | 2-player card access forms | Variant distinction |
| Cribbage | Card | Board + deck equipment combination | Requirement quantities |
| Charades | Party | No external provider required | Model “instructions only” Access Option |
| Twenty Questions | Social | Minimal equipment and remote suitability | Original concise rules |
| Telephone | Party | In-person group size and no destination | Accessibility note for hearing/speech alternatives |
| Categories | Word | Paper/pencil and spoken variants | Avoid trademarked branded presentation |
| Word Chain | Word | Language-dependent requirements | Language field and accessibility |
| Two Truths and a Lie | Social | Remote/in-person, no equipment | Privacy/sensitive disclosure guidance |

## Catalog completeness gate

A Game cannot publish until it has:

- canonical title and original summary,
- at least one Edition/Variant and Play Mode,
- at least one Access Option,
- supported player counts,
- total-time components or disclosed unknowns,
- age guidance source or disclosed unknown,
- requirements with scope,
- rights/provenance for every non-original asset or field,
- reviewed destination when an external link exists,
- explicit language/region state,
- publication reviewer.
