# Phase 2: Dashboard Integration - Research

**Researched:** 2026-03-05
**Domain:** React SPA dashboard replacement — MUI cards, hooks integration, file upload, duplicate detection dialog
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Dashboard layout:**
- Stats-first: top row of 4 `ComplexStatisticsCard` stats, then SBOM library section below
- User lands on the page to get an overview, not primarily to upload
- 4 stats cards: SBOMs in library, total components, total vulnerabilities tracked, unresolved vulnerabilities
- Below stats: SBOM cards grid (up to 3 cards) with an "Upload SBOM" button above or alongside the grid

**Stats cards:**
- Card 1: SBOM count ("3 SBOMs" or "2 / 3 SBOMs")
- Card 2: Total components across all SBOMs
- Card 3: Total vulnerabilities tracked
- Card 4: Unresolved vulnerabilities (status != REMEDIATED)
- Use existing `ComplexStatisticsCard` component — no new component needed

**SBOM library section:**
- Card-based grid, not a table — each SBOM gets its own card
- Up to 3 cards (matching the library limit)
- "Upload SBOM" button is the primary action trigger (not a persistent drag-drop zone)

### Claude's Discretion
- SBOM card content and actions (what info to show per card, whether to include delete action)
- Duplicate dialog appearance (MUI Dialog is the natural choice given the stack)
- Copy naming format for duplicates
- Empty state when no SBOMs are loaded yet
- Icon choices for stats cards

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DASH-01 | User can see SBOM library stats (count, total components) on the dashboard | `useSBOMLibrary.getStats()` returns `totalSBOMs` + `totalComponents`; `useVulnerabilities` provides vuln counts. Both hooks mount independently. |
| DASH-02 | User can see a card for each SBOM in the library (name, component count, dates) | `useSBOMLibrary.sboms` array contains all fields needed; MUI `Card` pattern is standard in this project |
| DASH-03 | User can upload an SBOM from the dashboard with drag-and-drop | `SBOMUploader` component already implements full drag-drop + file-input with built-in error handling; wired to `uploadSBOM()` |
| DASH-04 | User sees a duplicate detection prompt when uploading an SBOM with a matching hash | `uploadSBOM()` already returns `{ isDuplicate: true, existingSBOM, message }` — dashboard just needs to gate on this return value and show MUI Dialog |
| DASH-05 | User can create a copy of a duplicate SBOM or cancel the upload | Copy = re-call `uploadSBOM()` with modified name (e.g., append " (copy)"); cancel = close dialog with no state mutation |
</phase_requirements>

---

## Summary

Phase 2 is a **content replacement** inside an existing, functioning shell. The `DashboardLayout` / `DashboardNavbar` / `Footer` wrapper stays intact; the body of `src/layouts/dashboard/index.js` is replaced wholesale. The template content (bar charts, line charts, Projects table, OrdersOverview) is removed and replaced with four stats cards and an SBOM library section.

All business logic already exists: `useSBOMLibrary` provides `sboms`, `uploadSBOM()`, `removeSBOM()`, and `getStats()`. `useVulnerabilities` provides the vulnerability array needed for the two vulnerability stats cards (stats 3 and 4 in the locked layout). `SBOMUploader` provides the file-drop UI. The dashboard's job is to **wire these together**, handle the upload result, and render SBOM cards in a grid.

The one non-trivial piece is the duplicate detection dialog: `uploadSBOM()` returns `{ isDuplicate: true, existingSBOM }` instead of saving, and the dashboard must gate on this return value, render an MUI `Dialog`, and either call `uploadSBOM()` again with a renamed copy or dismiss cleanly. This is entirely UI state — no new storage primitives needed.

**Primary recommendation:** Replace `src/layouts/dashboard/index.js` body only. Wire `useSBOMLibrary` + `useVulnerabilities` for data. Compose existing components (`ComplexStatisticsCard`, `SBOMUploader`, MUI `Card`/`Dialog`). Create one new layout-local component: `SBOMCard` (renders a single SBOM's card in the grid).

---

## Standard Stack

No new dependencies required for this phase. Everything needed is already installed.

### Core (already in project)

| Library | Version | Purpose | Role in this phase |
|---------|---------|---------|--------------|
| React | 18.2.0 | Component model and hooks | `useState` for dialog state, `useSBOMLibrary` / `useVulnerabilities` hooks |
| MUI `@mui/material` | 5.12.3 | UI components | `Grid`, `Card`, `CardContent`, `CardActions`, `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions`, `Alert`, `Button`, `Typography`, `Divider` |
| `@mui/icons-material` | 5.12.3 | Icon nodes for `ComplexStatisticsCard` | `Inventory2`, `Extension`, `BugReport`, `GppBad` (or similar security/library icons) |
| `prop-types` | 15.8.1 | Runtime prop checking | Used on the new `SBOMCard` component |

### Existing Project Components Used Directly

| Component | Location | How Used |
|-----------|----------|----------|
| `ComplexStatisticsCard` | `examples/Cards/StatisticsCards/ComplexStatisticsCard` | All 4 stats cards — no changes needed |
| `SBOMUploader` | `components/SBOMUploader` | Rendered inside MUI `Dialog` triggered by "Upload SBOM" button |
| `DashboardLayout` | `examples/LayoutContainers/DashboardLayout` | Wrapper — kept as-is |
| `DashboardNavbar` | `examples/Navbars/DashboardNavbar` | Wrapper — kept as-is |
| `Footer` | `examples/Footer` | Wrapper — kept as-is |
| `MDBox` | `components/MDBox` | Spacing / layout primitive |
| `MDButton` | `components/MDButton` | "Upload SBOM" primary action button |
| `MDTypography` | `components/MDTypography` | Section headings, card text |

### Hooks Used

| Hook | Location | What It Provides |
|------|----------|-----------------|
| `useSBOMLibrary` | `hooks/useSBOMLibrary.js` | `sboms`, `loading`, `error`, `uploadSBOM()`, `removeSBOM()`, `getStats()` |
| `useVulnerabilities` | `hooks/useVulnerabilities.js` | `vulnerabilities` array — filter for total count and unresolved count |

### Installation

No new packages required. All dependencies already in `package.json`.

---

## Architecture Patterns

### Recommended Project Structure

```
src/layouts/dashboard/
├── index.js                         # Full replacement — main Dashboard component
└── components/
    └── SBOMCard/
        └── index.js                 # New: single SBOM card for the grid
```

Remove all existing `components/Projects/`, `components/OrdersOverview/` directories and the `data/` directory — they are template content not needed in the new dashboard.

### Pattern 1: Stats Row — Existing Grid Pattern

**What:** Four `ComplexStatisticsCard` components in a `<Grid container spacing={3}>` row.
**When to use:** Top of dashboard, always visible.

The `ComplexStatisticsCard` accepts: `color` (MUI palette key), `icon` (MUI icon name string), `title` (string), `count` (string | number), `percentage` ({ color, amount, label }). The `percentage` prop renders footer text — use it for descriptive labels like "3 SBOMs stored" or "Max: 3".

```javascript
// Source: src/examples/Cards/StatisticsCards/ComplexStatisticsCard/index.js (read directly)
<ComplexStatisticsCard
  color="info"
  icon="inventory_2"
  title="SBOMs in Library"
  count={`${stats.totalSBOMs} / 3`}
  percentage={{ color: "text", amount: "", label: `${3 - stats.totalSBOMs} slots remaining` }}
/>
```

Vuln counts come from the `useVulnerabilities` hook:
```javascript
const { vulnerabilities } = useVulnerabilities();
const totalVulns = vulnerabilities.length;
const unresolvedVulns = vulnerabilities.filter((v) => v.status !== "REMEDIATED").length;
```

### Pattern 2: SBOM Library Section — Card Grid

**What:** Section heading + optional "Upload SBOM" button in a flex row, then a `<Grid container spacing={3}>` of `SBOMCard` components, or an empty state.
**When to use:** Below stats row, always visible.

Grid item sizing: `xs={12} md={6} lg={4}` gives up to 3 per row on large screens, matching the 3-SBOM limit.

```javascript
// Empty state pattern (consistent with SBOMSelector's existing empty state)
{sboms.length === 0 && (
  <MDBox py={5} textAlign="center">
    <MDTypography color="text">No SBOMs uploaded yet.</MDTypography>
  </MDBox>
)}
```

### Pattern 3: Upload Flow with Duplicate Detection

**What:** Button triggers dialog with `SBOMUploader`. On `onUploadSuccess`, call `uploadSBOM()`. Gate on return value — if `isDuplicate`, swap to duplicate prompt within the same dialog (or open a second dialog). If success, close and refresh.

**Key insight:** `SBOMUploader.onUploadSuccess` is called with **parsed sbomData** (before storage). The dashboard calls `uploadSBOM(sbomData)` (async) and inspects the result. Do not call storage directly — always go through `useSBOMLibrary`.

```javascript
// Source: src/hooks/useSBOMLibrary.js (read directly)
const handleUpload = async (sbomData) => {
  const result = await uploadSBOM(sbomData);
  if (result.isDuplicate) {
    // Store sbomData in local state, show duplicate dialog
    setPendingUpload(sbomData);
    setDuplicateInfo(result);
    setShowDuplicateDialog(true);
  } else {
    setUploadDialogOpen(false); // success — close upload dialog
  }
};

const handleCreateCopy = async () => {
  const copyData = { ...pendingUpload, name: `${pendingUpload.name} (copy)` };
  await uploadSBOM(copyData); // hash will differ because name is included in stable string?
  // NOTE: See pitfall below — verify hash computation inputs
  setShowDuplicateDialog(false);
  setUploadDialogOpen(false);
};
```

### Pattern 4: New `SBOMCard` Component

**What:** Layout-local component (not promoted to global `components/`) that renders a single SBOM's info card.
**Structure:** MUI `Card` with `CardContent` (name, component count, dates) and `CardActions` (delete button, possibly a "View in Graph" link).

```javascript
// Recommended props — Claude's discretion for card content
function SBOMCard({ sbom, onDelete }) {
  return (
    <Card>
      <CardContent>
        <MDTypography variant="h6" fontWeight="bold" noWrap>{sbom.name}</MDTypography>
        <MDTypography variant="body2" color="text">
          {sbom.components?.length || 0} components
        </MDTypography>
        <MDTypography variant="caption" color="text">
          Created: {new Date(sbom.createdAt).toLocaleDateString()}
        </MDTypography>
        <MDTypography variant="caption" color="text" display="block">
          Modified: {new Date(sbom.modifiedAt).toLocaleDateString()}
        </MDTypography>
      </CardContent>
      <CardActions>
        <MDButton size="small" color="error" onClick={() => onDelete(sbom.id)}>
          Delete
        </MDButton>
      </CardActions>
    </Card>
  );
}
```

### Anti-Patterns to Avoid

- **Calling storage functions directly from layout:** All SBOM mutations go through `useSBOMLibrary` — never import from `utils/sbomStorage` in the dashboard layout.
- **Showing `SBOMUploader` inline as persistent zone:** User decision is a button-triggered dialog, not a persistent drag-drop zone on the page.
- **Using `SBOMSelector` for the SBOM grid:** `SBOMSelector` renders a table; the dashboard uses cards. These are different display surfaces for the same data.
- **Sorting `sboms` in `getStats()` as a side effect:** `useSBOMLibrary.getStats()` sorts `sboms` in-place via `sboms.sort(...)` before returning — this mutates React state (bug in the hook). Avoid calling `getStats()` to get the sbom list; use `sboms` directly. Use `getStats()` only for the numeric totals.
- **Assuming `uploadSBOM` for a copy will always succeed:** Check — after renaming for copy, the hash changes if `name` feeds into hash input. Read `computeSBOMHash` carefully: it hashes `{ components, metadata }` only — name is NOT in the hash. So a renamed copy will have the same hash as the original and will itself be flagged as a duplicate. See Pitfall 2 below.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-drop file upload zone | Custom drag-drop div | `SBOMUploader` (already built) | All drag state, file reading, CycloneDX validation already handled |
| SHA-256 duplicate detection | Custom comparison | `uploadSBOM()` from `useSBOMLibrary` | Hash computation and lookup already in hook |
| Modal dialog for upload | Custom overlay | MUI `Dialog` | Handles accessibility, backdrop, keyboard dismiss automatically |
| SBOM stats computation | `reduce()` in layout | `useSBOMLibrary.getStats()` (for counts) + `useVulnerabilities` (for vuln counts) | Logic centralized in hooks |
| Date formatting | `Date.toString()` | `new Date(iso).toLocaleDateString()` | Locale-aware, already used throughout codebase |

---

## Common Pitfalls

### Pitfall 1: `getStats()` Mutates `sboms` Array

**What goes wrong:** `useSBOMLibrary.getStats()` calls `sboms.sort(...)` (in-place sort) on the React state array before returning `recentlyModified`. This mutates the state array reference.
**Why it happens:** JavaScript `Array.sort()` sorts in place.
**How to avoid:** In the dashboard, use `getStats()` only for `totalSBOMs` and `totalComponents`. Do not rely on `getStats()` to get a sorted list of SBOMs — use `sboms` directly. The planner may want to note this as a pre-fix task or work around it (spread before sort: `[...sboms].sort(...)`).
**Warning signs:** SBOM cards rendering in unexpected order after any re-render.

### Pitfall 2: Copy of Duplicate Has Same Hash

**What goes wrong:** The duplicate dialog offers "Create Copy" but `uploadSBOM()` uses `computeSBOMHash({ components, metadata })` — the SBOM `name` is NOT included. Renaming to `"My SBOM (copy)"` does not change the hash. The copy attempt will return `isDuplicate: true` again, creating an infinite loop.
**Why it happens:** Hash inputs are `components` and `metadata` only (confirmed in `sbomStorage.js`).
**How to avoid:** When creating a copy, bypass the hash check. Either:
  - Option A: Call `createSBOM` directly (skips hash check, but breaks the "no direct storage calls" rule).
  - Option B: Add a `forceCreate` flag to `uploadSBOM()` — caller sets it to bypass duplicate check.
  - Option C: Mutate metadata to include a copy marker, changing the hash: `{ ...sbomData.metadata, copyOf: existingSBOM.id, copiedAt: Date.now() }`. This changes the hash because metadata is included in hash inputs.
**Recommended approach:** Option C — add `copyOf` to metadata before calling `uploadSBOM()` again. No hook changes needed. Clean, traceable.
**Warning signs:** Duplicate dialog re-appearing after clicking "Create Copy."

### Pitfall 3: Two Hooks Mounted Separately — Loading States

**What goes wrong:** Dashboard mounts both `useSBOMLibrary` and `useVulnerabilities`. Each has its own `loading` state. Stats cards may render zeros while hooks load, causing layout shift (cards flashing from 0 to real values).
**Why it happens:** Both hooks are async on mount.
**How to avoid:** Show a loading skeleton or defer rendering stats cards until both `loading === false`. Alternatively, accept the flash — for localStorage reads it completes in <1ms in practice, so the flash is imperceptible.
**Warning signs:** Stats cards showing 0 vulnerability count persistently on first load.

### Pitfall 4: SBOMUploader `onUploadSuccess` Is Synchronous But `uploadSBOM` Is Async

**What goes wrong:** `SBOMUploader` calls `onUploadSuccess(sbomData)` synchronously after parsing. The parent handler must be async to await `uploadSBOM()`. If the handler isn't async or doesn't handle the promise, duplicate detection result is silently lost.
**Why it happens:** `onUploadSuccess` prop isn't typed as async — easy to write it wrong.
**How to avoid:** Write the handler as `async (sbomData) => { const result = await uploadSBOM(sbomData); ... }` and pass it as the prop. Keep a local `uploading` state flag to disable the dialog action buttons while the promise resolves.
**Warning signs:** No duplicate dialog appearing on re-upload of same file.

### Pitfall 5: Deleting SBOM While Dialog Is Open

**What goes wrong:** If the upload dialog is open and user somehow triggers a delete (unlikely but possible via keyboard), the SBOM count can shift unexpectedly.
**Why it happens:** State updates in both paths.
**How to avoid:** Disable the delete button while the upload dialog is open. Simple `disabled={uploadDialogOpen}` on delete buttons.

---

## Code Examples

### Stats Row (complete, verified against existing components)

```javascript
// Source: src/layouts/dashboard/index.js (existing template) + src/hooks/useSBOMLibrary.js
import Grid from "@mui/material/Grid";
import MDBox from "components/MDBox";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";
import { useSBOMLibrary } from "hooks/useSBOMLibrary";
import { useVulnerabilities } from "hooks/useVulnerabilities";

function Dashboard() {
  const { sboms, loading: sbomsLoading, uploadSBOM, removeSBOM, getStats } = useSBOMLibrary();
  const { vulnerabilities } = useVulnerabilities();

  const stats = getStats(); // { totalSBOMs, totalComponents, recentlyModified }
  const totalVulns = vulnerabilities.length;
  const unresolvedVulns = vulnerabilities.filter((v) => v.status !== "REMEDIATED").length;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {/* Stats row */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="info"
                icon="inventory_2"
                title="SBOMs in Library"
                count={`${stats.totalSBOMs} / 3`}
                percentage={{ color: "text", amount: "", label: `${3 - stats.totalSBOMs} slots remaining` }}
              />
            </MDBox>
          </Grid>
          {/* ... 3 more cards */}
        </Grid>

        {/* SBOM library section below */}
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}
```

### Upload Dialog + Duplicate Detection

```javascript
// Local state in Dashboard component
const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
const [pendingUpload, setPendingUpload] = useState(null);
const [duplicateInfo, setDuplicateInfo] = useState(null); // { isDuplicate, existingSBOM, message }
const [uploading, setUploading] = useState(false);

const handleUploadSuccess = async (sbomData) => {
  setUploading(true);
  try {
    const result = await uploadSBOM(sbomData);
    if (result.isDuplicate) {
      setPendingUpload(sbomData);
      setDuplicateInfo(result);
    } else {
      setUploadDialogOpen(false); // success
    }
  } finally {
    setUploading(false);
  }
};

const handleCreateCopy = async () => {
  // Option C: mutate metadata to change hash
  const copyData = {
    ...pendingUpload,
    name: `${pendingUpload.name} (copy)`,
    metadata: {
      ...pendingUpload.metadata,
      copyOf: duplicateInfo.existingSBOM.id,
      copiedAt: new Date().toISOString(),
    },
  };
  setUploading(true);
  try {
    await uploadSBOM(copyData);
    setDuplicateInfo(null);
    setPendingUpload(null);
    setUploadDialogOpen(false);
  } finally {
    setUploading(false);
  }
};

const handleCancelDuplicate = () => {
  setDuplicateInfo(null);
  setPendingUpload(null);
  // Leave uploadDialogOpen so user can try a different file if they want, or close manually
};
```

### MUI Dialog for Upload (pattern from existing SBOMUploader Dialog usage)

```javascript
// Source: src/components/SBOMUploader/index.js — uses Dialog, DialogTitle, DialogContent, DialogActions
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

// Upload dialog — shows SBOMUploader or duplicate prompt
<Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
  {!duplicateInfo ? (
    <>
      <DialogTitle>Upload SBOM</DialogTitle>
      <DialogContent>
        <SBOMUploader
          onUploadSuccess={handleUploadSuccess}
          disabled={sboms.length >= 3}
        />
      </DialogContent>
      <DialogActions>
        <MDButton onClick={() => setUploadDialogOpen(false)}>Cancel</MDButton>
      </DialogActions>
    </>
  ) : (
    <>
      <DialogTitle>Duplicate SBOM Detected</DialogTitle>
      <DialogContent>
        <MDTypography variant="body2">{duplicateInfo.message}</MDTypography>
      </DialogContent>
      <DialogActions>
        <MDButton onClick={handleCancelDuplicate}>Cancel</MDButton>
        <MDButton
          color="primary"
          onClick={handleCreateCopy}
          disabled={uploading}
        >
          Create Copy
        </MDButton>
      </DialogActions>
    </>
  )}
</Dialog>
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Template content (bookings, charts, Projects table) | SBOM library overview | Full body replacement of `layouts/dashboard/index.js` |
| Template `ComplexStatisticsCard` with hardcoded data | Same component with live hook data | No component changes; just different props |

**To remove (template artifacts):**
- `layouts/dashboard/data/reportsBarChartData.js`
- `layouts/dashboard/data/reportsLineChartData.js`
- `layouts/dashboard/components/Projects/`
- `layouts/dashboard/components/OrdersOverview/`
- Imports for `ReportsBarChart`, `ReportsLineChart` in `dashboard/index.js`

---

## Open Questions

1. **`getStats()` mutation side effect — fix in place or work around?**
   - What we know: `getStats()` calls `sboms.sort(...)` mutating state array
   - What's unclear: Whether this causes visible bugs given React re-render behavior
   - Recommendation: Fix the hook (spread before sort: `[...sboms].sort(...)`) as part of Wave 1 tasks; it's a one-line change and prevents subtle ordering bugs.

2. **Stats cards 3 & 4: should `useVulnerabilities` be called directly in Dashboard or should `useSBOMLibrary.getStats()` be extended?**
   - What we know: `getStats()` only computes `totalSBOMs`, `totalComponents`, `recentlyModified` — no vuln data
   - What's unclear: Whether the team wants vuln stats in the SBOM hook or kept separate
   - Recommendation: Call `useVulnerabilities` directly in the Dashboard layout for the two vuln stats cards. Keep hooks cleanly separated. No changes to `useSBOMLibrary`.

3. **SBOMCard delete confirmation — confirm prompt or immediate delete?**
   - What we know: `SBOMSelector` uses direct delete (no confirm) via `onDelete` prop; `useVulnerabilities.clearAll()` uses `window.confirm()`
   - What's unclear: Project convention for destructive actions on SBOM cards
   - Recommendation: Claude's discretion. Use a `window.confirm()` or an inline confirmation chip (simpler). Avoid a full dialog for delete — that's over-engineered for a 3-item list.

---

## Sources

### Primary (HIGH confidence)
- `src/hooks/useSBOMLibrary.js` — read directly; confirmed `uploadSBOM()` return shape, `getStats()` signature, `removeSBOM()` API
- `src/utils/sbomStorage.js` — read directly; confirmed `computeSBOMHash` inputs (components + metadata only, NOT name), MAX_SBOMS = 3
- `src/components/SBOMUploader/index.js` — read directly; confirmed `onUploadSuccess(sbomData)` is called synchronously with parsed data
- `src/examples/Cards/StatisticsCards/ComplexStatisticsCard/index.js` — read directly; confirmed prop types: `color`, `icon` (string), `title`, `count`, `percentage: { color, amount, label }`
- `src/hooks/useVulnerabilities.js` — read directly; confirmed `vulnerabilities` array with `status` field; "REMEDIATED" is the terminal status string
- `src/layouts/dashboard/index.js` — read directly; confirmed existing template structure to replace

### Secondary (MEDIUM confidence)
- MUI Dialog usage pattern — verified against `SBOMUploader` which already uses `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions` from `@mui/material`
- MUI Grid pattern `xs={12} md={6} lg={3}` / `lg={4}` — verified against existing `dashboard/index.js` template

### Tertiary (LOW confidence)
- None — all findings backed by direct code reads

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all components/hooks read directly from source
- Architecture: HIGH — patterns derived from existing code, not assumption
- Pitfalls: HIGH (Pitfalls 1, 2, 4) — confirmed by reading implementation; MEDIUM (Pitfalls 3, 5) — logical inference from hook structure

**Research date:** 2026-03-05
**Valid until:** 2026-04-04 (stable codebase, no external dependencies to shift)
