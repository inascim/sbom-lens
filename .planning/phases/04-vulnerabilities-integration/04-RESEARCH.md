# Phase 4: Vulnerabilities Integration - Research

**Researched:** 2026-03-06
**Domain:** Vulnerability data fetching (OSV.dev, NVD), cross-SBOM filtering, deduplication, React state management
**Confidence:** HIGH (codebase read directly; API docs fetched from official sources)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**SBOM selector placement & default**
- SBOMSelector sits above the main Card — same pattern as Graph Editor (outside/above the card, always visible)
- Multi-select mode
- Default: no SBOMs selected = show all vulns (no filter applied, same as today)
- Selecting one or more SBOMs narrows both the table and the chart to matching vulns

**Deduplication key**
- CVE ID + component PURL = same vulnerability
- Same CVE on the same package across multiple SBOMs → one merged row
- Different PURLs = separate rows even if same CVE

**"Found in" attribution**
- New column in the vulnerability table: "Found In"
- Renders a small chip per SBOM name (e.g. [App A] [App B])
- Consistent with existing severity chips visual style

**Merged row status**
- Show worst-case status across all matching records (NOT_STARTED > IN_PROGRESS > REMEDIATED)
- Status is read-only on the merged row — editing per-SBOM is out of scope for this phase
- Status dropdown removed or disabled for rows that span multiple SBOMs

**Chart behaviour**
- Chart (stacked bar / donut) reflects the SBOM filter — chart and table stay in sync
- When no SBOM selected, chart shows totals across all vulns (same as today)
- When SBOMs selected, chart recalculates from filtered/merged vuln set only

**Vulnerability data source**
- Real vulnerability data is fetched **on upload** (when an SBOM is added to the library via SBOMUploader)
- Primary source: **OSV.dev** REST API (`https://api.osv.dev/v1/query`) — no API key required, accepts PURL queries natively
- Fallback source: **NVD** (National Vulnerability Database) — used if OSV.dev returns no results or is unavailable
- Fetched results are stored in the vulnerability store with `source: "osv"` or `source: "nvd"`
- Manually-added vulnerabilities retain `source: "manual"` and are preserved alongside fetched ones
- Deduplication key (CVE ID + PURL) applies across both manual and fetched records — fetched data does not overwrite manual entries

### Claude's Discretion

- Empty state illustration when selected SBOMs have zero vulns

### Deferred Ideas (OUT OF SCOPE)

- Per-SBOM status editing from the merged row — out of scope, edit per-SBOM separately
- Empty state illustration when selected SBOMs have zero vulns — Claude's discretion (above)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VULN-01 | User can select which SBOMs to include in the Vulnerabilities view via SBOMSelector (multi-select) | SBOMSelector already supports `mode="multiple"`. Add `selectedSBOMIds` state to `sbom-vulnerabilities/index.js` and mount `SBOMSelector` above Card. |
| VULN-02 | User sees vulnerabilities merged across all selected SBOMs | `useVulnerabilities` already has `getVulnerabilitiesForPURLs()`. Merge step groups by `cveId+purl` dedup key, picks worst-case status. New `useVulnerabilityFetcher` hook triggers on upload. |
| VULN-03 | Each vulnerability row shows which SBOMs it was found in ("Found in: SBOM A, SBOM B") | Add `sbomNames` field to merged rows. VulnerabilityTable gets new "Found In" column with `Chip` per SBOM name. Status cell becomes read-only when `sbomNames.length > 1`. |
</phase_requirements>

---

## Summary

Phase 4 has two interlocking concerns. The first is SBOM-aware filtering and cross-SBOM deduplication in the UI: the Vulnerabilities page gains a multi-select `SBOMSelector` above the Card, filters the vulnerability set to PURLs present in selected SBOMs, deduplicates rows by `cveId+purl`, shows worst-case status, and adds a "Found In" column. The second concern (scope expansion) is fetching real vulnerability data on SBOM upload: query OSV.dev's `/v1/querybatch` endpoint (no auth required) in parallel for all component PURLs, store results with `source: "osv"`, fall back to NVD if OSV returns nothing (but NVD does not accept PURL — requires CPE or keyword, complicating the fallback).

The existing codebase is well-prepared: `vulnerabilityAPI.js` already has a working `fetchFromOSV(purl)` function; `useVulnerabilities` already has `getVulnerabilitiesForPURLs(purls)`; `SBOMSelector` already supports `mode="multiple"`; and `VulnerabilityChart` already accepts a `vulnerabilities` prop so it only needs the filtered/merged array passed in. The largest changes are (a) the new `useVulnerabilityFetcher` hook called after successful SBOM upload in `dashboard/index.js`, (b) a new merge/filter function in `sbom-vulnerabilities/index.js`, and (c) `VulnerabilityTable` gaining the "Found In" column and read-only status for multi-SBOM rows.

**Primary recommendation:** Use OSV.dev `/v1/querybatch` to batch all component PURLs in one request per SBOM upload (up to 1000 queries/batch). Store results via `useVulnerabilities.addVulnerability()` with source tagging. For the NVD fallback, query by component name as a keyword — CPE is the standard path but PURL is not supported by NVD, so keyword search is the only viable browser-side option without a user-supplied API key.

---

## Standard Stack

### Core (already in project — no new installs)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React hooks (useState, useCallback, useEffect) | 18.x | State management for filter/merge/fetch | Project standard throughout |
| `fetch()` browser API | native | OSV.dev + NVD API calls | Already used in `vulnerabilityAPI.js` |
| MUI `Chip` | 5.x | "Found In" attribution chips | Already used for severity chips |
| `uuid` (v4) | already installed | IDs for fetched vuln records | Already used in `useVulnerabilities` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `Promise.allSettled` | native | Parallel PURL queries, tolerates individual failures | Use for batching OSV queries |
| OSV.dev REST API | v1 | Vulnerability lookup by PURL — no auth, no rate limit | Primary vuln data source |
| NVD REST API v2 | 2.0 | Vulnerability lookup by keyword (fallback) | Only when OSV returns zero results |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| OSV.dev querybatch | Per-component fetch | Batch is more efficient; up to 1000 PURLs per request |
| NVD keyword fallback | NVD CPE lookup | CPE requires knowing exact CPE string; keyword is simpler but less precise |
| Client-side merge in index.js | Dedicated hook | Simple enough to keep in index.js as a `useMemo` |

**Installation:** No new packages required. All dependencies are already present.

---

## Architecture Patterns

### Recommended Project Structure

The fetch trigger and storage hook are separate from the display layer. No new directories needed.

```
src/
├── hooks/
│   ├── useVulnerabilities.js        # existing — add `purl` field requirement, change source casing
│   └── useVulnerabilityFetcher.js   # NEW — OSV.dev + NVD fetch logic, triggered on SBOM upload
├── layouts/
│   └── sbom-vulnerabilities/
│       ├── index.js                 # add selectedSBOMIds state, SBOMSelector, merge logic
│       └── components/
│           └── VulnerabilityTable.js # add "Found In" column, read-only status for merged rows
└── utils/
    └── vulnerabilityAPI.js          # existing — fetchFromOSV already works; upgrade to querybatch
```

### Pattern 1: OSV.dev Batch Query on Upload

**What:** After a successful SBOM upload, extract all component PURLs and send them to `/v1/querybatch` in a single request. Map results back to individual PURLs.

**When to use:** Immediately after `uploadSBOM()` resolves with a non-duplicate result in `dashboard/index.js`.

**Example (based on OSV.dev official API docs):**

```javascript
// Source: https://google.github.io/osv.dev/post-v1-querybatch/
const fetchVulnsForSBOM = async (components, sbomId) => {
  const purls = components
    .map((c) => c.purl)
    .filter(Boolean);

  if (purls.length === 0) return [];

  // Batch all PURLs in a single request (up to 1000)
  const response = await fetch("https://api.osv.dev/v1/querybatch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      queries: purls.map((purl) => ({ package: { purl } })),
    }),
  });

  if (!response.ok) throw new Error(`OSV batch query failed: ${response.status}`);

  const data = await response.json();
  // data.results is an array matching purls[] order
  // Each result: { vulns: [{ id, modified, ... }] }
  return data.results.flatMap((result, idx) =>
    (result.vulns || []).map((vuln) => ({
      purl: purls[idx],
      sbomId,
      osvId: vuln.id,
    }))
  );
};
```

Note: The querybatch response only returns `id` and `modified` for each vuln. To get full details (CVE aliases, severity, summary), you must then call `GET /v1/vulns/{id}` for each unique vuln ID. This is a two-step process.

### Pattern 2: Full Vuln Detail Fetch

**What:** After getting vuln IDs from querybatch, fetch full records to get CVE IDs (from `aliases[]`), CVSS severity, and summary.

**Example (based on OSV vulnerability schema):**

```javascript
// Source: https://ossf.github.io/osv-schema/
const fetchVulnDetails = async (osvId) => {
  const response = await fetch(`https://api.osv.dev/v1/vulns/${osvId}`);
  const vuln = await response.json();

  // CVE ID is in aliases array — find the CVE- prefixed alias
  const cveId = (vuln.aliases || []).find((a) => a.startsWith("CVE-")) || vuln.id;

  // Severity is CVSS score string, needs parsing
  const severityEntry = (vuln.severity || []).find(
    (s) => s.type === "CVSS_V3" || s.type === "CVSS_V4"
  );
  const severity = parseCVSSSeverity(severityEntry?.score);

  return {
    cveId,
    summary: vuln.summary || "",
    publishedDate: vuln.published,
    severity,
    patchAvailable: false, // OSV does not provide this directly
  };
};

// CVSS base score → severity bucket
const parseCVSSSeverity = (scoreString) => {
  if (!scoreString) return "LOW";
  const match = scoreString.match(/CVSS:[\d.]+\/.*\/(\d+\.\d+)/);
  const score = match ? parseFloat(match[1]) : 0;
  if (score >= 9.0) return "CRITICAL";
  if (score >= 7.0) return "HIGH";
  if (score >= 4.0) return "MEDIUM";
  return "LOW";
};
```

### Pattern 3: Cross-SBOM Merge in Index.js

**What:** Given `selectedSBOMIds`, filter the full vulnerability list to PURLs present in any selected SBOM, then deduplicate by `cveId+purl` and attach `sbomNames`.

**When to use:** In `sbom-vulnerabilities/index.js` as a `useMemo` over `vulnerabilities`, `sboms`, `selectedSBOMIds`.

```javascript
// Source: derived from useVulnerabilities.getVulnerabilitiesForPURLs pattern
const mergedVulnerabilities = useMemo(() => {
  // Step 1: Determine which PURLs belong to selected SBOMs
  const selectedSboms = selectedSBOMIds.length > 0
    ? sboms.filter((s) => selectedSBOMIds.includes(s.id))
    : sboms; // no filter = all SBOMs

  const purlToSbomNames = {};
  selectedSboms.forEach((sbom) => {
    (sbom.components || []).forEach((comp) => {
      if (!comp.purl) return;
      if (!purlToSbomNames[comp.purl]) purlToSbomNames[comp.purl] = [];
      purlToSbomNames[comp.purl].push(sbom.name);
    });
  });

  const relevantPurls = new Set(Object.keys(purlToSbomNames));

  // Step 2: Filter to relevant vulns
  const relevant = vulnerabilities.filter((v) => relevantPurls.has(v.purl));

  // Step 3: Deduplicate by cveId+purl
  const STATUS_ORDER = { NOT_STARTED: 0, IN_PROGRESS: 1, REMEDIATED: 2 };
  const deduped = {};
  relevant.forEach((v) => {
    const key = `${v.cveId}||${v.purl}`;
    if (!deduped[key]) {
      deduped[key] = { ...v, sbomNames: purlToSbomNames[v.purl] || [] };
    } else {
      // worst-case status wins (lower STATUS_ORDER = worse)
      const existingOrder = STATUS_ORDER[deduped[key].status] ?? 2;
      const newOrder = STATUS_ORDER[v.status] ?? 2;
      if (newOrder < existingOrder) deduped[key].status = v.status;
    }
  });

  return Object.values(deduped);
}, [vulnerabilities, sboms, selectedSBOMIds]);
```

### Pattern 4: vuln Storage Schema — PURL is Mandatory

**What:** Fetched vulnerabilities MUST have a `purl` field to enable SBOM-to-vuln matching. The existing `useVulnerabilityData` hook does NOT store `purl` — only `component` (display name). The canonical hook with PURL support is `useVulnerabilities` in `src/hooks/`.

**Critical finding:** There are two parallel hooks:
- `src/hooks/useVulnerabilities.js` — PURL-indexed, designed for cross-SBOM use, has `getVulnerabilitiesForPURLs()`
- `src/layouts/sbom-vulnerabilities/hooks/useVulnerabilityData.js` — simpler hook without PURL, used by the Vulnerabilities page today

**The Vulnerabilities page (`sbom-vulnerabilities/index.js`) MUST be migrated from `useVulnerabilityData` to `useVulnerabilities`** so PURL-based filtering works. Both hooks use the same `localStorage` key (`sbom_vulnerabilities`), so they are reading/writing the same data — the migration is a hook swap.

### Anti-Patterns to Avoid

- **Using `useVulnerabilityData` for the new phase:** It doesn't store `purl` — SBOM filtering is impossible without PURL. Switch to `useVulnerabilities`.
- **Fetching vuln details one-by-one in serial:** Up to N×M HTTP requests for N SBOMs × M components. Use querybatch for the first pass, then batch the detail fetches with `Promise.allSettled`.
- **Blocking SBOM upload on vuln fetch:** Vuln fetch can be slow (10-30s for large SBOMs). Fire-and-forget — upload completes immediately, vulns arrive asynchronously.
- **Calling NVD for every component:** NVD rate limit without API key is 5 requests per 30 seconds. Only use NVD as a fallback for components where OSV returns zero results.
- **Deduplication in the store:** Deduplication is a display-layer concern (different SBOMs can have the same CVE+PURL and should each store their own record). Merge only at render time.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CVSS score → severity mapping | Custom regex | Provided pattern in Code Examples | CVSS vector strings have well-defined score encoding |
| Batch PURL queries | Serial fetch loop | OSV `/v1/querybatch` | Single request for up to 1000 PURLs |
| Vuln ID deduplication in store | Unique-ID enforcement | Display-layer merge by `cveId+purl` | Same CVE on same PURL across SBOMs is expected and valid |
| "Found In" SBOM name lookup | Join vuln→SBOM in store | Build `purlToSbomNames` map at render from `sboms` array | Avoids denormalizing SBOM names into each vuln record |

**Key insight:** The vulnerability store is normalized — each record belongs to one SBOM's PURL. Cross-SBOM views are a rendering concern only.

---

## Common Pitfalls

### Pitfall 1: Hook Mismatch — useVulnerabilityData vs useVulnerabilities

**What goes wrong:** The Vulnerabilities page (`sbom-vulnerabilities/index.js`) currently uses `useVulnerabilityData`. This hook does not store the `purl` field. When fetched vulns (which have `purl`) are added via `useVulnerabilities`, and the page reads from `useVulnerabilityData`, filtering by PURL silently fails (every PURL check against `undefined` is false).

**Why it happens:** Two parallel hooks evolved independently. Both use key `"sbom_vulnerabilities"` in localStorage.

**How to avoid:** Migrate `sbom-vulnerabilities/index.js` to import `useVulnerabilities` from `hooks/useVulnerabilities`. Map the API: `updateVulnerabilityStatus` → `updateVulnerabilityStatus`; `deleteVulnerability` → `deleteVulnerability`; `clearAll` → `clearAll`. The `addVulnerability` API is the same name.

**Warning signs:** "Found In" column always empty; SBOM filter shows same vulns regardless of selection.

### Pitfall 2: OSV querybatch Returns Only IDs, Not Full Records

**What goes wrong:** Treating the querybatch response as containing full vulnerability data. The response is `{ results: [{ vulns: [{ id, modified }] }] }` — no CVE IDs, no severity, no summary.

**Why it happens:** Documentation is easy to miss. The `id` field is the OSV ID (e.g. `GHSA-xxxx`, `RUSTSEC-xxxx`), not a CVE ID.

**How to avoid:** After querybatch, collect all unique vuln IDs and fetch full records via `GET /v1/vulns/{id}`. CVE IDs are in the `aliases[]` array — filter for entries starting with `"CVE-"`.

**Warning signs:** CVE column shows `GHSA-xxxx` instead of `CVE-xxxx`; severity is always "LOW" because CVSS data was never fetched.

### Pitfall 3: Existing fetchFromOSV Uses v1/query (Single-Package)

**What goes wrong:** The existing `vulnerabilityAPI.js fetchFromOSV(purl)` calls `/v1/query` once per PURL. An SBOM with 200 components triggers 200 sequential HTTP requests.

**Why it happens:** The existing function predates this phase's requirement.

**How to avoid:** In the new `useVulnerabilityFetcher`, use `/v1/querybatch` instead. The existing `fetchFromOSV` can be kept for standalone use (e.g., re-fetch for a single component) but is not appropriate for batch upload processing.

**Warning signs:** Upload appears to hang for 20+ seconds; network tab shows 100+ individual POST requests.

### Pitfall 4: NVD Does Not Accept PURL

**What goes wrong:** Assuming NVD API accepts `purl` as a query parameter (like OSV does). NVD's CVE API takes `cpeName` or `keywordSearch` — there is no PURL endpoint.

**Why it happens:** The existing `fetchFromNVD(keyword, apiKey)` uses keyword search, which is closest to practical. The comment in the file references NVD API v1.0 (deprecated); NVD API 2.0 is now current.

**How to avoid:** Use `component.name` as the `keywordSearch` parameter for NVD fallback. Accept that NVD results are less precise (may match unrelated packages). NVD is a fallback only for components where OSV returned zero results.

**Warning signs:** NVD query returns vulns for wrong packages; severity wildly incorrect.

### Pitfall 5: NVD Rate Limit Without API Key

**What goes wrong:** Querying NVD for all OSV-empty components in parallel triggers 429 rate limit errors (5 req / 30 sec without API key, 50 req / 30 sec with key).

**Why it happens:** NVD has strict rate limiting, unlike OSV (which has no stated rate limit).

**How to avoid:** For NVD fallback, process requests serially with 6-second delay between each, OR only query NVD when the user explicitly requests re-fetch for a single component. Given the fallback is for components OSV returned nothing on, it is likely a minority case.

**Warning signs:** Console shows 429 errors; some vulns never appear in the table.

### Pitfall 6: Vuln Fetch Blocks the Upload Flow

**What goes wrong:** Awaiting vuln fetch inside `handleUploadSuccess` before closing the upload dialog. For large SBOMs, the dialog stays open indefinitely.

**Why it happens:** Async/await makes it easy to serialize what should be fire-and-forget.

**How to avoid:** In `dashboard/index.js`, after `uploadSBOM()` resolves, call `fetchVulnsForSBOM(newSBOM.components, newSBOM.id)` without await (fire-and-forget). Close the dialog immediately. The vuln table will populate as data arrives.

**Warning signs:** Upload dialog never closes; user experience appears broken.

### Pitfall 7: Stats Recalculation After SBOM Filter Change

**What goes wrong:** The `stats` object (used by VulnerabilityChart and status bar) is computed from the full `vulnerabilities` array, not the SBOM-filtered+merged set. When a user selects SBOMs, the chart updates but the status bar counts remain unchanged.

**Why it happens:** The `useEffect` computing `stats` runs on `vulnerabilities`, not `filteredVulnerabilities`.

**How to avoid:** Compute `stats` from `mergedVulnerabilities` (the SBOM-filtered+deduplicated set), not from the raw `vulnerabilities` array.

---

## Code Examples

### OSV Querybatch + Detail Fetch (complete flow)

```javascript
// Source: https://google.github.io/osv.dev/post-v1-querybatch/ + https://ossf.github.io/osv-schema/
export const fetchVulnerabilitiesForSBOM = async (components) => {
  const purls = components.map((c) => c.purl).filter(Boolean);
  if (purls.length === 0) return [];

  // Step 1: batch query — returns only { id, modified } per vuln
  const batchResp = await fetch("https://api.osv.dev/v1/querybatch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      queries: purls.map((purl) => ({ package: { purl } })),
    }),
  });
  if (!batchResp.ok) return [];
  const batchData = await batchResp.json();

  // Map each PURL to its vuln IDs
  const purlVulnPairs = []; // [{ purl, osvId }]
  (batchData.results || []).forEach((result, idx) => {
    (result.vulns || []).forEach((v) => {
      purlVulnPairs.push({ purl: purls[idx], osvId: v.id });
    });
  });

  if (purlVulnPairs.length === 0) return [];

  // Step 2: fetch full details for unique vuln IDs
  const uniqueOsvIds = [...new Set(purlVulnPairs.map((p) => p.osvId))];
  const detailResults = await Promise.allSettled(
    uniqueOsvIds.map((id) =>
      fetch(`https://api.osv.dev/v1/vulns/${id}`).then((r) => r.json())
    )
  );

  const osvIdToDetail = {};
  detailResults.forEach((result, idx) => {
    if (result.status === "fulfilled") {
      osvIdToDetail[uniqueOsvIds[idx]] = result.value;
    }
  });

  // Step 3: assemble final records, one per purl+cveId pair
  const records = [];
  purlVulnPairs.forEach(({ purl, osvId }) => {
    const detail = osvIdToDetail[osvId];
    if (!detail) return;

    const cveId = (detail.aliases || []).find((a) => a.startsWith("CVE-")) || osvId;
    const severityEntry = (detail.severity || []).find(
      (s) => s.type === "CVSS_V3" || s.type === "CVSS_V4"
    );
    const severity = parseCVSSSeverity(severityEntry?.score);

    records.push({
      purl,
      cveId,
      severity,
      summary: detail.summary || "",
      publishedDate: detail.published || new Date().toISOString(),
      source: "osv",
      status: "NOT_STARTED",
      patchAvailable: false,
    });
  });

  return records;
};

const parseCVSSSeverity = (scoreString) => {
  if (!scoreString) return "LOW";
  // CVSS:3.1/AV:N/AC:L/.../... — base score is the last numeric segment
  const parts = scoreString.split("/");
  const baseScore = parseFloat(parts[parts.length - 1] || "0");
  if (baseScore >= 9.0) return "CRITICAL";
  if (baseScore >= 7.0) return "HIGH";
  if (baseScore >= 4.0) return "MEDIUM";
  return "LOW";
};
```

Note: CVSS vector string parsing above is simplified. The actual base score is embedded differently across CVSS v2/v3/v4. A safer approach: extract the numeric score from `database_specific.cvss` if present, or use a regex on the vector string's known position. For production accuracy, use a CVSS parsing library, but for this MVP the severity bucket approximation is sufficient.

### VulnerabilityTable — "Found In" Column Addition

```javascript
// Source: derived from existing VulnerabilityTable.js pattern (Chip with sx colors)
{
  Header: "Found In",
  accessor: "sbomNames",
  disableSortBy: true,
  Cell: ({ value }) => (
    <Box display="flex" gap={0.5} flexWrap="wrap">
      {(value || []).map((name) => (
        <Chip
          key={name}
          label={name}
          size="small"
          sx={{
            backgroundColor: "#e0f2fe",
            color: "#0369a1",
            fontWeight: "bold",
            fontSize: "0.65rem",
          }}
        />
      ))}
    </Box>
  ),
},
```

### VulnerabilityTable — Read-Only Status for Merged Rows

```javascript
// Source: derived from existing Status cell in VulnerabilityTable.js
Cell: ({ row }) => {
  const isMerged = (row.original.sbomNames || []).length > 1;
  const statusInfo = STATUS_COLORS[row.original.status];
  if (isMerged) {
    return (
      <Chip
        label={statusInfo?.label || row.original.status}
        size="small"
        sx={{
          backgroundColor: statusInfo?.bg,
          color: statusInfo?.color,
          fontWeight: "bold",
        }}
      />
    );
  }
  return (
    <Select
      size="small"
      value={row.original.status}
      onChange={(e) => onStatusChange(row.original.id, e.target.value)}
      sx={{ width: 130 }}
    >
      {statusOptions.map((stat) => (
        <MenuItem key={stat} value={stat}>
          <Chip label={STATUS_COLORS[stat].label} size="small"
            sx={{ backgroundColor: STATUS_COLORS[stat].bg, color: STATUS_COLORS[stat].color, fontWeight: "bold" }}
          />
        </MenuItem>
      ))}
    </Select>
  );
},
```

### Hook Swap: useVulnerabilityData → useVulnerabilities

```javascript
// sbom-vulnerabilities/index.js — replace:
// import { useVulnerabilityData } from "./hooks/useVulnerabilityData";
// const { vulnerabilities, addVulnerability, updateVulnerabilityStatus, deleteVulnerability, clearAll } = useVulnerabilityData();

// with:
import { useVulnerabilities } from "hooks/useVulnerabilities";
import { useSBOMLibrary } from "hooks/useSBOMLibrary";
const { vulnerabilities, addVulnerability, updateVulnerabilityStatus, deleteVulnerability, clearAll } = useVulnerabilities();
const { sboms } = useSBOMLibrary();
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| NVD API v1.0 (in existing vulnerabilityAPI.js) | NVD API 2.0 — endpoint changed | 2023 | Old endpoint deprecated; `services.nvd.nist.gov/rest/json/cves/1.0` is dead |
| Per-PURL OSV fetch | OSV querybatch `/v1/querybatch` | 2022 | Single request for all components instead of N requests |
| CVE ID as primary OSV key | OSV uses own IDs (GHSA-, RUSTSEC-, etc); CVE in `aliases[]` | Always | Must extract CVE from aliases, not root `id` |

**Deprecated/outdated:**
- `services.nvd.nist.gov/rest/json/cves/1.0`: Deprecated in 2023. Current endpoint is `services.nvd.nist.gov/rest/json/cves/2.0`. The existing `fetchFromNVD` in `vulnerabilityAPI.js` uses the old v1.0 endpoint — must be updated if NVD fallback is implemented.

---

## Open Questions

1. **OSV CORS headers — confirmed browser-callable?**
   - What we know: OSV API has no stated rate limit; the API is publicly documented as REST/HTTP. The existing `fetchFromOSV` in `vulnerabilityAPI.js` already calls it from the browser without special headers.
   - What's unclear: No official CORS documentation found. In practice, browsers can call it because it returns `Access-Control-Allow-Origin: *` (standard for public APIs), but this was not confirmed in documentation.
   - Recommendation: The existing code already calls it browser-side. If it were CORS-blocked, Phase 1 would have surfaced this. Treat as confirmed.

2. **CVSS base score extraction from vector string**
   - What we know: CVSS v3.1 vector strings do not embed the base score as a trailing segment — the score must be calculated from the vector components.
   - What's unclear: OSV `severity[].score` contains the full CVSS vector string, not a numeric score. Accurate parsing requires either a CVSS library or implementing the CVSS v3 calculation.
   - Recommendation: For this MVP, use the `database_specific` field which sometimes contains a numeric score, OR derive severity from keywords in the vector (`AV:N/AC:L` with `CI:H` signals HIGH+). Alternatively, accept LOW/MEDIUM/HIGH/CRITICAL at 25% granularity. The OSV `affected[].database_specific` field may also contain severity directly for some ecosystems.

3. **NVD API v2.0 endpoint for the fallback**
   - What we know: Old endpoint (`/cves/1.0`) used in `vulnerabilityAPI.js` is deprecated. New endpoint is `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=...`.
   - What's unclear: Rate limit without key is 5 req/30s. Using NVD for any more than a handful of components without an API key is impractical.
   - Recommendation: Implement NVD fallback as "keyword search for components where OSV returned zero results, serialized with 6s delay." Document that users can set an NVD API key in app config (or simply omit NVD fallback for MVP since OSV covers most npm/pypi/maven packages).

---

## Key Integration Points Summary

| File | Change Type | What Changes |
|------|------------|--------------|
| `src/hooks/useVulnerabilityFetcher.js` | NEW | Fetches vulns from OSV (batch) + NVD (fallback) on SBOM upload; calls `addVulnerability` for each result |
| `src/layouts/dashboard/index.js` | MODIFY | After `uploadSBOM()` resolves (non-duplicate), fire-and-forget call to `fetchVulnsForSBOM(newSBOM.components, newSBOM.id)` |
| `src/layouts/sbom-vulnerabilities/index.js` | MODIFY | Swap to `useVulnerabilities` + `useSBOMLibrary`; add `selectedSBOMIds` state; mount `SBOMSelector` above Card; add `mergedVulnerabilities` useMemo; pass merged set to Chart + Table; compute stats from merged set |
| `src/layouts/sbom-vulnerabilities/components/VulnerabilityTable.js` | MODIFY | Add "Found In" column; make Status cell read-only (Chip) when `sbomNames.length > 1`; update PropTypes to include `sbomNames` |
| `src/utils/vulnerabilityAPI.js` | MODIFY | Add `fetchVulnerabilitiesForSBOM(components)` using querybatch + detail fetch; update `fetchFromNVD` to use NVD API v2.0 endpoint |

---

## Sources

### Primary (HIGH confidence)
- `src/layouts/sbom-vulnerabilities/index.js` — current page structure, hook usage, filter pattern
- `src/layouts/sbom-vulnerabilities/components/VulnerabilityTable.js` — current columns, Chip pattern, Status cell
- `src/layouts/sbom-vulnerabilities/hooks/useVulnerabilityData.js` — current hook (no PURL field)
- `src/hooks/useVulnerabilities.js` — PURL-indexed hook, `getVulnerabilitiesForPURLs()` already exists
- `src/hooks/useSBOMLibrary.js` — SBOM structure: `sbom.components[].purl`
- `src/components/SBOMSelector/index.js` — already supports `mode="multiple"`, `selectedIds`, `onSelectedChange`
- `src/utils/vulnerabilityAPI.js` — existing `fetchFromOSV(purl)` pattern; NVD function uses deprecated v1.0 endpoint
- `src/components/SBOMUploader/index.js` — calls `onUploadSuccess(sbomData)` after parse; caller handles storage
- `src/layouts/dashboard/index.js` — upload flow: `handleUploadSuccess` → `uploadSBOM()` → success
- https://google.github.io/osv.dev/post-v1-querybatch/ — querybatch request/response shape, batch limits
- https://ossf.github.io/osv-schema/ — full OSV vulnerability schema (aliases, severity, affected.package)

### Secondary (MEDIUM confidence)
- https://nvd.nist.gov/developers/start-here — NVD API rate limits (5 req/30s without key, 50 with key); keyword search endpoint
- https://google.github.io/osv.dev/api/ — no stated rate limit for OSV API

### Tertiary (LOW confidence)
- CVSS base score extraction from vector string — approach in Code Examples is a simplification; validate against real OSV responses before shipping

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project; no new deps
- Architecture: HIGH — read all relevant source files directly; patterns confirmed
- OSV API: HIGH — official docs fetched; querybatch shape confirmed
- NVD API: MEDIUM — rate limits confirmed from official docs; PURL non-support inferred from docs (no PURL endpoint listed)
- Pitfalls: HIGH — most derived from reading actual code, not assumptions
- CVSS severity parsing: LOW — exact vector format varies by ecosystem; validate against real data

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (OSV/NVD APIs are stable; 30-day validity)
