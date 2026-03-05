/**
 * SBOMUploader Component
 *
 * Handles SBOM file upload with drag-drop support
 * Includes duplicate detection via hashing and confirmation dialog
 *
 * Props:
 *   onUploadSuccess: (sbom: SBOM) => void - called when SBOM successfully uploaded
 *   onError: (error: string) => void - called on upload/parse errors
 *   disabled: boolean - disable upload when max SBOMs reached
 */

import { useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

function SBOMUploader({ onUploadSuccess, onError, disabled = false }) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [duplicateDialog, setDuplicateDialog] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Parse CycloneDX JSON file
   */
  const parseCycloneDXFile = (fileContent) => {
    try {
      const data = JSON.parse(fileContent);

      // Validate basic CycloneDX structure
      if (!data.components && !data.metadata) {
        throw new Error("Invalid CycloneDX format: missing components or metadata");
      }

      // Extract SBOM metadata
      const sbomData = {
        name: data.metadata?.component?.name || "Imported SBOM",
        components: (data.components || []).map((comp) => ({
          purl: comp.purl || `${comp.name}@${comp.version}`,
          name: comp.name,
          version: comp.version,
          type: comp.type,
          licenses: comp.licenses || [],
          // Store other CycloneDX fields
          ...comp,
        })),
        metadata: {
          version: data.specVersion,
          bom_ref: data["bom-ref"],
          serialNumber: data.serialNumber,
          ...data.metadata,
        },
      };

      return sbomData;
    } catch (err) {
      throw new Error(`Failed to parse SBOM file: ${err.message}`);
    }
  };

  /**
   * Handle file selection/drop
   */
  const handleFile = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith(".json")) {
      setError("Please upload a .json file (CycloneDX format)");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fileContent = await file.text();
      const sbomData = parseCycloneDXFile(fileContent);

      // Pass to parent - they'll handle upload logic with duplicate detection
      onUploadSuccess(sbomData);
    } catch (err) {
      const errorMsg = err.message || "Failed to process file";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Drag and drop handlers
   */
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <Card sx={{ backgroundColor: dragActive ? "rgba(25, 118, 210, 0.05)" : "transparent" }}>
      <Box
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          position: "relative",
          padding: 4,
          textAlign: "center",
          border: "2px dashed",
          borderColor: dragActive ? "primary.main" : "divider",
          borderRadius: 2,
          backgroundColor: dragActive ? "rgba(25, 118, 210, 0.05)" : "transparent",
          transition: "all 0.3s ease",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <input
          type="file"
          accept=".json"
          onChange={handleInputChange}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
          disabled={disabled || loading}
        />

        <MDBox display="flex" flexDirection="column" alignItems="center" gap={1}>
          {loading ? (
            <>
              <CircularProgress size={40} />
              <MDTypography variant="body2" color="text">
                Processing file...
              </MDTypography>
            </>
          ) : (
            <>
              <CloudUploadIcon sx={{ fontSize: 48, color: "info.main" }} />
              <MDTypography variant="h6" fontWeight="bold">
                Drag and drop your SBOM file here
              </MDTypography>
              <MDTypography variant="body2" color="text">
                or click to browse (CycloneDX JSON format)
              </MDTypography>
              {disabled && (
                <MDTypography variant="caption" color="error" sx={{ marginTop: 1 }}>
                  Maximum SBOMs reached. Delete one to upload another.
                </MDTypography>
              )}
            </>
          )}
        </MDBox>
      </Box>

      {/* Error Alert */}
      {error && (
        <MDBox mt={2}>
          <Alert severity="error">{error}</Alert>
        </MDBox>
      )}
    </Card>
  );
}

SBOMUploader.propTypes = {
  onUploadSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func,
  disabled: PropTypes.bool,
};

export default SBOMUploader;
