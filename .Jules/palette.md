## 2025-02-27 - Disabled Button Tooltips
**Learning:** To display tooltips via the `title` attribute on disabled buttons, the button must be wrapped in a container (e.g., `<span>`) and the button itself must have `pointer-events: none` to ensure the wrapper captures hover events.
**Action:** Use a wrapper span with `cursor: not-allowed` and `title` when implementing disabled buttons that need explanation.
