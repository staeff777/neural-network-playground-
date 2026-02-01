## 2026-02-01 - Control Panel Accessibility and Usability
**Learning:** High-saturation background colors (like orange `#f39c12`) often fail WCAG AA contrast checks with white text.
**Action:** Use black or dark text on bright/warning colored buttons, or verify contrast ratio > 4.5:1.

**Learning:** Disabled buttons do not trigger mouse events, preventing `title` tooltips from showing.
**Action:** Wrap disabled buttons in a `<span>` with the `title` attribute and apply `pointer-events: none` to the disabled button to ensure the wrapper captures the hover.
