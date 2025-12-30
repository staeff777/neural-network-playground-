## 2024-05-23 - [Control Panel Accessibility]
**Learning:** Adding `title` attributes to disabled buttons is a highly effective "micro" improvement. It solves the "why can't I click this?" frustration for mouse users while providing context that might otherwise require complex UI states or toast messages.
**Action:** Whenever implementing disabled states, always pair them with a `title` or tooltip explaining the disabling condition (e.g., "Training running" or "No data").

## 2024-05-23 - [Live Regions for Status]
**Learning:** Simple status counters (like "Data points: 0") are invisible to screen readers when they update unless wrapped in `aria-live`.
**Action:** Audit all dynamic counters and status text for `aria-live="polite"` to ensure screen reader users are aware of state changes without needing focus management.
