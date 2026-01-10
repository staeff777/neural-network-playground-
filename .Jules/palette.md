## 2024-05-23 - Accessibility of Navigation and Controls
**Learning:** Even in small demos, navigation regions often lack semantic landmarks (`nav`) and current state indicators (`aria-current`), forcing screen reader users to guess their location. Simple `div` wrappers are invisible to assistive tech.
**Action:** Always wrap primary navigation in `<nav>` with a descriptive `aria-label` and use `aria-current="page"` for the active link. This is a low-effort, high-impact pattern.
