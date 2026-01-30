## 2025-01-30 - Accessible Interactive SVGs
**Learning:** Interactive SVG elements (like `<rect>`) need explicit `role="button"`, `tabIndex="0"`, and `onKeyDown` handlers to be keyboard accessible. Standard CSS focus rings often don't render predictably on SVG shapes.
**Action:** Use React state to toggle `stroke` color/width for a custom, robust focus indicator on SVG elements.
