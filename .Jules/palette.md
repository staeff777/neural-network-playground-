## 2024-03-24 - Navigation Semantics
**Learning:** Even simple navigation bars need semantic landmarks (`<nav>`) and state indicators (`aria-current`). The memory/docs might claim accessibility features exist when they don't - always verify code first.
**Action:** When auditing navigation, check for `nav` landmarks and `aria-current="page"` specifically, not just `active` classes.
