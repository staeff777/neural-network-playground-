## 2024-05-22 - Semantic Navigation Missing
**Learning:** The app's main phase navigation was implemented as a `div` with `a` tags, lacking `nav` semantics and `aria-current` indicators, making it hard for screen readers to identify the current context.
**Action:** Always check main navigation structures for `nav` landmarks and `aria-current` attributes, especially in custom routing implementations.
