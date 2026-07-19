# Party-size-first Find control

Milestone 2C replaces the temporary Find scaffold on both `/` and `/find` with
one shared, progressively enhanced party-size control. Both routes remain
`noindex,follow` and intentionally omit a canonical link under the current route
strategy.

## Contract

- The initial state is unset. There is no default party size.
- Native radio choices cover 1 through 8, with an explicit “Another number”
  path for whole numbers from 1 through 99.
- The pure parser exposes only `unset`, `valid`, and `invalid` states. Its stable
  errors are `required`, `not_integer`, `below_minimum`, and `above_maximum`.
- Surrounding whitespace and leading zeroes normalize. Values are never rounded,
  clamped, persisted, or silently coerced.
- Quick choices commit immediately. Custom values commit only through the Apply
  button or Enter. Validation never moves focus.
- A visible receipt exposes the canonical value. A concise polite live region
  announces deliberate commits and validation errors.
- With JavaScript disabled, the heading, fieldset, native controls, explanatory
  copy, and Browse link remain available; the page does not claim a value was
  applied.

## Explicit boundary

This slice does not match or filter games, show result counts or cards, serialize
URL state, use browser storage, call a network service, write analytics, or touch
accounts, catalog data, D1, or external destinations. Browse remains the peer
exploration path and makes no compatibility claim.

## Accessibility and layout

The implementation uses a native fieldset, legend, radios, labels, number input,
and button. Targets are at least 44 CSS pixels; focus remains visible and clears
the compact fixed navigation. The layout reflows from 320px through 1440px and
retains forced-colors and reduced-motion behavior from the shared shell.
