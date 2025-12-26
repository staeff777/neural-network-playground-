# Palette's Journal

This journal records critical UX and accessibility learnings from the `nn-demonstrator` project.

## 2025-05-19 - Initial Observation
**Learning:** The application lacks a loading state for the training process. The "Trainieren" button simply becomes disabled, which might be interpreted as a frozen state or a lack of response.
**Action:** Implement a text change and cursor update on the button to explicitly indicate that work is being done ("Suche läuft...").
