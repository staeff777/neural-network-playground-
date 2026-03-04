## 2024-05-15 - Disabled Button Tooltips in Preact
**Learning:** Native `title` attributes on `<button>` elements do not appear when the button is `disabled`.
**Action:** Wrap disabled buttons in a `<span>` with the `title` attribute, and set `pointer-events: none` on the button itself to ensure the parent span captures hover events correctly, while ensuring no interference with normal button functionality when not disabled.

## 2024-05-15 - Inline Loading Spinners
**Learning:** Loading states on buttons significantly improve user feedback, but external CSS spinners can be brittle.
**Action:** Use self-contained SVG elements with native `animateTransform` inside buttons for reliable, CSS-independent loading spinners. Combine with `display: inline-flex` and `gap` for perfect alignment with text.