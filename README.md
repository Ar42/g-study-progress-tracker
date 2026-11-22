# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Second spreadsheet (separate Apps Script)

Some features keep their data in a **separate** Google Spreadsheet, isolated from the study sheet. The app talks to it through its own Apps Script deployment.

1. Create the spreadsheet → **Extensions → Apps Script** → paste everything in `Code.second.gs` → save.
2. **Deploy → New deployment → Web app** — Execute as: *Me*, Who has access: *Anyone* → Deploy → copy the `/exec` URL.
3. Add to `.env` **and** to Netlify → Site configuration → Environment variables:
   ```
   VITE_SECOND_ADMIN_URL=https://script.google.com/macros/s/…/exec
   # optional, only used as a read fallback (share the sheet as "Anyone with the link can view"):
   VITE_SECOND_SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/<id>/export?format=csv&gid=0
   ```
4. Rebuild / redeploy (Vite bakes env vars in at build time).

Until `VITE_SECOND_ADMIN_URL` is set, features on the second sheet show "not connected" and no request is made. Tabs are mapped to a spreadsheet in `SHEET_SOURCE` (`src/config/constants.ts`); the study sheet and its `Code.gs` are never affected.
