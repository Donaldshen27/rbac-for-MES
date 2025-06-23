import { Request, Response, NextFunction } from 'express';
import { JWTUtil, JWTPayload } from '../utils/jwt.util';
import { AppError } from '../utils/errors';
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
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError('No authorization header provided', 401, 'AUTH_001');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new AppError('Invalid authorization format', 401, 'AUTH_001');
    }

    const payload = JWTUtil.verifyAccessToken(token);

    // Optionally verify user still exists and is active
    const user = await User.findByPk(payload.sub, {
      attributes: ['id', 'isActive', 'isSuperuser']
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401, 'AUTH_005');
    }

    req.user = {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
      roles: payload.roles,
      permissions: payload.permissions,
      isSuperuser: user.isSuperuser
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
      const user = await User.findByPk(payload.sub, {
        attributes: ['id', 'isActive', 'isSuperuser']
      });

      if (user && user.isActive) {
        req.user = {
          id: payload.sub,
          username: payload.username,
          email: payload.email,
          roles: payload.roles,
          permissions: payload.permissions,
          isSuperuser: user.isSuperuser
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
      return next(new AppError('Authentication required', 401, 'AUTH_001'));
    }

    if (req.user.isSuperuser) {
      return next();
    }

    const hasRole = requiredRoles.some(role => req.user!.roles.includes(role));

    if (!hasRole) {
      return next(new AppError('Insufficient permissions', 403, 'AUTH_004'));
    }

    next();
  };
};

export const requirePermission = (permissions: string | string[]) => {
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'AUTH_001'));
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
      return next(new AppError('Insufficient permissions', 403, 'AUTH_004'));
    }

    next();
  };
};

export const requireSuperuser = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401, 'AUTH_001'));
  }

  if (!req.user.isSuperuser) {
    return next(new AppError('Superuser access required', 403, 'AUTH_004'));
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
      throw new AppError('Refresh token required', 400, 'AUTH_001');
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
      throw new AppError('Invalid refresh token', 401, 'AUTH_003');
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      await storedToken.destroy();
      throw new AppError('Refresh token expired', 401, 'AUTH_002');
    }

    req.user = {
      id: payload.sub,
      username: '',
      email: '',
      roles: [],
      permissions: [],
      isSuperuser: false
    };

    next();
  } catch (error) {
    next(error);
  }
};