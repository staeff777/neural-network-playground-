## 2024-05-22 - Explaining Disabled States
**Learning:** Users can feel stuck when primary actions are disabled without explanation (like the "Train" button before data generation).
**Action:** Always add a `title` attribute or tooltip to disabled buttons explaining *why* they are disabled (e.g., "Generate data first") and *what* to do next.

## 2024-05-22 - Implicit Form Labels
**Learning:** Select elements often get overlooked for accessibility when they are visually grouped but lack an explicit `<label>`.
**Action:** Use `aria-label` on form inputs (like the trainer type selector) when a visual text label isn't design-appropriate, to ensure screen reader users know the control's purpose.
