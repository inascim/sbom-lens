---
phase: 03-graph-editor-integration
plan: 01
subsystem: ui
tags: [react, sbom, graph, cyclonedx, library, useSBOMLibrary, SBOMSelector]

# Dependency graph
requires:
  - phase: 02-dashboard-integration
    provides: useSBOMLibrary hook, SBOMSelector component, modifySBOM/uploadSBOM APIs
provides:
  - Graph editor wired to SBOM library — load, save, save-as from browser storage
  - isDirty tracking with unsaved-changes confirmation dialog
  - Status bar SBOM name + asterisk dirty indicator
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [useSBOMLibrary in layout, selectedIds + loadedSBOM + isDirty state triad, loadGraph helper for isDirty reset, span wrapper for MUI Tooltip on disabled buttons]

key-files:
  created: []
  modified:
    - src/layouts/sbom-graph/index.js

key-decisions:
  - "setIsDirty(true) called after setNewGraphData in handleAddComponent (not inside updater) for clarity"
  - "handleImport clears loadedSBOM so Save/Save As remain disabled after disk import"
  - "span wrapper required around disabled MDButton inside MUI Tooltip for tooltip to render"
  - "handleSaveAs injects copyOf: loadedSBOM.id into metadata to ensure hash change (same pattern as Phase 2 SBOM copy)"

patterns-established:
  - "loadGraph helper: always reset isDirty when loading any graph (library or disk)"
  - "Dirty-state confirmation: window.confirm before discarding unsaved changes"

requirements-completed: [GRAPH-01, GRAPH-02, GRAPH-03]

# Metrics
duration: 2min
completed: 2026-03-06
---

# Phase 3 Plan 01: Graph Editor Library Integration Summary

**SBOMSelector wired into graph editor with Load/Save/Save As library flows, dirty-state tracking, and status bar SBOM name indicator**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-06T00:10:23Z
- **Completed:** 2026-03-06T00:12:01Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Graph editor can load any library SBOM into the canvas via SBOMSelector table + Load button
- Save button overwrites the loaded SBOM in the library (modifySBOM, hash recomputed automatically)
- Save As button creates a new library SBOM named "{original} (edited)" with copyOf metadata; disabled when library is full (3 SBOMs)
- isDirty state tracks unsaved edits; triggers confirmation dialog on Load while dirty; shows asterisk in status bar

## Task Commits

Each task was committed atomically:

1. **Task 1: Add library state, SBOMSelector, and Load button** - `6490ab8` (feat)
2. **Task 2: Add Save, Save As toolbar buttons and status bar indicator** - `f6ea828` (feat)

**Plan metadata:** committed with final docs commit

## Files Created/Modified
- `src/layouts/sbom-graph/index.js` - Complete graph editor with library load, save, and save-as wiring

## Decisions Made
- `setIsDirty(true)` called after `setNewGraphData` in `handleAddComponent` (not inside the updater function) for cleaner separation
- `handleImport` clears `loadedSBOM` to null so Save/Save As are disabled after disk import — importing from disk is not "editing a loaded library SBOM"
- `<span>` wrappers required around disabled `MDButton` inside MUI `Tooltip` so tooltip renders correctly on disabled buttons
- `handleSaveAs` injects `copyOf: loadedSBOM.id` into metadata (same pattern established in Phase 2 for SBOM copies — name change alone does not change hash)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- GRAPH-01, GRAPH-02, GRAPH-03 fulfilled: users can load library SBOMs, edit in the graph canvas, save back, and save as new
- No regressions: Import from disk, Export to disk, zoom, layout, and Add Component all preserved
- Phase 3 complete — ready for any further phases

---
*Phase: 03-graph-editor-integration*
*Completed: 2026-03-06*
