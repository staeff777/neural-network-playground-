## 2024-03-22 - Interactive SVG Accessibility
**Learning:** Interactive visualizations using SVG `onClick` handlers on shapes (like `rect`) are inaccessible to keyboard users as they cannot be focused or triggered via Enter/Space.
**Action:** Always provide an alternative, accessible HTML control (like a `<button>`) to trigger the same interaction, or implement full keyboard accessibility (tabindex, role, onKeyDown) within the SVG.
