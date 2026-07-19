# Party-size-first Find control

Milestone 2D retains the Milestone 2C 1–99 parser, quick choices, custom Apply,
Enter handling, and validation copy while integrating the valid committed value
into the one canonical `FindFilterState`.

## URL and history contract

- The initial value remains unset; there is no default.
- A quick choice or valid custom commit pushes one `/find?players=<1–99>`
  history entry only when the value changes.
- Typing in the custom field does not change the committed URL.
- Invalid custom input remains visible, does not change the URL, and does not
  move focus.
- Initial URL cleanup uses `replaceState`; Back/Forward restoration uses
  `popstate` without writing another entry.
- The active-setup summary owns the committed receipt and exposes a real
  `Remove N players filter` button. Clear all removes party size with the other
  active constraints.

The parser still distinguishes `unset`, `valid(value)`, and
`invalid(input,error)`. The canonical filter state contains only the normalized
number or `null`; it does not duplicate invalid draft input.

## Boundary

Party size participates only in setup state in Milestone 2D. No game is
evaluated, filtered, counted, ranked, or rendered as a result. With JavaScript
disabled, native party controls remain readable but do not claim that a query
or control value has been applied.
