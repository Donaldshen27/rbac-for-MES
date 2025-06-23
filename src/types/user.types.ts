import { User } from '../models/User';
import { Role } from '../models/Role';

export interface CreateUserData {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  isSuperuser?: boolean;
  roleIds?: number[];
  createdBy?: string;
}

export interface UpdateUserData {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  isSuperuser?: boolean;
  roleIds?: number[];
}

export interface UserFilter {
  search?: string;
  isActive?: boolean;
  roleIds?: number[];
  sortBy?: 'email' | 'username' | 'firstName' | 'lastName' | 'createdAt' | 'lastLogin';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
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

export interface BulkOperationResult {
  success: string[];
  failed: Array<{
    id: string;
    error: string;
  }>;
}

export interface UserWithRoles extends User {
  roles?: Role[];
}

export interface UserListResponse {
  users: UserWithRoles[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface UserStatistics {
  total: number;
  active: number;
  inactive: number;
  superusers: number;
  byRole: Record<string, number>;
}

export interface UserExportData {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  roles: string[];
  isActive: boolean;
  isSuperuser: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}