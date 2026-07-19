# Table Notes shell and navigation contract

**Milestone:** 2A shell, amended by 2D  
**Decision authority:** D-001, D-002, D-006, D-011, D-014, D-015, D-016, D-027, D-029, D-030, I-012  
**Status:** Implementation contract; formal independent verification remains a separate gate

## Shell boundary

`BaseLayout.astro` emits fully prerendered semantic HTML with:

- a visible-on-focus link to `#main-content`;
- a semantic banner, one breakpoint-appropriate primary navigation, one focusable main landmark, and a restrained factual footer;
- route-owned title and description metadata plus `robots=noindex,follow` while the routes are scaffolds;
- one canonical link to `/find` on both Find aliases, so shared and normalized filter URLs have one stable target;
- no client hydration, navigation script, external runtime request, analytics, user data, secrets, or D1 rendering. The only shell-adjacent client code is the bounded M2D Find controller emitted once and referenced by `/` and `/find`; Browse retains its separately bounded inline M2C controller.

The root route renders the Find scaffold directly. It does not redirect and does not put marketing content before Find. Every temporary scaffold must be replaced by its authorized feature slice before indexing or public release; removing `noindex` is part of that later feature's acceptance work.

`@astrojs/react` remains pinned and installed so a later authorized interactive island can use the reviewed dependency baseline, but the integration is inactive while no page needs React. Activating it unconditionally emitted an unused 191,646-byte client asset. The first authorized island must deliberately restore the integration with bounded bundle and hydration tests, following the same inactive-until-needed pattern as the pinned Cloudflare adapter.

## Responsive navigation

The single typed source in `src/navigation/routes.ts` owns labels, localization-ready label keys, hrefs, exact/nested matching, placement, More membership, and deterministic order.

| Projection        | Ordered destinations                            |
| ----------------- | ----------------------------------------------- |
| Desktop primary   | Find, Browse, Random, Vote, Game Night, Popular |
| Desktop personal  | Library, Account                                |
| Compact bottom    | Find, Browse, Random, More                      |
| Static More route | Vote, Game Night, Popular, Library, Account     |

Compact mode applies below `64rem`. Desktop mode starts at `64rem`, so 320px, 390px, and 768px use the bottom navigation while 1024px and 1440px use the editorial header navigation. CSS `display` controls the projection, leaving only one Primary navigation visible and in the accessibility tree at a time. The bottom navigation reserves its height plus `safe-area-inset-bottom` in document spacing.

Route matching removes query strings, fragments, and trailing slashes, preserves segment boundaries, and chooses the longest matching owner. `/` is an exact alias of Find. Section destinations own nested paths; `/more` is exact-only. `/games/*` and unknown paths have no global owner. More is current only on `/more`, never merely because Vote, Game Night, Popular, Library, or Account belongs to its compact list.

Current links combine explicit `aria-current=page`, stronger weight, a contained shape, and a rule. Forced-colors mode adds a system-color border. Every destination remains a native link with a visible label and at least a 2.75rem target.

## Table Notes tokens

The token layer in `src/styles/global.css` defines warm paper (`#f4efe3`), deep paper (`#e7ddca`), ink (`#28251f`), muted ink (`#5f594f`), muted tomato, informational indigo, attention ochre, positive moss, destructive red, rule, and focus colors. It also defines typography, spacing, a 68ch reading measure, a 90rem shell, target and navigation dimensions, safe-area insets, focus geometry, motion, and z-index layers.

The shell uses no texture, gradient, glass treatment, dark theme, invented logo, decorative game icon, or generic card wrapper. Fraunces is limited to the text wordmark and editorial headings. Source Sans 3 owns body, navigation, and functional text. CSS uses only supplied weights 400, 600, and 700.

## Font provenance and evidence

Retrieval date: **2026-07-17**. Both releases permit self-hosting under the SIL Open Font License 1.1. Complete upstream copyright/license text is preserved in [`Fraunces-OFL.txt`](../../public/fonts/licenses/Fraunces-OFL.txt) and [`SourceSans3-LICENSE.txt`](../../public/fonts/licenses/SourceSans3-LICENSE.txt).

Fraunces uses tag `1.000`, release commit `0bf87f6`. The frozen packet named `fonts/webfonts/`, which returns 404 at that release. Inspection of the same approved commit located the exact requested files under `fonts/web/static/`; the root orchestrator approved this provenance-path correction without changing tag, commit, filenames, styles, or weights.

| Local file / original filename                 | Upstream release path                          |   Bytes | SHA-256                                                            |
| ---------------------------------------------- | ---------------------------------------------- | ------: | ------------------------------------------------------------------ |
| `fraunces/Fraunces72pt-Regular.woff2`          | `fonts/web/static/Fraunces72pt-Regular.woff2`  |  27,660 | `506c53f3fe7417e954d7e19e6103ca56358eec728abd910d6a0a5f4a66743473` |
| `fraunces/Fraunces72pt-SemiBold.woff2`         | `fonts/web/static/Fraunces72pt-SemiBold.woff2` |  28,132 | `2e75ffbd37bea715c775885a2932c0a001b151130fe20c22a261f984454390e4` |
| `source-sans-3/SourceSans3-Regular.ttf.woff2`  | `WOFF2/TTF/SourceSans3-Regular.ttf.woff2`      | 109,632 | `53492fb3a0def77354f166a55d09b63a10855e91c206c7620a81cf56e97f8ec3` |
| `source-sans-3/SourceSans3-Semibold.ttf.woff2` | `WOFF2/TTF/SourceSans3-Semibold.ttf.woff2`     | 108,900 | `47b9b661b9f395fe7f0d0e119637fba5c8dad97bde3df60066fd24229c0792f4` |
| `source-sans-3/SourceSans3-Bold.ttf.woff2`     | `WOFF2/TTF/SourceSans3-Bold.ttf.woff2`         | 108,640 | `8d35c6d40e750a4ee23bbbba2bd604ad098d172907369b43281507e16b8e2e7a` |

Source Sans 3 uses tag `3.052R`, release commit `ed18089`. The five-font transfer total is **382,964 bytes** before HTTP compression. Fonts are local-only, use `font-display: swap`, have robust system fallbacks, and are not preloaded without measured need.

`tests/browser/foundation.spec.ts` loads every supplied family/weight against an English-first Latin sample containing uppercase, lowercase, numerals, punctuation, curly quotes, en dash, and em dash, then checks the CSS Font Loading API and computed families. This is the scoped glyph/rendering check for the English-first release; broader authored-language coverage remains a later localization gate.

## Verification ownership

Unit checks cover route normalization, root/exact/nested matching, false prefixes, unknown routes, projections, ordering, More membership, and current semantics. Browser checks cover all scaffolds, metadata, internal links, 320/390/768 compact layouts, 1024/1440 desktop layouts, focus, overlap, overflow, forced colors, reduced motion, local fonts, bounded scripts, no islands or external assets, JavaScript-disabled reading, and automated accessibility. A build-output regression walks `dist`, requires exactly 13 HTML files, permits exactly one emitted JavaScript asset for the shared Find controller, requires that asset to be referenced only by `/` and `/find`, preserves Browse's existing inline script, and rejects Astro islands, React runtime markers, external script sources, or controller references on every other page.

Implementer checks do not satisfy acceptance. A fresh independent tester must execute the formal task charter, and the integrated candidate must pass a separate regression gate before Git delivery.
