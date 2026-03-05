# Technology Stack

**Analysis Date:** 2026-03-05

## Languages

**Primary:**
- JavaScript (ES2020+) - All application code; no TypeScript

**Secondary:**
- HTML/CSS - `public/index.html`, MUI-managed styles via Emotion

## Runtime

**Environment:**
- Node.js 24.4.1

**Package Manager:**
- npm 11.4.2
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 18.2.0 - UI rendering and component model; `src/App.js` is root
- React Router DOM 6.11.0 - Client-side routing; routes defined in `src/routes.js`

**UI Component Library:**
- MUI (Material UI) 5.12.3 - Base component system; `@mui/material`, `@mui/icons-material`
- Emotion 11.10.8 - CSS-in-JS engine used by MUI; `@emotion/react`, `@emotion/styled`, `@emotion/cache`
- Material Dashboard 2 React - Dashboard UI template (project was scaffolded from this)

**Graph Visualization:**
- Cytoscape.js 3.33.1 - Interactive graph rendering for SBOM dependency graphs; used in `src/layouts/sbom-graph/`
  - `cytoscape-dagre` 2.5.0 - DAG layout algorithm
  - `cytoscape-cxtmenu` 3.5.0 - Radial context menu on nodes/edges
  - `cytoscape-edgehandles` 4.0.1 - Interactive edge drawing
  - `cytoscape-popper` 4.0.1 - Tooltip/popover positioning

**Charting:**
- Chart.js 4.3.0 - Chart rendering
- react-chartjs-2 5.2.0 - React wrapper for Chart.js

**Data/Tables:**
- react-table 7.8.0 - Headless table utility

**Testing:**
- react-scripts 5.0.1 - CRA test runner (Jest under the hood)

**Build/Dev:**
- react-scripts 5.0.1 - Build toolchain (CRA/Webpack bundler)
- Prettier 2.8.8 - Code formatting
- ESLint 8.39.0 - Linting; config extends `react-app` and `react-app/jest`

## Key Dependencies

**Critical:**
- `uuid` 13.0.0 - Generates UUIDs for SBOM records and vulnerabilities; used in `src/utils/sbomStorage.js`, `src/hooks/useVulnerabilities.js`, `src/utils/parseInputSBOM.js`
- `lodash` 4.17.23 - Used in `src/utils/parseInputSBOM.js` for safe property access (`_.get`)
- `yup` 1.1.1 - Schema validation (imported but validation forms not yet confirmed in-depth)
- `chroma-js` 2.4.2 - Color manipulation for graph/chart styling
- `stylis` 4.1.4 + `stylis-plugin-rtl` 2.1.1 - RTL (right-to-left) layout support
- `prop-types` 15.8.1 - Runtime prop type checking on components

**Infrastructure:**
- `ajv` 7.2.4 (devDependency) - JSON schema validation; likely used for SBOM format validation

## Configuration

**Environment:**
- No `.env` files present in the repository
- `REACT_APP_API_URL` env var accepted for future API endpoint: `src/config/dataSource.js`
- Currently hardcoded: `DATA_SOURCE = "localStorage"` in `src/config/dataSource.js`

**Build:**
- `jsconfig.json` - Path alias: `baseUrl: "src"` so imports resolve from `src/`
- `genezio.yaml` - Genezio deployment config (see INTEGRATIONS.md)
- `package.json` `browserslist` - Targets modern browsers in production, last 1 version in dev

**Path Aliases:**
- `src/` is the base URL; all imports are relative to it (e.g., `import X from "components/MDBox"`)

## Platform Requirements

**Development:**
- Node.js (tested with 24.4.1)
- `npm install && npm start` (or `npm run install:clean` for clean install)
- Runs on `http://localhost:3000` (CRA default)

**Production:**
- Static SPA - output is `build/` directory
- Deployed via Genezio CDN (frontend-only deployment)
- No server-side runtime required

---

*Stack analysis: 2026-03-05*
