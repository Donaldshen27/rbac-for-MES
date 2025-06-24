import { AuthService } from '../../../src/services/auth.service';
import { User } from '../../../src/models/User';
import { Role } from '../../../src/models/Role';
import { RefreshToken } from '../../../src/models/RefreshToken';
import { AuditLog } from '../../../src/models/AuditLog';
import { AuthUtil } from '../../../src/utils/auth.util';
import { BcryptUtil } from '../../../src/utils/bcrypt.util';
import { JWTUtil } from '../../../src/utils/jwt.util';
import { ApiError } from '../../../src/utils/api-error';

// Mock dependencies
jest.mock('../../../src/models/User');
jest.mock('../../../src/models/Role');
jest.mock('../../../src/models/RefreshToken');
jest.mock('../../../src/models/AuditLog');
jest.mock('../../../src/utils/auth.util');
jest.mock('../../../src/utils/bcrypt.util');
jest.mock('../../../src/utils/jwt.util');
jest.mock('../../../src/utils/logger', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerData = {
      email: 'test@example.com',
      password: 'Test123!@#',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User'
    };

    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 1,
        email: registerData.email,
        username: registerData.username,
        setRoles: jest.fn()
      };

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (BcryptUtil.hashPassword as jest.Mock).mockResolvedValue('hashed-password');
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (Role.findOne as jest.Mock).mockResolvedValue({ id: 1, name: 'user' });
      (AuthUtil.generateUserTokens as jest.Mock).mockResolvedValue(mockTokens);
      (AuditLog.create as jest.Mock).mockResolvedValue({});

      const result = await AuthService.register(registerData);

      expect(result.user).toBe(mockUser);
      expect(result.tokens).toBe(mockTokens);
      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: registerData.email },
        transaction: undefined
      });
      expect(BcryptUtil.hashPassword).toHaveBeenCalledWith(registerData.password);
      expect(mockUser.setRoles).toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      (User.findOne as jest.Mock).mockResolvedValueOnce({ id: 1 });

      await expect(AuthService.register(registerData)).rejects.toThrow(
        new ApiError(409, 'User with this email already exists')
      );
    });

    it('should throw error if username already exists', async () => {
      (User.findOne as jest.Mock)
        .mockResolvedValueOnce(null) // Email check
        .mockResolvedValueOnce({ id: 1 }); // Username check

      await expect(AuthService.register(registerData)).rejects.toThrow(
        new ApiError(409, 'Username is already taken')
      );
    });
  });

  describe('login', () => {
    const credentials = {
      username: 'test@example.com',
      password: 'Test123!@#'
    };

    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password: 'hashed-password',
      status: 'active',
      failedLoginAttempts: 0,
      increment: jest.fn(),
      update: jest.fn()
    };

    it('should login user successfully with email', async () => {
      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (BcryptUtil.comparePassword as jest.Mock).mockResolvedValue(true);
      (AuthUtil.generateUserTokens as jest.Mock).mockResolvedValue(mockTokens);
      (AuditLog.create as jest.Mock).mockResolvedValue({});

      const result = await AuthService.login(credentials);

      expect(result.user).toBe(mockUser);
      expect(result.tokens).toBe(mockTokens);
      expect(mockUser.update).toHaveBeenCalledWith(
        { lastLoginAt: expect.any(Date) },
        { transaction: undefined }
      );
    });

    it('should throw error for non-existent user', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(AuthService.login(credentials)).rejects.toThrow(
        new ApiError(401, 'Invalid credentials')
      );
    });

    it('should throw error for inactive user', async () => {
      const inactiveUser = { ...mockUser, status: 'inactive' };
      (User.findOne as jest.Mock).mockResolvedValue(inactiveUser);

      await expect(AuthService.login(credentials)).rejects.toThrow(
        new ApiError(403, 'Account is inactive')
      );
    });

    it('should increment failed attempts on wrong password', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (BcryptUtil.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(AuthService.login(credentials)).rejects.toThrow(
        new ApiError(401, 'Invalid credentials')
      );

      expect(mockUser.increment).toHaveBeenCalledWith('failedLoginAttempts', { transaction: undefined });
    });

    it('should lock account after 5 failed attempts', async () => {
      const userWithFailedAttempts = { ...mockUser, failedLoginAttempts: 4 };
      (User.findOne as jest.Mock).mockResolvedValue(userWithFailedAttempts);
      (BcryptUtil.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(AuthService.login(credentials)).rejects.toThrow(
        new ApiError(403, 'Account has been locked due to multiple failed login attempts')
      );

      expect(userWithFailedAttempts.update).toHaveBeenCalledWith(
        { status: 'locked' },
        { transaction: undefined }
      );
    });
  });

  describe('refreshToken', () => {
    const refreshToken = 'valid-refresh-token';
    const mockPayload = { userId: 1 };

    it('should refresh tokens successfully', async () => {
      const mockStoredToken = {
        token: refreshToken,
        userId: 1,
        expiresAt: new Date(Date.now() + 86400000),
        user: {
          id: 1,
          email: 'test@example.com',
          status: 'active'
        },
        destroy: jest.fn()
      };

      const mockNewTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600
      };

      (JWTUtil.verifyRefreshToken as jest.Mock).mockReturnValue(mockPayload);
      (RefreshToken.findOne as jest.Mock).mockResolvedValue(mockStoredToken);
      (AuthUtil.generateUserTokens as jest.Mock).mockResolvedValue(mockNewTokens);

      const result = await AuthService.refreshToken(refreshToken);

      expect(result).toBe(mockNewTokens);
      expect(mockStoredToken.destroy).toHaveBeenCalled();
    });

    it('should throw error for invalid refresh token', async () => {
      (JWTUtil.verifyRefreshToken as jest.Mock).mockReturnValue(mockPayload);
      (RefreshToken.findOne as jest.Mock).mockResolvedValue(null);

      await expect(AuthService.refreshToken(refreshToken)).rejects.toThrow(
        new ApiError(401, 'Invalid refresh token')
      );
    });

    it('should throw error for expired refresh token', async () => {
      const expiredToken = {
        token: refreshToken,
        expiresAt: new Date(Date.now() - 1000),
        destroy: jest.fn()
      };

      (JWTUtil.verifyRefreshToken as jest.Mock).mockReturnValue(mockPayload);
      (RefreshToken.findOne as jest.Mock).mockResolvedValue(expiredToken);

      await expect(AuthService.refreshToken(refreshToken)).rejects.toThrow(
        new ApiError(401, 'Refresh token has expired')
      );

      expect(expiredToken.destroy).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout user by revoking specific token', async () => {
      const userId = '1';
      const refreshToken = 'refresh-token';

      (AuthUtil.revokeRefreshToken as jest.Mock).mockResolvedValue(undefined);
      (AuditLog.create as jest.Mock).mockResolvedValue({});

      await AuthService.logout(userId, refreshToken);

      expect(AuthUtil.revokeRefreshToken).toHaveBeenCalledWith(refreshToken, undefined);
      expect(AuditLog.create).toHaveBeenCalledWith({
        userId,
        action: 'USER_LOGOUT',
        resource: 'User',
        resourceId: userId,
        details: { logoutType: 'single' }
      }, { transaction: undefined });
    });

    it('should logout user by revoking all tokens', async () => {
      const userId = '1';

      (AuthUtil.revokeAllUserTokens as jest.Mock).mockResolvedValue(undefined);
      (AuditLog.create as jest.Mock).mockResolvedValue({});

      await AuthService.logout(userId);

      expect(AuthUtil.revokeAllUserTokens).toHaveBeenCalledWith(userId, undefined);
      expect(AuditLog.create).toHaveBeenCalledWith({
        userId,
        action: 'USER_LOGOUT',
        resource: 'User',
        resourceId: userId,
        details: { logoutType: 'all' }
      }, { transaction: undefined });
    });
  });

  describe('changePassword', () => {
    const userId = 1;
    const currentPassword = 'OldPass123!';
    const newPassword = 'NewPass123!';

    it('should change password successfully', async () => {
      const mockUser = {
        id: userId,
        password: 'hashed-old-password',
        update: jest.fn()
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (BcryptUtil.comparePassword as jest.Mock).mockResolvedValue(true);
      (BcryptUtil.hashPassword as jest.Mock).mockResolvedValue('hashed-new-password');
      (AuthUtil.revokeAllUserTokens as jest.Mock).mockResolvedValue(undefined);
      (AuditLog.create as jest.Mock).mockResolvedValue({});

      await AuthService.changePassword(userId, currentPassword, newPassword);

      expect(mockUser.update).toHaveBeenCalledWith({
        password: 'hashed-new-password',
        passwordChangedAt: expect.any(Date)
      }, { transaction: undefined });
      expect(AuthUtil.revokeAllUserTokens).toHaveBeenCalledWith(userId, undefined);
    });

    it('should throw error if current password is incorrect', async () => {
      const mockUser = {
        id: userId,
        password: 'hashed-old-password'
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (BcryptUtil.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(
        AuthService.changePassword(userId, currentPassword, newPassword)
      ).rejects.toThrow(new ApiError(401, 'Current password is incorrect'));
    });
  });

  describe('requestPasswordReset', () => {
    const email = 'test@example.com';

    it('should generate reset token for existing user', async () => {
      const mockUser = {
        id: 1,
        email,
        update: jest.fn()
      };

      const resetToken = 'reset-token';
      const hashedToken = 'hashed-reset-token';

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (BcryptUtil.generateRandomToken as jest.Mock).mockResolvedValue(resetToken);
      (BcryptUtil.hashPassword as jest.Mock).mockResolvedValue(hashedToken);
      (AuditLog.create as jest.Mock).mockResolvedValue({});

      const result = await AuthService.requestPasswordReset(email);

      expect(result).toBe(resetToken);
      expect(mockUser.update).toHaveBeenCalledWith({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: expect.any(Date)
      }, { transaction: undefined });
    });

    it('should return generic message for non-existent email', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const result = await AuthService.requestPasswordReset(email);

      expect(result).toBe('If the email exists, a reset link will be sent');
    });
  });

  describe('resetPassword', () => {
    const token = 'reset-token';
    const newPassword = 'NewPass123!';

    it('should reset password successfully', async () => {
      const mockUser = {
        id: 1,
        resetPasswordToken: 'hashed-reset-token',
        resetPasswordExpires: new Date(Date.now() + 3600000),
        update: jest.fn()
      };

      (User.findAll as jest.Mock).mockResolvedValue([mockUser]);
      (BcryptUtil.comparePassword as jest.Mock).mockResolvedValue(true);
      (BcryptUtil.hashPassword as jest.Mock).mockResolvedValue('hashed-new-password');
      (AuthUtil.revokeAllUserTokens as jest.Mock).mockResolvedValue(undefined);
      (AuditLog.create as jest.Mock).mockResolvedValue({});

      await AuthService.resetPassword(token, newPassword);

      expect(mockUser.update).toHaveBeenCalledWith({
        password: 'hashed-new-password',
        passwordChangedAt: expect.any(Date),
        resetPasswordToken: null,
        resetPasswordExpires: null
      }, { transaction: undefined });
    });

    it('should throw error for invalid token', async () => {
      (User.findAll as jest.Mock).mockResolvedValue([]);

      await expect(
        AuthService.resetPassword(token, newPassword)
      ).rejects.toThrow(new ApiError(400, 'Invalid or expired reset token'));
    });
  });
});