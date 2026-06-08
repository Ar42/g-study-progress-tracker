# MODIFY REQUIREMENTS UPDATE

## Chapter Hierarchy

- The edit icon must always be visible.
- Remove hover-only behavior for edit actions.
- Edit controls should be permanently accessible in the UI.

---

## Admin Panel Removal

- Completely remove the Admin Panel from the menu/navigation.
- Delete all related routes, components, and logic.
- Ensure no unused or orphaned code remains in the project.

---

## Reports Module (NEW FEATURE)

Introduce a new **Reports section**:

- Show bar charts for **individual subject completion**
- Each bar represents a subject's completion percentage
- Use a clean charting library (e.g., Recharts or equivalent)
- Data should be aggregated per subject

---

## Dashboard – Completion Logic Fix

### Current Issue:

- Completion is incorrectly calculated as:
  - Average of completed chapters / total chapters

### Required Fix:

- Completion must be based on **individual modules**
- Correct formula:
  - (Completed modules / Total modules) \* 100

- Each module must contribute equally to the final percentage

---

## Exam Countdown Timer (NEW FEATURE)

Add an **exam countdown timer** on the dashboard:

- Format:
  - `101 days 5 hours 10 minutes 47 seconds`
- Calculation:
  - Current time → Exam date at **12:00 AM**
- Should update in real-time (live ticking)
- Must be clearly visible in dashboard header or top section

---

## UI / Theme Improvements

### Remove Current Red Theme Issues

- Avoid harsh red colors completely
- Remove high-contrast red text styles
- Replace with:
  - Soft muted red tones
  - Redish-white background variations where needed
- Reduce aggressive visual contrast for error/danger states

---

## New Color System

Introduce a **green-based UI theme palette**:

- Primary: Green tones (modern, clean, calm)
- Success: Green shades
- Warning: Soft amber (optional)
- Error: Muted soft red (not bright red)
- Background: Light neutral / soft gray
- UI should feel smooth and easy on the eyes

---

## Card UI Upgrade (IMPORTANT)

- Improve dashboard cards with a modern UI design
- Replace basic cards with:
  - Soft shadows
  - Subtle gradients (green-based theme)
  - Better spacing and rounded corners
  - Slight hover lift effect
- Make cards feel more premium and interactive
- Maintain performance and simplicity (no over-design)

---

## General UI Goal

- Make UI more modern and consistent
- Reduce visual noise
- Improve readability and spacing
- Ensure a calm, eye-friendly design system
