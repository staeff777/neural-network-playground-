## 2024-03-22 - Accessibility Patterns for Disabled Buttons
**Learning:** Browser events (like `mouseover`) are not fired on disabled buttons, making standard tooltips (`title` attribute) inaccessible.
**Action:** Wrap disabled buttons in a container (e.g., `<span>`) with `cursor: not-allowed` and the `title` attribute, while ensuring the disabled button has `pointer-events: none` so the wrapper captures the hover.
