# Palette's Journal - Critical UX Learnings

## 2024-05-22 - Control Panel Accessibility
**Learning:** Disabled buttons often suppress pointer events, preventing tooltips (via `title` attribute) from appearing.
**Action:** Always wrap disabled buttons in a container (e.g., `<span>`) that handles the tooltip and layout, and ensure the button has `pointer-events: none`.

**Learning:** The orange brand color (`#f39c12`) has insufficient contrast with white text (~1.8:1).
**Action:** Use black text on orange backgrounds to achieve WCAG AAA compliance (~11.5:1).
