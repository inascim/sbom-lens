# Coding Conventions

**Analysis Date:** 2026-03-05

## Naming Patterns

**Files:**
- React components: PascalCase matching the component name (e.g., `VulnerabilityForm.js`, `GraphVisualizer.js`)
- React hooks: camelCase prefixed with `use` (e.g., `useSBOMLibrary.js`, `useVulnerabilityData.js`)
- Utility modules: camelCase (e.g., `sbomStorage.js`, `vulnerabilityAPI.js`, `parseInputSBOM.js`)
- Config modules: camelCase (e.g., `dataSource.js`)
- Theme/style files: camelCase or PascalCase matching MUI component names (e.g., `buttonBase.js`, `switchButton.js`)
- Each component lives in its own directory with an `index.js` entry file (e.g., `src/components/MDBox/index.js`)
- Root files for styled components are named `[ComponentName]Root.js` (e.g., `MDBoxRoot.js`, `MDButtonRoot.js`)

**Functions:**
- Event handlers: `handle` prefix + PascalCase noun/verb (e.g., `handleDrag`, `handleDrop`, `handleExport`, `handleSelectAll`)
- Hook-returned operations: verb + noun (e.g., `addVulnerability`, `updateVulnerabilityStatus`, `deleteSBOM`, `uploadSBOM`)
- Internal helpers: descriptive camelCase (e.g., `parseCycloneDXFile`, `loadSBOMs`, `saveVulnerabilities`)

**Variables:**
- State: descriptive camelCase noun (e.g., `vulnerabilities`, `filterSeverity`, `dragActive`, `duplicateDialog`)
- Boolean state: adjective or `is`/`has` prefix (e.g., `loading`, `dragActive`, `patchAvailable`)
- Constants: camelCase for module-level strings (e.g., `SBOM_STORAGE_KEY`, `VULNERABILITY_STORAGE_KEY`, `MAX_SBOMS` — uppercase with underscores for true constants)

**Types/Interfaces:**
- PropTypes are defined at the bottom of each component file
- Data shape documentation uses JSDoc `@param` / `@returns` annotations in utility files (e.g., `src/utils/sbomStorage.js`)
- Enum-style values are SCREAMING_SNAKE_CASE strings (e.g., `"NOT_STARTED"`, `"IN_PROGRESS"`, `"REMEDIATED"`, `"CRITICAL"`, `"HIGH"`)

**Components:**
- MD-prefixed components (`MDBox`, `MDButton`, `MDTypography`, etc.) are the base design system components in `src/components/`
- Application-specific components (no prefix) live in `src/components/` or feature directories (e.g., `SBOMSelector`, `SBOMUploader`)
- Feature layout pages use PascalCase named exports (e.g., `SbomGraph`, `SbomVulnerabilities`)

## Code Style

**Formatting:**
- Tool: Prettier 2.8.8
- Print width: 100 characters
- Tab width: 2 spaces
- Trailing commas: ES5 style (in objects/arrays, not function parameters)
- Semicolons: required
- Quotes: double quotes (not single)
- End of line: auto

**Linting:**
- Tool: ESLint 8.39.0
- Extends: `plugin:react/recommended`, `prettier`
- JSX filename extension: `.js` and `.jsx` both allowed
- `react/react-in-jsx-scope` disabled (React 17+ JSX transform)
- `react/display-name` disabled
- JSX curly spacing: never (e.g., `{value}` not `{ value }`)
- JSX props spreading: allowed for custom components, warned for HTML elements

## Import Organization

**Order (observed pattern in files like `src/layouts/sbom-vulnerabilities/index.js`):**
1. React core hooks (`import { useState, useEffect } from "react"`)
2. External library components (MUI: `import Card from "@mui/material/Card"`)
3. Internal design system components (`import MDBox from "components/MDBox"`)
4. Layout/example components (`import DashboardLayout from "examples/LayoutContainers/DashboardLayout"`)
5. Local feature components (`import VulnerabilityChart from "./components/VulnerabilityChart"`)
6. Local hooks (`import { useVulnerabilityData } from "./hooks/useVulnerabilityData"`)
7. Utilities and config (`import { DATA_SOURCE } from "config/dataSource"`)

**Path Aliases:**
- `jsconfig.json` sets `baseUrl: "src"`, enabling absolute imports from `src/`
- Use bare module paths without `../../` for anything under `src/` (e.g., `"components/MDBox"`, `"utils/sbomStorage"`, `"config/dataSource"`)
- Relative imports only for files in the same feature directory (e.g., `"./components/VulnerabilityChart"`, `"./hooks/useVulnerabilityData"`)

## Error Handling

**Patterns:**
- Async operations use `try/catch/finally` blocks universally
- Errors are stored in component/hook state as `error` (string message)
- `setLoading(true)` at the start, `setLoading(false)` in `finally`
- Errors are logged with `console.error()` and also stored in state for UI rendering
- Functions that fail set `setError(err.message)` and either `throw err` (hooks) or return early (utilities)
- Storage utilities return empty arrays `[]` on parse failure rather than throwing
- API utilities return empty arrays `[]` on network failure, log with `console.error`, and never throw
- Optional chaining `?.` used heavily for defensive access (e.g., `onSelectedChange?.()`, `graphRef.current?.zoomIn()`)
- Nullish coalescing `??` used for fallback values (e.g., `graphRef.current?.getZoom() ?? 100`)

**Example pattern from hooks:**
```js
const uploadSBOM = useCallback(async (sbomData) => {
  try {
    setError(null);
    // ... operation
    return result;
  } catch (err) {
    setError(err.message);
    throw err; // re-throw so callers can handle
  }
}, []);
```

## Logging

**Framework:** `console` (no structured logging library)

**Patterns:**
- `console.error()` for caught errors in storage/API utilities: `console.error("Error reading SBOMs from storage:", err)`
- `console.warn()` for missing configuration (e.g., missing API keys)
- `console.log()` sparingly for debug info (e.g., `console.log("node selected:", nodeData)`)
- No production log suppression — all console statements are live

## Comments

**When to Comment:**
- Block comments at the top of hook/utility files documenting data structures and usage examples
- Section comments within JSX to label logical areas: `{/* Page header */}`, `{/* Toolbar */}`, `{/* Canvas area */}`
- Inline comments for non-obvious logic (e.g., `// Reset so the same file can be re-imported`)
- TODO comments for planned API migration stubs: `// TODO: Replace with API call when migrating to backend`

**JSDoc:**
- Used in utility files (`src/utils/sbomStorage.js`, `src/utils/vulnerabilityAPI.js`) for exported functions
- Format: `@param {type} name - description` and `@returns {type} description`
- Not used in React component files

**Block header comments in component/hook files:**
```js
/**
 * ComponentName
 *
 * Brief description of purpose
 *
 * Props:
 *   propName: type - description
 */
```

## Function Design

**Size:** Functions are generally focused on a single operation. Layout page components are longer (100–330 lines) due to JSX, but logic is extracted into hooks.

**Parameters:**
- Components use destructured props with defaults in the function signature: `function SBOMUploader({ onUploadSuccess, onError, disabled = false })`
- Hooks return plain objects with named operations: `return { sboms, loading, error, getSBOM, uploadSBOM, ... }`
- Utility functions use positional parameters with JSDoc types

**Return Values:**
- Hook operations return result objects with status fields (e.g., `{ isDuplicate: true, existingSBOM, message }` or `{ isDuplicate: false, sbom }`)
- Utility functions return the created/updated entity or `null` on not-found
- Failing utilities return empty fallbacks (`[]`, `null`) rather than undefined

## Module Design

**Exports:**
- React components: single `export default ComponentName` at the bottom of the file
- Hooks: named exports (e.g., `export const useSBOMLibrary = () => {...}`)
- Utility functions: named exports per function (e.g., `export const getAllSBOMs = () => {...}`)
- Config constants: named exports (e.g., `export const DATA_SOURCE = "localStorage"`)

**Barrel Files:**
- Not used in the project — imports reference each module directly by path
- Feature component subdirectories use `index.js` as entry point (not as barrel re-exports)

## PropTypes

All components define PropTypes at the bottom of the file:
```js
ComponentName.propTypes = {
  propName: PropTypes.string.isRequired,
  optionalProp: PropTypes.func,
  shapeArray: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string.isRequired })
  ),
};
```

Default values are set either via `defaultProps` (older MD base components) or inline destructuring defaults (newer application components). Prefer inline destructuring defaults for new components.

---

*Convention analysis: 2026-03-05*
