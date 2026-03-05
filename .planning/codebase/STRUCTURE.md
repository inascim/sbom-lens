# Codebase Structure

**Analysis Date:** 2026-03-05

## Directory Layout

```
sbom-lens/
├── public/                     # Static assets served by Create React App
├── src/
│   ├── index.js                # Application entry point (React root mount)
│   ├── App.js                  # App shell: theme, routing, sidenav
│   ├── routes.js               # Route + sidenav registry
│   ├── assets/
│   │   ├── theme/              # Light MUI theme overrides + functions
│   │   ├── theme-dark/         # Dark MUI theme overrides + functions
│   │   └── images/             # Logos, icons, illustrations
│   ├── components/             # Primitive reusable UI components (MD-prefixed + SBOM-specific)
│   │   ├── MDBox/
│   │   ├── MDButton/
│   │   ├── MDTypography/
│   │   ├── MDInput/
│   │   ├── MDAlert/
│   │   ├── MDAvatar/
│   │   ├── MDBadge/
│   │   ├── MDPagination/
│   │   ├── MDProgress/
│   │   ├── MDSnackbar/
│   │   ├── SBOMUploader/       # Drag-drop CycloneDX file upload widget
│   │   └── SBOMSelector/       # SBOM library table with single/multi select
│   ├── config/
│   │   └── dataSource.js       # DATA_SOURCE flag + API_CONFIG stub
│   ├── context/
│   │   └── index.js            # MaterialUIControllerProvider (global UI state)
│   ├── examples/               # Higher-order template components from base dashboard
│   │   ├── Breadcrumbs/
│   │   ├── Cards/              # BlogCard, InfoCard, ProjectCard, StatisticsCard
│   │   ├── Charts/             # Bar, Line, Doughnut, Pie, Radar, etc.
│   │   ├── Configurator/       # Floating settings panel
│   │   ├── Footer/
│   │   ├── Items/NotificationItem/
│   │   ├── LayoutContainers/
│   │   │   ├── DashboardLayout/ # Main content wrapper (adjusts for sidenav)
│   │   │   └── PageLayout/      # Full-page layout (auth pages)
│   │   ├── Lists/ProfilesList/
│   │   ├── Navbars/
│   │   │   ├── DashboardNavbar/ # Top bar used by all dashboard pages
│   │   │   └── DefaultNavbar/   # Auth page top bar
│   │   ├── Sidenav/            # Side navigation drawer
│   │   ├── Tables/DataTable/   # Reusable paginated data table
│   │   └── Timeline/           # Timeline list + item components
│   ├── hooks/                  # Global custom hooks
│   │   ├── useSBOMLibrary.js   # SBOM CRUD + duplicate detection
│   │   └── useVulnerabilities.js # Vulnerability CRUD + PURL-based filtering
│   ├── layouts/                # Feature page components (one per route)
│   │   ├── authentication/
│   │   │   ├── components/     # BasicLayout, CoverLayout, Footer
│   │   │   ├── sign-in/
│   │   │   ├── sign-up/
│   │   │   └── reset-password/
│   │   ├── billing/            # Template billing page
│   │   ├── dashboard/          # Template stats dashboard (placeholder)
│   │   ├── notifications/      # Template notifications page
│   │   ├── profile/            # Template profile page
│   │   ├── rtl/                # RTL layout demo
│   │   ├── sbom-graph/         # SBOM dependency graph explorer (core feature)
│   │   │   └── components/
│   │   │       └── GraphVisualizer.js
│   │   ├── sbom-vulnerabilities/ # Vulnerability tracking dashboard (core feature)
│   │   │   ├── components/
│   │   │   │   ├── VulnerabilityChart.js
│   │   │   │   ├── VulnerabilityTable.js
│   │   │   │   └── VulnerabilityForm.js
│   │   │   └── hooks/
│   │   │       └── useVulnerabilityData.js
│   │   └── tables/             # Template tables page
│   └── utils/                  # Pure utility functions
│       ├── sbomStorage.js      # localStorage CRUD for SBOM entities
│       ├── parseInputSBOM.js   # CycloneDX JSON ↔ Cytoscape graph conversion
│       ├── graphUtils.js       # BFS traversal, hash helpers
│       ├── cytoscapeConfig.js  # Cytoscape layout options, context menu builder
│       └── vulnerabilityAPI.js # NVD / GitHub / OSV fetch utilities
├── .planning/codebase/         # GSD analysis documents (not committed by default)
├── build/                      # Production build output (generated, not committed)
├── package.json
├── jsconfig.json               # Path aliases (src/ mapped as root)
├── .eslintrc.json
├── .prettierrc.json
└── genezio.yaml                # Genezio deployment config
```

## Directory Purposes

**`src/components/`:**
- Purpose: Atomic, reusable UI components — either MUI wrappers (`MD`-prefixed) or SBOM domain widgets
- Contains: One directory per component, each with an `index.js` default export
- Key files: `src/components/SBOMUploader/index.js`, `src/components/SBOMSelector/index.js`

**`src/config/`:**
- Purpose: Application-level constants and feature flags
- Contains: `dataSource.js` — the `DATA_SOURCE` toggle and `API_CONFIG` placeholder
- Key files: `src/config/dataSource.js`

**`src/context/`:**
- Purpose: React Context for global UI state (sidenav, dark mode, direction, layout type)
- Contains: `index.js` — provider, hook, and all dispatch action helpers
- Key files: `src/context/index.js`

**`src/examples/`:**
- Purpose: Composite template components inherited from Material Dashboard 2 React base
- Contains: Charts, cards, navbars, sidenav, layout containers, data tables
- Key files: `src/examples/LayoutContainers/DashboardLayout/index.js`, `src/examples/Navbars/DashboardNavbar/index.js`, `src/examples/Sidenav/index.js`

**`src/hooks/`:**
- Purpose: Global stateful business logic hooks consumed across multiple features
- Contains: `useSBOMLibrary.js`, `useVulnerabilities.js`
- Key files: `src/hooks/useSBOMLibrary.js`

**`src/layouts/`:**
- Purpose: Feature pages — one directory per route, each exporting a default page component
- Contains: `sbom-graph/`, `sbom-vulnerabilities/` (core product features) + template layouts
- Key files: `src/layouts/sbom-graph/index.js`, `src/layouts/sbom-vulnerabilities/index.js`

**`src/utils/`:**
- Purpose: Pure, stateless helper functions — no React, no hooks
- Contains: Storage abstraction, SBOM format converters, graph algorithms, external API clients
- Key files: `src/utils/sbomStorage.js`, `src/utils/parseInputSBOM.js`, `src/utils/vulnerabilityAPI.js`

**`src/assets/`:**
- Purpose: Static assets and MUI theme configuration
- Contains: `theme/` (light), `theme-dark/`, `images/`
- Key files: `src/assets/theme/index.js`, `src/assets/theme-dark/index.js`

## Key File Locations

**Entry Points:**
- `src/index.js`: React DOM root creation, context + router wrapping
- `src/App.js`: Theme selection, sidenav rendering, route registration
- `src/routes.js`: All application routes and sidebar items

**Configuration:**
- `src/config/dataSource.js`: `DATA_SOURCE` flag to switch localStorage ↔ API
- `jsconfig.json`: Path alias configuration (`src/` is the module root)
- `genezio.yaml`: Deployment configuration

**Core Logic:**
- `src/utils/sbomStorage.js`: SBOM persistence (CRUD + hash-based deduplication)
- `src/utils/parseInputSBOM.js`: CycloneDX ↔ Cytoscape graph format conversion
- `src/utils/vulnerabilityAPI.js`: NVD, GitHub Advisory, OSV API integrations
- `src/hooks/useSBOMLibrary.js`: SBOM management hook (wraps storage + hash dedup)
- `src/hooks/useVulnerabilities.js`: Vulnerability management hook

**Key Feature Files:**
- `src/layouts/sbom-graph/index.js`: SBOM Graph Explorer page
- `src/layouts/sbom-graph/components/GraphVisualizer.js`: Cytoscape.js canvas (exposed via `forwardRef`/`useImperativeHandle`)
- `src/layouts/sbom-vulnerabilities/index.js`: Vulnerability dashboard page
- `src/layouts/sbom-vulnerabilities/hooks/useVulnerabilityData.js`: Local vulnerability state for the vulnerabilities page
- `src/components/SBOMUploader/index.js`: Drag-drop SBOM file upload component
- `src/components/SBOMSelector/index.js`: SBOM library table component

**Theme:**
- `src/assets/theme/index.js`: Light theme export
- `src/assets/theme-dark/index.js`: Dark theme export
- `src/context/index.js`: Global UI state including `darkMode` toggle

## Naming Conventions

**Files:**
- Layout page entry points: `index.js` inside a PascalCase or kebab-case directory
- Utility modules: camelCase descriptive name (e.g., `sbomStorage.js`, `parseInputSBOM.js`)
- Hook files: `use` prefix, camelCase (e.g., `useSBOMLibrary.js`, `useVulnerabilityData.js`)
- Config files: camelCase (e.g., `dataSource.js`, `cytoscapeConfig.js`)

**Directories:**
- Layout directories: kebab-case matching the route path (e.g., `sbom-graph/`, `sbom-vulnerabilities/`)
- Component directories: PascalCase matching the component name (e.g., `SBOMUploader/`, `MDBox/`)
- Example component directories: PascalCase (e.g., `DashboardLayout/`, `ReportsBarChart/`)

**Components:**
- MUI wrapper primitives: `MD` prefix + PascalCase (e.g., `MDBox`, `MDButton`)
- Domain components: PascalCase descriptive (e.g., `SBOMUploader`, `GraphVisualizer`)
- All components use default export

**Hooks:**
- Global hooks: `src/hooks/use[Domain].js`
- Feature-local hooks: `src/layouts/[feature]/hooks/use[Feature].js`

## Where to Add New Code

**New Feature Page (new route):**
- Create directory: `src/layouts/[feature-name]/`
- Page component: `src/layouts/[feature-name]/index.js`
- Sub-components: `src/layouts/[feature-name]/components/`
- Feature-local hooks: `src/layouts/[feature-name]/hooks/`
- Register in: `src/routes.js` (adds to both router and sidebar)

**New Reusable Component (used across features):**
- Implementation: `src/components/[ComponentName]/index.js`
- Follow PropTypes pattern from existing components (e.g., `SBOMSelector/index.js`)

**New Global Hook (cross-feature business logic):**
- Implementation: `src/hooks/use[Domain].js`
- If it reads/writes data, check `DATA_SOURCE` from `src/config/dataSource.js`
- Add localStorage utility functions to `src/utils/sbomStorage.js` or a new utils file

**New Utility Function:**
- If SBOM format related: `src/utils/parseInputSBOM.js`
- If storage related: `src/utils/sbomStorage.js`
- If external API related: `src/utils/vulnerabilityAPI.js`
- If graph/cytoscape related: `src/utils/graphUtils.js` or `src/utils/cytoscapeConfig.js`
- New concern: create `src/utils/[descriptiveName].js`

**New Config Value:**
- Application flag: add to `src/config/dataSource.js` or create `src/config/[area].js`

**New Chart Type:**
- Follow pattern in `src/examples/Charts/` — create `[ChartType]/` with component and `configs/` subdirectory

## Special Directories

**`src/examples/`:**
- Purpose: Template UI components from Material Dashboard 2 React base — not SBOM-specific
- Generated: No (from template, then modified)
- Committed: Yes

**`build/`:**
- Purpose: Production build output from `react-scripts build`
- Generated: Yes
- Committed: No (in `.gitignore`)

**`.planning/`:**
- Purpose: GSD analysis and planning documents
- Generated: By GSD tooling
- Committed: Depends on team preference (not in `.gitignore` by default)

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes
- Committed: No

---

*Structure analysis: 2026-03-05*
