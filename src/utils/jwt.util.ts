import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError, AuthenticationError } from './errors';
import { ErrorCode } from '../types';

export interface JWTPayload {
  sub: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}

export class JWTUtil {
  private static readonly JWT_SECRET = config.jwt.secret;
  private static readonly JWT_EXPIRY = config.jwt.expiresIn;
  private static readonly REFRESH_TOKEN_SECRET = config.jwt.refreshSecret;
  private static readonly REFRESH_TOKEN_EXPIRY = config.jwt.refreshExpiresIn;

  static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload as any, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRY
    } as jwt.SignOptions);
  }

  static generateRefreshToken(userId: string, tokenId: string): string {
    const payload: RefreshTokenPayload = {
      sub: userId,
      tokenId
    };

    return jwt.sign(payload as any, this.REFRESH_TOKEN_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY
    } as jwt.SignOptions);
  }

  static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError(ErrorCode.AUTH_TOKEN_EXPIRED, 'Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError(ErrorCode.AUTH_TOKEN_INVALID, 'Invalid token');
      }
      throw error;
    }
  }

  static verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return jwt.verify(token, this.REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError(ErrorCode.AUTH_TOKEN_EXPIRED, 'Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError(ErrorCode.AUTH_TOKEN_INVALID, 'Invalid refresh token');
      }
      throw error;
    }
  }

  static decodeToken(token: string): JWTPayload | RefreshTokenPayload | null {
    return jwt.decode(token) as JWTPayload | RefreshTokenPayload | null;
  }

  static generateTokenPair(payload: Omit<JWTPayload, 'iat' | 'exp'>, tokenId: string) {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload.sub, tokenId);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getExpiresInSeconds(),
      tokenType: 'Bearer'
    };
  }

  private static getExpiresInSeconds(): number {
    const expiry = this.JWT_EXPIRY;
    if (typeof expiry === 'number') {
      return expiry;
    }

    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 900; // Default 15 minutes
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900;
    }
  }
}