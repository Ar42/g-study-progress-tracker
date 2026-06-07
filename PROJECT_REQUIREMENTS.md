# Study Progress Tracker

## Objective

Build a modern, scalable, responsive Study Progress Tracker using:

- React
- TypeScript
- TailwindCSS
- clsx

The application will visualize study progress for subjects and chapters with unlimited nesting support.

The architecture must be designed for long-term scalability and future expansion.

---

# Technical Requirements

## Mandatory Stack

- React
- TypeScript (strict mode)
- TailwindCSS
- clsx
- React Router DOM
- Zustand
- Recharts

---

## Code Quality Rules

### TypeScript

- Strict mode enabled
- No `any`
- No hardcoded status strings
- Use enums everywhere applicable
- Use reusable interfaces and types
- Use readonly where appropriate
- Prefer type-safe utility functions

### Architecture

- DRY
- Reusable
- Scalable
- Feature-based organization
- Separation of concerns
- Business logic separated from UI
- No duplicated logic

### Styling

- TailwindCSS
- clsx for conditional classes
- Mobile-first approach
- Responsive at all breakpoints
- No UI overflow issues
- No layout breaking
- Consistent spacing system

---

# Data Structure

The application must support unlimited nesting.

Example:

```text
Science
└── Botany
    ├── Virus
    └── Bacteria

English
└── Parts Of Speech
    └── Noun
        └── Gerund
```

Every item in the tree is a node.

---

# Node Rules

There are only two node types.

## Parent Node

A parent node:

- Has children
- Does NOT own status
- Progress is calculated from descendants

Example:

```text
Science
Botany
English
Noun
```

---

## Leaf Node

A leaf node:

- Has no children
- Owns status

Example:

```text
Virus
Bacteria
Gerund
```

Only leaf nodes can have status.

---

# Status System

Use enum.

Example:

```ts
export enum ProgressStatus {
  COMPLETED = "COMPLETED",
  IN_PROGRESS = "IN_PROGRESS",
  NOT_STARTED = "NOT_STARTED",
}
```

Never use hardcoded strings.

---

# Progress Calculation

Progress must always be calculated dynamically.

Never store percentages in data.

---

## Rules

Only leaf nodes participate in calculations.

Completed:

```text
COMPLETED = 1
```

Not Completed:

```text
IN_PROGRESS = 0
NOT_STARTED = 0
```

There is no partial completion value.

---

## Example

```text
Virus      -> COMPLETED
Bacteria   -> NOT_STARTED
```

Botany:

```text
1 / 2 = 50%
```

Science:

```text
1 / 2 = 50%
```

---

# Data Source

For V1 use local JSON files.

Structure:

```text
src
└── data
    ├── english.json
    └── science.json
```

Create a centralized loader.

Example:

```ts
export const SUBJECTS = [english, science] as const;
```

The application must render everything dynamically from data.

No hardcoded subjects.

---

# Folder Structure

```text
src
├── app
│
├── routes
│
├── layouts
│
├── pages
│   └── dashboard
│
├── features
│   ├── subjects
│   ├── progress
│   └── charts
│
├── components
│   ├── ui
│   └── shared
│
├── hooks
│
├── stores
│
├── services
│
├── utils
│
├── constants
│
├── enums
│
├── types
│
├── data
│
└── assets
```

---

# UI Components

All reusable generic components must live under:

```text
src/components/ui
```

Examples:

```text
Button
Card
Input
Modal
Drawer
Sidebar
Tooltip
Badge
Accordion
Skeleton
ProgressCircle
```

Business-specific components must not be placed inside ui.

---

# Application Layout

The application must use a reusable application shell.

Structure:

```text
+----------------------+
| Sidebar | Content    |
|         |            |
|         |            |
+----------------------+
```

---

# Sidebar

For V1 there is only one menu.

Menu:

```text
Dashboard
```

The sidebar exists because more modules will be added later.

Requirements:

Desktop:

- Fixed sidebar

Mobile:

- Drawer sidebar
- Hamburger menu

Must be reusable.

---

# Dashboard

Dashboard is the default route.

Route:

```text
/
```

---

## Dashboard Cards

Show one card per subject.

Each card must contain:

- Subject Name
- Completion Percentage
- Completed Count
- Total Count
- Circular Progress Chart

Example:

```text
Science
65%

130 / 200
```

Cards must be responsive.

Grid:

Desktop:

- 4 columns

Tablet:

- 2 columns

Mobile:

- 1 column

---

# Charts

Use Recharts.

Requirements:

- Circular progress chart
- Responsive
- Clean design
- Consistent sizing

---

# Subject Details

Clicking a dashboard card opens subject details.

Route example:

```text
/subject/:subjectId
```

---

## Subject Details Page

Show:

- Subject Name
- Progress Summary
- Total Chapters
- Completed Chapters
- Progress Chart

---

## Chapter Tree

Display the full hierarchy.

Must support:

- Unlimited depth
- Expand / collapse
- Responsive layout

Each node shows:

- Name
- Progress Percentage
- Completion Information

Leaf nodes show:

- Name
- Status

---

# State Management

Use Zustand.

Requirements:

- Minimal state
- No unnecessary global state
- Business logic separated from components

---

# Performance Requirements

- Memoize expensive calculations
- Avoid unnecessary rerenders
- Recursive calculations must be optimized
- Use stable keys
- Use lazy loaded routes where appropriate

---

# Accessibility

- Keyboard navigable
- Proper button semantics
- Proper aria labels where appropriate
- Accessible sidebar behavior

---

# Future Expansion

Architecture must allow future modules without restructuring.

Examples:

```text
Dashboard
Analytics
Exam Planner
Mock Tests
Vocabulary
Reports
Settings
```

The sidebar and routing structure must already support this future growth.

---

# Persistence

For V1:

Do NOT use:

- localStorage
- sessionStorage
- backend
- database

Data is read-only from JSON files. (create 2 files for implementation purpose. Then I'll just update with real data by keeping this format)

The architecture must make it easy to add persistence later without major refactoring.

---

# Expected Outcome

Build a production-quality application with:

- Clean architecture
- Scalable folder structure
- Strict TypeScript
- Responsive UI
- Reusable components
- Dynamic data-driven rendering
- Unlimited nested chapter support
- Accurate recursive progress calculation
- Dashboard with circular progress cards
- Subject detail pages with expandable tree visualization
- Future-ready architecture
