import { Role } from '../models/Role';
import { Permission } from '../models/Permission';
import { User } from '../models/User';

export interface CreateRoleData {
  name: string;
  description?: string;
  isSystem?: boolean;
  permissionIds?: string[];
  createdBy?: string;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export interface RoleFilter {
  search?: string;
  isSystem?: boolean;
  hasUsers?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface RoleWithDetails extends Role {
  permissions?: Permission[];
  users?: User[];
  userCount?: number;
  permissionCount?: number;
}

export interface RoleListResponse {
  roles: RoleWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface BulkRoleOperationResult {
  success: string[];
  failed: Array<{
    id: string;
    error: string;
  }>;
}

export interface RoleStatistics {
  total: number;
  system: number;
  custom: number;
  withUsers: number;
  withoutUsers: number;
  avgPermissionsPerRole: number;
  mostUsedRoles: Array<{
    id: string;
    name: string;
    userCount: number;
  }>;
}

export interface RolePermissionUpdate {
  add?: string[];
  remove?: string[];
}

export interface RoleMenuPermissions {
  roleId: string;
  menuPermissions: Array<{
    menuId: string;
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canExport: boolean;
  }>;
}

export interface RoleCloneData {
  sourceRoleId: string;
  newRoleName: string;
  description?: string;
  includePermissions?: boolean;
  includeMenuPermissions?: boolean;
}

export interface RoleHierarchy {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  children?: RoleHierarchy[];
  permissionCount: number;
  userCount: number;
}