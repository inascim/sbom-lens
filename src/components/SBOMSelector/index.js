/**
 * SBOMSelector Component
 *
 * Reusable table for selecting SBOMs, built on the app's DataTable component
 * so headers match the rest of the dashboard.
 *
 * Props:
 *   mode: "single" | "multiple" (default: "single")
 *   selectedIds: string[] (currently selected SBOM IDs)
 *   onSelectedChange: (ids: string[]) => void
 *   renderRowActions: (sbom) => ReactNode  — optional; renders an Actions column
 *   loading: bool
 */

/* eslint-disable react/prop-types */
import PropTypes from "prop-types";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DataTable from "examples/Tables/DataTable";

function SBOMSelector({
  sboms = [],
  mode = "single",
  selectedIds = [],
  onSelectedChange,
  renderRowActions,
  loading = false,
}) {
  const handleSelectChange = (sbomId) => {
    if (mode === "single") {
      const newSelection = selectedIds.includes(sbomId) ? [] : [sbomId];
      onSelectedChange?.(newSelection);
    } else {
      const newSelection = selectedIds.includes(sbomId)
        ? selectedIds.filter((id) => id !== sbomId)
        : [...selectedIds, sbomId];
      onSelectedChange?.(newSelection);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === sboms.length) {
      onSelectedChange?.([]);
    } else {
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

  const columns = [
    {
      id: "select",
      accessor: (row) => row.id,
      Header:
        mode === "multiple" ? (
          <Checkbox
            indeterminate={selectedIds.length > 0 && selectedIds.length < sboms.length}
            checked={selectedIds.length === sboms.length && sboms.length > 0}
            onChange={handleSelectAll}
          />
        ) : (
          " "
        ),
      width: "50px",
      Cell: ({ value }) => (
        <Checkbox
          checked={selectedIds.includes(value)}
          onChange={() => handleSelectChange(value)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      Header: "SBOM Name",
      accessor: "name",
      Cell: ({ row }) => (
        <MDTypography
          variant="body2"
          fontWeight={selectedIds.includes(row.original.id) ? "bold" : "regular"}
        >
          {row.original.name}
        </MDTypography>
      ),
    },
    {
      Header: "Components",
      accessor: "components",
      align: "center",
      Cell: ({ value }) => (
        <Chip label={value?.length || 0} color="info" variant="outlined" size="small" />
      ),
    },
    {
      Header: "Created",
      accessor: "createdAt",
      align: "center",
      Cell: ({ value }) => (
        <MDTypography variant="caption">{new Date(value).toLocaleDateString()}</MDTypography>
      ),
    },
    {
      Header: "Modified",
      accessor: "modifiedAt",
      align: "center",
      Cell: ({ value }) => (
        <MDTypography variant="caption">{new Date(value).toLocaleDateString()}</MDTypography>
      ),
    },
    ...(renderRowActions
      ? [
          {
            id: "actions",
            accessor: (row) => row,
            Header: "Actions",
            align: "center",
            disableSortBy: true,
            Cell: ({ value }) => (
              <Box display="flex" gap={0.5} justifyContent="center">
                {renderRowActions(value)}
              </Box>
            ),
          },
        ]
      : []),
  ];

  return (
    <DataTable
      table={{ columns, rows: sboms }}
      entriesPerPage={false}
      showTotalEntries={false}
      isSorted={false}
      noEndBorder
    />
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
  renderRowActions: PropTypes.func,
  loading: PropTypes.bool,
};

export default SBOMSelector;
