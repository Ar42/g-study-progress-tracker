# Project Context & Handoff
You are taking over the development of a "Study Progress Tracker" React application (built with Vite, TypeScript, and TailwindCSS). 

## Current State Summary (The "Read" Operation)
We have successfully implemented the "Read" portion of the application using a Google Sheet as our database. Here is what is currently working:
1. **Data Fetching:** We use an RTK Query endpoint (`sheetApi.ts`) that fetches the published CSV export of the Google Sheet.
2. **Data Parsing & Tree Reconstruction:** The Google Sheet holds a flat Adjacency List. We have a robust custom CSV parser that handles quotes and nested commas, and converts this flat list into a recursive tree structure (`Subject[]` -> `ParentNode[]` -> `LeafNode[]`).
3. **State Management:** Once fetched, the tree is stored in Zustand (`useStudyStore.ts`).
4. **UI Components:** 
   - A dashboard that shows overall progress cards and "Preli Marks".
   - A nested tree hierarchy component (`TreeNode.tsx`) that recursively renders chapters and folders.
   - A detailed Subject Page showcasing metadata (Dates, Comments) and external structured Links.
   - A global floating "Sync Now" button that triggers a manual RTK Query refetch and shows toast notifications.

## Database Schema (Google Sheet Columns)
The Google Sheet acts as our source of truth and contains the following columns:
1. `Id` (string)
2. `Name` (string)
3. `ParentId` (string - empty if it's a root Subject)
4. `Status` (enum: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`)
5. `Preli Marks` (string)
6. `Comments` (string)
7. `Started Date` (string)
8. `Target To Complete Date` (string)
9. `Completed Date` (string)
10. `Links` (stringified JSON array of objects: `[{title, link, sourceName}]`)

## Your Task: Implement the Admin Panel (Create, Update, Delete)
Our frontend reads the CSV, but we cannot write to it. Your goal is to build an Admin Panel to handle the Create, Update, and Delete (CUD) operations.

**Requirements:**
1. **The Backend (Google Apps Script):** 
   - Write a Google Apps Script (`Code.gs`) that we can attach to our Google Sheet.
   - It should expose a `doPost(e)` function to accept JSON payloads for `CREATE`, `UPDATE`, and `DELETE` actions.
   - Provide me with the Apps Script code and instructions on how to deploy it as a Web App to get the API URL.
2. **The Frontend Admin Panel:**
   - Create a new route (e.g., `/admin`) with a secure/hidden UI.
   - Build a form interface that allows us to add new rows (Subjects/Chapters), edit existing rows (update marks, comments, links, status), and delete rows.
   - Connect this Admin Panel to the new Google Apps Script Web App URL via standard `fetch` requests or RTK Query mutations.
   - Ensure the UI triggers our existing "Sync Now" logic to refresh the app's read-state after a successful CUD operation.

Please start by thoroughly reviewing the existing `src/types/index.ts` and `src/services/sheetApi.ts` to understand the data flow, and then present an Implementation Plan for the Apps Script and Admin UI!
