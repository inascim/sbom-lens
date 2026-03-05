# External Integrations

**Analysis Date:** 2026-03-05

## APIs & External Services

**Vulnerability Databases:**
All integrations live in `src/utils/vulnerabilityAPI.js`. None are active by default - they are called only when triggered and API keys provided at call time.

- **OSV (Open Source Vulnerabilities)** - Free, no auth required
  - Endpoint: `https://api.osv.dev/v1/query` (POST)
  - Auth: None
  - Input: Package URL (PURL) format
  - Function: `fetchFromOSV(purl)`

- **NVD (National Vulnerability Database)** - Requires API key
  - Endpoint: `https://services.nvd.nist.gov/rest/json/cves/1.0` (GET)
  - Auth: `api-key` request header
  - API Key Source: Passed at call time (not stored); no env var wiring yet
  - API Version: NVD API v1.0
  - Function: `fetchFromNVD(keyword, apiKey)`

- **GitHub Advisory Database** - Requires personal access token
  - Endpoint: `https://api.github.com/graphql` (POST, GraphQL)
  - Auth: `Authorization: Bearer <token>` header
  - Token Source: Passed at call time; no env var wiring yet
  - Function: `fetchFromGitHub(packageName, githubToken)`

**Batch fetching:** `fetchFromMultipleSources(components, apiKeys)` in `src/utils/vulnerabilityAPI.js` calls all three sources in parallel via `Promise.allSettled`.

## Data Storage

**Databases:**
- None - No external database is used

**Client-Side Persistence:**
- Browser `localStorage` is the only data store
  - SBOM records: key `sbom_library` (max 3 SBOMs enforced in `src/utils/sbomStorage.js`)
  - Vulnerability records: key `sbom_vulnerabilities` (`src/hooks/useVulnerabilities.js`)
  - Data abstraction: `src/config/dataSource.js` controls `DATA_SOURCE = "localStorage"` flag; all hooks check this before deciding to use localStorage or a (not yet implemented) API

**Future API Configuration (stubbed, not active):**
- GraphQL endpoint placeholder: `process.env.REACT_APP_API_URL || "http://localhost:4000/graphql"`
- Defined in `src/config/dataSource.js` as `API_CONFIG`
- Hooks contain `// TODO: API call here` placeholders in `src/hooks/useSBOMLibrary.js` and `src/hooks/useVulnerabilities.js`

**File Storage:**
- Local filesystem only - users upload SBOM files directly in browser; files are parsed client-side and stored in localStorage

**Caching:**
- None beyond localStorage persistence

## Authentication & Identity

**Auth Provider:**
- None active - Sign-in/sign-up routes exist (`src/layouts/authentication/sign-in/`, `src/layouts/authentication/sign-up/`) but appear to be template stubs from Material Dashboard
- No auth context, JWT handling, or session management implemented
- Vulnerability records hardcode `user: "Current User"` with a `// TODO: Get from auth context` comment in `src/hooks/useVulnerabilities.js`

## Monitoring & Observability

**Error Tracking:**
- None - No Sentry, Datadog, or similar integrated

**Logs:**
- `console.error` and `console.warn` used throughout `src/utils/sbomStorage.js`, `src/hooks/useSBOMLibrary.js`, `src/hooks/useVulnerabilities.js`, `src/utils/vulnerabilityAPI.js`
- No structured logging framework

## CI/CD & Deployment

**Hosting:**
- Genezio - Frontend-only CDN deployment
- Config: `genezio.yaml` at project root
- Build: `npm run build` → publishes `./build/` directory
- Region: `us-east-1`
- Project name in Genezio: `material-dashboard-react`

**CI Pipeline:**
- None detected - no `.github/workflows/`, `.gitlab-ci.yml`, or similar

## Environment Configuration

**Required env vars:**
- None currently required (app runs entirely on localStorage with no env vars needed)

**Optional env vars:**
- `REACT_APP_API_URL` - Future backend GraphQL endpoint (not active; stubbed in `src/config/dataSource.js`)

**Secrets location:**
- No secrets stored in repository
- NVD API key and GitHub token are passed at runtime by the user through the UI (not stored in env or config)

## Webhooks & Callbacks

**Incoming:**
- None - frontend-only application with no server

**Outgoing:**
- None - vulnerability API calls are user-initiated fetches, not webhooks

## SBOM Format Support

The application parses and exports CycloneDX format:
- `src/utils/parseInputSBOM.js` - Converts CycloneDX JSON to internal graph format (`convertCycloneDXToGraph`) and back (`convertGraphToCycloneDX`)
- Supported spec version on export: CycloneDX 1.6
- Component identification uses PURL (Package URL) standard throughout

---

*Integration audit: 2026-03-05*
