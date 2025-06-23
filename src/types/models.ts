// Re-export model types for convenience
export type { User } from '@models/User';
export type { Role } from '@models/Role';
export type { Permission } from '@models/Permission';
export type { Resource } from '@models/Resource';
export type { Menu } from '@models/Menu';
export type { RefreshToken } from '@models/RefreshToken';
export type { AuditLog, AuditDetails } from '@models/AuditLog';
export type { UserRole } from '@models/UserRole';
export type { RolePermission } from '@models/RolePermission';
export type { MenuPermission } from '@models/MenuPermission';

// Common types for API responses
export interface UserWithRoles {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  isSuperuser: boolean;
  roles: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
}

export interface RoleWithPermissions {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Array<{
    id: string;
    name: string;
    resource: string;
    action: string;
    description: string | null;
  }>;
  userCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuWithPermissions {
  id: string;
  parentId: string | null;
  title: string;
  href: string | null;
  icon: string | null;
  target: string;
  orderIndex: number;
  isActive: boolean;
  permissions?: {
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canExport: boolean;
  };
  children?: MenuWithPermissions[];
}

export interface UserPermissions {
  permissions: string[];
  roles: string[];
  isSuperuser: boolean;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}