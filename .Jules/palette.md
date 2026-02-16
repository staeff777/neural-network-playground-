## 2024-05-22 - Tooltips on Disabled Buttons
**Learning:** The app lacks a centralized tooltip component. To show tooltips on disabled buttons (which don't fire mouse events), we must wrap them in a container (e.g., `<span>`) and apply the `title` attribute to the wrapper, while setting `pointer-events: none` on the disabled button to ensure the wrapper captures the hover.
**Action:** When adding tooltips to disabled interactive elements in this codebase, use the wrapper pattern with `pointer-events: none`.
