// Export all model types
export * from './models';
export * from './auth.types';

// Common API types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
  timestamp?: string;
  path?: string;
}

// Common query parameters
export interface SearchParams {
  search?: string;
}

export interface FilterParams {
  [key: string]: any;
}

// Error codes
export enum ErrorCode {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS = 'AUTH_001',
  AUTH_TOKEN_EXPIRED = 'AUTH_002',
  AUTH_TOKEN_INVALID = 'AUTH_003',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_004',
  AUTH_ACCOUNT_DISABLED = 'AUTH_005',
  AUTH_TOO_MANY_ATTEMPTS = 'AUTH_006',

  // User errors
  USER_NOT_FOUND = 'USER_001',
  USER_ALREADY_EXISTS = 'USER_002',
  USER_EMAIL_EXISTS = 'USER_003',
  USER_CANNOT_DELETE_SELF = 'USER_004',
  USER_CANNOT_DELETE_SUPERUSER = 'USER_005',

  // Role errors
  ROLE_NOT_FOUND = 'ROLE_001',
  ROLE_ALREADY_EXISTS = 'ROLE_002',
  ROLE_CANNOT_DELETE_SYSTEM = 'ROLE_003',
  ROLE_HAS_USERS = 'ROLE_004',

  // Permission errors
  PERMISSION_NOT_FOUND = 'PERM_001',
  PERMISSION_ALREADY_EXISTS = 'PERM_002',
  PERMISSION_IN_USE = 'PERM_003',

  // Validation errors
  VALIDATION_ERROR = 'VAL_001',
  VALIDATION_REQUIRED_FIELD = 'VAL_002',
  VALIDATION_INVALID_FORMAT = 'VAL_003',
  VALIDATION_OUT_OF_RANGE = 'VAL_004',
  VALIDATION_WEAK_PASSWORD = 'VAL_005',

  // System errors
  INTERNAL_SERVER_ERROR = 'SYS_001',
  DATABASE_ERROR = 'SYS_002',
  SERVICE_UNAVAILABLE = 'SYS_003',
  RATE_LIMIT_EXCEEDED = 'SYS_004',

  // Resource errors
  NOT_FOUND = 'RES_001',
  ALREADY_EXISTS = 'RES_002',
  CONFLICT = 'RES_003',
}