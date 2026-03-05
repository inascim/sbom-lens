/**
 * SBOMSelector Component
 *
 * Reusable table for selecting SBOMs
 * Displays SBOM library with metadata and selection capabilities
 *
 * Props:
 *   mode: "single" | "multiple" (default: "single")
 *   selectedIds: string[] (currently selected SBOM IDs)
 *   onSelectedChange: (ids: string[]) => void (callback when selection changes)
 *   onSBOMClick: (sbomId: string) => void (callback when row is clicked)
 *   onDelete: (sbomId: string) => void (callback to delete SBOM)
 */

import PropTypes from "prop-types";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  IconButton,
  Chip,
  Box,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

function SBOMSelector({
  sboms = [],
  mode = "single",
  selectedIds = [],
  onSelectedChange,
  onSBOMClick,
  onDelete,
  loading = false,
}) {
  const handleSelectChange = (sbomId) => {
    if (mode === "single") {
      // Single select: toggle or set
      const newSelection = selectedIds.includes(sbomId) ? [] : [sbomId];
      onSelectedChange?.(newSelection);
    } else {
      // Multi select: toggle
      const newSelection = selectedIds.includes(sbomId)
        ? selectedIds.filter((id) => id !== sbomId)
        : [...selectedIds, sbomId];
      onSelectedChange?.(newSelection);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === sboms.length) {
      // All selected, deselect all
      onSelectedChange?.([]);
    } else {
      // Select all
      onSelectedChange?.(sboms.map((s) => s.id));
    }
  };

  if (loading) {
    return (
      <MDBox display="flex" justifyContent="center" alignItems="center" py={5}>
        <MDTypography>Loading SBOMs...</MDTypography>
      </MDBox>
    );
  }

  if (sboms.length === 0) {
    return (
      <MDBox display="flex" justifyContent="center" alignItems="center" py={5}>
        <MDTypography color="text">
          No SBOMs uploaded yet. Click the upload button to get started.
        </MDTypography>
      </MDBox>
    );
  }

  return (
    <TableContainer>
      <Table stickyHeader>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
            {mode === "multiple" && (
              <TableCell padding="checkbox" sx={{ width: "50px" }}>
                <Checkbox
                  indeterminate={selectedIds.length > 0 && selectedIds.length < sboms.length}
                  checked={selectedIds.length === sboms.length && sboms.length > 0}
                  onChange={handleSelectAll}
                />
              </TableCell>
            )}
            {mode === "single" && <TableCell sx={{ width: "50px" }} />}
            <TableCell>
              <MDTypography variant="caption" fontWeight="bold">
                SBOM Name
              </MDTypography>
            </TableCell>
            <TableCell align="center">
              <MDTypography variant="caption" fontWeight="bold">
                Components
              </MDTypography>
            </TableCell>
            <TableCell align="center">
              <MDTypography variant="caption" fontWeight="bold">
                Created
              </MDTypography>
            </TableCell>
            <TableCell align="center">
              <MDTypography variant="caption" fontWeight="bold">
                Modified
              </MDTypography>
            </TableCell>
            <TableCell align="center">
              <MDTypography variant="caption" fontWeight="bold">
                Actions
              </MDTypography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sboms.map((sbom) => {
            const isSelected = selectedIds.includes(sbom.id);
            const createdDate = new Date(sbom.createdAt).toLocaleDateString();
            const modifiedDate = new Date(sbom.modifiedAt).toLocaleDateString();

            return (
              <TableRow
                key={sbom.id}
                selected={isSelected}
                hover
                sx={{
                  backgroundColor: isSelected ? "rgba(25, 118, 210, 0.08)" : "inherit",
                  cursor: "pointer",
                }}
              >
                {mode === "multiple" && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleSelectChange(sbom.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                )}
                {mode === "single" && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleSelectChange(sbom.id)}
                      onClick={(e) => e.stopPropagation()}
                      radio
                    />
                  </TableCell>
                )}
                <TableCell
                  onClick={() => onSBOMClick?.(sbom.id)}
                  sx={{ fontWeight: isSelected ? 600 : 400 }}
                >
                  <MDTypography variant="body2" fontWeight={isSelected ? "bold" : "regular"}>
                    {sbom.name}
                  </MDTypography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={sbom.components?.length || 0}
                    color="info"
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <MDTypography variant="caption">{createdDate}</MDTypography>
                </TableCell>
                <TableCell align="center">
                  <MDTypography variant="caption">{modifiedDate}</MDTypography>
                </TableCell>
                <TableCell align="center">
                  <Box display="flex" gap={0.5} justifyContent="center">
                    <IconButton
                      size="small"
                      onClick={() => onSBOMClick?.(sbom.id)}
                      title="View/Edit SBOM"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onDelete?.(sbom.id)}
                      title="Delete SBOM"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

SBOMSelector.propTypes = {
  sboms: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      createdAt: PropTypes.string.isRequired,
      modifiedAt: PropTypes.string.isRequired,
      components: PropTypes.array,
    })
  ),
  mode: PropTypes.oneOf(["single", "multiple"]),
  selectedIds: PropTypes.arrayOf(PropTypes.string),
  onSelectedChange: PropTypes.func,
  onSBOMClick: PropTypes.func,
  onDelete: PropTypes.func,
  loading: PropTypes.bool,
};

export default SBOMSelector;
