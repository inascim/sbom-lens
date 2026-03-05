# Codebase Concerns

**Analysis Date:** 2026-03-05

## Tech Debt

**Duplicated Vulnerability Hook:**
- Issue: Two separate, non-integrated hooks manage the same `sbom_vulnerabilities` localStorage key with divergent data schemas. `src/hooks/useVulnerabilities.js` uses a PURL-based schema with `purl` field; `src/layouts/sbom-vulnerabilities/hooks/useVulnerabilityData.js` uses a component-name-based schema with `component` field. The active UI page (`sbom-vulnerabilities/index.js`) uses only the local hook, making the global hook in `src/hooks/` dead code.
- Files: `src/hooks/useVulnerabilities.js`, `src/layouts/sbom-vulnerabilities/hooks/useVulnerabilityData.js`, `src/layouts/sbom-vulnerabilities/index.js`
- Impact: Both hooks write to the same localStorage key (`sbom_vulnerabilities`) but with incompatible shapes, causing silent data corruption if both are ever used simultaneously. The global hook's features (PURL-based lookups, `getVulnerabilitiesForPURLs`) are inaccessible from the current UI.
- Fix approach: Decide on one canonical hook; unify the data schema; delete the dead hook.

**`useSBOMLibrary` Hook Unused in Production UI:**
- Issue: `src/hooks/useSBOMLibrary.js` is a fully implemented hook for SBOM library management with upload, duplicate detection, and delete operations. It is not imported by any current layout or page component. The SBOMUploader and SBOMSelector components exist but are not wired into any routed page.
- Files: `src/hooks/useSBOMLibrary.js`, `src/components/SBOMUploader/index.js`, `src/components/SBOMSelector/index.js`
- Impact: Completed work is unreachable from the application. Users have no way to build an SBOM library from the UI, even though the storage layer is ready.
- Fix approach: Create an SBOM Library page that mounts `useSBOMLibrary`, renders `SBOMSelector` and `SBOMUploader`, and registers a route in `src/routes.js`.

**Hard-Coded `localStorage` Data Source:**
- Issue: `src/config/dataSource.js` exports `DATA_SOURCE = "localStorage"` as a string constant. Every hook contains `if (DATA_SOURCE === "localStorage") { ... } else { // TODO: API call here }` branches that are permanently dead. The `else` branches across `src/hooks/useSBOMLibrary.js` and `src/hooks/useVulnerabilities.js` stub out API paths that have never been implemented.
- Files: `src/config/dataSource.js`, `src/hooks/useSBOMLibrary.js`, `src/hooks/useVulnerabilities.js`
- Impact: Any migration to a real backend requires touching every hook individually and all the stubs will need to be replaced at once. The branching adds cognitive overhead now for zero value.
- Fix approach: Remove the `DATA_SOURCE` conditional branches and the `else` stubs; implement API calls directly if and when a backend exists.

**`vulnerabilityAPI.js` Utilities Entirely Unused:**
- Issue: `src/utils/vulnerabilityAPI.js` implements `fetchFromNVD`, `fetchFromGitHub`, `fetchFromOSV`, `fetchFromMultipleSources`, and `normalizeSeverity`. None of these functions are imported anywhere in the codebase.
- Files: `src/utils/vulnerabilityAPI.js`
- Impact: Dead code adds surface area to maintain and creates false confidence that vulnerability data is being fetched from live sources. The NVD endpoint used is v1.0, which was sunset — it will not work.
- Fix approach: Either wire these utilities into the vulnerability workflow or delete them. If kept, update the NVD endpoint to API 2.0 (`/rest/json/cves/2.0`).

**`src/utils/graphUtils.js` `bfsTraverse` Unused:**
- Issue: `bfsTraverse` in `src/utils/graphUtils.js` expects `nodes` and `edges` as keyed objects (`nodes[nodeID]`, `edges` as an object iterable), but Cytoscape stores elements internally. This function is not imported anywhere and its expected data shape does not match what the graph layer produces.
- Files: `src/utils/graphUtils.js`
- Impact: Dead utility with an incompatible interface. Cannot be dropped in without an adapter.
- Fix approach: Delete if not planned for use, or rewrite to accept Cytoscape element collections.

**Template-Origin Pages Still Routed:**
- Issue: `src/layouts/dashboard`, `src/layouts/billing`, `src/layouts/tables`, `src/layouts/notifications`, `src/layouts/profile`, `src/layouts/rtl` are all unchanged Material Dashboard 2 React template pages containing hardcoded dummy data ("Bookings: 281", credit card numbers, random user profiles). They are registered in `src/routes.js` and appear in the sidenav.
- Files: `src/routes.js`, `src/layouts/dashboard/index.js`, `src/layouts/billing/index.js`, `src/layouts/tables/index.js`, `src/layouts/rtl/index.js`, `src/layouts/notifications/index.js`, `src/layouts/profile/index.js`
- Impact: Users see irrelevant demo content (bookings, invoices, fake profiles). The Sign In / Sign Up pages are also routed but have no actual authentication logic.
- Fix approach: Remove template-only routes from `src/routes.js` and sidenav; replace dashboard with an SBOM-specific landing page.

**`getStats` Mutates State Array:**
- Issue: In `src/hooks/useSBOMLibrary.js`, the `getStats` callback calls `sboms.sort(...)` directly on the `sboms` state array inside a `useCallback`. `Array.prototype.sort` mutates in place, which can cause unexpected re-renders or stale ordering bugs.
- Files: `src/hooks/useSBOMLibrary.js` (line ~147)
- Impact: Subtle mutation bug. `sboms` state array is sorted as a side effect each time `getStats` is called.
- Fix approach: Replace `sboms.sort(...)` with `[...sboms].sort(...)`.

**SBOM Limit Hard-Coded at 3:**
- Issue: `src/utils/sbomStorage.js` enforces `MAX_SBOMS = 3` with no configuration path.
- Files: `src/utils/sbomStorage.js`
- Impact: Artificially limits the tool for any realistic use case. Must be changed in source code to increase.
- Fix approach: Expose the limit via an environment variable or config value; document the reasoning for the limit.

## Known Bugs

**`computeSBOMHash` Returns a Promise But Callers Don't Always Await It Consistently:**
- Symptoms: The function in `src/utils/sbomStorage.js` always returns a `Promise` (both browser and Node paths return promises). `createSBOM` and `updateSBOM` correctly `await` it. `useSBOMLibrary.uploadSBOM` also `await`s a separate call before passing to `createSBOM` (which then hashes again), producing two hash computations per upload.
- Files: `src/utils/sbomStorage.js`, `src/hooks/useSBOMLibrary.js`
- Trigger: Every SBOM upload runs the hash twice.
- Workaround: Duplicate hashing has no visible bug, but is wasteful.

**NVD API Endpoint is Deprecated (v1.0):**
- Symptoms: `fetchFromNVD` in `src/utils/vulnerabilityAPI.js` calls `https://services.nvd.nist.gov/rest/json/cves/1.0`, which NIST retired in 2023. Any call to this endpoint will receive an error or empty response.
- Files: `src/utils/vulnerabilityAPI.js` (line 23)
- Trigger: Would occur when `fetchFromNVD` is called with a valid API key.
- Workaround: The function is not currently called from anywhere in the UI.

**GitHub GraphQL Query Does Not Filter by Package Name:**
- Symptoms: `fetchFromGitHub` in `src/utils/vulnerabilityAPI.js` fetches the first 10 security advisories globally, ignoring the `packageName` parameter entirely. The query has no filter variable tied to the package.
- Files: `src/utils/vulnerabilityAPI.js` (lines 67-82)
- Trigger: Would surface as unrelated advisories being returned for any component lookup.
- Workaround: The function is not currently called from anywhere in the UI.

**Graph Import Does Not Validate Non-CycloneDX Files:**
- Symptoms: `handleImport` in `src/layouts/sbom-graph/index.js` only checks that the file extension is `.json`. Any valid JSON that is not CycloneDX (missing `components` and `dependencies`) will silently produce an empty graph.
- Files: `src/layouts/sbom-graph/index.js` (lines 53-68)
- Trigger: Upload a JSON file that is not a CycloneDX SBOM.
- Workaround: None — the error is swallowed with `console.error`.

**`handleAddComponent` Generates Colliding IDs:**
- Symptoms: In `src/layouts/sbom-graph/index.js`, new node IDs are generated as `component-${nodeCount}` where `nodeCount = allNodes.length + 1`. If a node has been deleted before adding a new one, the count can collide with an existing node ID.
- Files: `src/layouts/sbom-graph/index.js` (lines 85-88)
- Trigger: Delete a node, then add a new component.
- Workaround: None. The new node silently fails to add or corrupts the existing node's data.

**`window.confirm` Used for Destructive Action:**
- Symptoms: `clearAll` in both `src/hooks/useVulnerabilities.js` (line 223) and `src/layouts/sbom-vulnerabilities/hooks/useVulnerabilityData.js` (line 81) call `window.confirm(...)` directly. This is blocked in certain browser contexts (iframes, some sandboxed environments) and is not unit-testable.
- Files: `src/hooks/useVulnerabilities.js`, `src/layouts/sbom-vulnerabilities/hooks/useVulnerabilityData.js`
- Trigger: Click "Clear All" button.
- Workaround: Always works in standard browser contexts, but breaks in embedded or tested contexts.

**`VulnerabilityTable` Sorting Uses Variable Named `sortedAndSortedVulnerabilities`:**
- Symptoms: The `useMemo` variable in `src/layouts/sbom-vulnerabilities/components/VulnerabilityTable.js` (line 66) is named `sortedAndSortedVulnerabilities`, indicating a copy-paste error (formerly had a separate filter step). Functionally does not cause a bug but suggests the filtering was removed mid-refactor.
- Files: `src/layouts/sbom-vulnerabilities/components/VulnerabilityTable.js`
- Trigger: Always visible in code.

## Security Considerations

**All Data Stored in Unencrypted localStorage:**
- Risk: SBOM data (full component lists, versions, dependency graphs) and vulnerability records are stored in `localStorage` without encryption. Any JavaScript on the page can access this data, and it persists indefinitely across sessions.
- Files: `src/utils/sbomStorage.js`, `src/hooks/useVulnerabilities.js`, `src/layouts/sbom-vulnerabilities/hooks/useVulnerabilityData.js`
- Current mitigation: None. SBOMs and vulnerabilities may contain sensitive supply chain information.
- Recommendations: Move to session storage for ephemeral data; implement a backend with authenticated API access for persistent storage; consider encryption at rest for sensitive SBOM content.

**No Authentication Guard on Any Route:**
- Risk: All routes including vulnerability and SBOM data pages are accessible without any authentication. The Sign In / Sign Up pages exist but implement no auth logic and are not enforced as guards.
- Files: `src/routes.js`, `src/layouts/authentication/sign-in/index.js`, `src/layouts/authentication/sign-up/index.js`
- Current mitigation: None.
- Recommendations: Add route guards that redirect unauthenticated users; implement actual auth (at minimum, a session token check) before the app is used beyond local development.

**SBOM File Parsing Trusts Arbitrary JSON Input:**
- Risk: `parseCycloneDXFile` in `src/components/SBOMUploader/index.js` spreads the entire parsed component object (`...comp`) into storage without sanitization. A maliciously crafted SBOM could inject prototype-polluting keys or oversized payloads.
- Files: `src/components/SBOMUploader/index.js` (lines 51-60)
- Current mitigation: File type check is extension-only (`.json`); no schema validation is performed.
- Recommendations: Validate against the CycloneDX JSON schema before storing; strip unexpected keys; enforce payload size limits.

**Graph Import Injects Unsanitized Data into Cytoscape:**
- Risk: `handleImport` in `src/layouts/sbom-graph/index.js` passes parsed JSON directly to `convertCycloneDXToGraph`, then into Cytoscape's `node.data()`. Cytoscape renders node labels from `data(name)` — a crafted SBOM with HTML/script content in component names could cause display issues depending on Cytoscape's rendering context.
- Files: `src/layouts/sbom-graph/index.js`, `src/utils/parseInputSBOM.js`
- Current mitigation: Cytoscape renders labels as canvas text by default (not HTML), which reduces XSS risk.
- Recommendations: Explicitly sanitize label strings before injecting into Cytoscape data.

**API Keys Passed Through Function Parameters Without Storage Strategy:**
- Risk: `fetchFromNVD` and `fetchFromGitHub` in `src/utils/vulnerabilityAPI.js` accept API keys as function arguments. There is no defined strategy for where these keys come from — if users type them into UI fields, they will likely be stored in React state or localStorage, exposing them to any JS on the page.
- Files: `src/utils/vulnerabilityAPI.js`
- Current mitigation: Functions are not called from any UI yet.
- Recommendations: Document that keys must be stored in environment variables (`REACT_APP_*`) only; never accept API keys via user-facing input fields.

## Performance Bottlenecks

**SBOM Hash Computed Twice Per Upload:**
- Problem: `useSBOMLibrary.uploadSBOM` calls `computeSBOMHash` once for duplicate detection, then passes `sbomData` to `createSBOM` which calls `computeSBOMHash` again internally.
- Files: `src/hooks/useSBOMLibrary.js` (lines 75-91), `src/utils/sbomStorage.js` (lines 97-101)
- Cause: `createSBOM` always recomputes the hash regardless of whether one was already computed by the caller.
- Improvement path: Accept an optional pre-computed hash in `createSBOM` and skip recomputation if provided.

**Cytoscape `getStats` Depth Calculation is O(n) Per Node:**
- Problem: `getStats` in `src/layouts/sbom-graph/components/GraphVisualizer.js` (lines 208-213) calls `node.ancestors().nodes().length` for every node to find max depth. For a graph with 500+ nodes, this runs an ancestor traversal for each node.
- Files: `src/layouts/sbom-graph/components/GraphVisualizer.js`
- Cause: No caching or smarter tree depth algorithm.
- Improvement path: Compute depth once using a BFS/DFS from root nodes and cache the result; update only when graph topology changes.

**Zoom State Uses `setTimeout` as a Proxy for Animation Completion:**
- Problem: `handleZoomIn`, `handleZoomOut`, and `handleFitToView` in `src/layouts/sbom-graph/index.js` use `setTimeout(..., 50)` to read zoom after the operation, relying on timing rather than a Cytoscape event.
- Files: `src/layouts/sbom-graph/index.js` (lines 38-50)
- Cause: Cytoscape's zoom operations are synchronous but the zoom display needs to lag slightly to pick up the updated value after Cytoscape's internal state settles.
- Improvement path: Listen to Cytoscape's `zoom` event to reactively update the displayed zoom level.

## Fragile Areas

**GraphVisualizer Cytoscape Initialization:**
- Files: `src/layouts/sbom-graph/components/GraphVisualizer.js`
- Why fragile: Cytoscape is initialized in a `useEffect` with `[]` deps and stored in a `useRef`. The `clearGraphWithAnimation` and removal functions use `setTimeout` to mutate the Cytoscape instance after animations. If the component unmounts during the 500ms animation window, `cyRef.current` will be referenced after unmount, causing a silent crash.
- Safe modification: Always check `cyRef.current` and that the component is still mounted before calling `.remove()` inside `setTimeout`; add a cleanup flag or `AbortController`.
- Test coverage: No tests exist for the graph visualizer.

**`keydown` Event Listener Added Without Cleanup:**
- Files: `src/layouts/sbom-graph/components/GraphVisualizer.js` (line 281)
- Why fragile: `document.addEventListener("keydown", ...)` is added inside the Cytoscape init `useEffect` but the listener is never removed on unmount (no `return () => document.removeEventListener(...)`). Each navigation away from and back to the graph page adds another listener.
- Safe modification: Add a cleanup function in the `useEffect` return that calls `document.removeEventListener` with the exact same handler reference.
- Test coverage: None.

**localStorage Silently Fails on Quota Exceeded:**
- Files: `src/utils/sbomStorage.js`, `src/hooks/useVulnerabilities.js`
- Why fragile: `localStorage.setItem` can throw a `QuotaExceededError` when storage is full. `saveVulnerabilities` in `src/layouts/sbom-vulnerabilities/hooks/useVulnerabilityData.js` calls `localStorage.setItem` inside a `useEffect` with no try/catch. Large SBOMs with many components will silently fail to persist.
- Safe modification: Wrap `localStorage.setItem` calls in try/catch and surface the error to the user.
- Test coverage: None.

**`SBOMUploader` `duplicateDialog` State is Set but Never Rendered:**
- Files: `src/components/SBOMUploader/index.js` (line 33)
- Why fragile: `const [duplicateDialog, setDuplicateDialog] = useState(null)` is declared but `setDuplicateDialog` is never called and `duplicateDialog` is never rendered. The duplicate detection dialog that was planned (referenced in the JSDoc comment) was never completed.
- Safe modification: Either remove the dead state or implement the duplicate confirmation dialog.
- Test coverage: None.

## Scaling Limits

**localStorage SBOM Storage:**
- Current capacity: 5MB typical browser localStorage limit.
- Limit: A large CycloneDX SBOM with thousands of components (common for container images) can easily exceed 1-2MB per file. With the 3-SBOM limit, the storage ceiling is effectively reached quickly.
- Scaling path: Move storage to IndexedDB for larger capacity, or implement a backend API.

**In-Memory Vulnerability List:**
- Current capacity: All vulnerabilities are loaded into React state on mount from localStorage.
- Limit: Hundreds of vulnerabilities (each with a `timeline` array) begin to affect sort and filter performance as all processing is done in-memory on every render cycle.
- Scaling path: Add server-side pagination and filtering when an API backend is implemented.

## Dependencies at Risk

**`react-scripts` 5.0.1 (Create React App):**
- Risk: Create React App is officially unmaintained as of 2023. `react-scripts` 5.0.1 bundles Webpack 5 with known security advisories in transitive dependencies. No upgrade path exists within CRA.
- Impact: Build tooling will not receive security updates; npm audit will report vulnerabilities in the build pipeline.
- Migration plan: Migrate to Vite or Next.js; this is a significant but well-documented migration.

**`react-table` 7.8.0:**
- Risk: `react-table` v7 is a deprecated major version; the library was rebranded and redesigned as TanStack Table v8 with a breaking API. v7 receives no security patches.
- Impact: Table components (`src/layouts/tables/index.js`) use a maintenance-mode library.
- Migration plan: Replace with TanStack Table v8 or MUI DataGrid where tables are used.

**`lodash` 4.17.23 (minor version bump):**
- Risk: `package.json` specifies `^4.17.23` but the published latest is `4.17.21`. This version does not exist on npm, which may cause install failures or fallback to `4.17.21`.
- Impact: `npm install` may warn or fail on fresh installs.
- Migration plan: Correct the version pin to `^4.17.21`; audit lodash usage and consider replacing specific functions with native equivalents.

**`uuid` 13.0.0:**
- Risk: `package.json` specifies `^13.0.0`. As of early 2026, the latest stable uuid release is v9.x. Version 13 does not exist as a stable release, suggesting this is a typo or incorrect pinning.
- Impact: `npm install` will fail or resolve to an unexpected version. If `node_modules` was installed with an incorrect resolution, runtime behavior may differ from the intended API.
- Migration plan: Correct the version to `^9.0.0` or the actual current stable version; verify that `uuidv4` import still works.

## Missing Critical Features

**No SBOM Library UI:**
- Problem: The storage layer (`src/utils/sbomStorage.js`), the management hook (`src/hooks/useSBOMLibrary.js`), the uploader component (`src/components/SBOMUploader/index.js`), and the selector component (`src/components/SBOMSelector/index.js`) are all implemented but not connected to any routed page.
- Blocks: Users cannot upload, list, or manage SBOMs from the application UI.

**No Vulnerability-to-SBOM Linkage:**
- Problem: The vulnerability data schema in the active hook (`useVulnerabilityData`) stores vulnerabilities by component name string, not by PURL or SBOM reference. There is no way to determine which uploaded SBOM a vulnerability belongs to.
- Blocks: Cross-SBOM vulnerability analysis; linking the graph page and vulnerability page.

**No Authentication:**
- Problem: Sign In and Sign Up pages exist with no backend integration and no route protection.
- Blocks: Multi-user use; any production deployment.

## Test Coverage Gaps

**Zero Test Files Exist:**
- What's not tested: The entire application — all storage utilities, hooks, parsers, and UI components.
- Files: All files in `src/`
- Risk: Any refactoring, especially of the storage layer or the duplicated hooks, can introduce regressions with no automated safety net.
- Priority: High. Start with `src/utils/sbomStorage.js`, `src/utils/parseInputSBOM.js`, and the two vulnerability hooks as they contain the most logic and the most known bugs.

---

*Concerns audit: 2026-03-05*
