# Phase 3: Graph Editor Integration - Research

**Researched:** 2026-03-05
**Domain:** React state management, CycloneDX graph ↔ library round-trip, MUI toolbar UI
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- SBOMSelector table sits above the graph card, between the page header and the main Card
- Always visible — not collapsible, not a dialog
- Single-select mode (only one SBOM loaded at a time in the graph)
- User selects a row, then clicks a "Load" button to render the graph — selection does not auto-load

### Claude's Discretion
- Whether the existing "Import from disk" button stays or is visually de-emphasized once a library SBOM is loaded
- Save / Save As button placement (toolbar right group is the natural fit)
- Save As disabled state when library is full (3 SBOMs)
- Loaded SBOM indicator (show active SBOM name somewhere in the toolbar or status bar)
- Unsaved changes warning when user selects a different SBOM while edits are pending

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GRAPH-01 | User can select which SBOM to load in the Graph Editor via SBOMSelector | SBOMSelector already built in single-select mode; need `selectedSBOM` + `loadedSBOM` state + Load button in sbom-graph/index.js |
| GRAPH-02 | User can save edits back to the selected SBOM (overwrite) | `graphRef.current.getAllNodes()/getAllEdges()` + `convertGraphToCycloneDX` + `modifySBOM(id, updates)` — all pieces exist |
| GRAPH-03 | User can save edits as a new SBOM (Save As), if under the 3-SBOM limit | `uploadSBOM(sbomData)` handles create; limit check is `sboms.length >= 3`; disable Save As button when full |
</phase_requirements>

---

## Summary

Phase 3 is a wiring task, not a build task. All required primitives exist: `SBOMSelector` (single-select), `useSBOMLibrary` (CRUD), `convertCycloneDXToGraph` / `convertGraphToCycloneDX` (round-trip conversion), and `graphRef` imperative API (`getAllNodes`, `getAllEdges`). The work is entirely contained in `src/layouts/sbom-graph/index.js` with no new components or utilities required.

The key integration challenge is state management: the layout needs two distinct state variables (`selectedSBOM` — what the user has highlighted in the table, and `loadedSBOM` — what is currently rendered in the graph), plus an `isDirty` flag to detect unsaved changes before allowing a different SBOM to load. The Load button bridges selected → loaded. Save uses `modifySBOM`; Save As uses `uploadSBOM`. Both read graph state via the existing `graphRef` imperative handle.

The 3-SBOM limit enforcement for Save As is a simple `sboms.length >= 3` check on the value returned by `useSBOMLibrary`. No new storage logic is needed.

**Primary recommendation:** Mount `useSBOMLibrary` in `SbomGraph`, insert `SBOMSelector` above the main Card, add `selectedSBOM` / `loadedSBOM` / `isDirty` state, wire Load / Save / Save As handlers using existing utilities, add the Save/Save As buttons to the toolbar right group.

---

## Standard Stack

### Core (already in project — no new installs)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React `useState` / `useCallback` | 18.x | `selectedSBOM`, `loadedSBOM`, `isDirty` state | Established pattern in all layouts |
| `useSBOMLibrary` hook | project | SBOM CRUD + limit check | Single source of truth for library state |
| `SBOMSelector` component | project | Single-select table above graph | Already built for single-select mode |
| `convertCycloneDXToGraph` | project | Library SBOM → graph nodes/edges | Already used by Import |
| `convertGraphToCycloneDX` | project | Graph nodes/edges → CycloneDX for save | Already used by Export |
| MUI `Tooltip` + `MDButton` | project | Save / Save As buttons | Toolbar pattern established |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `window.confirm` | browser | Unsaved-changes warning | Established destructive-action pattern (SBOMCard delete) |
| MUI `Dialog` | project | Save As confirmation (optional) | Only if plain `window.confirm` feels insufficient — MUI Dialog pattern established in Phase 2 |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended File Change

Only one file needs modification:

```
src/layouts/sbom-graph/index.js   ← all phase 3 changes live here
```

No new files. No new hooks. No new utilities.

### Pattern 1: Two-Level SBOM State

**What:** Separate "selected in table" from "loaded into graph" so that clicking a row does not immediately discard current work.

**When to use:** Whenever there is a selection step before a destructive/expensive action.

```jsx
// Source: project pattern — mirrors dashboard's selectedSBOM concept
const [selectedSBOM, setSelectedSBOM] = useState(null); // highlighted in table
const [loadedSBOM, setLoadedSBOM]     = useState(null); // currently in graph
const [isDirty, setIsDirty]           = useState(false); // graph edited since load

const handleLoad = () => {
  if (!selectedSBOM) return;
  if (isDirty) {
    const ok = window.confirm("You have unsaved changes. Load a new SBOM and discard them?");
    if (!ok) return;
  }
  const sbom = getSBOM(selectedSBOM.id);
  const graphData = convertCycloneDXToGraph(sbom); // sbom is raw CycloneDX JSON
  setNewGraphData(graphData);
  setLoadedSBOM(selectedSBOM);
  setIsDirty(false);
};
```

### Pattern 2: Save (Overwrite)

**What:** Read current graph state, convert back to CycloneDX, call `modifySBOM`.

```jsx
// Source: mirrors existing handleExport pattern
const handleSave = async () => {
  if (!loadedSBOM) return;
  const nodes = graphRef.current?.getAllNodes() ?? [];
  const edges = graphRef.current?.getAllEdges() ?? [];
  const cycloneDX = convertGraphToCycloneDX(nodes, edges);
  await modifySBOM(loadedSBOM.id, {
    components: cycloneDX.components,
    metadata: cycloneDX.metadata,
  });
  setIsDirty(false);
};
```

### Pattern 3: Save As (New SBOM)

**What:** Same graph read, but call `uploadSBOM` instead. Disabled when `sboms.length >= 3`.

```jsx
// Source: useSBOMLibrary.uploadSBOM API
const handleSaveAs = async () => {
  if (sboms.length >= 3) return; // guard — button should also be disabled
  const nodes = graphRef.current?.getAllNodes() ?? [];
  const edges = graphRef.current?.getAllEdges() ?? [];
  const cycloneDX = convertGraphToCycloneDX(nodes, edges);
  const result = await uploadSBOM({
    name: `${loadedSBOM?.name ?? "Graph"} (edited)`,
    components: cycloneDX.components,
    metadata: cycloneDX.metadata,
  });
  if (result && !result.isDuplicate) {
    setLoadedSBOM(result.sbom);
    setIsDirty(false);
  }
};
```

### Pattern 4: isDirty Tracking

**What:** Set `isDirty = true` whenever graph is mutated after load.

The `SbomGraph` layout already has `setNewGraphData` called by `handleAddComponent`. The GraphVisualizer exposes an imperative ref. The cleanest approach is to mark dirty after any `setNewGraphData` call that is not a Load operation, and also intercept edits via a wrapper around `setNewGraphData`:

```jsx
const loadGraph = (graphData) => {
  setNewGraphData(graphData);
  setIsDirty(false); // explicit reset on load
};

const editGraph = (updater) => {
  setNewGraphData(updater);
  setIsDirty(true);
};
```

Replace existing `setNewGraphData(...)` calls:
- In `handleLoad` → use `loadGraph`
- In `handleAddComponent` and any other edit path → use `editGraph`

### Pattern 5: SBOMSelector Placement

**What:** Insert `SBOMSelector` + Load button between the page header `MDBox` and the main `Card`.

```jsx
// Between the existing page-header MDBox and the <Card>
<MDBox mb={2}>
  <SBOMSelector
    sboms={sboms}
    selectedId={selectedSBOM?.id ?? null}
    onSelect={(sbom) => setSelectedSBOM(sbom)}
    mode="single"
  />
  <MDBox display="flex" justifyContent="flex-end" mt={1}>
    <MDButton
      variant="gradient"
      color="info"
      size="small"
      disabled={!selectedSBOM}
      onClick={handleLoad}
    >
      Load
    </MDButton>
  </MDBox>
</MDBox>
```

### Pattern 6: Save / Save As Buttons in Toolbar Right Group

Add to the existing right group (`MDBox display="flex" alignItems="center" gap={1}`), after the Export button:

```jsx
<Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
<Tooltip title={!loadedSBOM ? "No SBOM loaded" : "Save changes to library"}>
  <span>  {/* span needed for Tooltip on disabled button */}
    <MDButton
      variant="gradient"
      color="success"
      size="small"
      startIcon={<Icon>save</Icon>}
      disabled={!loadedSBOM || !isDirty}
      onClick={handleSave}
    >
      Save
    </MDButton>
  </span>
</Tooltip>
<Tooltip title={sboms.length >= 3 ? "Library full (3 SBOMs max)" : "Save as new SBOM"}>
  <span>
    <MDButton
      variant="gradient"
      color="warning"
      size="small"
      startIcon={<Icon>save_as</Icon>}
      disabled={!loadedSBOM || sboms.length >= 3}
      onClick={handleSaveAs}
    >
      Save As
    </MDButton>
  </span>
</Tooltip>
```

### Pattern 7: Loaded SBOM Indicator in Status Bar

Show active SBOM name in the existing status bar (left side), replacing or prefixing the node/edge counts:

```jsx
// Status bar left side
<MDTypography variant="caption" color="text">
  {loadedSBOM ? `Loaded: ${loadedSBOM.name}${isDirty ? " *" : ""}  |  ` : ""}
  Nodes: {stats.nodes}&nbsp;&nbsp;|&nbsp;&nbsp;Edges: {stats.edges}
  &nbsp;&nbsp;|&nbsp;&nbsp;Depth: {stats.depth}
</MDTypography>
```

The `*` suffix is a universally understood "unsaved changes" indicator.

### Anti-Patterns to Avoid

- **Auto-loading on row click:** The CONTEXT.md explicitly locks "Load button required — no auto-load." Do not add `onSelect` → immediate graph render logic.
- **Calling `modifySBOM` with the full SBOM object:** `modifySBOM` takes `(id, updates)` — only pass the changed fields (`components`, `metadata`). Passing the whole SBOM object works but overwrites `id`, `createdAt`, `hash` unexpectedly.
- **Forgetting `<span>` wrapper on disabled MUI buttons inside `<Tooltip>`:** MUI Tooltip does not fire on disabled buttons unless the button is wrapped in a `<span>`. This is an established MUI gotcha.
- **Reading `getSBOM` return value as graph-ready data:** `getSBOM` returns the library SBOM object (`{ id, name, components, metadata, ... }`). It must be passed through `convertCycloneDXToGraph` before being set as `newGraphData`. The CycloneDX input to `convertCycloneDXToGraph` is the raw JSON shape `{ components, dependencies, metadata }`, not the library wrapper.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SBOM CRUD | Custom localStorage writes | `useSBOMLibrary` (`modifySBOM`, `uploadSBOM`) | Hash recomputation, state sync, error handling already implemented |
| Graph → CycloneDX conversion | Custom serializer | `convertGraphToCycloneDX` | Already handles `bom-ref`, `dependencies`, `metadata.component` correctly |
| CycloneDX → graph conversion | Custom parser | `convertCycloneDXToGraph` | Already handles lodash `_.get`, edge deduplication, primary node unshift |
| Duplicate detection on Save As | Custom hash check | `uploadSBOM` return value `isDuplicate` | Hash computation and duplicate lookup already implemented |
| SBOM limit check | Manual count | `sboms.length >= 3` from `useSBOMLibrary` | `sboms` is always up-to-date reactive state |

**Key insight:** This phase is entirely glue code. Every data operation has an existing, tested implementation. The risk is in the wiring — state sequencing and UI disable logic — not in the data layer.

---

## Common Pitfalls

### Pitfall 1: getSBOM Returns Library Wrapper, Not Raw CycloneDX

**What goes wrong:** Passing `getSBOM(id)` directly to `convertCycloneDXToGraph` — the library wrapper has `{ id, name, hash, components, metadata }`, while `convertCycloneDXToGraph` expects `{ components, dependencies, metadata }`. The `dependencies` field is missing, so edges are never generated.

**Why it happens:** The SBOM is stored in a library wrapper in localStorage. The graph converter expects the raw CycloneDX JSON shape.

**How to avoid:** When loading, either pass the raw CycloneDX fields directly or reconstruct the CycloneDX shape: `convertCycloneDXToGraph({ components: sbom.components, metadata: sbom.metadata, dependencies: sbom.dependencies })`.

**Warning signs:** Graph loads with nodes but zero edges.

### Pitfall 2: Save Overwrites Computed Fields

**What goes wrong:** Calling `modifySBOM(id, cycloneDX)` where `cycloneDX` is the full output of `convertGraphToCycloneDX`. The `updateSBOM` storage function merges updates, so extra keys are harmless, but `hash` will not be recomputed unless the storage layer explicitly recalculates it.

**Why it happens:** `modifySBOM` calls `updateSBOM` which does a spread merge. The hash stored in the library record will become stale after Save.

**How to avoid:** Check whether `updateSBOM` in `sbomStorage.js` recomputes the hash on update. If it does not, call `computeSBOMHash` and include `hash` in the updates passed to `modifySBOM`, or accept that the hash is stale (duplicate detection on re-upload would be wrong).

**Warning signs:** After Save + re-upload of the same file, duplicate detection does not trigger.

### Pitfall 3: isDirty Not Reset on Load

**What goes wrong:** User loads SBOM A, makes edits, loads SBOM B (confirmed), but `isDirty` remains `true` because `setIsDirty(false)` was not called inside `handleLoad` after graph is set.

**Why it happens:** Forgetting to reset `isDirty` in the load path.

**How to avoid:** The `loadGraph` wrapper pattern (Pattern 4) resets `isDirty` atomically with setting graph data.

### Pitfall 4: Tooltip on Disabled Button Has No Tooltip

**What goes wrong:** Wrapping a disabled `MDButton` (which is a disabled `<button>`) in MUI `Tooltip` — the tooltip never appears because pointer events are suppressed on disabled elements.

**How to avoid:** Wrap the `MDButton` in a `<span>` element before the `<Tooltip>` (Pattern 6 above). This is documented MUI behavior.

### Pitfall 5: Save As Triggers Duplicate Detection

**What goes wrong:** The edited graph content matches the original loaded SBOM's hash, so `uploadSBOM` returns `{ isDuplicate: true }` and no new SBOM is created.

**Why it happens:** If the user loads an SBOM, makes no edits, and clicks Save As, the content is identical and the hash matches.

**How to avoid:** Before calling `uploadSBOM`, inject a distinguishing field (following the Phase 2 `metadata.copyOf` pattern): add `metadata.copyOf = loadedSBOM.id` or `metadata.savedAt = new Date().toISOString()` to ensure a distinct hash. Handle the `isDuplicate` return case with a user-facing message.

---

## Code Examples

### Loading a Library SBOM into the Graph

```jsx
// Source: project codebase — mirrors handleImport pattern in sbom-graph/index.js
const handleLoad = () => {
  if (!selectedSBOM) return;
  if (isDirty) {
    const ok = window.confirm("You have unsaved changes. Load a new SBOM and discard them?");
    if (!ok) return;
  }
  const sbom = getSBOM(selectedSBOM.id);
  // Reconstruct CycloneDX shape — sbom is library wrapper, not raw CycloneDX
  const graphData = convertCycloneDXToGraph({
    components: sbom.components,
    metadata: sbom.metadata,
    dependencies: sbom.dependencies ?? [],
  });
  setNewGraphData(graphData);
  setLoadedSBOM(selectedSBOM);
  setIsDirty(false);
};
```

### Saving Back to Library (Overwrite)

```jsx
// Source: mirrors handleExport in sbom-graph/index.js + modifySBOM API from useSBOMLibrary
const handleSave = async () => {
  if (!loadedSBOM) return;
  const nodes = graphRef.current?.getAllNodes() ?? [];
  const edges = graphRef.current?.getAllEdges() ?? [];
  const cycloneDX = convertGraphToCycloneDX(nodes, edges);
  await modifySBOM(loadedSBOM.id, {
    components: cycloneDX.components ?? [],
    metadata: cycloneDX.metadata ?? {},
    dependencies: cycloneDX.dependencies ?? [],
  });
  setIsDirty(false);
};
```

### Save As New SBOM

```jsx
// Source: uploadSBOM API from useSBOMLibrary + metadata.copyOf pattern from Phase 2
const handleSaveAs = async () => {
  if (!loadedSBOM || sboms.length >= 3) return;
  const nodes = graphRef.current?.getAllNodes() ?? [];
  const edges = graphRef.current?.getAllEdges() ?? [];
  const cycloneDX = convertGraphToCycloneDX(nodes, edges);
  // Inject copyOf to ensure distinct hash (Phase 2 pattern)
  const metadata = {
    ...(cycloneDX.metadata ?? {}),
    copyOf: loadedSBOM.id,
  };
  const result = await uploadSBOM({
    name: `${loadedSBOM.name} (edited)`,
    components: cycloneDX.components ?? [],
    metadata,
    dependencies: cycloneDX.dependencies ?? [],
  });
  if (result?.isDuplicate) {
    // Edge case: content unchanged — inform user
    window.alert("No changes detected. Edit the graph before saving as a new SBOM.");
    return;
  }
  if (result?.sbom) {
    setLoadedSBOM(result.sbom);
    setIsDirty(false);
  }
};
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Import only from disk | Load from library via SBOMSelector | Library becomes the primary SBOM source |
| Export only to disk | Save back to library (overwrite or new) | Round-trip editing without file system |

**No deprecated approaches in this phase** — wiring uses existing stable project patterns throughout.

---

## Open Questions

1. **Does `updateSBOM` in `sbomStorage.js` recompute the hash?**
   - What we know: `modifySBOM` calls `updateSBOM(id, updates)` which does a spread merge and writes to localStorage.
   - What's unclear: Whether it recalculates `hash` from the new `components` + `metadata`.
   - Recommendation: Read `sbomStorage.js` at plan time and include a `computeSBOMHash` call in the Save handler if needed. If hash is stale, duplicate detection on future uploads of the same file will be wrong.

2. **Does `SBOMSelector` expose an `onSelect` prop that returns the full SBOM object or just the ID?**
   - What we know: `SBOMSelector` is used in the dashboard and was built in Phase 2 with single-select mode.
   - What's unclear: The exact prop signature for selection callback.
   - Recommendation: Read `src/components/SBOMSelector/index.js` at plan time to confirm callback shape before coding the Load handler.

3. **Does `useSBOMLibrary` need to be mounted at the layout level or can it be passed down?**
   - What we know: Dashboard mounts it at layout level. The graph layout does not currently use it.
   - Recommendation: Mount at layout level in `SbomGraph` (same pattern as dashboard) — this is the established convention.

---

## Sources

### Primary (HIGH confidence)
- `src/layouts/sbom-graph/index.js` — Full source read; all existing state, handlers, and toolbar structure confirmed
- `src/hooks/useSBOMLibrary.js` — Full source read; `modifySBOM`, `uploadSBOM`, `getSBOM` signatures confirmed
- `src/utils/parseInputSBOM.js` — Full source read; `convertCycloneDXToGraph` input shape and `convertGraphToCycloneDX` output shape confirmed
- `.planning/codebase/ARCHITECTURE.md` — Data flow, layer boundaries, error handling patterns confirmed
- `.planning/phases/03-graph-editor-integration/03-CONTEXT.md` — All locked decisions confirmed

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — Phase 2 decisions confirmed (window.confirm pattern, metadata.copyOf pattern)
- `.planning/REQUIREMENTS.md` — GRAPH-01/02/03 requirements confirmed

### Tertiary (LOW confidence)
- MUI Tooltip + disabled button `<span>` wrapper requirement — training knowledge; verify against MUI docs if tooltip behavior is unexpected

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are existing project code, read directly from source
- Architecture: HIGH — integration points confirmed by reading actual source files
- Pitfalls: HIGH (Pitfall 1-4) / MEDIUM (Pitfall 5) — Pitfalls 1-4 derived directly from reading source; Pitfall 5 is inferred from Phase 2 copyOf pattern

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable project; no external dependencies to track)
