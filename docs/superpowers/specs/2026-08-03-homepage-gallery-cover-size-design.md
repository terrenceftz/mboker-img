# Homepage Gallery Cover Size Design

## Goal

Prevent homepage gallery covers from becoming excessively large on wide desktop screens while preserving the original asymmetric photography layout.

## Scope

- Change only `src/components/IndexCard.astro`.
- Do not change the homepage hero images or hero sizing.
- Do not crop gallery covers.
- Do not add database fields or backend controls.
- Do not apply one shared scale limit to the whole gallery.

## Layout

The existing nine-position grid cycle remains unchanged. Each position receives an independent maximum width on desktop screens:

| Cycle position | Maximum width | Maximum height |
| --- | ---: | ---: |
| 1 | 900px | min(760px, 78vh) |
| 2 | 440px | min(620px, 78vh) |
| 3 | 620px | min(700px, 78vh) |
| 4 | 860px | min(760px, 78vh) |
| 5 | 600px | min(700px, 78vh) |
| 6 | 520px | min(720px, 78vh) |
| 7 | 840px | min(760px, 78vh) |
| 8 | 600px | min(800px, 78vh) |
| 9 | 900px | min(900px, 78vh) |

The limits apply to each card's inner content instead of the grid container. This keeps the current column spans, offsets, margins, and alternating left/right information placement. Cards keep their existing relative size differences.

On desktop, the inner wrapper, media link, and picture shrink to the rendered image width. Images use `width: auto`, `max-width: 100%`, `height: auto`, and the position-specific maximum height. This bounds portrait images without distortion and keeps the detached information label adjacent to the visible image. No fixed height, `aspect-ratio`, or cover cropping is introduced.

## Responsive Behavior

The independent limits apply only to desktop layouts where the asymmetric grid and detached information labels are active. Mobile and tablet layouts continue using the existing responsive widths, so covers remain readable and do not become artificially narrow.

## Verification

- Source test confirms the hero styles are untouched and `IndexCard` retains `height: auto` without cropping.
- Source test confirms independent desktop limits exist for large, medium, and small card positions.
- Browser verification at wide desktop width confirms the first cover stays at or below 900px.
- Browser verification confirms every cover stays below its position-specific height cap and 78% of the viewport height.
- Browser verification confirms at least three distinct cover widths remain in the nine-card cycle.
- Mobile verification confirms no horizontal overflow.
