## 2024-05-23 - Accessible Tab Panels
**Learning:** When conditionally rendering tab panels, standard practice (keeping all panels in DOM but hidden) can be performance-heavy or state-unfriendly. However, replacing fragments with `div role="tabpanel"` allows us to keep the conditional rendering (good for React performance/state reset) while maintaining valid ARIA structure when content IS present.
**Action:** Always wrap conditional tab content in a `role="tabpanel"` container, even if the container is only present when active.
