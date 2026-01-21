## 2024-05-23 - Accessibility of Control Panel
**Learning:** Hardcoded colors (like orange `#f39c12`) often fail contrast checks against white text. Semantic colors should be verified. Also, async buttons like "Train" benefit greatly from `aria-busy` and `title` tooltips to explain disabled states (e.g., "No data").
**Action:** Always verify button contrast ratios. Use `title` attributes on disabled elements to provide "why" context. Ensure toggle buttons use `aria-pressed`.
