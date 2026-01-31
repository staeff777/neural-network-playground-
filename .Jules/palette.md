## 2025-02-20 - [Tooltip on Disabled Button]
**Learning:** Native `title` tooltips do not appear on disabled buttons in many browsers because the element absorbs/ignores mouse events.
**Action:** Wrap the disabled button in a `<span>` (or `div`) with the `title` attribute. Set `pointer-events: none` on the disabled button and ensure the wrapper has `cursor: not-allowed` to maintain the visual cue while allowing the parent to capture the hover for the tooltip.
