## 2024-02-14 - Tab Accessibility Pattern
**Learning:** React/Preact conditional rendering of tabs often removes content from DOM, which is fine for performance but requires careful ARIA management. `aria-controls` pointing to non-existent ID is valid, but having a stable `tablist` container is crucial for screen readers to announce "Tab 1 of 3".
**Action:** When adding a11y to tabs, always wrap the "active" content in a `role="tabpanel"` div, even if it's conditionally rendered.
