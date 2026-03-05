# SBOM Lens

## What This Is

A browser-based tool for security and compliance teams to manage, visualize, and audit Software Bills of Materials (SBOMs). Users can upload CycloneDX SBOMs, explore dependency graphs interactively, and track vulnerabilities across components using PURL-based identity — so a vulnerability fix applies everywhere that component appears.

## Core Value

A security engineer can load their SBOMs, see all vulnerabilities across them in one merged view, and know exactly which packages are affected — without duplicating tracking work per-SBOM.

## Requirements

### Validated

- ✓ SBOM library with max 3 SBOMs stored in localStorage — Phase 1
- ✓ SHA-256 hash-based duplicate detection with copy-creation option — Phase 1
- ✓ SBOM CRUD operations via `useSBOMLibrary` hook — Phase 1
- ✓ Vulnerability tracking via `useVulnerabilities` hook with PURL linkage — Phase 1
- ✓ `SBOMSelector` reusable table component (single/multi-select) — Phase 1
- ✓ `SBOMUploader` component with CycloneDX JSON parsing — Phase 1
- ✓ `dataSource.js` config flag for future localStorage → API migration — Phase 1
- ✓ Interactive dependency graph via Cytoscape.js in Graph Editor page — existing
- ✓ Vulnerability tracking page with severity/status filters and charts — existing

### Active

- [ ] Dashboard shows SBOM library stats + per-SBOM cards
- [ ] Dashboard supports SBOM upload with drag-and-drop + duplicate detection flow
- [ ] Graph Editor has SBOMSelector to choose which SBOM to load/edit
- [ ] Graph Editor has Save (overwrite) and Save As (new SBOM) options
- [ ] Vulnerabilities page has SBOMSelector for filtering which SBOMs to show vulns for
- [ ] Vulnerabilities merged view across selected SBOMs using PURL identity
- [ ] Vulnerability records show "Found in: SBOM A, SBOM B" cross-SBOM attribution

### Out of Scope

- Authentication / multi-user — single-user local tool, no auth needed
- Real-time collaboration — local-only for now
- More than 3 SBOMs — MVP scope; may expand when migrating to API backend
- Server-side storage — localStorage only until API migration

## Context

- Built on Material Dashboard 2 React (Creative Tim template), scaffolded from it
- CycloneDX JSON is the canonical SBOM format throughout
- Cytoscape.js handles all graph visualization
- All hooks are designed with a `DATA_SOURCE` toggle so the entire storage layer can be swapped to GraphQL/REST by changing one config value
- Deployment target: Genezio CDN (static SPA, no server)
- Phase 1 data layer and hooks are complete and tested against ESLint/Prettier

## Constraints

- **Tech stack**: React 18 + MUI 5 + Cytoscape.js — no changes to these
- **Storage**: localStorage only for v1 — `sbomStorage.js` abstraction handles this
- **SBOM format**: CycloneDX JSON only — parser already built
- **SBOM limit**: Max 3 in library — enforced in `useSBOMLibrary`
- **No TypeScript**: Project is JavaScript only

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PURL-based vulnerability identity | Vuln applies to the package, not the SBOM — avoids duplicate tracking | — Pending |
| Max 3 SBOMs for MVP | Keep scope tight before API migration | — Pending |
| DATA_SOURCE config flag | Single-file swap to move from localStorage to API | ✓ Good |
| CycloneDX as canonical format | Industry standard; parser already built | ✓ Good |
| localStorage for v1 | No backend needed; Genezio deploys static SPA | ✓ Good |

---
*Last updated: 2026-03-05 after initialization (Phase 1 complete, starting Phase 2)*
