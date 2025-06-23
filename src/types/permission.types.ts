export interface IPermission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPermissionWithRoles extends IPermission {
  roles?: Array<{
    id: string;
    name: string;
    userCount?: number;
  }>;
}

export interface IPermissionCreate {
  name?: string;
  resource: string;
  action: string;
  description?: string;
}

export interface IPermissionUpdate {
  description?: string;
}

export interface IPermissionFilters {
  resource?: string;
  action?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface IPermissionPaginationResult {
  permissions: IPermission[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IPermissionCheckResult {
  hasPermission: boolean;
  source?: string;
}

export interface IResourceCreate {
  name: string;
  description?: string;
}

export interface IResource {
  id: string;
  name: string;
  description?: string | null;
  permissionCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IResourceFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface IResourcePaginationResult {
  resources: IResource[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute',
  APPROVE = 'approve',
  REJECT = 'reject',
  EXPORT = 'export',
  IMPORT = 'import',
  VIEW = 'view',
  MANAGE = 'manage',
  ASSIGN = 'assign',
  REVOKE = 'revoke',
  ALL = '*'
}

export enum PermissionResource {
  USER = 'user',
  ROLE = 'role',
  PERMISSION = 'permission',
  MENU = 'menu',
  RESOURCE = 'resource',
  PRODUCTION = 'production',
  QUALITY = 'quality',
  REPORT = 'report',
  SYSTEM = 'system',
  AUDIT = 'audit'
}

export interface IPermissionValidation {
  isValid: boolean;
  errors?: string[];
}