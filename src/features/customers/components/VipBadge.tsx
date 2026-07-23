import { Chip, Tooltip } from '@mui/material';
import StarIcon from '@mui/icons-material/WorkspacePremium';

/**
 * The VIP marker.
 *
 * Display only, everywhere it appears. VIP is earned automatically by the
 * backend when a customer's payments cross a threshold and is never set
 * by hand, so this deliberately has no interactive form — showing it as
 * an editable field would imply a control that does not exist.
 */
export function VipBadge() {
  return (
    <Tooltip title="Earned automatically from payment history">
      <Chip
        size="small"
        color="warning"
        icon={<StarIcon />}
        label="VIP"
        sx={{ fontWeight: 600 }}
      />
    </Tooltip>
  );
}
