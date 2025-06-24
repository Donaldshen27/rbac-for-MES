import { Request, Response, NextFunction } from 'express';
import { AuthController } from '../../../src/controllers/auth.controller';
import { AuthService } from '../../../src/services/auth.service';
import { ApiResponse } from '../../../src/utils/response';
import { ApiError } from '../../../src/utils/api-error';

// Mock dependencies
jest.mock('../../../src/services/auth.service');
jest.mock('../../../src/utils/response');
jest.mock('../../../src/utils/logger', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('AuthController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: undefined,
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0')
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        username: 'testuser'
      };

      const mockUser = {
        id: '1',
        email: registerData.email,
        username: registerData.username,
        firstName: null,
        lastName: null,
        roles: [],
        isActive: true,
        createdAt: new Date()
      };

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600
      };

      req.body = registerData;
      (AuthService.register as jest.Mock).mockResolvedValue({
        user: mockUser,
        tokens: mockTokens
      });
      (ApiResponse.success as jest.Mock).mockReturnValue({ success: true });

      await AuthController.register(req as Request, res as Response, next);

      expect(AuthService.register).toHaveBeenCalledWith({
        ...registerData,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Registration failed');
      req.body = { email: 'test@example.com' };
      (AuthService.register as jest.Mock).mockRejectedValue(error);

      await AuthController.register(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const credentials = {
        username: 'test@example.com',
        password: 'Test123!@#'
      };

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        roles: [{ id: 1, name: 'user' }],
        isActive: true,
        lastLogin: new Date()
      };

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600
      };

      req.body = credentials;
      (AuthService.login as jest.Mock).mockResolvedValue({
        user: mockUser,
        tokens: mockTokens
      });
      (ApiResponse.success as jest.Mock).mockReturnValue({ success: true });

      await AuthController.login(req as Request, res as Response, next);

      expect(AuthService.login).toHaveBeenCalledWith({
        ...credentials,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0'
      });
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600
      };

      req.body = { refreshToken };
      (AuthService.refreshToken as jest.Mock).mockResolvedValue(mockTokens);
      (ApiResponse.success as jest.Mock).mockReturnValue({ success: true });

      await AuthController.refreshToken(req as Request, res as Response, next);

      expect(AuthService.refreshToken).toHaveBeenCalledWith(refreshToken);
      expect(res.json).toHaveBeenCalled();
    });

    it('should return error if refresh token is missing', async () => {
      req.body = {};

      await AuthController.refreshToken(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Refresh token is required'
        })
      );
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const userId = '1';
      const refreshToken = 'refresh-token';

      req.user = { 
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        roles: ['user'],
        permissions: [],
        isSuperuser: false,
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      } as any;
      req.body = { refreshToken };
      (AuthService.logout as jest.Mock).mockResolvedValue(undefined);
      (ApiResponse.success as jest.Mock).mockReturnValue({ success: true });

      await AuthController.logout(req as Request, res as Response, next);

      expect(AuthService.logout).toHaveBeenCalledWith(userId, refreshToken);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('logoutAll', () => {
    it('should logout from all devices successfully', async () => {
      const userId = '1';

      req.user = { 
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        roles: ['user'],
        permissions: [],
        isSuperuser: false,
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      } as any;
      (AuthService.logout as jest.Mock).mockResolvedValue(undefined);
      (ApiResponse.success as jest.Mock).mockReturnValue({ success: true });

      await AuthController.logoutAll(req as Request, res as Response, next);

      expect(AuthService.logout).toHaveBeenCalledWith(userId);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        roles: [{ id: 1, name: 'user' }],
        isActive: true,
        isSuperuser: false,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      req.user = mockUser as any;
      (ApiResponse.success as jest.Mock).mockReturnValue({ success: true });

      await AuthController.getProfile(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const userId = '1';
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const mockUser = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Updated',
        lastName: 'Name',
        updatedAt: new Date(),
        update: jest.fn().mockResolvedValue({
          id: userId,
          email: 'test@example.com',
          username: 'testuser',
          firstName: 'Updated',
          lastName: 'Name',
          updatedAt: new Date()
        })
      };

      req.user = mockUser as any;
      req.body = updateData;
      (ApiResponse.success as jest.Mock).mockReturnValue({ success: true });

      await AuthController.updateProfile(req as Request, res as Response, next);

      expect(mockUser.update).toHaveBeenCalledWith(updateData);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userId = '1';
      const passwordData = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!'
      };

      req.user = { 
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        roles: ['user'],
        permissions: [],
        isSuperuser: false,
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      } as any;
      req.body = passwordData;
      (AuthService.changePassword as jest.Mock).mockResolvedValue(undefined);
      (ApiResponse.success as jest.Mock).mockReturnValue({ success: true });

      await AuthController.changePassword(req as Request, res as Response, next);

      expect(AuthService.changePassword).toHaveBeenCalledWith(
        userId,
        passwordData.currentPassword,
        passwordData.newPassword
      );
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('getSessions', () => {
    it('should get active sessions successfully', async () => {
      const userId = '1';
      const mockSessions = [
        {
          id: 'session-1',
          token: 'token-1',
          userAgent: 'Chrome',
          ipAddress: '127.0.0.1',
          createdAt: new Date(),
          expiresAt: new Date()
        }
      ];

      req.user = { 
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        roles: ['user'],
        permissions: [],
        isSuperuser: false,
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      } as any;
      req.body = { currentRefreshToken: 'token-1' };
      (AuthService.getActiveSessions as jest.Mock).mockResolvedValue(mockSessions);
      (ApiResponse.success as jest.Mock).mockReturnValue({ success: true });

      await AuthController.getSessions(req as Request, res as Response, next);

      expect(AuthService.getActiveSessions).toHaveBeenCalledWith(userId);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('revokeSession', () => {
    it('should revoke session successfully', async () => {
      const userId = '1';
      const sessionId = 'session-1';

      req.user = { 
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        roles: ['user'],
        permissions: [],
        isSuperuser: false,
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      } as any;
      req.params = { sessionId };
      (AuthService.revokeSession as jest.Mock).mockResolvedValue(undefined);
      (ApiResponse.success as jest.Mock).mockReturnValue({ success: true });

      await AuthController.revokeSession(req as Request, res as Response, next);

      expect(AuthService.revokeSession).toHaveBeenCalledWith(userId, sessionId);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        roles: [{ id: 1, name: 'user' }],
        permissions: [],
        isSuperuser: false,
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      };

      req.user = mockUser as any;
      (ApiResponse.success as jest.Mock).mockReturnValue({ success: true });

      await AuthController.validateToken(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalled();
    });
  });
});