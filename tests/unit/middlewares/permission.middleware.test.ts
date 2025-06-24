import { Request, Response, NextFunction } from 'express';
import {
  requirePermission,
  requireRole,
  requireOwnershipOrPermission,
  requireSuperuser,
  requireDynamicPermission,
  requireResourcePermission,
  requireAny,
  auditPermissionCheck
} from '../../../src/middlewares/permission.middleware';
import permissionService from '../../../src/services/permission.service';
import { logger } from '../../../src/utils/logger';
import { ApiError } from '../../../src/utils/ApiError';

jest.mock('../../../src/services/permission.service');
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Permission Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      params: {},
      body: {},
      user: {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['user'],
        permissions: ['user:read', 'user:update'],
        isSuperuser: false,
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      }
    };
    mockRes = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('requirePermission', () => {
    it('should allow access for users with required permission', () => {
      const middleware = requirePermission('user:read');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow access for superusers', () => {
      mockReq.user!.isSuperuser = true;
      const middleware = requirePermission('admin:delete');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access for users without required permission', () => {
      const middleware = requirePermission('admin:delete');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'Insufficient permissions'
        })
      );
    });

    it('should check wildcard permissions', () => {
      mockReq.user!.permissions = ['user:*'];
      const middleware = requirePermission('user:delete');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle multiple permissions with OR logic', () => {
      const middleware = requirePermission(['user:delete', 'user:read']);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle multiple permissions with AND logic', () => {
      const middleware = requirePermission(['user:read', 'user:update'], { requireAll: true });
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should fail when not all required permissions are present', () => {
      const middleware = requirePermission(['user:read', 'user:delete'], { requireAll: true });
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });

    it('should check database for real-time permissions', async () => {
      (permissionService.checkUserPermission as jest.Mock).mockResolvedValue({
        hasPermission: true,
        source: 'role:admin'
      });

      const middleware = requirePermission('admin:read', { checkDatabase: true });
      await middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(permissionService.checkUserPermission).toHaveBeenCalledWith('user-123', 'admin:read');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should require authentication', () => {
      delete mockReq.user;
      const middleware = requirePermission('user:read');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Authentication required'
        })
      );
    });
  });

  describe('requireRole', () => {
    it('should allow access for users with required role', () => {
      const middleware = requireRole('user');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow access for superusers', () => {
      mockReq.user!.isSuperuser = true;
      const middleware = requireRole('admin');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access for users without required role', () => {
      const middleware = requireRole('admin');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'Insufficient role privileges'
        })
      );
    });

    it('should handle multiple roles', () => {
      const middleware = requireRole(['admin', 'user']);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('requireOwnershipOrPermission', () => {
    it('should allow access for resource owner', async () => {
      mockReq.params = { userId: 'user-123' };
      const middleware = requireOwnershipOrPermission({
        ownerIdParam: 'userId',
        fallbackPermission: 'user:update'
      });
      await middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow access with fallback permission', async () => {
      mockReq.params = { userId: 'other-user' };
      const middleware = requireOwnershipOrPermission({
        ownerIdParam: 'userId',
        fallbackPermission: 'user:update'
      });
      await middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access without ownership or permission', async () => {
      mockReq.params = { userId: 'other-user' };
      const middleware = requireOwnershipOrPermission({
        ownerIdParam: 'userId',
        fallbackPermission: 'admin:update'
      });
      await middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'Access denied: Not owner and insufficient permissions'
        })
      );
    });

    it('should use custom getUserId function', async () => {
      const getUserId = jest.fn().mockResolvedValue('user-123');
      const middleware = requireOwnershipOrPermission({
        getUserId,
        fallbackPermission: 'admin:update'
      });
      await middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(getUserId).toHaveBeenCalledWith(mockReq);
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('requireSuperuser', () => {
    it('should allow access for superusers', () => {
      mockReq.user!.isSuperuser = true;
      requireSuperuser(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access for non-superusers', () => {
      requireSuperuser(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'Superuser access required'
        })
      );
    });

    it('should require authentication', () => {
      delete mockReq.user;
      requireSuperuser(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Authentication required'
        })
      );
    });
  });

  describe('requireDynamicPermission', () => {
    it('should handle dynamic permission resolution', async () => {
      const getPermission = jest.fn().mockReturnValue('user:read');
      const middleware = requireDynamicPermission(getPermission);
      await middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(getPermission).toHaveBeenCalledWith(mockReq);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle async permission resolution', async () => {
      const getPermission = jest.fn().mockResolvedValue(['user:read', 'user:update']);
      const middleware = requireDynamicPermission(getPermission);
      await middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle errors in permission resolution', async () => {
      const getPermission = jest.fn().mockRejectedValue(new Error('Failed to get permission'));
      const middleware = requireDynamicPermission(getPermission);
      await middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('requireResourcePermission', () => {
    it('should map GET method to read permission', () => {
      mockReq.method = 'GET';
      const middleware = requireResourcePermission('user');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should map POST method to create permission', () => {
      mockReq.method = 'POST';
      mockReq.user!.permissions = ['user:create'];
      const middleware = requireResourcePermission('user');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should map PUT/PATCH methods to update permission', () => {
      mockReq.method = 'PUT';
      const middleware = requireResourcePermission('user');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();

      mockReq.method = 'PATCH';
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('should map DELETE method to delete permission', () => {
      mockReq.method = 'DELETE';
      mockReq.user!.permissions = ['user:delete'];
      const middleware = requireResourcePermission('user');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject unsupported methods', () => {
      mockReq.method = 'OPTIONS';
      const middleware = requireResourcePermission('user');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 405,
          message: 'Method not allowed'
        })
      );
    });
  });

  describe('requireAny', () => {
    it('should pass if any middleware passes', async () => {
      const middleware1 = requirePermission('admin:read');
      const middleware2 = requirePermission('user:read');
      const combined = requireAny(middleware1, middleware2);
      
      await combined(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should fail if all middlewares fail', async () => {
      const middleware1 = requirePermission('admin:read');
      const middleware2 = requirePermission('admin:write');
      const combined = requireAny(middleware1, middleware2);
      
      await combined(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });

    it('should pass for superuser in any middleware', async () => {
      mockReq.user!.isSuperuser = true;
      const middleware1 = requirePermission('admin:read');
      const middleware2 = requireRole('admin');
      const combined = requireAny(middleware1, middleware2);
      
      await combined(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('auditPermissionCheck', () => {
    it('should log permission checks', () => {
      const middleware = auditPermissionCheck('read', 'user');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(logger.info).toHaveBeenCalledWith(
        'Permission check: User testuser accessing read on user'
      );
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle missing resource', () => {
      const middleware = auditPermissionCheck('login');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(logger.info).toHaveBeenCalledWith(
        'Permission check: User testuser accessing login'
      );
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should skip logging for unauthenticated requests', () => {
      delete mockReq.user;
      const middleware = auditPermissionCheck('read', 'user');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(logger.info).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});