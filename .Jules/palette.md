# Palette's Journal

## 2025-02-27 - Semantic Navigation & SPA Behavior
**Learning:** The application used simple anchor tags for navigation, causing full page reloads. This is a common pattern in MPAs but less ideal for a smooth interactive demo. Also, the navigation lacked semantic structure (`<nav>`) and accessibility attributes (`aria-current`).
**Action:** When implementing navigation in this app, prefer `pushState` for SPA behavior and wrap links in `<nav>` with clear labels. Ensure `aria-current="page"` is used for the active link.
