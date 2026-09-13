# IT Study Module — Antigravity Development Requirements

## Objective

Extend the existing BCS study-tracking application to support a second independent study domain named **IT**.

The existing BCS functionality must continue working exactly as it does today.

The new IT module should use the same CRUD patterns, UI conventions, status system, date handling, comments, links, reporting patterns, and reusable components wherever possible.

---

# 1. Existing BCS Module

The current BCS module remains the default study module.

Do not rename, restructure, or migrate the existing BCS data unnecessarily.

Existing behavior should remain backward compatible.

Conceptually:

```text
BCS
├── Subjects
├── CRUD
├── Reports
└── Dashboard
```

The existing Excel `Sheet1` continues to represent BCS data.

---

# 2. New IT Module

Create a new independent module:

```text
IT
├── Chapters / Topics
├── CRUD
├── Reports
└── Dashboard
```

Important distinction:

For BCS:

```text
Subject
  └── Chapter / Topic
```

For IT:

There is no subject-level grouping.

**IT itself is the subject/domain.**

Therefore, an IT record should directly represent an IT chapter/topic.

Example:

```text
IT
├── Operating System
├── Computer Networks
├── Database Management System
├── System Design
├── Data Structures
├── Algorithms
└── Software Engineering
```

Do NOT introduce an additional `Subject` field for IT.

---

# 3. IT Data Model

The IT record should contain:

```text
ID
Name
Status
Comments
Started Date
Target to Complete Date
Completed Date
Links
```

Suggested conceptual type:

```ts
type ITTopic = {
  id: string;
  name: string;
  status: string;
  comments: string;
  startedDate: string | null;
  targetToCompleteDate: string | null;
  completedDate: string | null;
  links: string[];
};
```

Use the project's existing type conventions if the current BCS implementation already has an equivalent model.

Do not create duplicate types unnecessarily.

---

# 4. Status

The IT module must use the **same status system as BCS**.

Do not create a second status enum unless the existing architecture absolutely requires it.

For example, if BCS currently supports:

```text
Not Started
In Progress
Completed
On Hold
```

then IT should use the same statuses.

The same status labels, colors, filters, validation, and calculations should be reused.

---

# 5. CRUD

Implement complete CRUD for IT topics:

```text
Create IT Topic
Read IT Topics
Update IT Topic
Delete IT Topic
```

Required operations:

### Create

Allow the user to create:

```text
Name
Status
Comments
Started Date
Target to Complete Date
Completed Date
Links
```

### Read

Display IT topics using the existing BCS list/table/card patterns where appropriate.

### Update

Every editable IT field must be editable using the same UX pattern used by BCS.

### Delete

Use the same confirmation behavior already used by BCS.

Do not create a different delete interaction without a strong reason.

---

# 6. Reuse Existing Architecture

Before implementing anything:

1. Inspect the existing project structure.
2. Find the current BCS data model.
3. Find the BCS CRUD implementation.
4. Find the existing status implementation.
5. Find the existing date handling.
6. Find the existing comments implementation.
7. Find the existing links implementation.
8. Find the existing report implementation.
9. Find the dashboard implementation.
10. Find the current Excel/Google Sheets integration.
11. Reuse existing abstractions wherever possible.

Do not duplicate working BCS components just because IT is a new module.

Prefer:

```text
Reusable component
       ↓
BCS implementation
IT implementation
```

instead of:

```text
BCS component
IT duplicate component
```

---

# 7. Domain / Module Identification

Introduce a domain/category concept only where required.

Conceptually:

```ts
type StudyDomain = "BCS" | "IT";
```

Use the existing application's architecture if an equivalent concept already exists.

Avoid scattering:

```ts
if (isIT) ...
if (isBCS) ...
```

throughout the UI.

Prefer domain-aware reusable components and services.

Example:

```text
StudyModule
├── BCS
└── IT
```

with shared:

```text
CRUD
Status
Date
Comments
Links
Reports
Dashboard
```

---

# 8. Navigation

Update the main navigation so that BCS and IT are clearly separated.

Expected conceptual structure:

```text
Dashboard

Study
├── BCS
└── IT

Reports
├── BCS
└── IT
```

If the existing navigation already has a BCS-specific structure, preserve its current appearance and introduce IT using the same design language.

---

# 9. Reports Submenu

Create a **Reports** submenu.

It must contain:

```text
Reports
├── BCS
└── IT
```

The current BCS report should remain the **default report view**.

Therefore:

```text
Reports → BCS
```

should be the default destination.

IT reports should be accessible through:

```text
Reports → IT
```

Do not remove or replace the existing BCS report.

---

# 10. IT Reports

The IT report should operate only on IT records.

It should use the same reporting architecture as BCS.

Where applicable, support the same metrics such as:

```text
Total Topics
Not Started
In Progress
Completed
On Hold
Completion Percentage
Started Topics
Overdue Topics
Upcoming Targets
```

Do not hard-code BCS terminology into shared report components.

For example, avoid:

```text
BCS Subjects Completed
```

inside a reusable component.

Prefer domain-aware labels:

```text
IT Topics Completed
BCS Subjects Completed
```

depending on the selected domain.

---

# 11. Dashboard

Extend the dashboard to include IT.

The existing BCS dashboard must remain intact.

Add IT-related dashboard information such as:

```text
IT Progress
IT Topics
IT Completed
IT In Progress
IT Not Started
IT Completion %
```

The exact visual structure should follow the existing dashboard design.

Avoid unnecessarily redesigning the existing dashboard.

---

# 12. Dashboard Navigation

If the current dashboard has clickable study/report items, make the new IT items navigate to the appropriate IT pages.

Example:

```text
Dashboard
│
├── BCS Progress → BCS
├── IT Progress  → IT
│
├── BCS Reports  → Reports / BCS
└── IT Reports   → Reports / IT
```

Use the application's existing routing conventions.

---

# 13. Excel / Google Sheets Integration

The IT module must read/write from the new:

```text
IT
```

sheet/tab.

Existing:

```text
Sheet1
```

continues to represent BCS.

Do not mix BCS and IT rows inside `Sheet1`.

Do not modify existing BCS rows merely to support IT.

Conceptually:

```text
Workbook
│
├── Sheet1
│   └── BCS data
│
└── IT
    └── IT data
```

The application should select the appropriate sheet based on the selected domain.

---

# 14. Sheet Adapter

If the application already has a Google Sheets/Excel adapter, extend it rather than creating a separate integration.

Conceptually:

```ts
getStudyRecords("BCS");
getStudyRecords("IT");

createStudyRecord("BCS", data);
createStudyRecord("IT", data);

updateStudyRecord("BCS", id, data);
updateStudyRecord("IT", id, data);

deleteStudyRecord("BCS", id);
deleteStudyRecord("IT", id);
```

The actual implementation must follow the existing project's architecture.

The UI should not directly know how the spreadsheet works.

Prefer:

```text
UI
 ↓
Study Service
 ↓
Repository / Adapter
 ↓
Spreadsheet
```

---

# 15. Important Separation

The application should distinguish between:

```text
BCS
```

and

```text
IT
```

at the domain level.

Do not infer the domain from arbitrary row content.

Use an explicit domain/sheet mapping.

Example:

```ts
const studySheets = {
  BCS: "Sheet1",
  IT: "IT",
};
```

Use an existing configuration pattern if one already exists.

---

# 16. Routing

Follow the existing routing convention.

A possible structure is:

```text
/dashboard

/bcs
/bcs/reports

/it
/it/reports

/reports/bcs
/reports/it
```

However, do not blindly introduce these exact URLs if the current project already follows another routing structure.

Preserve existing conventions.

The important requirement is that BCS and IT have independent navigation and report views.

---

# 17. Filtering and Search

IT should support the same filtering/search behavior as BCS wherever applicable.

For example:

```text
Search
Status
Date
Completion
```

Do not implement a different filter architecture unless IT genuinely requires different behavior.

---

# 18. Empty State

When there are no IT records, display a proper empty state.

Example:

```text
No IT topics found.

Add your first IT topic to start tracking your progress.
```

Use the existing application's empty-state component if available.

---

# 19. Validation

Reuse existing validation rules where applicable.

At minimum:

```text
Name → required
Status → valid status
Started Date → valid date
Target Date → valid date
Completed Date → valid date
Links → valid link format where applicable
```

Follow existing BCS validation behavior.

Do not introduce stricter rules for IT without a requirement.

---

# 20. Date Handling

Use exactly the same date handling used by BCS.

The three date fields are:

```text
Started Date
Target to Complete Date
Completed Date
```

Do not create a second date formatting system.

Respect the existing application timezone and date-format configuration.

---

# 21. Links

The IT `Links` field should behave the same way as the BCS `Links` field.

If BCS supports multiple links, IT should support multiple links.

If BCS has link validation, reuse it.

If BCS displays links as clickable external resources, IT should do the same.

---

# 22. Terminology

Use terminology appropriate to IT.

Prefer:

```text
IT Topic
IT Chapter
Topic Name
```

instead of:

```text
IT Subject
```

because IT itself is the subject/domain.

The spreadsheet column should remain:

```text
Name
```

as requested.

---

# 23. Backward Compatibility

Existing functionality must continue working:

- BCS dashboard
- BCS CRUD
- BCS reports
- BCS filtering
- BCS status tracking
- BCS date tracking
- BCS links
- Existing spreadsheet integration

The new IT feature must not break these.

---

# 24. Testing

Test at minimum:

### IT CRUD

- create IT topic
- display IT topic
- edit IT topic
- delete IT topic

### Navigation

- Dashboard → IT
- IT → topic list
- Reports → BCS
- Reports → IT

### Reports

- IT metrics use IT data only
- BCS metrics use BCS data only

### Spreadsheet

- BCS writes to `Sheet1`
- IT writes to `IT`
- BCS does not accidentally write to `IT`
- IT does not accidentally write to `Sheet1`

### Regression

Run the existing tests and build.

Verify that existing BCS functionality remains unchanged.

---

# 25. Implementation Principle

This is an extension of the existing study tracker, not a separate application.

Think:

```text
                 Study Tracker
                       │
             ┌─────────┴─────────┐
             │                   │
            BCS                  IT
             │                   │
      ┌──────┼──────┐     ┌──────┼──────┐
      CRUD Reports   │     CRUD Reports  │
             │       │            │       │
          Dashboard         Dashboard
             │                   │
          Sheet1                IT
```

Shared infrastructure should be reused.

Only domain-specific behavior should differ.

---

# 26. Definition of Done

The feature is complete when:

- [ ] IT sheet exists and is connected.
- [ ] IT topics can be created.
- [ ] IT topics can be viewed.
- [ ] IT topics can be edited.
- [ ] IT topics can be deleted.
- [ ] IT uses the same status system as BCS.
- [ ] IT uses the same date handling as BCS.
- [ ] IT supports comments.
- [ ] IT supports links.
- [ ] Dashboard contains IT information.
- [ ] Reports has a submenu.
- [ ] BCS is the default Reports view.
- [ ] IT has its own Reports view.
- [ ] IT reports use only IT data.
- [ ] BCS reports continue using BCS data.
- [ ] Existing BCS functionality is not broken.
- [ ] Existing reusable components are reused where possible.
- [ ] Application build succeeds.
- [ ] Existing tests pass.
