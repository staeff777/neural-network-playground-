# Palette's UX Journal

## 2024-05-22 - [Contrast & Semantic Navigation]
**Learning:** The project relies heavily on inline styles and lacks a formal design system. This makes standard accessibility improvements (like hover states for focus) tricky without adding verbose CSS. However, replacing `div` with `nav` and fixing contrast ratios in inline styles are high-impact, low-risk changes that fit this constraint.
**Action:** When working with inline-styled components, prioritize semantic HTML and ARIA attributes over CSS classes. For color changes, directly modify the style prop to ensure compliance.
