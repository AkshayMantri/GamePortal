# Game Portal — Approved Visual Direction

## Direction: Table Notes

**Status:** CONFIRMED  
**Thesis:** A considered game-night notebook—tactile paper, editorial marginalia, soft irregularity, and intimate warmth—built on rigorous accessible structure.

The interface should feel like a well-kept host’s notebook rather than a SaaS dashboard, toy store, casino, or neon gamer portal.

## Emotional and functional balance

| Emotional objective | Functional constraint |
|---|---|
| Warm and inviting | Fast party-size selection and scanability |
| Tactile and social | Native, predictable controls |
| Editorial and distinctive | Stable information hierarchy |
| Playful in moments | No ambiguity in requirements/status |
| Hand-prepared | No fake handmade text for critical content |
| Calm | Dense metadata revealed progressively |

## Composition

- Use an 8-column editorial grid at wide widths.
- Allow controlled offsets for headings, imagery, and marginal notes.
- Keep form controls, lists, and body copy aligned to a strict reading grid.
- Use large fields of warm background rather than wrapping every area in a card.
- Reserve contained “play slips” for game results and event invitations.
- Use horizontal rules, numbered sections, and margin annotations instead of dashboard panels.
- Remove overlaps and decorative offsets on narrow screens.

## Typography

Recommended free/open candidates, subject to final license and language verification:

- **Display/editorial:** Fraunces or Literata.
- **Interface/body:** Noto Sans or Source Sans 3.
- **Data/numerals:** the body family with tabular numerals; avoid adding a third family unless necessary.

Rules:

- Functional text never uses handwriting fonts.
- Display serif is limited to titles, section openings, and occasional pull statements.
- Body/UI text remains highly legible at small sizes.
- Long names wrap; the only occurrence of a title is never ellipsized.
- Fonts should be self-hosted to reduce third-party requests and privacy exposure.

## Color concept

A light-first system:

- warm paper background,
- charcoal ink,
- muted tomato as the primary expressive accent,
- moss for positive/available states,
- indigo or deep blue for informational states,
- ochre for attention,
- red only for destructive, blocked, or unsafe states.

Status always includes text and iconography. Paper texture must be extremely subtle and absent under dense copy, inputs, tables, and status text.

A dark theme is not part of the first release. The interface must still work in system forced-colors/high-contrast modes.

## Game-card structure: “play slip”

Order:

1. image crop or neutral editorial mark,
2. game title,
3. immediate fit line,
4. total time and age guidance,
5. best matching Access Option,
6. concise requirement sentence,
7. availability label and checked time,
8. one clear action to open the Game Page.

Avoid:

- tag clouds,
- multiple equal-weight buttons,
- tiny colored status dots,
- hidden hover-only data,
- decorative tape on every card.

## Party-size signature interaction

The hero-level interaction resembles a tabletop scorekeeper or guest-count note while remaining a normal input group:

- large selected numeral,
- quick buttons for common counts,
- direct numeric entry,
- concise prompt,
- optional sentence explaining result implications.

After selection, the control compresses into a sticky context strip without disappearing.

Motion: a brief paper-counter slide or numeric transition, disabled under reduced motion. No dice roll or slot reel.

## Navigation and shell

- Thin editorial header at desktop.
- Bottom navigation at mobile.
- Current destination is indicated with text, weight, and shape—not color alone.
- Find workspace context may stick below the header.
- Browse feels like a notebook contents page.
- Library feels like a personal index, not an analytics dashboard.

## Imagery and illustration

Preferred:

- licensed publisher art when permission is recorded,
- neutral tabletop photography created for the project,
- original line drawings and geometric marks,
- abstract paper cut shapes,
- original texture scans,
- typographic placeholders that are designed rather than apologetic.

Prohibited without rights:

- copied box art,
- screenshots,
- downloaded video thumbnails,
- publisher logos used as decoration,
- mood-board imagery reused in the product.

## Signature moments

1. **Party size:** restrained scorekeeper transition.
2. **Random:** one paper/card reveal; no gambling metaphor.
3. **Vote result:** totals settle once after closure, followed by a simple stamped “group pick.”
4. **Event join:** subtle confirmation imprint after authoritative server success.

Reduced motion replaces spatial movement with immediate state change or short opacity.

## Mobile adaptation

- Linear document order.
- No overlap or marginal note outside the viewport.
- Party size becomes a compact sticky strip.
- Filters open in a full-height sheet.
- Game cards become single-column play slips.
- Important requirements appear before imagery where space is constrained.
- Bottom navigation never covers focused content.
- Paper texture is reduced further for clarity and performance.

## Accessibility risks and controls

| Risk | Control |
|---|---|
| Texture reduces contrast | No texture beneath functional text; automated and manual contrast review |
| Editorial offset conflicts with DOM order | DOM follows logical reading order; visual placement never reverses it |
| Craft metaphor hides control type | Use native control semantics and familiar labels |
| Serif becomes hard to read | Display use only; body/UI remains sans |
| Drag metaphor in Vote | Complete button/keyboard alternative |
| Decorative stamps communicate status | Status also uses explicit text and icon |
| Motion causes discomfort | Respect reduced motion; no continuous animation |
| Tactile layers cause layout shifts | Reserve intrinsic media dimensions and avoid runtime collage assembly |

## Reference qualities

Reference material should be selected for qualities rather than copied layouts:

- editorial notebooks: hierarchy, warmth, and annotation,
- paper-cut exhibitions: material contrast and restrained layering,
- transit or field guides: clear navigation and dense factual organization,
- contemporary cookbooks: practical instructions with inviting art direction.

Do not copy identifiable compositions, scans, illustrations, or game packaging.

## What preserves the direction

- warmth from spacing, paper tone, type, and editorial rhythm;
- contained objects only when containment has meaning;
- clear practical language;
- asymmetry at large sizes with strict responsive simplification;
- one or two expressive moments per screen;
- neutral placeholders that feel intentional.

## What breaks the direction

- generic rounded SaaS cards around every section,
- faux tape, torn paper, and drop shadows everywhere,
- illegible handwriting,
- purple gradients or glass panels,
- neon “gamer” styling,
- category rainbow palettes,
- casino/random-wheel metaphors,
- tiny metadata,
- decorative dice, meeples, or controllers without purpose.
