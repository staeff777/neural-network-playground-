## 2025-02-18 - High Contrast & Self-Contained Loaders
**Learning:** WCAG AAA compliance for orange backgrounds (#f39c12) requires black text, not white. White text fails contrast checks (1.95:1) while black passes (10.74:1). Also, when restricted from adding custom CSS classes, self-contained SVGs with internal `<style>` tags are a robust way to add loading animations.
**Action:** Always verify contrast ratios for colored buttons. Use inline SVG styles for micro-interactions in restricted environments.
