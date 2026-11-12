# Job Not Found — The Ascent design system

The shared tokens live in `global.css`; use the CSS custom properties in CSS and
the matching Tailwind v4 utilities (`bg-base`, `bg-surface`, `text-primary`,
`text-muted`, `border-line`, `text-accent`) in components. Keep raw colors in
the token file only.

## Foundations

- **Alpine night:** base `#07111c`, surface `#0d1c2a`, elevated `#14283a`,
  border `#294052`.
- **Glacier text:** primary `#f1f6f8`, secondary `#cad8e1`, muted `#a5b8c5`.
- **Sunrise accent:** amber `#ffb574`; hover `#ffc891`; active `#e89155`.
- **Ice accent:** `#91c9dd` for wayfinding, route detail, and atmospheric glow.
- **Semantic:** success `#78d6b1`, warning `#ffd17a`, error `#ff9292`.
- **Typography:** Rubik headlines, Heebo body, Frank Ruhl Libre editorial accents;
  each has a Hebrew-capable fallback. Technical labels use monospace.
- **Type scale:** display, h1, h2, h3, body-lg, body, small, and caption each
  have size, weight, line-height, and letter-spacing tokens. Display through h2
  use fluid sizing from phone to desktop. Tailwind utilities include
  `text-display`, `text-h1`, `text-h2`, `text-h3`, `text-body-lg`, `text-body`,
  `text-small`, and `text-caption`.
- **Spacing:** 8px base with named steps from 8px to 256px. Sections use
  `--section-space`; content uses the 82rem container and 46rem reading width.
- **Shape:** 8px controls, 14px cards, 20px panels, and pill-shaped chips.
- **Depth:** deep neutral card shadow with restrained sunrise and ice glows.
- **Motion:** 160ms / 320ms / 780ms; standard and emphasized easing; 90ms stagger.
  Animate transform, opacity, clip-path, and SVG strokes only; remove parallax,
  count-up, and cursor effects for reduced motion.
- **Layers:** base 0, content 1, sticky 20, menu 30, overlay 50, cursor 60.
- **Ascent colors:** section sky, ridgeline, and route colors are also declared
  as CSS variables in `global.css`; SVG fills and page backgrounds reference
  those variables rather than embedding colors in components.

## Usage rules

1. Keep all page and component colors on these shared tokens. Use alpha variants
   with `rgb(var(--*-rgb) / <alpha>)`.
2. Keep body text at 16px or larger. Check primary and secondary text on all
   surfaces for WCAG AA contrast; reserve muted color for decorative metadata.
3. Use the same container, section spacing, card padding, and grid gap across
   routes; do not introduce arbitrary spacing values.
4. Use sunrise amber as the CTA and emphasis color; use glacier ice as a
   secondary wayfinding color. Keep semantic colors limited to status.
5. Motion is progressive enhancement: every text and image must be available
   without JavaScript and when reduced motion is enabled. The About page uses
   vanilla Motion for scroll reveals and parallax, plus CSS for Astro view
   transitions; reduced motion removes parallax, counters, and the custom cursor.
