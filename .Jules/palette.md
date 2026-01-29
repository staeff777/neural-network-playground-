# Palette's Journal

## 2024-05-22 - Disabled Button Tooltips
**Learning:** Disabled buttons in the ControlPanel swallow mouse events, preventing `title` tooltips from appearing. This leaves users unsure why an action is unavailable.
**Action:** Wrap disabled buttons in a container (e.g., `<span>`) that holds the `title` attribute, and apply `style={{ pointerEvents: "none" }}` to the disabled button itself to allow hover events to bubble to the wrapper.
