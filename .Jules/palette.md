## 2025-05-18 - Tooltips on Disabled Buttons
**Learning:** Browsers suppress mouse events on disabled buttons, preventing `title` tooltips from appearing. Wrapping the button in a `span` and applying `pointer-events: none` to the button allows the wrapper to capture the hover and display the tooltip.
**Action:** Use this wrapper pattern for all disabled actions requiring explanation.
