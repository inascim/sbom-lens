---
phase: 02-dashboard-integration
plan: "02"
subsystem: ui
tags: [react, hooks, mui, sbom, dialog, duplicate-detection]

# Dependency graph
requires:
  - phase: 02-dashboard-integration
    provides: SBOMCard component and patched getStats() from plan 01
  - phase: 01-foundation
    provides: useSBOMLibrary hook, useVulnerabilities hook, sbomStorage utilities
provides:
  - Fully functional Dashboard page replacing all template content
  - 4 live stats cards (SBOM count, components, total vulns, unresolved vulns)
  - SBOM library grid backed by useSBOMLibrary with empty state
  - Upload SBOM button opening MUI Dialog with SBOMUploader
  - Duplicate detection flow with Create Copy (metadata.copyOf hash mutation) option
  - Delete confirmation via window.confirm (delegated to SBOMCard)
affects:
  - Any future phases that extend the Dashboard page

# Tech tracking
tech-stack:
  added: []
  patterns:
    - MUI Dialog for modal upload flow — Dialog state lifted to page, onClose guarded during async upload
    - Hash mutation for copy creation — mutate metadata.copyOf to ensure new hash, avoiding re-triggered duplicate detection
    - Conditional dialog view — single Dialog switches between upload view and duplicate-detected view via duplicateInfo state

key-files:
  created: []
  modified:
    - src/layouts/dashboard/index.js
    - src/utils/sbomStorage.js

key-decisions:
  - "Remove static 'import crypto from crypto' in sbomStorage.js — webpack 5 cannot polyfill Node built-ins; the browser code path already uses window.crypto.subtle so the import was dead code causing the build to fail"
  - "Use metadata.copyOf mutation (Option C) for copy creation — name change alone does not change hash since computeSBOMHash only hashes components+metadata; copyOf in metadata ensures a different hash, no duplicate re-trigger"
  - "Upload dialog stays open after duplicate detection — user can cancel duplicate prompt and try a different file without losing the dialog context"

patterns-established:
  - "Dialog upload pattern: uploadDialogOpen + duplicateInfo state split — normal upload view renders when duplicateInfo is null, duplicate prompt view renders otherwise"
  - "Async upload guard: uploading=true disables Cancel and Create Copy buttons and prevents dialog onClose during in-flight async save"

requirements-completed: [DASH-01, DASH-02, DASH-03, DASH-04, DASH-05]

# Metrics
duration: 5min
completed: 2026-03-05
---

# Phase 2 Plan 02: Dashboard SBOM Library Home Page Summary

**Dashboard replaced with SBOM library home page: 4 live stats cards, SBOM card grid via useSBOMLibrary, MUI Dialog upload flow with duplicate detection and metadata.copyOf-based copy creation**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-05T20:02:59Z
- **Completed:** 2026-03-05T20:08:00Z
- **Tasks:** 2
- **Files modified:** 2 (+ 5 deleted)

## Accomplishments
- Replaced all template content (charts, Projects, OrdersOverview, reportsBarChartData, reportsLineChartData) with SBOM library UI
- Implemented 4 live stats cards pulling from useSBOMLibrary.getStats() and useVulnerabilities
- Built upload dialog with SBOMUploader, duplicate detection branch, and Create Copy flow using metadata.copyOf mutation
- Deleted 5 orphaned template files — components dir now contains only SBOMCard
- Fixed pre-existing webpack 5 build failure caused by static `import crypto from 'crypto'` in sbomStorage.js

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace dashboard/index.js with SBOM library home page** - `faacad3` (feat)
2. **Task 2: Remove template artifact files** - `c8f123c` (chore)

## Files Created/Modified
- `src/layouts/dashboard/index.js` - Complete rewrite: SBOM library home page with stats, upload dialog, duplicate flow
- `src/utils/sbomStorage.js` - Removed dead `import crypto from 'crypto'` that caused webpack 5 build failure
- `src/layouts/dashboard/data/reportsBarChartData.js` - Deleted (template artifact)
- `src/layouts/dashboard/data/reportsLineChartData.js` - Deleted (template artifact)
- `src/layouts/dashboard/components/Projects/` - Deleted (template artifact)
- `src/layouts/dashboard/components/OrdersOverview/` - Deleted (template artifact)

## Decisions Made
- Used `metadata.copyOf` mutation for copy creation (Option C) — `computeSBOMHash` hashes only `{ components, metadata }`, not the name, so a name change alone would leave the hash identical and re-trigger duplicate detection. Injecting `copyOf` and `copiedAt` into metadata changes the hash input, producing a different hash.
- Dialog `onClose` is a no-op when `uploading=true` — prevents accidental dismissal during async save which could leave orphaned state.
- Upload dialog remains open after cancelling a duplicate prompt — user can drop a new file without re-opening.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed dead `import crypto from 'crypto'` in sbomStorage.js**
- **Found during:** Task 1 (initial build verification)
- **Issue:** Webpack 5 no longer auto-polyfills Node.js built-ins. The static `import crypto from 'crypto'` caused the build to fail with "Module not found: Can't resolve 'crypto'". The import was dead code — the browser code path uses `window.crypto.subtle` and the Node fallback path (for tests) was in an unreachable `else` branch during browser builds.
- **Fix:** Removed the static `import crypto from "crypto"` line. Browser hash computation via `window.crypto.subtle` is unaffected.
- **Files modified:** `src/utils/sbomStorage.js`
- **Verification:** Build passed after removal
- **Committed in:** faacad3 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - pre-existing build-breaking bug)
**Impact on plan:** Fix was necessary for the build to pass at all. No scope creep.

## Issues Encountered
- ESLint/prettier rejected blank lines inside JSX (`<MDBox py={3}>` followed by blank line). Fixed by removing the 3 offending blank lines. Build passed on second attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Dashboard page is fully functional; users can upload SBOMs, view the library, see stats, detect duplicates, and delete entries
- All 5 DASH requirements (DASH-01 through DASH-05) are satisfied
- Phase 02-dashboard-integration is complete
- No blockers for phase 03

## Self-Check: PASSED

- FOUND: src/layouts/dashboard/index.js
- FOUND: src/utils/sbomStorage.js
- FOUND: .planning/phases/02-dashboard-integration/02-02-SUMMARY.md
- FOUND: commit faacad3 (feat(02-02): replace dashboard with SBOM library home page)
- FOUND: commit c8f123c (chore(02-02): remove template artifact files)

---
*Phase: 02-dashboard-integration*
*Completed: 2026-03-05*
