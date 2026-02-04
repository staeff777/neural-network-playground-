## 2026-02-04 - Tooltips for Disabled Buttons
**Learning:** Standard disabled buttons do not trigger mouse events (like hover), preventing tooltips from appearing. This is a common accessibility/UX gap.
**Action:** Wrap disabled buttons in a container (e.g., `<span>`) with `title` attribute. Ensure the button has `pointer-events: none` so the wrapper captures the hover event.
