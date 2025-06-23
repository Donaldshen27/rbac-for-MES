import { Menu } from '../models/Menu';
import { MenuPermission } from '../models/MenuPermission';

export interface MenuNode extends Menu {
  children?: MenuNode[];
  permissions?: MenuPermissionSummary;
}

export interface MenuPermissionSummary {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

export interface CreateMenuData {
  id: string;
  parentId?: string | null;
  title: string;
  href?: string | null;
  icon?: string | null;
  target?: string;
  orderIndex?: number;
  isActive?: boolean;
}

export interface UpdateMenuData {
  parentId?: string | null;
  title?: string;
  href?: string | null;
  icon?: string | null;
  target?: string;
  orderIndex?: number;
  isActive?: boolean;
}

export interface MenuFilter {
  search?: string;
  parentId?: string | null;
  isActive?: boolean;
  roleId?: string;
  userId?: string;
  sortBy?: 'title' | 'orderIndex' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface MenuPermissionData {
  menuId: string;
  roleId: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

export interface BatchMenuPermissionUpdate {
  roleId: string;
  permissions: Array<{
    menuId: string;
    canView?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canExport?: boolean;
  }>;
  applyToChildren?: boolean;
}

export interface UserMenuResponse {
  menus: MenuNode[];
  totalCount: number;
  activeCount: number;
}

export interface MenuPermissionMatrix {
  roleId: string;
  roleName: string;
  permissions: Record<string, MenuPermissionSummary>;
}

export interface MenuAccessCheck {
  menuId: string;
  userId: string;
  permission: 'view' | 'edit' | 'delete' | 'export';
}

export interface MenuAccessResult {
  allowed: boolean;
  reason?: string;
  rolesThatGrantAccess?: Array<{
    roleId: string;
    roleName: string;
  }>;
}

export interface MenuBulkOperationResult {
  success: string[];
  failed: Array<{
    id: string;
    error: string;
  }>;
}

export interface MenuTreeStatistics {
  totalMenus: number;
  activeMenus: number;
  topLevelMenus: number;
  maxDepth: number;
  averageChildrenPerMenu: number;
}

export interface MenuPermissionChange {
  menuId: string;
  roleId: string;
  changes: {
    field: 'canView' | 'canEdit' | 'canDelete' | 'canExport';
    oldValue: boolean;
    newValue: boolean;
  }[];
}