---
name: agriova-ui
description: Use when building or changing any screen or component in this app - choosing text styles, colors, cards, buttons, lists, charts, or adapting a Figma frame from the Unified Design file into React Native.
---

# Agriova UI

Every screen is assembled from `src/ui` and `src/theme/tokens.ts`. If a screen
needs something those do not have, add it there first, with a test, then use
it. Never style a one-off inside a screen.

The design source is Figma "Unified Design", section "Prototype" (node
441:1356): Dashboard, Maps, Schedule, ERP AI, Shop, Settings, Statistics,
Notifications. Keep its language (deep-green gradient cards, red warning cards,
white rounded cards on #F7F7F7, pill chips, circular header buttons, Geist).
Do not copy its sizes: the prototype sets body text at 11px.

## Who this is for

Filipino smallholders, average age 57, about 8 years of schooling, often
outdoors in sunlight, often with Bisaya as their first language. Every rule
below follows from that.

## Hard rules (tests enforce the first four)

1. **Text is `<Text variant tone>` from `@/ui`.** Never React Native's Text,
   never a raw `fontSize` or `fontFamily`. Variants: `display` (hero peso
   figure), `figure`, `title`, `heading`, `bodyStrong`, `body`, `label`.
   `label` (15) is for non-essential text only: never a peso amount, date or
   quantity.
2. **Contrast is 4.5:1 or better** for all reading text, including white text
   over the first three quarters of a gradient card. `tokens.test.ts` checks
   every pair; add a new pair there when you add a color.
3. **Touch targets are 56dp** (`layout.minTouch`). Smaller visuals, like the
   48dp IconButton or 44dp FilterPill, make it up with `hitSlop`.
4. **Every string comes from `src/i18n/strings.ts`**, in both languages.
   Bisaya runs longer than English; design for the longer one.
5. **Spacing comes from the scale.** Follow the `spacing` skill. No raw
   numbers, and no arithmetic on tokens (`space.xs / 2`); if the scale lacks a
   value, add a named token.
6. **Selection never relies on color alone.** Selected pills show a check;
   selected days fill; alert cards carry an icon and a title.
7. **Money uses `numeric`** on its Text, so digits do not jitter as totals
   change, and is formatted with `formatPesos` from `src/db/units.ts`.

## Components

| Need | Use |
| --- | --- |
| Screen frame, safe area, gutter, tablet width cap | `Screen` (pass `header` for a TopBar) |
| "Welcome back / name / bell" header | `TopBar` with `IconButton` actions |
| White card | `Card` (`padding="hero"` for heroes, `gap="none"` for lists of rows) |
| Green or red gradient card | `GradientCard` (`gradient="brand"` or `"danger"`) |
| AI Warning / Approves / Suggests | `AlertCard kind="warning" \| "approve" \| "suggest"` |
| Status pill | `Chip` (`tone="onCard"` on gradients, `dot` for a status dot) |
| Single-select pill row | `FilterPills` |
| Main / secondary / on-card button | `Button variant="primary" \| "secondary" \| "onCard"` |
| Settings-style row | `ListRow` inside `Card gap="none"` |
| Seven-day picker | `WeekStrip` |
| Finance trend | `StepChart` (falling periods turn red) |
| Temperature / moisture trend | `Sparkline` |
| Nothing recorded yet | `EmptyState`, always with an action |
| Logo | `Logo variant="mark" \| "wordmark"` |

Width-dependent layout goes through `useBreakpoint()`. `isNarrow` is true below
380dp **or** at font scale 1.3 and up; two-up tiles stack when it is.

## Content rules from the product review

The prototype shows readings a smallholder cannot produce (soil kPa, pH, a
"plant health" percentage) and a 41.5 million peso total. Keep the card
designs; feed them real sources: season profit from `cycle_pnl`, heat from a
weather API, a spoilage countdown from `crop.shelfLifeDays`, prices from
`price_reference`. Never show a diagnosis of plant disease; that is out of
scope for the product.

## Before calling a screen done

1. `npm run verify` passes.
2. The screen has a component test for its interactive parts
   (`@testing-library/react-native` v14: `await render(...)`,
   `await fireEvent.press(...)`).
3. Screenshots via the `run-android` skill at 411dp, 360dp, and 320dp with
   font scale 1.3, compared against the Figma frame. The 320dp / 1.3 case is
   where layouts break: words split mid-word, circles touch, rows overflow.
4. `app/gallery.tsx` shows any new primitive.
