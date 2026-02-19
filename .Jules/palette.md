## 2024-05-22 - Control Panel Accessibility
**Learning:** To display tooltips via the `title` attribute on disabled buttons, the button must be wrapped in a container (e.g., `<span>`) and the button itself must have `pointer-events: none` to ensure the wrapper captures hover events.
**Action:** Use this wrapper pattern for all disabled button tooltips.

## 2024-05-22 - Lightweight Loading Spinners
**Learning:** Loading spinners for buttons are implemented as self-contained inline SVGs using `animateTransform` for rotation, avoiding external CSS or `<style>` tag dependencies.
**Action:** Reuse this inline SVG pattern for small, self-contained loading states.

## 2024-05-22 - Button Contrast
**Learning:** The 'Stop' state of the simulation button uses black text on an orange background (`#f39c12`) to ensure WCAG AAA contrast compliance. White text fails.
**Action:** Always verify contrast ratios for colored buttons.
