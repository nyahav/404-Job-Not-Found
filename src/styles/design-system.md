# Job Not Found design system

The shared tokens live in `global.css`; use the CSS custom properties in CSS and
the matching Tailwind v4 utilities (`bg-base`, `bg-surface`, `text-primary`,
`text-muted`, `border-line`, `text-accent`) in components. Keep raw colors in
the token file only.

## Foundations

- **Surfaces:** base `#0b0f14`, surface `#111821`, elevated `#1b2632`, border
  `#344354`.
- **Text:** primary `#f4f7fa`, secondary `#c2cdd8`, muted `#a3b1c0`.
- **Accent:** brand violet `#c5a3ff`; hover `#d7bfff`; active `#ae82f2`.
- **Semantic:** success `#67d3a3`, warning `#ffd166`, error `#ff8a8a`.
- **Typography:** Arial with Noto Sans Hebrew and Segoe UI fallbacks; monospace
  is reserved for technical labels. Headings use a fluid display-to-h3 scale.
- **Spacing:** 4px base, named steps from 4px to 128px. Sections use
  `--section-space`; content uses the 76rem container and 48rem reading width.
- **Shape:** 12px controls, 20px cards, 28px panels, and pill-shaped chips.
- **Depth:** one restrained card shadow and a low-opacity accent glow.
- **Motion:** 140ms / 220ms / 520ms; standard and emphasized easing; 60ms stagger.
  Animate opacity and transforms, and simplify or skip motion for reduced-motion
  preferences.
- **Layers:** base 0, content 1, sticky 20, menu 30, transition overlay 50.

## Usage rules

1. Keep all page and component colors on these shared tokens. Use alpha variants
   with `rgb(var(--*-rgb) / <alpha>)`.
2. Keep body text at 16px or larger. Use secondary/muted text only where the
   contrast check against its surface remains at least WCAG AA (4.5:1).
3. Use the same container, section spacing, card padding, and grid gap across
   routes; do not introduce arbitrary spacing values.
4. Prefer one accent color. Use semantic colors only to express status.
   Existing cyan utility classes resolve to the shared violet accent tokens so
   interactive labs and the portfolio chrome stay visually consistent.
5. Motion should be brief, transform/opacity-only, and never required to reveal
   readable content.
