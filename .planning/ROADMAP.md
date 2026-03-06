# Roadmap: SBOM Lens

## Overview

Phase 1 (data layer, hooks, SBOMSelector, SBOMUploader) is complete. The remaining work wires those building blocks into the three feature pages: Dashboard becomes the SBOM library home with upload and stats; Graph Editor gains library-backed load and save; Vulnerabilities gains multi-SBOM selection with merged, PURL-deduplicated output.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Foundation** - Data layer, hooks, SBOMSelector, SBOMUploader (COMPLETE)
- [x] **Phase 2: Dashboard Integration** - Wire SBOM library stats, cards, and upload flow into the Dashboard page (completed 2026-03-05)
- [x] **Phase 3: Graph Editor Integration** - Add SBOMSelector to Graph Editor; implement Save and Save As against the library (completed 2026-03-06)
- [ ] **Phase 4: Vulnerabilities Integration** - Add multi-SBOM selector, merged vulnerability view, and cross-SBOM attribution

## Phase Details

### Phase 1: Foundation
**Goal**: Data layer and reusable SBOM components exist and are ready for page integration
**Depends on**: Nothing (first phase)
**Requirements**: (complete — see PROJECT.md)
**Success Criteria** (what must be TRUE):
  1. useSBOMLibrary hook manages CRUD, duplicate detection, and stats
  2. useVulnerabilities hook tracks vulnerabilities by PURL
  3. SBOMSelector renders library table with single/multi-select
  4. SBOMUploader parses CycloneDX JSON and emits structured SBOM data
**Plans**: Complete

### Phase 2: Dashboard Integration
**Goal**: Users can manage their SBOM library from the Dashboard — see what they have and add new SBOMs
**Depends on**: Phase 1
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05
**Success Criteria** (what must be TRUE):
  1. User sees total SBOM count and total component count on the Dashboard
  2. User sees one card per stored SBOM showing its name, component count, and dates
  3. User can drag-and-drop (or click to select) a CycloneDX JSON file on the Dashboard and have it added to the library
  4. When uploading a file whose SHA-256 hash matches an existing SBOM, the user sees a prompt offering to create a copy or cancel
  5. User can confirm copy creation or dismiss the duplicate prompt without corrupting existing data
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md — Fix getStats() mutation bug + create SBOMCard component
- [x] 02-02-PLAN.md — Replace dashboard/index.js with live SBOM library home page

### Phase 3: Graph Editor Integration
**Goal**: Users can open any library SBOM in the Graph Editor and save edits back to the library
**Depends on**: Phase 2
**Requirements**: GRAPH-01, GRAPH-02, GRAPH-03
**Success Criteria** (what must be TRUE):
  1. User can pick an SBOM from the library via SBOMSelector inside the Graph Editor and have its dependency graph rendered
  2. User can save edits to the currently loaded SBOM, overwriting it in the library
  3. User can save the edited graph as a new SBOM (Save As), provided fewer than 3 SBOMs are stored; the action is disabled or blocked when the library is full
**Plans**: 1 plan

Plans:
- [ ] 03-01-PLAN.md — Wire SBOMSelector, Load, Save, and Save As into the Graph Editor

### Phase 4: Vulnerabilities Integration
**Goal**: Users can filter the Vulnerabilities view by SBOM and see a deduplicated, cross-SBOM vulnerability picture
**Depends on**: Phase 2
**Requirements**: VULN-01, VULN-02, VULN-03
**Success Criteria** (what must be TRUE):
  1. User can select one or more SBOMs via multi-select SBOMSelector at the top of the Vulnerabilities page
  2. The vulnerability table and charts update to show only vulnerabilities whose component PURLs appear in the selected SBOMs
  3. Each vulnerability row displays a "Found in: SBOM A, SBOM B" attribution listing every selected SBOM that contains the affected PURL
**Plans**: TBD

## Progress

**Execution Order:** 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | - | Complete | 2026-03-05 |
| 2. Dashboard Integration | 2/2 | Complete    | 2026-03-05 |
| 3. Graph Editor Integration | 1/1 | Complete   | 2026-03-06 |
| 4. Vulnerabilities Integration | 0/TBD | Not started | - |
