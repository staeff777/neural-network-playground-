## 2025-02-18 - Tooltips on Disabled Buttons
**Learning:** Browsers often suppress mouse events on disabled elements, making `title` attributes ineffective.
**Action:** Wrap the disabled button in a `<span>` (or `<div>` with `display: contents/inline-block`) that has the `title` attribute, and set `pointer-events: none` on the button itself. This ensures the wrapper captures the hover event and displays the tooltip.
