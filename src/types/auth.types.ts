import { Request } from 'express';

export interface LoginCredentials {
  username: string; // Can be email or username
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  roleIds?: string[];
  ipAddress?: string;
  userAgent?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export type AuthTokens = TokenPair;

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    roles: string[];
    permissions: string[];
    isSuperuser: boolean;
    firstName?: string;
    lastName?: string;
    isActive: boolean;
    lastLogin?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetData {
  token: string;
  newPassword: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface SessionInfo {
  id: string;
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    roles: Array<{
      id: string;
      name: string;
      description?: string;
    }>;
    isActive: boolean;
    isSuperuser: boolean;
    lastLogin?: Date;
  };
  tokens: TokenPair;
}