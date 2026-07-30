import DashboardIcon from '@mui/icons-material/SpaceDashboardOutlined';
import PeopleIcon from '@mui/icons-material/PeopleAltOutlined';
import PaymentsIcon from '@mui/icons-material/PaymentsOutlined';
import CommissionIcon from '@mui/icons-material/PaidOutlined';
import ImportIcon from '@mui/icons-material/UploadFileOutlined';
import BadgeIcon from '@mui/icons-material/BadgeOutlined';
import type { SvgIconComponent } from '@mui/icons-material';

import { appRoutes } from '../../app/router/routes';
import type { UserRole } from '../../features/auth/types';

export interface NavItem {
  label: string;
  path: string;
  icon: SvgIconComponent;
  /**
   * Roles allowed to see this entry. Undefined means every signed-in
   * role. Kept in step with the router's own RoleRoute guards — this
   * controls visibility, the router controls access.
   */
  roles?: readonly UserRole[];
  /**
   * Per-role label overrides. The default `label` is used unless the
   * signed-in role has an entry here — e.g. an agent sees "My Commission"
   * where an admin sees "Commission".
   */
  labelByRole?: Partial<Record<UserRole, string>>;
}

/**
 * Sidebar contents, as data rather than as markup, so the sidebar renders
 * a list instead of hard-coding four near-identical blocks and role
 * filtering stays a single `filter` call.
 */
export const navItems: readonly NavItem[] = [
  {
    label: 'Dashboard',
    path: appRoutes.dashboard,
    icon: DashboardIcon,
  },
  {
    label: 'Customers',
    path: appRoutes.customers,
    icon: PeopleIcon,
  },
  {
    label: 'Payments',
    path: appRoutes.payments,
    icon: PaymentsIcon,
  },
  {
    // No `roles`: visible to admin and agent. The backend scopes the data and
    // enforces admin-only payout. Agents see "My Commission" for clarity,
    // since their view is only ever their own.
    label: 'Commission',
    path: appRoutes.commission,
    icon: CommissionIcon,
    labelByRole: { agent: 'My Commission' },
  },
  {
    label: 'Agents',
    path: appRoutes.agents,
    icon: BadgeIcon,
    roles: ['admin'],
  },
  {
    label: 'Import Data',
    path: appRoutes.importData,
    icon: ImportIcon,
    roles: ['admin'],
  },
];

export function visibleNavItems(role: UserRole | undefined): NavItem[] {
  return navItems
    .filter(
      (item) =>
        !item.roles || (role !== undefined && item.roles.includes(role)),
    )
    .map((item) => {
      const override = role !== undefined ? item.labelByRole?.[role] : undefined;
      return override ? { ...item, label: override } : item;
    });
}

