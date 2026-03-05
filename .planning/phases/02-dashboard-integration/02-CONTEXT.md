# Phase 2: Dashboard Integration - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the template placeholder dashboard with an SBOM library home page. Delivers: stats summary row, SBOM cards grid, and upload flow with duplicate detection. Graph Editor and Vulnerabilities integration are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Dashboard layout
- Stats-first: top row of 4 `ComplexStatisticsCard` stats, then SBOM library section below
- User lands on the page to get an overview, not primarily to upload
- 4 stats cards: SBOMs in library, total components, total vulnerabilities tracked, unresolved vulnerabilities
- Below stats: SBOM cards grid (up to 3 cards) with an "Upload SBOM" button above or alongside the grid

### Stats cards
- Card 1: SBOM count ("3 SBOMs" or "2 / 3 SBOMs")
- Card 2: Total components across all SBOMs
- Card 3: Total vulnerabilities tracked
- Card 4: Unresolved vulnerabilities (status != REMEDIATED)
- Use existing `ComplexStatisticsCard` component — no new component needed

### SBOM library section
- Card-based grid, not a table — each SBOM gets its own card
- Up to 3 cards (matching the library limit)
- "Upload SBOM" button is the primary action trigger (not a persistent drag-drop zone)

### Claude's Discretion
- SBOM card content and actions (what info to show per card, whether to include delete action)
- Duplicate dialog appearance (MUI Dialog is the natural choice given the stack)
- Copy naming format for duplicates
- Empty state when no SBOMs are loaded yet
- Icon choices for stats cards

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ComplexStatisticsCard` (`examples/Cards/StatisticsCards/ComplexStatisticsCard`): supports icon + title + count + percentage/label — use for all 4 stats cards
- `SBOMUploader` (`components/SBOMUploader`): drag-drop CycloneDX upload with built-in error handling — wire to `uploadSBOM()` from `useSBOMLibrary`
- `useSBOMLibrary` (`hooks/useSBOMLibrary.js`): provides `sboms`, `uploadSBOM()`, `deleteSBOM()`, `getStats()` — use as the data source for the entire dashboard
- `MDBox`, `MDButton`, `MDTypography`: base layout + text primitives already in use throughout

### Established Patterns
- Dashboard layout wraps content in `<DashboardLayout>` + `<DashboardNavbar>` + `<Footer>` — match this
- Stats in a `<Grid container spacing={3}>` with `<Grid item xs={12} md={6} lg={3}>` per card — existing pattern in `layouts/dashboard/index.js`
- Duplicate detection result from `uploadSBOM()` returns `{ isDuplicate: true, existingSBOM, message }` — use this to trigger the copy dialog
- Error state pattern: hooks expose `error` string; display via MUI `Alert` or `MDAlert`

### Integration Points
- `src/layouts/dashboard/index.js` — full replacement of template content; keep `DashboardLayout`/`DashboardNavbar`/`Footer` wrapper
- `useSBOMLibrary` hook — single source of truth; no direct `sbomStorage` calls from the layout

</code_context>

<specifics>
## Specific Ideas

- No specific references — open to standard Material Dashboard card/grid patterns

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-dashboard-integration*
*Context gathered: 2026-03-05*
