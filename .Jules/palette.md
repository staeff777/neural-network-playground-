## 2024-05-24 - Interactive SVG Rectangles Require Special Attention
**Learning:** When making SVG primitives like `<rect>` interactive, you must add `role="button"`, `tabindex="0"`, and keydown handlers (Enter/Space) to mimic native button behavior for keyboard accessibility. Visual focus indicators (`onFocus`/`onBlur`) should also be added using stroke manipulation, as native `outline` may not work reliably inside SVGs.
**Action:** Always check SVG elements used as buttons for these attributes and handlers, ensuring keyboard users can access and activate them.
