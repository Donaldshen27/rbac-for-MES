import { Request, Response, NextFunction } from 'express';
import {
  authenticate,
  optionalAuthenticate,
  requireRole,
  requirePermission,
  requireSuperuser,
  refreshTokenMiddleware
} from '../../../src/middlewares/auth.middleware';
import { JWTUtil } from '../../../src/utils/jwt.util';
import { AppError } from '../../../src/utils/errors';
import { User, RefreshToken } from '../../../src/models';

// Mock dependencies
jest.mock('../../../src/utils/jwt.util');
jest.mock('../../../src/models');

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    const mockPayload = {
      sub: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      roles: ['user'],
      permissions: ['read']
    };

    it('should authenticate valid token and attach user to request', async () => {
      const token = 'valid-token';
      mockReq.headers = { authorization: `Bearer ${token}` };
      
      (JWTUtil.verifyAccessToken as jest.Mock).mockReturnValue(mockPayload);
      (User.findByPk as jest.Mock).mockResolvedValue({
        id: 'user-123',
        isActive: true,
        isSuperuser: false
      });

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(JWTUtil.verifyAccessToken).toHaveBeenCalledWith(token);
      expect(User.findByPk).toHaveBeenCalledWith('user-123', {
        attributes: ['id', 'isActive', 'isSuperuser']
      });
      expect(mockReq.user).toEqual({
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['user'],
        permissions: ['read'],
        isSuperuser: false
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject request without authorization header', async () => {
      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No authorization header provided',
          statusCode: 401,
          code: 'AUTH_001'
        })
      );
    });

    it('should reject request with invalid authorization format', async () => {
      mockReq.headers = { authorization: 'InvalidFormat token' };

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid authorization format',
          statusCode: 401,
          code: 'AUTH_001'
        })
      );
    });

    it('should reject request with empty token', async () => {
      mockReq.headers = { authorization: 'Bearer ' };

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid authorization format',
          statusCode: 401,
          code: 'AUTH_001'
        })
      );
    });

    it('should reject request when user not found', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };
      
      (JWTUtil.verifyAccessToken as jest.Mock).mockReturnValue(mockPayload);
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not found or inactive',
          statusCode: 401,
          code: 'AUTH_005'
        })
      );
    });

    it('should reject request when user is inactive', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };
      
      (JWTUtil.verifyAccessToken as jest.Mock).mockReturnValue(mockPayload);
      (User.findByPk as jest.Mock).mockResolvedValue({
        id: 'user-123',
        isActive: false,
        isSuperuser: false
      });

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not found or inactive',
          statusCode: 401,
          code: 'AUTH_005'
        })
      );
    });

    it('should handle token verification errors', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };
      
      const tokenError = new AppError('Invalid token', 401, 'AUTH_003');
      (JWTUtil.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw tokenError;
      });

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(tokenError);
    });
  });

  describe('optionalAuthenticate', () => {
    it('should proceed without authentication when no header provided', async () => {
      await optionalAuthenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.user).toBeUndefined();
    });

    it('should authenticate when valid token provided', async () => {
      const token = 'valid-token';
      mockReq.headers = { authorization: `Bearer ${token}` };
      
      const mockPayload = {
        sub: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['user'],
        permissions: ['read']
      };
      
      (JWTUtil.verifyAccessToken as jest.Mock).mockReturnValue(mockPayload);
      (User.findByPk as jest.Mock).mockResolvedValue({
        id: 'user-123',
        isActive: true,
        isSuperuser: false
      });

      await optionalAuthenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should proceed without authentication when token is invalid', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };
      
      (JWTUtil.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await optionalAuthenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.user).toBeUndefined();
    });
  });

  describe('requireRole', () => {
    it('should allow access for user with required role', () => {
      mockReq.user = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['admin', 'user'],
        permissions: [],
        isSuperuser: false
      };

      const middleware = requireRole('admin');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow access for superuser regardless of role', () => {
      mockReq.user = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        roles: [],
        permissions: [],
        isSuperuser: true
      };

      const middleware = requireRole('admin');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access for user without required role', () => {
      mockReq.user = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['user'],
        permissions: [],
        isSuperuser: false
      };

      const middleware = requireRole('admin');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Insufficient permissions',
          statusCode: 403,
          code: 'AUTH_004'
        })
      );
    });

    it('should handle multiple required roles (OR logic)', () => {
      mockReq.user = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['editor'],
        permissions: [],
        isSuperuser: false
      };

      const middleware = requireRole(['admin', 'editor']);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access when user is not authenticated', () => {
      const middleware = requireRole('admin');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication required',
          statusCode: 401,
          code: 'AUTH_001'
        })
      );
    });
  });

  describe('requirePermission', () => {
    it('should allow access for user with exact permission', () => {
      mockReq.user = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        roles: [],
        permissions: ['user:create', 'user:read'],
        isSuperuser: false
      };

      const middleware = requirePermission('user:create');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow access for user with wildcard permission', () => {
      mockReq.user = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        roles: [],
        permissions: ['user:*'],
        isSuperuser: false
      };

      const middleware = requirePermission('user:create');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow access for superuser', () => {
      mockReq.user = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        roles: [],
        permissions: [],
        isSuperuser: true
      };

      const middleware = requirePermission('user:create');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access for user without permission', () => {
      mockReq.user = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        roles: [],
        permissions: ['user:read'],
        isSuperuser: false
      };

      const middleware = requirePermission('user:create');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Insufficient permissions',
          statusCode: 403,
          code: 'AUTH_004'
        })
      );
    });

    it('should handle multiple required permissions (OR logic)', () => {
      mockReq.user = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        roles: [],
        permissions: ['user:update'],
        isSuperuser: false
      };

      const middleware = requirePermission(['user:create', 'user:update']);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('requireSuperuser', () => {
    it('should allow access for superuser', () => {
      mockReq.user = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['admin'],
        permissions: [],
        isSuperuser: true
      };

      requireSuperuser(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access for non-superuser', () => {
      mockReq.user = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['admin'],
        permissions: ['*'],
        isSuperuser: false
      };

      requireSuperuser(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Superuser access required',
          statusCode: 403,
          code: 'AUTH_004'
        })
      );
    });

    it('should deny access when user is not authenticated', () => {
      requireSuperuser(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication required',
          statusCode: 401,
          code: 'AUTH_001'
        })
      );
    });
  });

  describe('refreshTokenMiddleware', () => {
    it('should validate refresh token and attach user info', async () => {
      const refreshToken = 'valid-refresh-token';
      mockReq.body = { refreshToken };

      const mockPayload = {
        sub: 'user-123',
        tokenId: 'token-456'
      };

      (JWTUtil.verifyRefreshToken as jest.Mock).mockReturnValue(mockPayload);
      (RefreshToken.findOne as jest.Mock).mockResolvedValue({
        token: refreshToken,
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 86400000) // 1 day in future
      });

      await refreshTokenMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(JWTUtil.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(RefreshToken.findOne).toHaveBeenCalledWith({
        where: {
          token: refreshToken,
          userId: 'user-123'
        }
      });
      expect(mockReq.user).toEqual({
        id: 'user-123',
        username: '',
        email: '',
        roles: [],
        permissions: [],
        isSuperuser: false
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject request without refresh token', async () => {
      mockReq.body = {};

      await refreshTokenMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Refresh token required',
          statusCode: 400,
          code: 'AUTH_001'
        })
      );
    });

    it('should reject invalid refresh token', async () => {
      mockReq.body = { refreshToken: 'invalid-token' };

      const tokenError = new AppError('Invalid refresh token', 401, 'AUTH_003');
      (JWTUtil.verifyRefreshToken as jest.Mock).mockImplementation(() => {
        throw tokenError;
      });

      await refreshTokenMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(tokenError);
    });

    it('should reject when token not found in database', async () => {
      mockReq.body = { refreshToken: 'valid-token' };

      (JWTUtil.verifyRefreshToken as jest.Mock).mockReturnValue({
        sub: 'user-123',
        tokenId: 'token-456'
      });
      (RefreshToken.findOne as jest.Mock).mockResolvedValue(null);

      await refreshTokenMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid refresh token',
          statusCode: 401,
          code: 'AUTH_003'
        })
      );
    });

    it('should reject and delete expired token', async () => {
      mockReq.body = { refreshToken: 'expired-token' };

      const mockToken = {
        token: 'expired-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() - 86400000), // 1 day in past
        destroy: jest.fn()
      };

      (JWTUtil.verifyRefreshToken as jest.Mock).mockReturnValue({
        sub: 'user-123',
        tokenId: 'token-456'
      });
      (RefreshToken.findOne as jest.Mock).mockResolvedValue(mockToken);

      await refreshTokenMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockToken.destroy).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Refresh token expired',
          statusCode: 401,
          code: 'AUTH_002'
        })
      );
    });
  });
});