import { Request } from 'express';

// Authentication types
export interface LoginRequest {
  username: string; // Can be username or email
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface JwtPayload {
  sub: string; // user id
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  isSuperuser: boolean;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

// Extended Express Request with auth
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  userId?: string;
}

// Auth response types
export interface LoginResponse {
  user: {
    id: string;
    username: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    roles: Array<{
      id: string;
      name: string;
      description: string | null;
    }>;
  };
  tokens: AuthTokens;
}

export interface RegisterResponse {
  user: {
    id: string;
    username: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    isActive: boolean;
    createdAt: Date;
  };
}