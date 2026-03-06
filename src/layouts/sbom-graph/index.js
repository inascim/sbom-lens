import { useRef, useState, useEffect } from "react";
import { convertCycloneDXToGraph, convertGraphToCycloneDX } from "utils/parseInputSBOM";

// @mui material components
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Graph
import GraphVisualizer from "./components/GraphVisualizer";
import SBOMSelector from "components/SBOMSelector";
import useSBOMLibrary from "hooks/useSBOMLibrary";

function SbomGraph() {
  const graphRef = useRef(null);
  const fileInputRef = useRef(null);
  const [newGraphData, setNewGraphData] = useState({});
  const [stats, setStats] = useState({ nodes: 0, edges: 0, depth: 0 });
  const [zoom, setZoom] = useState(100);

  const { sboms, getSBOM, uploadSBOM, modifySBOM } = useSBOMLibrary();
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadedSBOM, setLoadedSBOM] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // Update stats whenever graph data changes
  useEffect(() => {
    if (graphRef.current) {
      setStats(graphRef.current.getStats());
      setZoom(graphRef.current.getZoom());
    }
  }, [newGraphData]);

  const handleZoomIn = () => {
    graphRef.current?.zoomIn();
    setTimeout(() => setZoom(graphRef.current?.getZoom() ?? 100), 50);
  };

  const handleZoomOut = () => {
    graphRef.current?.zoomOut();
    setTimeout(() => setZoom(graphRef.current?.getZoom() ?? 100), 50);
  };

  const handleFitToView = () => {
    graphRef.current?.fitToView();
    setTimeout(() => setZoom(graphRef.current?.getZoom() ?? 100), 50);
  };

  const loadGraph = (graphData) => {
    setNewGraphData(graphData);
    setIsDirty(false);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const graphData = convertCycloneDXToGraph(json);
        loadGraph(graphData);
        setLoadedSBOM(null);
      } catch {
        console.error("Invalid CycloneDX JSON file");
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-imported
    e.target.value = null;
  };

  const handleExport = () => {
    const nodes = graphRef.current?.getAllNodes() ?? [];
    const edges = graphRef.current?.getAllEdges() ?? [];
    const cycloneDX = convertGraphToCycloneDX(nodes, edges);
    const blob = new Blob([JSON.stringify(cycloneDX, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sbom-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddComponent = () => {
    const allNodes = graphRef.current?.getAllNodes() ?? [];
    const nodeCount = allNodes.length + 1;
    const nodeId = `component-${nodeCount}`;

    // Position new node to the right of the last node
    const lastNode = allNodes.length > 0 ? allNodes[allNodes.length - 1] : null;
    const baseX = lastNode?.position?.x ?? 100;
    const baseY = lastNode?.position?.y ?? 100;
    const offset = 120; // pixels to the right

    const newNode = {
      id: nodeId,
      label: `Component ${nodeCount}`,
      data: {
        id: nodeId,
        name: `Component ${nodeCount}`,
        version: "1.0.0",
        type: "library",
        purl: `pkg:generic/component-${nodeCount}@1.0.0`,
        "bom-ref": nodeId,
      },
      position: {
        x: baseX + offset,
        y: baseY,
      },
      classes: "default-node",
    };

    setNewGraphData((prev) => ({
      ...prev,
      nodes: [...(prev.nodes || []), newNode],
      edges: prev.edges || [],
    }));
    setIsDirty(true);
  };

  const handleLoad = () => {
    if (selectedIds.length === 0) return;
    if (isDirty) {
      const ok = window.confirm("You have unsaved changes. Load a new SBOM and discard them?");
      if (!ok) return;
    }
    const sbom = getSBOM(selectedIds[0]);
    if (!sbom) return;
    const graphData = convertCycloneDXToGraph({
      components: sbom.components ?? [],
      metadata: sbom.metadata ?? {},
      dependencies: sbom.dependencies ?? [],
    });
    loadGraph(graphData);
    setLoadedSBOM(sbom);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox
        px={3}
        display="flex"
        flexDirection="column"
        sx={{
          height: "calc(100vh - 140px)",
        }}
      >
        {/* Page header */}
        <MDBox mb={2} py={3} px={3}>
          <MDTypography variant="h4" fontWeight="medium">
            SBOM Graph Explorer
          </MDTypography>
          <MDTypography variant="body2" color="text">
            Visualize and explore the dependency graph of your Software Bill of Materials.
          </MDTypography>
        </MDBox>
        <MDBox mb={2}>
          <SBOMSelector
            sboms={sboms}
            mode="single"
            selectedIds={selectedIds}
            onSelectedChange={setSelectedIds}
          />
          <MDBox display="flex" justifyContent="flex-end" mt={1}>
            <MDButton
              variant="gradient"
              color="info"
              size="small"
              disabled={selectedIds.length === 0}
              onClick={handleLoad}
            >
              Load
            </MDButton>
          </MDBox>
        </MDBox>
        {/* Main card: toolbar + canvas */}
        <Card sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Toolbar */}
          <MDBox
            px={2}
            py={1.5}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1}
          >
            {/* Left group: view controls */}
            <MDBox display="flex" alignItems="center" gap={1}>
              <Tooltip title="Zoom In">
                <MDButton
                  variant="outlined"
                  color="info"
                  iconOnly
                  size="small"
                  onClick={handleZoomIn}
                >
                  <Icon>zoom_in</Icon>
                </MDButton>
              </Tooltip>
              <Tooltip title="Zoom Out">
                <MDButton
                  variant="outlined"
                  color="info"
                  iconOnly
                  size="small"
                  onClick={handleZoomOut}
                >
                  <Icon>zoom_out</Icon>
                </MDButton>
              </Tooltip>
              <Tooltip title="Fit to View">
                <MDButton
                  variant="outlined"
                  color="info"
                  iconOnly
                  size="small"
                  onClick={handleFitToView}
                >
                  <Icon>fit_screen</Icon>
                </MDButton>
              </Tooltip>
              <Tooltip title="Clear Graph">
                <MDButton
                  variant="outlined"
                  color="error"
                  iconOnly
                  size="small"
                  onClick={() => graphRef.current?.clearGraphWithAnimation()}
                >
                  <Icon>refresh</Icon>
                </MDButton>
              </Tooltip>

              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

              {/* Add Component */}
              <Tooltip title="Add Component Node">
                <MDButton
                  variant="outlined"
                  color="success"
                  iconOnly
                  size="small"
                  onClick={handleAddComponent}
                >
                  <Icon>add</Icon>
                </MDButton>
              </Tooltip>

              {/* Layout selector */}
              <Tooltip title="Tree Layout">
                <MDButton
                  variant="outlined"
                  color="dark"
                  iconOnly
                  size="small"
                  onClick={() => graphRef.current?.applyLayout("breadthfirst")}
                >
                  <Icon>account_tree</Icon>
                </MDButton>
              </Tooltip>
              <Tooltip title="Radial Layout">
                <MDButton
                  variant="outlined"
                  color="dark"
                  iconOnly
                  size="small"
                  onClick={() => graphRef.current?.applyLayout("concentric")}
                >
                  <Icon>hub</Icon>
                </MDButton>
              </Tooltip>
              <Tooltip title="Force-Directed Layout">
                <MDButton
                  variant="outlined"
                  color="dark"
                  iconOnly
                  size="small"
                  onClick={() => graphRef.current?.applyLayout("cose")}
                >
                  <Icon>bubble_chart</Icon>
                </MDButton>
              </Tooltip>
            </MDBox>

            {/* Right group: actions */}
            <MDBox display="flex" alignItems="center" gap={1}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: "none" }}
                onChange={handleImport}
              />
              <Tooltip title="Import CycloneDX SBOM">
                <MDButton
                  variant="gradient"
                  color="light"
                  size="small"
                  startIcon={<Icon>upload_file</Icon>}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Import
                </MDButton>
              </Tooltip>
              <Tooltip title="Export as CycloneDX JSON">
                <MDButton
                  variant="gradient"
                  color="info"
                  size="small"
                  startIcon={<Icon>download</Icon>}
                  onClick={handleExport}
                >
                  Export
                </MDButton>
              </Tooltip>
            </MDBox>
          </MDBox>

          <Divider sx={{ my: 0 }} />

          {/* Canvas area */}
          <MDBox
            sx={{
              flex: 1,
              position: "relative",
              display: "flex",
              backgroundColor: ({ palette: { grey } }) => grey[100],
              backgroundImage: "radial-gradient(circle, #d0d0d0 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              overflow: "hidden",
            }}
          >
            <GraphVisualizer
              ref={graphRef}
              newGraphData={newGraphData}
              handleOpenNodeDetails={(nodeData) => console.log("node selected:", nodeData)}
            />
          </MDBox>

          {/* Status bar */}
          <MDBox
            px={2}
            py={0.75}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{ borderTop: "1px solid", borderColor: "grey.200" }}
          >
            <MDTypography variant="caption" color="text">
              Nodes: {stats.nodes}&nbsp;&nbsp;|&nbsp;&nbsp;Edges: {stats.edges}
              &nbsp;&nbsp;|&nbsp;&nbsp;Depth: {stats.depth}
            </MDTypography>
            <MDTypography variant="caption" color="text">
              Zoom: {zoom}%
            </MDTypography>
          </MDBox>
        </Card>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default SbomGraph;
