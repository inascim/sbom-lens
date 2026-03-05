# SBOM Lens

A comprehensive Software Bill of Materials (SBOM) analysis and vulnerability management portal built with React and Material-UI.

## Overview

SBOM Lens is a modern web application designed to help organizations ingest, visualize, and analyze Software Bill of Materials (SBOM) data. It provides interactive graph visualization for dependency analysis and integrated vulnerability management with multi-source threat intelligence.

### Key Features

- **📊 Interactive SBOM Graph Visualization**
  - Cytoscape.js-based interactive dependency graph
  - Multiple layout algorithms (breadth-first, concentric, force-directed)
  - Zoom controls and fit-to-view functionality
  - Drag-and-drop component management
  - Dynamic node creation and relationship mapping

- **🔒 Vulnerability Management**
  - Comprehensive vulnerability tracking dashboard
  - Dual visualization modes (stacked bar chart + donut chart)
  - Sortable, filterable, paginated vulnerability table
  - Manual vulnerability entry with validation
  - Remediation status tracking
  - Inline status updates and deletion
  - Timeline-based audit trail for changes

- **🔗 Multi-Source Vulnerability Data Integration**
  - NVD (National Vulnerability Database) API support
  - GitHub Security Advisories integration
  - OSV (Open Source Vulnerabilities) free API
  - Batch vulnerability import and synchronization
  - Vulnerability normalization across sources

- **📈 Data Management**
  - SBOM import/export in CycloneDX JSON format
  - Vulnerability report generation
  - Local data persistence via browser localStorage
  - Vulnerability timeline tracking with status history

## Getting Started

### Prerequisites

- Node.js 14+ and npm
- Modern web browser with ES6+ support

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd sbom-lens

# Install dependencies
npm install

# Start the development server
npm start
```

The application will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

## Project Structure

```
sbom-lens/
├── src/
│   ├── components/              # Reusable UI components (MDBox, MDButton, etc.)
│   ├── examples/                # Complex component examples (Sidenav, etc.)
│   ├── layouts/                 # Page layouts
│   │   ├── sbom-graph/         # SBOM visualization page
│   │   ├── sbom-vulnerabilities/# Vulnerability management page
│   │   └── ...
│   ├── hooks/                   # Custom React hooks
│   ├── utils/                   # Utility functions
│   ├── context/                 # React context providers
│   ├── assets/                  # Images, themes, styles
│   ├── App.js                  # Main app component
│   ├── routes.js               # Route definitions
│   └── index.js                # Entry point
├── public/                      # Static files
├── package.json                 # Project dependencies
└── README.md                    # This file
```

## Usage Guide

### SBOM Graph Page

1. **View Dependency Graph**: The graph visualization displays all components and their relationships
2. **Zoom Controls**: Use zoom in/out buttons or scroll wheel to navigate
3. **Add Components**: Click the "+" button to create new component nodes
4. **Clear Graph**: Clear button removes all nodes and edges
5. **Import SBOM**: Import existing CycloneDX JSON files
6. **Export SBOM**: Export current graph state as CycloneDX JSON
7. **Layout Types**: Switch between different graph layout algorithms from the toolbar

### Vulnerabilities Page

1. **View Vulnerabilities**: Interactive dashboard showing all tracked vulnerabilities
2. **Change Chart View**: Toggle between stacked bar chart and donut chart visualizations
3. **Filter by Severity**: Filter vulnerabilities by CRITICAL, HIGH, MEDIUM, or LOW
4. **Filter by Status**: Filter by NOT_STARTED, IN_PROGRESS, or REMEDIATED
5. **Add Vulnerability**: Click "+" to manually submit a new vulnerability
6. **Edit Status**: Click on the status dropdown in any table row to update remediation status
7. **Delete Entry**: Click the delete icon to remove a vulnerability entry
8. **Export Report**: Generate and download a JSON vulnerability report
9. **View Details**: Click CVE IDs to view full details on the National Vulnerability Database

## Technology Stack

- **Frontend Framework**: React 18.2.0
- **UI Component Library**: Material-UI (MUI) 5.12.3
- **Graph Visualization**: Cytoscape.js 3.33.1
- **Charts**: Chart.js 4.3.0 with react-chartjs-2 5.2.0
- **Routing**: React Router DOM 6.11.0
- **State Management**: React Hooks (useState, useEffect, useCallback, useMemo)
- **Data Persistence**: Browser localStorage
- **ID Generation**: UUID 13.0.0
- **Component Validation**: PropTypes 15.8.1

## API Integration

### Supported Vulnerability Sources

#### NVD (National Vulnerability Database)
- Requires: API Key
- URL: `https://services.nvd.nist.gov/rest/json/cves/2.0`
- Coverage: Comprehensive, government-maintained database

#### GitHub Security Advisories
- Requires: GitHub Personal Access Token
- Uses: GraphQL API
- Coverage: Open source vulnerabilities with GitHub context

#### OSV (Open Source Vulnerabilities)
- Requires: None (free public API)
- URL: `https://api.osv.dev/v1/query`
- Coverage: Aggregated OSV data from multiple sources

## Data Persistence

- All vulnerabilities are saved to browser localStorage under the key `sbom_vulnerabilities`
- SBOM graph state can be exported/imported via JSON files
- Data persists across browser sessions until manually cleared
- Export reports include timestamp and vulnerability metadata

## Component Documentation

### Custom Hooks

**useVulnerabilityData**
- Manages vulnerability state with localStorage persistence
- Provides CRUD operations: addVulnerability, updateVulnerabilityStatus, deleteVulnerability, clearAll, importVulnerabilities
- Tracks timeline history for each vulnerability

### Utility Functions

**vulnerabilityAPI.js**
- `fetchFromNVD(keyword, apiKey)` - Query NVD database
- `fetchFromGitHub(packageName, token)` - Query GitHub advisories
- `fetchFromOSV(purl)` - Query OSV API
- `generatePURL(component, version, ecosystem)` - Create Package URLs
- `fetchFromMultipleSources(components, apiKeys)` - Batch fetch with error handling
- `normalizeSeverity(severity)` - Standardize severity scores

**parseInputSBOM.js**
- Parse and validate CycloneDX JSON format SBOMs
- Extract component metadata
- Initialize graph nodes and edges

**cytoscapeConfig.js**
- Cytoscape.js configuration presets
- Layout algorithms and styling
- Plugin initialization

## Configuration

### Theme Customization

The application uses Material-UI theming system. Customize themes in:
- `src/assets/theme/index.js` - Light theme
- `src/assets/theme-dark/index.js` - Dark theme

### API Keys

For production use with external APIs, store API keys securely:
1. Use environment variables (recommended)
2. Implement secure backend proxy for API calls
3. Never commit API keys to version control

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

## Performance Considerations

- Large graphs (100+ nodes) may benefit from layout algorithm selection
- Chart.js renders efficiently with memoization for datasets up to 1000 entries
- localStorage has ~5-10MB limit depending on browser
- Consider exporting large datasets for external analysis

## Troubleshooting

### Graph Not Displaying
- Check browser console for JavaScript errors
- Verify CycloneDX JSON format is valid
- Clear browser cache and reload page

### Vulnerability Sync Fails
- Verify API key/token is valid
- Check network requests in browser DevTools
- Ensure API endpoint URLs are accessible from your network

### Data Not Persisting
- Check browser localStorage is enabled
- Verify storage quota isn't exceeded
- Check browser privacy settings aren't blocking storage

## Development

### Available Scripts

```bash
# Start development server with hot reload
npm start

# Build production-optimized bundle
npm run build

# Run tests
npm run test

# Eject configuration (irreversible)
npm run eject

# Clean install dependencies
npm run install:clean
```

### Code Quality

- ESLint configuration included
- Prettier formatting for consistent code style
- PropTypes validation for component props
- React strict mode enabled for development

## Future Enhancements

- [ ] Advanced filtering and search capabilities
- [ ] Custom remediation timeline views
- [ ] Notification and alerting system
- [ ] Multi-source vulnerability aggregation dashboard
- [ ] PDF report generation with custom templates
- [ ] Real-time vulnerability updates via WebSocket
- [ ] Role-based access control (RBAC)
- [ ] Audit logging and compliance tracking
- [ ] Batch SBOM processing pipeline
- [ ] Integration with CI/CD platforms

## Contributing

Contributions are welcome! Please ensure:
1. Code follows ESLint rules
2. Components include PropTypes validation
3. New features include documentation updates
4. Changes don't break existing tests

## License

© 2024 SBOM Lens. All rights reserved.

## Support

For issues, feature requests, or questions:
1. Check existing documentation
2. Review browser console for error messages
3. Check GitHub Issues for similar problems
4. Submit new issue with reproduction steps

## Acknowledgments

Built with:
- [React](https://react.dev/) - UI framework
- [Material-UI](https://mui.com/) - Component library
- [Cytoscape.js](https://cytoscape.org/) - Graph visualization
- [Chart.js](https://www.chartjs.org/) - Data visualization

---

**SBOM Lens** - Bringing clarity to your software supply chain
