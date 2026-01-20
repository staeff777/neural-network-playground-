## 2024-05-15 - Control Panel Accessibility
**Learning:** The Control Panel lacked basic ARIA labels and had poor contrast on the active "Stop" button. Adding `title` tooltips for disabled states clarifies "why" something is disabled, which is a critical usability pattern for this app where simulation states interlock.
**Action:** Always check `title` for disabled buttons and ensure active toggle states have sufficient contrast (avoid light orange on white).
