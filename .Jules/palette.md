# Palette's Journal - Critical Learnings

This journal documents critical UX and accessibility learnings, patterns, and decisions for the Neural Network Demonstrator project.

## 2025-02-23 - Utility Panel Accessibility
**Learning:** Utility panels (like `ControlPanel.jsx`) often rely on visual grouping and proximity for context, routinely omitting explicit labels for form elements like `<select>`. This pattern is common in "dev tool" interfaces but creates significant barriers for screen reader users who cannot see the visual grouping.
**Action:** When auditing "tool" or "control" components, systematically verify that every input/select has a programmatic label (`<label>` or `aria-label`), regardless of how "obvious" its function appears visually.
