# Palette's Journal

## 2025-02-17 - Button Contrast & Disabled Tooltips
**Learning:** WCAG AAA compliance for orange buttons requires black text, as white text fails contrast ratios. Disabled buttons are a UX trap; users need to know *why* an action is unavailable.
**Action:** When using brand colors like `#f39c12`, always verify contrast against black/white text. Wrap disabled buttons in a `span` with a `title` attribute and `pointer-events: none` on the button to ensure the tooltip is triggered on hover.
