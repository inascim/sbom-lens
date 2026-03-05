/**
 * SBOMCard Component
 *
 * Renders a single SBOM's info card in the library grid.
 * Layout-local component — do not promote to global src/components/.
 */

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import PropTypes from "prop-types";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

function SBOMCard({ sbom, onDelete, disabled }) {
  const handleDelete = () => {
    if (window.confirm(`Delete "${sbom.name}"?`)) {
      onDelete(sbom.id);
    }
  };

  return (
    <Card>
      <CardContent>
        <MDBox p={2}>
          <MDTypography variant="h6" fontWeight="bold" noWrap>
            {sbom.name}
          </MDTypography>
          <MDTypography variant="body2" color="text">
            {sbom.components?.length || 0} components
          </MDTypography>
          <MDTypography variant="caption" color="text" display="block">
            Uploaded: {new Date(sbom.createdAt).toLocaleDateString()}
          </MDTypography>
          <MDTypography variant="caption" color="text" display="block">
            Modified: {new Date(sbom.modifiedAt).toLocaleDateString()}
          </MDTypography>
        </MDBox>
      </CardContent>
      <CardActions>
        <MDButton
          size="small"
          color="error"
          variant="outlined"
          onClick={handleDelete}
          disabled={disabled}
        >
          Delete
        </MDButton>
      </CardActions>
    </Card>
  );
}

SBOMCard.propTypes = {
  sbom: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    components: PropTypes.array,
    createdAt: PropTypes.string,
    modifiedAt: PropTypes.string,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

SBOMCard.defaultProps = {
  disabled: false,
};

export default SBOMCard;
