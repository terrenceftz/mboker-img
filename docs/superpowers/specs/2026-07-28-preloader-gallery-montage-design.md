# Gallery Preloader Montage Design

## Goal

Replace the homepage preloader's fixed portrait with a short montage of gallery photos while preserving the existing layered page-reveal animation.

## Data Source

- Read photos only from published albums inside published categories.
- Include uploaded and external photos.
- Prefer each photo's thumbnail URL and fall back to its original URL.
- Randomly select five unique photos for each homepage request.
- If fewer than five photos exist, repeat the available photos until five frames are present.
- If no published gallery photo exists, use `/hero-preloader.jpg` as the fallback frame.

## Presentation

- Render five overlapping image cards in the center of the preloader.
- Reveal cards in sequence with a short fade, blur, vertical movement, and subtle rotation.
- Keep the montage within the existing preloader intro duration, then run the current three-layer page reveal.
- Preserve each image's natural crop with a consistent frame and `object-fit: cover`.
- Reduce the frame dimensions on mobile to avoid overflow.
- Treat the montage as decorative and hide it from assistive technology.

## Architecture

1. Add a repository query that returns eligible preloader image URLs.
2. Add a small deterministic selection helper that accepts a random function so selection behavior can be tested.
3. Select the five URLs in the homepage server frontmatter and pass them through `Layout.astro` to `Preloader.astro`.
4. Update `PreloaderRuntime.astro` to wait for the montage intro before starting the existing page reveal.

## Error Handling

- Missing thumbnails fall back to original URLs.
- Empty galleries use the local optimized fallback image.
- Individual image load failures do not block the page reveal.
- A timeout still completes the intro if an animation event is missed.

## Verification

- Unit test published-photo filtering, uniqueness, repeat behavior, and empty fallback.
- Component source test confirms the fixed portrait is no longer the only homepage preloader image.
- Run focused unit tests, the production build, and a desktop/mobile browser smoke check.
