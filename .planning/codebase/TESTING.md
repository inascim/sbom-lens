# Testing Patterns

**Analysis Date:** 2026-03-05

## Test Framework

**Runner:**
- Jest (via Create React App / `react-scripts`)
- No separate jest config file — configuration is embedded in `react-scripts`
- Config: built into `react-scripts test` (CRA defaults)

**Assertion Library:**
- Jest built-in (`expect`) + `@testing-library/react` (CRA default dependency)

**Run Commands:**
```bash
npm test              # Run tests in watch mode (CRA default)
npm test -- --watchAll=false   # Run once (CI mode)
npm test -- --coverage         # Run with coverage report
```

## Test File Organization

**Current State:**
- **No test files exist in this codebase.** No `.test.js`, `.spec.js`, `.test.jsx`, or `.spec.jsx` files were found anywhere in `src/`.
- CRA is configured with `react-app/jest` in `eslintConfig` (in `package.json`), meaning the test infrastructure is present but unused.
- `@testing-library` packages are available via `react-scripts` but not explicitly in `devDependencies`.

**Location (when tests are added):**
- CRA convention: co-locate test files alongside the source file being tested
- Pattern: `src/utils/sbomStorage.test.js` next to `src/utils/sbomStorage.js`
- Alternative: `src/__tests__/` directory for integration-level tests

**Naming (when tests are added):**
- Unit tests: `[FileName].test.js`
- Component tests: `[ComponentName].test.js`

## Test Structure

**No existing tests to document.**

When tests are added, the standard CRA + React Testing Library structure should be used:

```js
import { render, screen, fireEvent } from "@testing-library/react";
import ComponentName from "./ComponentName";

describe("ComponentName", () => {
  it("renders correctly", () => {
    render(<ComponentName />);
    expect(screen.getByText("Expected text")).toBeInTheDocument();
  });

  it("handles user interaction", () => {
    const mockFn = jest.fn();
    render(<ComponentName onAction={mockFn} />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockFn).toHaveBeenCalled();
  });
});
```

## Mocking

**Framework:** Jest built-in mocks

**No existing mock patterns in codebase.** The following mocks will be required when tests are written:

**localStorage** (used by `src/utils/sbomStorage.js`, `src/hooks/useVulnerabilities.js`, `src/layouts/sbom-vulnerabilities/hooks/useVulnerabilityData.js`):
```js
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value; }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });
```

**window.crypto.subtle** (used by `src/utils/sbomStorage.js` for SHA-256 hashing):
- `computeSBOMHash` already handles Node/Jest environment via the `crypto` module fallback branch:
  ```js
  } else {
    // Node environment for testing
    return Promise.resolve(crypto.createHash("sha256").update(stableString).digest("hex"));
  }
  ```
- No mock needed for `computeSBOMHash` in Jest (it auto-detects the environment).

**fetch** (used by `src/utils/vulnerabilityAPI.js` for NVD, GitHub, OSV APIs):
```js
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ /* mock response */ }),
  })
);
```

**What to Mock:**
- `localStorage` for all storage layer tests
- `fetch` for `src/utils/vulnerabilityAPI.js` tests
- `window.confirm` for tests of `clearAll` in hooks (uses `window.confirm`)
- `uuid` if deterministic IDs are needed: `jest.mock("uuid", () => ({ v4: () => "test-uuid" }))`

**What NOT to Mock:**
- Internal utility functions under test
- React state and hooks (test through component behavior)
- `computeSBOMHash` (Node crypto fallback handles Jest automatically)

## Fixtures and Factories

**No test fixtures or factories exist in the codebase.**

When added, suggested fixture patterns based on existing data structures:

```js
// Suggested: src/__tests__/fixtures/sbom.js
export const mockSBOM = {
  id: "test-sbom-id",
  name: "Test SBOM",
  createdAt: "2026-01-01T00:00:00.000Z",
  modifiedAt: "2026-01-01T00:00:00.000Z",
  hash: "abc123",
  components: [
    {
      purl: "pkg:npm/react@18.2.0",
      name: "react",
      version: "18.2.0",
      type: "library",
    },
  ],
  metadata: {},
};

// Suggested: src/__tests__/fixtures/vulnerability.js
export const mockVulnerability = {
  id: "test-vuln-id",
  cveId: "CVE-2021-44228",
  component: "log4j-core",
  severity: "CRITICAL",
  status: "NOT_STARTED",
  patchAvailable: true,
  publishedDate: "2021-12-09T00:00:00.000Z",
  lastUpdated: "2026-01-01T00:00:00.000Z",
  source: "MANUAL",
  notes: "",
  timeline: [],
};
```

**Location:** Place fixtures in `src/__tests__/fixtures/` or co-locate with test files.

## Coverage

**Requirements:** None enforced. No coverage thresholds configured.

**View Coverage:**
```bash
npm test -- --coverage
```

Coverage report outputs to `coverage/` directory (gitignored by CRA default).

## Test Types

**Unit Tests:**
- Not yet written. Primary candidates:
  - `src/utils/sbomStorage.js` — pure storage operations, easy to test with localStorage mock
  - `src/utils/vulnerabilityAPI.js` — API mapping functions (`normalizeSeverity`, `generatePURL`) are pure and immediately testable
  - `src/utils/parseInputSBOM.js` — `convertCycloneDXToGraph` and `convertGraphToCycloneDX` are pure functions requiring no mocks
  - `src/utils/graphUtils.js` — utility functions

**Integration Tests:**
- Not yet written. Primary candidates:
  - `src/hooks/useSBOMLibrary.js` — hook + storage layer integration
  - `src/hooks/useVulnerabilities.js` — hook + localStorage integration
  - `src/layouts/sbom-vulnerabilities/hooks/useVulnerabilityData.js`

**E2E Tests:**
- Not used. No Cypress, Playwright, or similar framework is installed.

## Common Patterns

**Note:** Since no tests exist, the following are recommended patterns derived from the codebase's actual structure.

**Async Testing (for hooks using useEffect + localStorage):**
```js
import { renderHook, act } from "@testing-library/react";
import { useSBOMLibrary } from "hooks/useSBOMLibrary";

it("loads SBOMs from storage on mount", async () => {
  // Pre-populate storage
  localStorage.setItem("sbom_library", JSON.stringify([mockSBOM]));

  const { result } = renderHook(() => useSBOMLibrary());

  // Wait for useEffect to complete
  await act(async () => {});

  expect(result.current.sboms).toHaveLength(1);
  expect(result.current.loading).toBe(false);
});
```

**Testing pure utility functions (no async needed):**
```js
import { normalizeSeverity, generatePURL } from "utils/vulnerabilityAPI";

describe("normalizeSeverity", () => {
  it("returns CRITICAL for critical input", () => {
    expect(normalizeSeverity("CRITICAL")).toBe("CRITICAL");
  });
  it("returns LOW as fallback for null", () => {
    expect(normalizeSeverity(null)).toBe("LOW");
  });
});
```

**Error Testing:**
```js
it("handles invalid JSON in localStorage gracefully", () => {
  localStorage.getItem.mockReturnValue("not-valid-json");
  const result = getAllSBOMs();
  expect(result).toEqual([]);
});
```

## Key Testable Units (Prioritized)

High value, low effort targets based on codebase analysis:

1. `src/utils/parseInputSBOM.js` — pure functions, no dependencies
2. `src/utils/vulnerabilityAPI.js` — `normalizeSeverity` and `generatePURL` are pure; API functions need fetch mock
3. `src/utils/sbomStorage.js` — all functions testable with localStorage mock
4. `src/components/SBOMUploader/index.js` — file validation logic (`parseCycloneDXFile`) is extractable and testable
5. `src/components/SBOMSelector/index.js` — selection mode logic is straightforward to test with RTL

---

*Testing analysis: 2026-03-05*
