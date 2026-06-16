# Study Dashboard - Improvements & Modifications

## General

- Improve the overall UI/UX while keeping responsiveness in mind across the entire application.
- Replace the current font with a better-looking font for general text.
- **Do not change the font currently used for numbers**; it looks good and should remain unchanged.

---

# Dashboard Page

## 1. Welcome Section

Below the **"Welcome to your Study Dashboard"** section, add two new status sections.

### A. Overdue Chapters (better naming)

> Suggest a better name than **"Failed to complete"** (e.g. **Overdue**, **Missed Deadline**, **Past Due**, etc.)

- Red-themed UI.
- Display chapters whose target date has already passed but are still incomplete.
- This section should appear **before** the "In Progress" section.
- Organize chapters in the same subject → chapter hierarchy/tree structure.
- Users can mark chapters as completed.
- Completion must require a confirmation modal.

### B. In Progress

- Yellow-themed UI.
- Show all chapters currently being studied.
- Organize them using the same subject → chapter hierarchy/tree structure.
- Users can mark chapters as completed.
- Completion must require a confirmation modal.

### UI/UX

- Both sections should have an animated border (running/glowing/moving effect).
- Keep the animation subtle and professional.
- Prioritize a clean, modern UX.

---

## 2. Your Subjects Cards

Currently:

- Normal click should open the subject in the **current tab**.
- **Ctrl + Click** should open the subject in a **new browser tab** (currently not working).

---

# Subject Details Page

Currently there are separate sections like:

- Resources & Links
- Comments
- Others

These should be removed.

Instead:

Under the **Chapter Hierarchy**, each chapter should display its own:

- Resources & Links
- Comments
- Other information

This information should live directly beneath its corresponding chapter instead of being displayed in separate page-level sections.

---

## Filters

Add a new filter for the new status:

- Use the same name chosen for **"Failed to complete"** so terminology stays consistent throughout the app.

---

# Add/Edit Chapter Modal

## Closing Behavior

Make these behaviors configurable using constants so they can easily be changed later.

Current desired behavior:

- ✅ Close on **Escape** key.
- ❌ Do NOT close on outside click.

---

## Focus

When **adding** a new chapter (not editing):

- Automatically focus the **Chapter Name** input.
- This should happen only initially.
- If the user interacts with another field, do not steal focus back.

---

## Date Logic

### Target Date Auto-fill

When selecting a **Start Date**:

- If **Target Date** is empty, automatically set it to the same date.
- If a Target Date already exists, do nothing.

---

### Date Layout

Improve spacing between:

- Date level labels
- Date inputs

The current layout feels too cramped.

---

### Automatic Status Update

If:

- Current date > Target Date
- AND chapter is still marked as **In Progress**

Automatically change its status to the new "Failed to complete" status (using the final chosen name).

Example:

- Target Date = June 18
- Today = June 19
- Status = In Progress

↓

Automatically becomes:

- Status = Overdue (or whatever final name is selected)

This business rule should happen automatically.

---

# Responsiveness

While implementing every feature:

- Keep responsiveness in mind.
- Ensure layouts work well on desktop, tablet, and mobile.
- Avoid UI breaking at smaller screen sizes.

---

# Notes

- Keep the UX polished and intuitive.
- Maintain consistency with the existing design system.
- Prefer reusable components and configurable behavior where possible.
- Follow existing project architecture and coding conventions.
