import { Request, Response, NextFunction } from 'express';
import { JWTUtil, JWTPayload } from '../utils/jwt.util';
import { AppError, AuthenticationError, AuthorizationError } from '../utils/errors';
import { ErrorCode } from '../types';
import { User } from '../models';
import { RefreshToken } from '../models';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export interface AuthUser {
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
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AuthenticationError(ErrorCode.AUTH_INVALID_CREDENTIALS, 'No authorization header provided');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new AuthenticationError(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Invalid authorization format');
    }

    const payload = JWTUtil.verifyAccessToken(token);

    // Fetch full user object
    const user = await User.findByPk(payload.sub);

    if (!user || !user.isActive) {
      throw new AuthenticationError(ErrorCode.AUTH_ACCOUNT_DISABLED, 'User not found or inactive');
    }

    // Create AuthUser object
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: payload.roles,
      permissions: payload.permissions,
      isSuperuser: user.isSuperuser,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return next();
    }

    try {
      const payload = JWTUtil.verifyAccessToken(token);
      const user = await User.findByPk(payload.sub);

      if (user && user.isActive) {
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          roles: payload.roles,
          permissions: payload.permissions,
          isSuperuser: user.isSuperuser,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        };
      }
    } catch (error) {
      // Ignore token errors for optional auth
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (roles: string | string[]) => {
  const requiredRoles = Array.isArray(roles) ? roles : [roles];

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Authentication required'));
    }

    if (req.user.isSuperuser) {
      return next();
    }

    const hasRole = requiredRoles.some(role => req.user!.roles.includes(role));

    if (!hasRole) {
      return next(new AuthorizationError('Insufficient role permissions'));
    }

    next();
  };
};

export const requirePermission = (permissions: string | string[]) => {
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Authentication required'));
    }

    if (req.user.isSuperuser) {
      return next();
    }

    const hasPermission = requiredPermissions.some(permission => {
      // Check exact permission
      if (req.user!.permissions.includes(permission)) {
        return true;
      }

      // Check wildcard permissions (e.g., "user:*" matches "user:create")
      const [resource] = permission.split(':');
      return req.user!.permissions.includes(`${resource}:*`);
    });

    if (!hasPermission) {
      return next(new AuthorizationError('Insufficient permissions'));
    }

    next();
  };
};

export const requireSuperuser = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new AuthenticationError(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Authentication required'));
  }

  if (!req.user.isSuperuser) {
    return next(new AuthorizationError('Superuser access required'));
  }

  next();
};

export const refreshTokenMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError(ErrorCode.VALIDATION_REQUIRED_FIELD, 'Refresh token required', 400);
    }

    const payload = JWTUtil.verifyRefreshToken(refreshToken);

    // Verify refresh token exists in database
    const storedToken = await RefreshToken.findOne({
      where: {
        token: refreshToken,
        userId: payload.sub
      }
    });

    if (!storedToken) {
      throw new AuthenticationError(ErrorCode.AUTH_TOKEN_INVALID, 'Invalid refresh token');
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      await storedToken.destroy();
      throw new AuthenticationError(ErrorCode.AUTH_TOKEN_EXPIRED, 'Refresh token expired');
    }

    req.user = {
      id: payload.sub,
      username: '',
      email: '',
      roles: [],
      permissions: [],
      isSuperuser: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    next();
  } catch (error) {
    next(error);
  }
};