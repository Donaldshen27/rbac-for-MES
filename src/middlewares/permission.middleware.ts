import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import permissionService from '../services/permission.service';
import logger from '../utils/logger';

/**
 * Extended Request interface with user property
 */
interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    roles: string[];
    permissions: string[];
    isSuperuser: boolean;
  };
}

/**
 * Check if user has specific permission(s)
 * Supports single permission or array of permissions
 * @param permissions - Permission(s) to check
 * @param options - Options for permission checking
 */
export const requirePermission = (
  permissions: string | string[],
  options: {
    requireAll?: boolean; // Require all permissions (AND) vs any permission (OR)
    checkDatabase?: boolean; // Check database for real-time permissions
  } = {}
) => {
  const { requireAll = false, checkDatabase = false } = options;
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthRequest;
    
    try {
      // Check if user is authenticated
      if (!authReq.user) {
        throw new ApiError(401, 'Authentication required');
      }

      // Superusers bypass all permission checks
      if (authReq.user.isSuperuser) {
        return next();
      }

      // Check permissions
      let hasPermission = false;

      if (checkDatabase) {
        // Real-time permission check from database
        if (requireAll) {
          // Check all permissions
          const results = await Promise.all(
            requiredPermissions.map(permission =>
              permissionService.checkUserPermission(authReq.user!.id, permission)
            )
          );
          hasPermission = results.every(result => result.hasPermission);
        } else {
          // Check any permission
          for (const permission of requiredPermissions) {
            const result = await permissionService.checkUserPermission(
              authReq.user.id,
              permission
            );
            if (result.hasPermission) {
              hasPermission = true;
              break;
            }
          }
        }
      } else {
        // Check permissions from JWT token
        if (requireAll) {
          hasPermission = requiredPermissions.every(permission =>
            checkPermissionWithWildcard(authReq.user!.permissions, permission)
          );
        } else {
          hasPermission = requiredPermissions.some(permission =>
            checkPermissionWithWildcard(authReq.user!.permissions, permission)
          );
        }
      }

      if (!hasPermission) {
        logger.warn(`Access denied for user ${authReq.user.username}: Missing permission(s) ${requiredPermissions.join(', ')}`);
        throw new ApiError(403, 'Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has any of the specified roles
 * @param roles - Role(s) to check
 */
export const requireRole = (roles: string | string[]) => {
  const requiredRoles = Array.isArray(roles) ? roles : [roles];

  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (authReq.user.isSuperuser) {
      return next();
    }

    const hasRole = requiredRoles.some(role => authReq.user!.roles.includes(role));

    if (!hasRole) {
      logger.warn(`Access denied for user ${authReq.user.username}: Missing role(s) ${requiredRoles.join(', ')}`);
      return next(new ApiError(403, 'Insufficient role privileges'));
    }

    next();
  };
};

/**
 * Check if user owns the resource or has permission
 * @param options - Options for ownership checking
 */
export const requireOwnershipOrPermission = (
  options: {
    ownerIdParam?: string; // Request param containing owner ID
    ownerIdField?: string; // Field in request body containing owner ID
    fallbackPermission: string; // Permission to check if not owner
    getUserId?: (req: Request) => Promise<string>; // Custom function to get resource owner ID
  }
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthRequest;

    try {
      if (!authReq.user) {
        throw new ApiError(401, 'Authentication required');
      }

      if (authReq.user.isSuperuser) {
        return next();
      }

      // Check ownership
      let isOwner = false;
      let resourceOwnerId: string | undefined;

      if (options.getUserId) {
        resourceOwnerId = await options.getUserId(req);
      } else if (options.ownerIdParam && req.params[options.ownerIdParam]) {
        resourceOwnerId = req.params[options.ownerIdParam];
      } else if (options.ownerIdField && req.body[options.ownerIdField]) {
        resourceOwnerId = req.body[options.ownerIdField];
      }

      if (resourceOwnerId && resourceOwnerId === authReq.user.id) {
        isOwner = true;
      }

      // If owner, allow access
      if (isOwner) {
        return next();
      }

      // Otherwise, check permission
      const hasPermission = checkPermissionWithWildcard(
        authReq.user.permissions,
        options.fallbackPermission
      );

      if (!hasPermission) {
        throw new ApiError(403, 'Access denied: Not owner and insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Require superuser privileges
 */
export const requireSuperuser = (req: Request, res: Response, next: NextFunction): void => {
  const authReq = req as AuthRequest;

  if (!authReq.user) {
    return next(new ApiError(401, 'Authentication required'));
  }

  if (!authReq.user.isSuperuser) {
    logger.warn(`Superuser access denied for user ${authReq.user.username}`);
    return next(new ApiError(403, 'Superuser access required'));
  }

  next();
};

/**
 * Check permission with wildcard support
 * @param userPermissions - User's permissions
 * @param requiredPermission - Required permission
 */
function checkPermissionWithWildcard(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  // Check exact permission
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Check wildcard permissions
  const [resource, action] = requiredPermission.split(':');
  
  // Check resource wildcard (e.g., "user:*")
  if (userPermissions.includes(`${resource}:*`)) {
    return true;
  }

  // Check global wildcard (e.g., "*:*")
  if (userPermissions.includes('*:*')) {
    return true;
  }

  // Check action wildcard across all resources (e.g., "*:read")
  if (action && userPermissions.includes(`*:${action}`)) {
    return true;
  }

  return false;
}

/**
 * Dynamic permission checking based on request data
 * @param getPermission - Function to determine required permission based on request
 */
export const requireDynamicPermission = (
  getPermission: (req: Request) => string | string[] | Promise<string | string[]>,
  options?: {
    requireAll?: boolean;
    checkDatabase?: boolean;
  }
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const permissions = await getPermission(req);
      const middleware = requirePermission(permissions, options);
      middleware(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has permission for specific HTTP method
 * Maps HTTP methods to CRUD actions
 */
export const requireResourcePermission = (resource: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const methodPermissionMap: Record<string, string> = {
      GET: 'read',
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete'
    };

    const action = methodPermissionMap[req.method];
    if (!action) {
      return next(new ApiError(405, 'Method not allowed'));
    }

    const permission = `${resource}:${action}`;
    const middleware = requirePermission(permission);
    middleware(req, res, next);
  };
};

/**
 * Combine multiple middleware checks with OR logic
 * Passes if any of the middleware checks pass
 */
export const requireAny = (
  ...middlewares: Array<(req: Request, res: Response, next: NextFunction) => void>
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let lastError: any;

    for (const middleware of middlewares) {
      try {
        await new Promise<void>((resolve, reject) => {
          middleware(req, res, (err?: any) => {
            if (err) reject(err);
            else resolve();
          });
        });
        // If any middleware passes, continue
        return next();
      } catch (error) {
        lastError = error;
      }
    }

    // All middlewares failed, return the last error
    next(lastError || new ApiError(403, 'Access denied'));
  };
};

/**
 * Log permission checks for audit purposes
 */
export const auditPermissionCheck = (
  action: string,
  resource?: string
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;

    if (authReq.user) {
      logger.info(`Permission check: User ${authReq.user.username} accessing ${action}${resource ? ` on ${resource}` : ''}`);
    }

    next();
  };
};