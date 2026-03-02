
## 2024-05-15 - [Disabled Button Tooltips]
**Learning:** Standard native HTML elements like `<button disabled>` do not reliably trigger hover events (like CSS `:hover` or native HTML `title` attributes) because they eat the events or browsers ignore them.
**Action:** The solution for this is to wrap the `<button disabled>` inside a focusable/hoverable element like `<span>` with the `title` attribute, but importantly apply `pointer-events: none` to the child button so the parent span can actually capture the pointer events and show the tooltip properly.
