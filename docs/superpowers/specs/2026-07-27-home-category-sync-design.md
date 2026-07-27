# Home Category Sync Design

## Goal

Keep the original alternating Tink homepage composition while making category visibility and featured-card spacing consistent with CMS data.

## Data Flow

- `Menu.astro` reads published categories from the CMS database on every server render.
- Each menu item links to its first published album, falling back to the category page when no published album exists.
- Menu covers use the category cover, then the first published album cover, with the existing neutral fallback when neither is available.
- Draft categories never appear in the menu, homepage category slider, or featured album cards.

## Featured Card Layout

- Keep the existing nine-card alternating grid and left/right text placement.
- Make the image link and picture fill the card width so text positioning uses the visible image edge.
- Use the original image URL for large featured cards instead of the small thumbnail.
- Preserve a consistent 20px desktop gap and the current stacked mobile layout.

## Compatibility

- Keep the existing menu open/close animation and hover-cover behavior.
- Generate stable per-item hover identifiers instead of hard-coded category classes.
- Preserve the special label for albums marked as special.

## Verification

- Repository/source tests confirm the menu uses published CMS categories and has no hard-coded Altay entry.
- Browser checks confirm a draft Altay category is absent from the menu.
- Browser geometry checks confirm featured image and text edges stay 20px apart on desktop.
- Desktop and 390px screenshots confirm no overlap or layout regression.
