## 2026-02-21 - SVG Focus Accessibility in Preact
**Learning:** In Preact, interactive SVG elements (like `<rect>`) require lowercase `tabindex` (not `tabIndex`) to be focusable and correctly receive keyboard events.
**Action:** When adding interactivity to SVGs, use `tabindex="0"` and manage focus state manually (e.g. `isFocused`) for robust visual feedback.
