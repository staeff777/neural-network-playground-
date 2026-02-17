## 2024-05-22 - Simulation Button Contrast & Disabled State Logic
**Learning:** The "Stop" simulation button used white text on an orange background (`#f39c12`), which has a contrast ratio of ~1.7:1, failing WCAG. Changing the text to black improved it to ~12:1.
**Action:** Always check contrast on colored buttons, especially "warning" or "active" states using orange/yellow.

**Learning:** Testing disabled state tooltips for the "Train" button was tricky because `useSimulationRunner` auto-generates data on mount, so `dataCount` is rarely 0 initially.
**Action:** When testing disabled states dependent on data, ensure you understand the initialization logic or force the state if possible.
