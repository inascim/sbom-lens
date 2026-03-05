# Requirements: SBOM Lens

**Defined:** 2026-03-05
**Core Value:** A security engineer can load their SBOMs, see all vulnerabilities across them in one merged view, and know exactly which packages are affected — without duplicating tracking work per-SBOM.

## v1 Requirements

### Dashboard

- [x] **DASH-01**: User can see SBOM library stats (count, total components) on the dashboard
- [x] **DASH-02**: User can see a card for each SBOM in the library (name, component count, dates)
- [x] **DASH-03**: User can upload an SBOM from the dashboard with drag-and-drop
- [x] **DASH-04**: User sees a duplicate detection prompt when uploading an SBOM with a matching hash
- [x] **DASH-05**: User can create a copy of a duplicate SBOM or cancel the upload

### Graph Editor

- [ ] **GRAPH-01**: User can select which SBOM to load in the Graph Editor via SBOMSelector
- [ ] **GRAPH-02**: User can save edits back to the selected SBOM (overwrite)
- [ ] **GRAPH-03**: User can save edits as a new SBOM in the library (Save As), if under the 3-SBOM limit

### Vulnerabilities

- [ ] **VULN-01**: User can select which SBOMs to include in the Vulnerabilities view via SBOMSelector (multi-select)
- [ ] **VULN-02**: User sees vulnerabilities merged across all selected SBOMs
- [ ] **VULN-03**: Each vulnerability row shows which SBOMs it was found in ("Found in: SBOM A, SBOM B")

## v2 Requirements

### Vulnerability Enrichment

- **VENR-01**: Vulnerability records can be enriched from NVD/OSV/GitHub Advisory APIs
- **VENR-02**: User can trigger a re-fetch of vulnerability data for a component PURL

### Storage Migration

- **STOR-01**: Data layer switches to GraphQL/REST API by changing DATA_SOURCE config flag
- **STOR-02**: SBOM library supports more than 3 SBOMs when backed by API

## Out of Scope

| Feature | Reason |
|---------|--------|
| Authentication | Single-user local tool; no auth needed for v1 |
| Real-time collaboration | Local-only for now |
| Mobile / responsive layout | Desktop security tooling; not a mobile use case |
| SBOM formats other than CycloneDX | Parser is built for CycloneDX; other formats deferred |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DASH-01 | Phase 2 | Complete |
| DASH-02 | Phase 2 | Complete |
| DASH-03 | Phase 2 | Complete |
| DASH-04 | Phase 2 | Complete |
| DASH-05 | Phase 2 | Complete |
| GRAPH-01 | Phase 3 | Pending |
| GRAPH-02 | Phase 3 | Pending |
| GRAPH-03 | Phase 3 | Pending |
| VULN-01 | Phase 4 | Pending |
| VULN-02 | Phase 4 | Pending |
| VULN-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-05*
*Last updated: 2026-03-05 after initial definition*
