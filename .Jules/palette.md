## 2025-02-17 - [Semantic Navigation Refactor]
**Learning:** Refactoring hardcoded navigation links into a data-driven list mapped inside a `<nav>` element makes it trivial to add `aria-current="page"` and ensures semantic correctness.
**Action:** Always check if navigation is just a `div` and upgrade it to `nav` with `aria-label` and active state indicators.
