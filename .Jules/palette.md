## 2025-05-02 - Accessible Tooltips for Disabled Buttons
**Learning:** Browsers generally suppress mouse events (including hover for tooltips) on `disabled` form elements. A reliable pattern is to wrap the disabled button in a container (e.g., `<span>`) that handles the tooltip (`title`) and cursor (`cursor: not-allowed`), while ensuring the button itself has `pointer-events: none` so the wrapper receives the events.
**Action:** Apply this wrapper pattern whenever a disabled action needs an explanation for why it is unavailable.
