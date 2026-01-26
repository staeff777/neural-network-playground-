## 2025-05-19 - Wrapper for Disabled Button Tooltips
**Learning:** Browsers typically suppress mouse events on disabled elements, preventing `title` tooltips from showing. To provide feedback on why an action is disabled (e.g., "Generate data first"), the disabled button must be wrapped in a container (like a `span` or `div`) that receives the hover event.
**Action:** When adding tooltips to potentially disabled buttons, always wrap them in a container and place the `title` attribute on the wrapper.
