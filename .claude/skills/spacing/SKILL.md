---
name: spacing
description: Use when writing or reviewing any layout code in this app - choosing padding, margin, gap, or whitespace between elements, or when a screen looks cramped, floaty, or unevenly spaced.
---

# Spacing

All spacing in this app comes from the `space` scale in `src/theme/tokens.ts`.
Never type a raw pixel number into a style. If a value you need is not on the
scale, the layout is wrong before the number is.

Scale: `xs 4`, `sm 8`, `md 12`, `lg 16`, `xl 24`, `xxl 32`.

## The one rule that does most of the work

**Proximity signals grouping.** Elements that belong together sit closer than
elements that do not, and the gap between groups should be roughly double the
gap inside a group. A reader parses structure from whitespace before they read
a single word, which matters enormously for a user who reads slowly.

If a label looks like it belongs to the field below it instead of the field
above it, the fix is never a divider line. It is the gap.

```tsx
// ✅ Label binds to its own input, fields separate clearly
<View style={{ gap: space.xl }}>          // between fields: 24
  <View style={{ gap: space.sm }}>        // label to input: 8
    <Text>Kantidad</Text>
    <TextInput />
  </View>
  <View style={{ gap: space.sm }}>
    <Text>Petsa</Text>
    <TextInput />
  </View>
</View>
```

## Quick reference

| Situation | Value |
| --- | --- |
| Screen edge padding | `layout.screenPadding` (16). Never less on a phone. |
| Between major sections | `xl` 24, or `xxl` 32 at the top of a screen |
| Between sibling cards in a list | `md` 12 |
| Padding inside a card | `lg` 16, or `xl` 24 for a hero card |
| Label to its own control | `sm` 8 |
| Icon to its adjacent text | `sm` 8 |
| Inside a pill or chip | `sm` vertical, `md` horizontal |
| Between two tappable controls | `sm` 8 minimum, so fat fingers cannot mis-tap |

**Padding inside a card must be greater than or equal to the gap between
cards.** When the inside gap exceeds the outside gap, the card stops reading as
one object and its contents appear to belong to the neighbours.

## React Native specifics

**Prefer `gap` on the parent over `margin` on children.** React Native has no
margin collapsing, unlike the web, so a `marginBottom: 16` next to a
`marginTop: 16` produces 32 and not 16. `gap` on a flex container is immune to
this and it survives reordering and conditional children.

**Never put margin on both sides of the same axis.** Pick one direction and
stay consistent, or use `gap`. Mixed directions make a list's first and last
items silently different from the middle.

**Use `padding-block` style pairs, not the `padding` shorthand, when the two
axes differ.** `paddingVertical` with `paddingHorizontal` reads clearly;
`padding: 16` followed by an override is how inconsistency creeps in.

## Horizontal versus vertical are not interchangeable

Vertical space is cheap and horizontal space is scarce on a 360pt phone. The
same numeric value reads as tighter horizontally. When a row feels cramped but
the scale says the value is right, reduce content rather than reduce the gap.

## Optical adjustment

The grid is a starting point, not the verdict. Trust your eye over the number
in three cases:

- **Icons next to text** need slightly less gap than two text elements do,
  because an icon's glyph carries its own internal padding.
- **Circular elements** such as an avatar need a touch more surrounding space
  than a square of the same size, since the corners read as empty.
- **A large figure**, like the peso total on the home screen, needs more space
  above it than below it, or it appears to sag inside its card.

## Common mistakes

- **Reaching for a divider line.** Almost every divider in a mockup is a
  spacing failure wearing a disguise. Increase the gap first and see whether
  the line is still needed.
- **Uniform spacing everywhere.** A screen where every gap is 16 has no
  hierarchy and reads as an undifferentiated wall. Vary deliberately.
- **Padding a scroll container's bottom by nothing.** Content must clear the
  tab bar. Add `paddingBottom: space.xxl` to scroll content, more when the tab
  bar is translucent.
- **Shrinking spacing to fit more in.** On this app that is always the wrong
  trade. The accessibility floors in `tokens.ts` exist because the user is
  older and outdoors. Cut content, never the gaps or the type size.
