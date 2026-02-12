## 2025-02-17 - SVG Keyboard Accessibility in Preact
**Learning:** When making SVG elements like `<rect>` focusable in Preact, the `tabIndex` prop (camelCase) may render as `tabIndex="0"` in the DOM, which some browsers ignore for focusability on SVG elements (expecting `tabindex`). The lowercase `tabindex` prop must be used in JSX to ensure the attribute is rendered correctly for browser recognition.
**Action:** Use `tabindex="0"` (lowercase) instead of `tabIndex={0}` when working with SVG elements in Preact to ensure keyboard accessibility.
