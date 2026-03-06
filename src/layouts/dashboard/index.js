// @mui material components
import Grid from "@mui/material/Grid";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

// React
import { useState } from "react";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";

// SBOM components and hooks
import SBOMUploader from "components/SBOMUploader";
import SBOMCard from "layouts/dashboard/components/SBOMCard";
import { useSBOMLibrary } from "hooks/useSBOMLibrary";
import { useVulnerabilities } from "hooks/useVulnerabilities";
import { useVulnerabilityFetcher } from "hooks/useVulnerabilityFetcher";

function Dashboard() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(null);
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { sboms, loading, error, uploadSBOM, removeSBOM, getStats } = useSBOMLibrary();
  const { vulnerabilities } = useVulnerabilities();
  const { fetchVulnsForSBOM } = useVulnerabilityFetcher();
  const stats = getStats();
  const totalVulns = vulnerabilities.length;
  const unresolvedVulns = vulnerabilities.filter((v) => v.status !== "REMEDIATED").length;

  const handleUploadSuccess = async (sbomData) => {
    setUploading(true);
    try {
      const result = await uploadSBOM(sbomData);
      if (result.isDuplicate) {
        setPendingUpload(sbomData);
        setDuplicateInfo(result);
      } else {
        setUploadDialogOpen(false);
        // Fire-and-forget: fetch vulns for uploaded SBOM; does not block dialog close
        fetchVulnsForSBOM(result.sbom?.components || sbomData.components || []);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleCreateCopy = async () => {
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
      setPendingUpload(null);
      setDuplicateInfo(null);
      setUploadDialogOpen(false);
    } finally {
      setUploading(false);
    }
  };

  const handleCancelDuplicate = () => {
    setDuplicateInfo(null);
    setPendingUpload(null);
    // Leave uploadDialogOpen=true so user can try a different file
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {/* Error banner */}
        {error && (
          <MDTypography color="error" mb={2}>
            {error}
          </MDTypography>
        )}

        {/* Stats row — 4 cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="info"
                icon="inventory_2"
                title="SBOMs in Library"
                count={`${stats.totalSBOMs} / 3`}
                percentage={{
                  color: "text",
                  amount: "",
                  label: `${3 - stats.totalSBOMs} slot(s) remaining`,
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="success"
                icon="extension"
                title="Total Components"
                count={stats.totalComponents}
                percentage={{
                  color: "text",
                  amount: "",
                  label: "across all SBOMs",
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="warning"
                icon="bug_report"
                title="Vulnerabilities Tracked"
                count={totalVulns}
                percentage={{
                  color: "text",
                  amount: "",
                  label: "unique CVEs",
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="error"
                icon="gpp_bad"
                title="Unresolved"
                count={unresolvedVulns}
                percentage={{
                  color: "text",
                  amount: "",
                  label: "not remediated",
                }}
              />
            </MDBox>
          </Grid>
        </Grid>

        {/* SBOM Library section */}
        <MDBox mt={4.5}>
          {/* Section header row */}
          <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <MDTypography variant="h5" fontWeight="medium">
              SBOM Library
            </MDTypography>
            <MDButton
              color="info"
              onClick={() => setUploadDialogOpen(true)}
              disabled={sboms.length >= 3}
            >
              Upload SBOM
            </MDButton>
          </MDBox>

          {/* SBOM cards grid or empty/loading state */}
          {loading ? (
            <MDTypography color="text">Loading...</MDTypography>
          ) : sboms.length === 0 ? (
            <MDBox py={5} textAlign="center">
              <MDTypography color="text">
                No SBOMs uploaded yet. Click &quot;Upload SBOM&quot; to get started.
              </MDTypography>
            </MDBox>
          ) : (
            <Grid container spacing={3}>
              {sboms.map((sbom) => (
                <Grid item xs={12} md={6} lg={4} key={sbom.id}>
                  <SBOMCard sbom={sbom} onDelete={removeSBOM} disabled={uploadDialogOpen} />
                </Grid>
              ))}
            </Grid>
          )}
        </MDBox>
      </MDBox>
      <Footer />

      {/* Upload / Duplicate Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => {
          if (!uploading) setUploadDialogOpen(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        {!duplicateInfo ? (
          <>
            <DialogTitle>Upload SBOM</DialogTitle>
            <DialogContent>
              <SBOMUploader onUploadSuccess={handleUploadSuccess} disabled={uploading} />
            </DialogContent>
            <DialogActions>
              <MDButton onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
                Cancel
              </MDButton>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle>Duplicate SBOM Detected</DialogTitle>
            <DialogContent>
              <MDTypography variant="body2">{duplicateInfo.message}</MDTypography>
              <MDTypography variant="caption" color="text" display="block" mt={1}>
                You can create a copy with a new name, or cancel to try a different file.
              </MDTypography>
            </DialogContent>
            <DialogActions>
              <MDButton onClick={handleCancelDuplicate} disabled={uploading}>
                Cancel
              </MDButton>
              <MDButton color="info" onClick={handleCreateCopy} disabled={uploading}>
                {uploading ? "Saving..." : "Create Copy"}
              </MDButton>
            </DialogActions>
          </>
        )}
      </Dialog>
    </DashboardLayout>
  );
}

export default Dashboard;
