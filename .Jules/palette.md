## 2025-02-18 - Semantic Navigation
**Learning:** The application used `div` elements for the main navigation, relying on visual cues (bold text) for the active state. This excludes screen reader users from understanding the page structure and current location.
**Action:** Replace navigation containers with `<nav>` landmarks and use `aria-current="page"` for the active link to communicate state programmatically.
