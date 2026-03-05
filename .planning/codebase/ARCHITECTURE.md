# Architecture

**Analysis Date:** 2026-03-05

## Pattern Overview

**Overall:** Single-Page Application (SPA) with feature-based layout architecture

**Key Characteristics:**
- React SPA built on Material Dashboard 2 React template (Creative Tim)
- Feature layouts act as page-level controllers, composing reusable example/primitive components
- Global UI state managed via React Context + useReducer (no Redux or external state manager)
- All data persisted to `localStorage` with an explicit abstraction layer designed for future API migration
- CycloneDX SBOM format is the canonical data exchange format throughout

## Layers

**Primitive Components Layer:**
- Purpose: Base MUI-wrapped building blocks with theme integration
- Location: `src/components/`
- Contains: `MDBox`, `MDButton`, `MDTypography`, `MDInput`, `MDAlert`, `MDSnackbar`, `MDBadge`, `MDAvatar`, `MDProgress`, `MDPagination`; also SBOM-specific `SBOMUploader`, `SBOMSelector`
- Depends on: MUI, `context/`
- Used by: Example components, layout pages

**Example/Composite Components Layer:**
- Purpose: Higher-order reusable UI blocks (charts, cards, navbars, tables, layout containers)
- Location: `src/examples/`
- Contains: `LayoutContainers/`, `Navbars/`, `Sidenav/`, `Cards/`, `Charts/`, `Tables/`, `Footer/`, `Configurator/`
- Depends on: Primitive components layer, `context/`
- Used by: Layout pages

**Layout Pages Layer:**
- Purpose: Feature pages — each is a self-contained route component
- Location: `src/layouts/`
- Contains: `dashboard/`, `sbom-graph/`, `sbom-vulnerabilities/`, `tables/`, `billing/`, `profile/`, `notifications/`, `rtl/`, `authentication/`
- Depends on: Example components, primitive components, hooks, utils
- Used by: `routes.js` / `App.js`

**Hooks Layer:**
- Purpose: Stateful business logic abstracted from UI
- Location: `src/hooks/` (global hooks), `src/layouts/*/hooks/` (feature-local hooks)
- Contains:
  - `src/hooks/useSBOMLibrary.js` — SBOM CRUD, duplicate detection, stats
  - `src/hooks/useVulnerabilities.js` — vulnerability CRUD, PURL-based filtering
  - `src/layouts/sbom-vulnerabilities/hooks/useVulnerabilityData.js` — local vulnerability state for the vulnerabilities page
- Depends on: `utils/sbomStorage.js`, `config/dataSource.js`
- Used by: Layout pages, components

**Utilities Layer:**
- Purpose: Pure functions and stateless helpers
- Location: `src/utils/`
- Contains:
  - `sbomStorage.js` — localStorage CRUD for SBOMs (SBOM, Component data structures)
  - `parseInputSBOM.js` — CycloneDX JSON ↔ Cytoscape graph conversion
  - `graphUtils.js` — BFS traversal, hash codes for graph
  - `vulnerabilityAPI.js` — NVD, GitHub Advisory, OSV API fetch helpers
- Depends on: Nothing internal (pure functions / browser APIs)
- Used by: Hooks, layout components

**Configuration Layer:**
- Purpose: Application-wide config values and feature flags
- Location: `src/config/`
- Contains: `dataSource.js` — `DATA_SOURCE` toggle (`localStorage` | `api`), `API_CONFIG` stub
- Depends on: Nothing
- Used by: All hooks that need to distinguish storage vs. API

**Theme / Assets Layer:**
- Purpose: MUI theme overrides, fonts, images
- Location: `src/assets/theme/`, `src/assets/theme-dark/`
- Contains: Base variables, per-component overrides, theme functions
- Depends on: MUI
- Used by: `App.js`, layout containers

**Global Context Layer:**
- Purpose: UI controller state (sidenav, dark mode, direction, layout type)
- Location: `src/context/index.js`
- Contains: `MaterialUIControllerProvider`, `useMaterialUIController`, action dispatchers
- Depends on: React
- Used by: `App.js`, `DashboardLayout`, `DashboardNavbar`, `Sidenav`, `Configurator`

## Data Flow

**SBOM Upload Flow:**
1. User drops/selects a `.json` file in `SBOMUploader` (`src/components/SBOMUploader/index.js`)
2. `SBOMUploader` parses the CycloneDX JSON and calls `onUploadSuccess(sbomData)`
3. Parent layout (or `useSBOMLibrary`) calls `uploadSBOM(sbomData)`
4. `useSBOMLibrary` (`src/hooks/useSBOMLibrary.js`) computes SHA-256 hash, checks for duplicates via `findSBOMByHash`
5. If no duplicate, calls `createSBOM` in `src/utils/sbomStorage.js`, which writes to `localStorage`
6. React state is updated, triggering re-render of `SBOMSelector` table

**SBOM Graph Visualization Flow:**
1. User clicks Import in `SbomGraph` layout (`src/layouts/sbom-graph/index.js`)
2. `FileReader` reads the selected file and calls `convertCycloneDXToGraph` (`src/utils/parseInputSBOM.js`)
3. Converted `{ nodes, edges, styling }` is set as state (`newGraphData`)
4. `GraphVisualizer` (`src/layouts/sbom-graph/components/GraphVisualizer.js`) detects the prop change and adds/updates Cytoscape elements with fade-in animation
5. User can interact with graph (zoom, layout change, add/remove nodes via context menu)
6. Export calls `convertGraphToCycloneDX` and triggers browser file download

**Vulnerability Tracking Flow:**
1. `SbomVulnerabilities` layout (`src/layouts/sbom-vulnerabilities/index.js`) mounts and calls `useVulnerabilityData` hook
2. Hook loads vulnerability list from `localStorage` key `sbom_vulnerabilities` on mount
3. User can add/update/delete vulnerabilities; every mutation persists back to `localStorage` automatically
4. Chart and table components receive `filteredVulnerabilities` derived from state + active severity/status filters

**State Management:**
- UI-only global state (sidenav width, dark mode, RTL direction) lives in `MaterialUIControllerProvider` (`src/context/index.js`) using `useReducer`
- Domain state (SBOMs, vulnerabilities) lives in custom hooks that own React `useState` and sync to `localStorage`
- No shared cross-feature state store — each feature manages its own domain state independently

## Key Abstractions

**SBOM Data Structure:**
- Purpose: Canonical in-memory and storage representation of an uploaded SBOM
- Examples: defined in `src/utils/sbomStorage.js` (JSDoc at top of file)
- Pattern: `{ id: uuid, name, createdAt, modifiedAt, hash: sha256, components: Component[], metadata }`

**Component (CycloneDX):**
- Purpose: A single dependency entry inside an SBOM
- Examples: `src/components/SBOMUploader/index.js` (parsing), `src/utils/parseInputSBOM.js`
- Pattern: `{ purl, name, version, type, licenses, ...cycloneDX fields }`

**Graph Node / Edge (Cytoscape):**
- Purpose: Visual representation of SBOM components and their dependency relationships
- Examples: `src/layouts/sbom-graph/components/GraphVisualizer.js`, `src/utils/parseInputSBOM.js`
- Pattern: `{ id, label, data: { ...cycloneDX }, position, classes }` / `{ data: { id, source, target, label } }`

**Vulnerability Record:**
- Purpose: Tracked CVE/advisory associated with a component PURL
- Examples: `src/hooks/useVulnerabilities.js` (JSDoc at top)
- Pattern: `{ id, purl, cveId, severity, status, patchAvailable, notes, timeline[], source, publishedDate, lastUpdated }`

**Route Object:**
- Purpose: Drives both sidebar navigation rendering and React Router `<Route>` registration
- Examples: `src/routes.js`
- Pattern: `{ type, name, key, icon, route, component }` — `type: "collapse"` renders as nav item, `type: "divider"` renders a separator

**DATA_SOURCE Flag:**
- Purpose: Feature flag that switches all hooks between localStorage and future API
- Examples: `src/config/dataSource.js`, used in `useSBOMLibrary`, `useVulnerabilities`
- Pattern: `if (DATA_SOURCE === 'localStorage') { ... } // TODO: API call here`

## Entry Points

**Application Bootstrap:**
- Location: `src/index.js`
- Triggers: Browser loads `public/index.html`, mounts into `#app` div
- Responsibilities: Creates React root, wraps app in `BrowserRouter` + `MaterialUIControllerProvider`

**App Shell:**
- Location: `src/App.js`
- Triggers: Rendered by `index.js`
- Responsibilities: Selects light/dark/RTL theme, renders `Sidenav` when `layout === "dashboard"`, maps `routes.js` to `<Route>` elements, redirects unknown paths to `/dashboard`

**Route Registry:**
- Location: `src/routes.js`
- Triggers: Imported by `App.js` and `Sidenav`
- Responsibilities: Single source of truth for all page routes and sidebar entries

## Error Handling

**Strategy:** Localized error state in each hook and component; no global error boundary detected

**Patterns:**
- Hooks expose an `error` string state (e.g., `useSBOMLibrary`, `useVulnerabilities`); consumers are responsible for displaying it
- `SBOMUploader` has local `error` state displayed as an MUI `<Alert>`
- Storage operations are wrapped in try/catch with `console.error` fallback
- API utility functions (`vulnerabilityAPI.js`) catch fetch errors and return empty arrays rather than throwing
- Parse errors in `SBOMUploader` re-throw with descriptive messages so the component can surface them

## Cross-Cutting Concerns

**Logging:** `console.error` / `console.warn` only — no structured logging framework
**Validation:** Input validation performed inline in individual components (e.g., file extension check in `SBOMUploader`, CycloneDX structure check in `parseCycloneDXFile`)
**Authentication:** Not implemented — authentication layout pages (`sign-in`, `sign-up`) exist from the base template but are not wired to any auth provider

---

*Architecture analysis: 2026-03-05*
