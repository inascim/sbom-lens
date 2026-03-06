# Phase 4: Vulnerabilities Integration - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a multi-SBOM filter to the existing Vulnerabilities page. Users select which SBOMs to scope the view to; the table and chart both respond. Vulnerability rows are deduplicated by CVE ID + PURL and show "Found in" chips for cross-SBOM attribution. No new vulnerability management features — just SBOM-aware filtering and attribution.

</domain>

<decisions>
## Implementation Decisions

### SBOM selector placement & default
- SBOMSelector sits above the main Card — same pattern as Graph Editor (outside/above the card, always visible)
- Multi-select mode
- Default: no SBOMs selected = show all vulns (no filter applied, same as today)
- Selecting one or more SBOMs narrows both the table and the chart to matching vulns

### Deduplication key
- CVE ID + component PURL = same vulnerability
- Same CVE on the same package across multiple SBOMs → one merged row
- Different PURLs = separate rows even if same CVE

### "Found in" attribution
- New column in the vulnerability table: "Found In"
- Renders a small chip per SBOM name (e.g. [App A] [App B])
- Consistent with existing severity chips visual style

### Merged row status
- Show worst-case status across all matching records (NOT_STARTED > IN_PROGRESS > REMEDIATED)
- Status is read-only on the merged row — editing per-SBOM is out of scope for this phase
- Status dropdown removed or disabled for rows that span multiple SBOMs

### Chart behaviour
- Chart (stacked bar / donut) reflects the SBOM filter — chart and table stay in sync
- When no SBOM selected, chart shows totals across all vulns (same as today)
- When SBOMs selected, chart recalculates from filtered/merged vuln set only

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SBOMSelector` (`components/SBOMSelector`): multi-select mode already supported — drop in above the Card
- `useSBOMLibrary` (`hooks/useSBOMLibrary`): provides `sboms` array with id/name — needed to render SBOM name chips
- `useVulnerabilityData` (`layouts/sbom-vulnerabilities/hooks/useVulnerabilityData`): current vuln data source — needs to expose per-SBOM vuln records or be supplemented with cross-SBOM merge logic
- `useVulnerabilities` (`hooks/useVulnerabilities`): used in dashboard — relationship to `useVulnerabilityData` needs clarifying in research
- `VulnerabilityTable` (`components/VulnerabilityTable`): already migrated to DataTable — add "Found In" column and adapt status cell for merged rows
- `VulnerabilityChart`: receives `vulnerabilities` + `stats` props — just pass filtered/merged set; no internal changes needed

### Established Patterns
- SBOMSelector above Card: established in Phase 3 (Graph Editor)
- Severity chips (`Chip` with custom sx colors): reuse same pattern for "Found in" SBOM chips
- `filteredVulnerabilities` computed from state in `index.js` — extend this to also apply SBOM filter + merge step

### Integration Points
- `src/layouts/sbom-vulnerabilities/index.js` — add `selectedSBOMIds` state, mount `useSBOMLibrary`, add SBOMSelector above Card, pipe filtered+merged vuln set to both Chart and Table
- `VulnerabilityTable` — add "Found In" column; make status cell read-only when `sbomNames.length > 1`

</code_context>

<specifics>
## Specific Ideas

- No specific visual references — follow existing chip/card patterns already in the app

</specifics>

<deferred>
## Deferred Ideas

- Per-SBOM status editing from the merged row — out of scope, edit per-SBOM separately
- Empty state illustration when selected SBOMs have zero vulns — Claude's discretion

</deferred>

---

*Phase: 04-vulnerabilities-integration*
*Context gathered: 2026-03-06*
