import { useState, useEffect } from "react";

// @mui material components
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Local components
import VulnerabilityChart from "./components/VulnerabilityChart";
import VulnerabilityTable from "./components/VulnerabilityTable";
import VulnerabilityForm from "./components/VulnerabilityForm";

// Hooks
import { useVulnerabilityData } from "./hooks/useVulnerabilityData";

function SbomVulnerabilities() {
  const {
    vulnerabilities,
    addVulnerability,
    updateVulnerabilityStatus,
    deleteVulnerability,
    clearAll,
  } = useVulnerabilityData();

  const [chartType, setChartType] = useState("stacked");
  const [filterSeverity, setFilterSeverity] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    remediated: 0,
  });

  // Update stats when vulnerabilities change
  useEffect(() => {
    const newStats = {
      total: vulnerabilities.length,
      critical: vulnerabilities.filter((v) => v.severity === "CRITICAL").length,
      high: vulnerabilities.filter((v) => v.severity === "HIGH").length,
      medium: vulnerabilities.filter((v) => v.severity === "MEDIUM").length,
      low: vulnerabilities.filter((v) => v.severity === "LOW").length,
      remediated: vulnerabilities.filter((v) => v.status === "REMEDIATED").length,
    };
    setStats(newStats);
  }, [vulnerabilities]);

  // Filter vulnerabilities
  const filteredVulnerabilities = vulnerabilities.filter((v) => {
    if (filterSeverity && v.severity !== filterSeverity) return false;
    if (filterStatus && v.status !== filterStatus) return false;
    return true;
  });

  const handleExportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      stats,
      vulnerabilities: filteredVulnerabilities,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sbom-vulnerabilities-${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
            SBOM Vulnerabilities
          </MDTypography>
          <MDTypography variant="body2" color="text">
            Track, manage, and remediate vulnerabilities found in your Software Bill of Materials.
          </MDTypography>
        </MDBox>

        {/* Main card */}
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
            {/* Left group: Chart type selector */}
            <MDBox display="flex" alignItems="center" gap={2}>
              <MDTypography variant="body2" fontWeight="medium" color="text">
                Chart Type:
              </MDTypography>
              <ToggleButtonGroup
                value={chartType}
                exclusive
                onChange={(e, newType) => newType && setChartType(newType)}
                size="small"
                sx={{
                  "& .MuiToggleButton-root": {
                    borderColor: "divider",
                    color: "text.secondary",
                    "&.Mui-selected": {
                      backgroundColor: "info.main",
                      color: "white",
                      borderColor: "info.main",
                    },
                  },
                }}
              >
                <ToggleButton value="stacked">Stacked Bar</ToggleButton>
                <ToggleButton value="donut">Donut</ToggleButton>
              </ToggleButtonGroup>

              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

              {/* Action buttons */}
              <Tooltip title="Add Vulnerability">
                <MDButton
                  variant="gradient"
                  color="success"
                  size="small"
                  startIcon={<Icon>add</Icon>}
                  onClick={() => setFormOpen(true)}
                >
                  Add
                </MDButton>
              </Tooltip>

              <Tooltip title="Clear All">
                <MDButton
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<Icon>delete_sweep</Icon>}
                  onClick={clearAll}
                >
                  Clear All
                </MDButton>
              </Tooltip>
            </MDBox>

            {/* Right group: Export */}
            <MDBox display="flex" alignItems="center" gap={1}>
              <Tooltip title="Export Report">
                <MDButton
                  variant="gradient"
                  color="info"
                  size="small"
                  startIcon={<Icon>download</Icon>}
                  onClick={handleExportReport}
                >
                  Export
                </MDButton>
              </Tooltip>
            </MDBox>
          </MDBox>

          <Divider sx={{ my: 0 }} />

          {/* Chart area */}
          <MDBox
            sx={{
              flex: "0 0 auto",
              minHeight: 350,
              p: 2,
              backgroundColor: "background.paper",
            }}
          >
            <VulnerabilityChart
              vulnerabilities={filteredVulnerabilities}
              chartType={chartType}
              stats={stats}
            />
          </MDBox>

          <Divider sx={{ my: 0 }} />

          {/* Table area */}
          <MDBox
            sx={{
              flex: 1,
              overflow: "auto",
              p: 2,
            }}
          >
            <VulnerabilityTable
              vulnerabilities={filteredVulnerabilities}
              onStatusChange={updateVulnerabilityStatus}
              onDelete={deleteVulnerability}
              filterSeverity={filterSeverity}
              onSeverityFilterChange={setFilterSeverity}
              filterStatus={filterStatus}
              onStatusFilterChange={setFilterStatus}
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
              Total: {stats.total}&nbsp;&nbsp;|&nbsp;&nbsp;Critical: {stats.critical}
              &nbsp;&nbsp;|&nbsp;&nbsp;High: {stats.high}&nbsp;&nbsp;|&nbsp;&nbsp;Remediated:{" "}
              {stats.remediated}
            </MDTypography>
            <MDTypography variant="caption" color="text">
              Showing {filteredVulnerabilities.length} of {vulnerabilities.length}
            </MDTypography>
          </MDBox>
        </Card>
      </MDBox>

      {/* Vulnerability Form Modal */}
      <VulnerabilityForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={(data) => {
          addVulnerability(data);
          setFormOpen(false);
        }}
      />

      <Footer />
    </DashboardLayout>
  );
}

export default SbomVulnerabilities;
