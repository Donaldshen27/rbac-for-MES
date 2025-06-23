import { Transaction } from 'sequelize';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { Role } from '../models/Role';
import { AuthUtil } from '../utils/auth.util';
import { BcryptUtil } from '../utils/bcrypt.util';
import { JWTUtil } from '../utils/jwt.util';
import { logger } from '../utils/logger';
import { LoginCredentials, RegisterData, TokenPair, TokenPayload } from '../types/auth.types';
import { AuditLog } from '../models/AuditLog';
import { 
  AuthenticationError, 
  ConflictError, 
  ValidationError, 
  NotFoundError,
  AppError 
} from '../utils/errors';
import { ErrorCode } from '../types';

export class AuthService {
  /**
   * Register a new user
   */
  static async register(data: RegisterData, transaction?: Transaction): Promise<{ user: User; tokens: TokenPair }> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        where: { email: data.email },
        transaction
      });

      if (existingUser) {
        throw new ConflictError('User with this email already exists', ErrorCode.USER_EMAIL_EXISTS);
      }

      // Check if username is taken
      if (data.username) {
        const existingUsername = await User.findOne({
          where: { username: data.username },
          transaction
        });

        if (existingUsername) {
          throw new ConflictError('Username is already taken', ErrorCode.USER_ALREADY_EXISTS);
        }
      }

      // Hash password
      const hashedPassword = await BcryptUtil.hashPassword(data.password);

      // Create user
      const user = await User.create({
        email: data.email,
        username: data.username || data.email.split('@')[0],
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        isActive: true
      }, { transaction });

      // If roleIds provided, assign roles
      if (data.roleIds && data.roleIds.length > 0) {
        const roles = await Role.findAll({
          where: { id: data.roleIds },
          transaction
        });

        if (roles.length !== data.roleIds.length) {
          throw new ValidationError('One or more role IDs are invalid');
        }

        await user.setRoles(roles);
      } else {
        // Assign default role if exists
        const defaultRole = await Role.findOne({
          where: { name: 'user' },
          transaction
        });

        if (defaultRole) {
          await user.setRoles([defaultRole]);
        }
      }

      // Generate tokens
      const tokens = await AuthUtil.generateUserTokens(user, data.ipAddress, data.userAgent);

      // Log registration
      await AuditLog.create({
        userId: user.id,
        action: 'USER_REGISTERED',
        resource: 'User',
        resourceId: user.id,
        details: {
          email: user.email,
          username: user.username
        },
        ipAddress: data.ipAddress,
        userAgent: data.userAgent
      }, { transaction });

      logger.info(`User registered successfully: ${user.email}`);

      return { user, tokens };
    } catch (error) {
      logger.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  static async login(credentials: LoginCredentials, transaction?: Transaction): Promise<{ user: User; tokens: TokenPair }> {
    try {
      // Find user by email or username
      const whereClause = credentials.email 
        ? { email: credentials.email }
        : credentials.username?.includes('@')
          ? { email: credentials.username }
          : { username: credentials.username };
          
      const user = await User.findOne({
        where: whereClause,
        include: [
          {
            model: Role,
            as: 'roles',
            attributes: ['id', 'name', 'description'],
            through: { attributes: [] }
          }
        ],
        transaction
      });

      if (!user) {
        throw new AuthenticationError(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new AuthenticationError(ErrorCode.AUTH_ACCOUNT_DISABLED, 'Account is inactive');
      }

      // Verify password
      const isPasswordValid = await BcryptUtil.comparePassword(credentials.password, user.password);
      if (!isPasswordValid) {
        // Since failedLoginAttempts doesn't exist in the model,
        // we'll just log the failed attempt without tracking count
        logger.warn(`Failed login attempt for user: ${user.email}`);

        throw new AuthenticationError(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Invalid credentials');
      }

      // Update last login time
      await user.update({ lastLogin: new Date() }, { transaction });

      // Generate tokens
      const tokens = await AuthUtil.generateUserTokens(user, credentials.ipAddress, credentials.userAgent);

      // Log login
      await AuditLog.create({
        userId: user.id,
        action: 'USER_LOGIN',
        resource: 'User',
        resourceId: user.id,
        details: {
          loginMethod: credentials.email ? 'email' : 'username'
        },
        ipAddress: credentials.ipAddress,
        userAgent: credentials.userAgent
      }, { transaction });

      logger.info(`User logged in successfully: ${user.email}`);

      return { user, tokens };
    } catch (error) {
      logger.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string, transaction?: Transaction): Promise<TokenPair> {
    try {
      // Verify refresh token
      const payload = JWTUtil.verifyRefreshToken(refreshToken);
      
      // Find the refresh token in database
      const storedToken = await RefreshToken.findOne({
        where: { 
          token: refreshToken,
          userId: payload.sub 
        },
        include: [
          {
            model: User,
            as: 'user',
            include: [
              {
                model: Role,
                as: 'roles',
                attributes: ['id', 'name'],
                through: { attributes: [] }
              }
            ]
          }
        ],
        transaction
      });

      if (!storedToken) {
        throw new AuthenticationError(ErrorCode.AUTH_TOKEN_INVALID, 'Invalid refresh token');
      }

      // Check if token is expired
      if (new Date() > storedToken.expiresAt) {
        await storedToken.destroy({ transaction });
        throw new AuthenticationError(ErrorCode.AUTH_TOKEN_EXPIRED, 'Refresh token has expired');
      }

      // Check if user is active
      if (!storedToken.user || !storedToken.user.isActive) {
        throw new AuthenticationError(ErrorCode.AUTH_ACCOUNT_DISABLED, 'Account is inactive');
      }

      // Revoke old refresh token
      await storedToken.destroy({ transaction });

      // Generate new tokens
      const tokens = await AuthUtil.generateUserTokens(storedToken.user, storedToken.ipAddress, storedToken.userAgent);

      logger.info(`Tokens refreshed for user: ${storedToken.user.email}`);

      return tokens;
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  static async logout(userId: string, refreshToken?: string, transaction?: Transaction): Promise<void> {
    try {
      if (refreshToken) {
        // Revoke specific refresh token
        await AuthUtil.revokeRefreshToken(refreshToken);
      } else {
        // Revoke all user tokens
        await AuthUtil.revokeAllUserTokens(userId);
      }

      // Log logout
      await AuditLog.create({
        userId,
        action: 'USER_LOGOUT',
        resource: 'User',
        resourceId: userId,
        details: {
          logoutType: refreshToken ? 'single' : 'all'
        }
      }, { transaction });

      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      logger.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  static async changePassword(
    userId: string, 
    currentPassword: string, 
    newPassword: string,
    transaction?: Transaction
  ): Promise<void> {
    try {
      const user = await User.findByPk(userId, { transaction });
      
      if (!user) {
        throw new NotFoundError('User');
      }

      // Verify current password
      const isPasswordValid = await BcryptUtil.comparePassword(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new AuthenticationError(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await BcryptUtil.hashPassword(newPassword);

      // Update password
      await user.update({ 
        password: hashedPassword
      }, { transaction });

      // Revoke all refresh tokens (force re-login)
      await AuthUtil.revokeAllUserTokens(userId);

      // Log password change
      await AuditLog.create({
        userId,
        action: 'PASSWORD_CHANGED',
        resource: 'User',
        resourceId: userId,
        details: {
          forced_logout: true
        }
      }, { transaction });

      logger.info(`Password changed for user: ${userId}`);
    } catch (error) {
      logger.error('Password change failed:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string, transaction?: Transaction): Promise<string> {
    try {
      const user = await User.findOne({
        where: { email },
        transaction
      });

      if (!user) {
        // Don't reveal if email exists
        logger.warn(`Password reset requested for non-existent email: ${email}`);
        return 'If the email exists, a reset link will be sent';
      }

      // Generate reset token
      const resetToken = await BcryptUtil.generateRandomToken();
      const resetTokenHash = await BcryptUtil.hashPassword(resetToken);
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      // Since resetPasswordToken fields don't exist in the model,
      // we would need to implement a separate PasswordReset model
      // For now, we'll just return the token
      logger.warn('Password reset tokens need to be stored in a separate model');

      // Log password reset request
      await AuditLog.create({
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        resource: 'User',
        resourceId: user.id,
        details: { email }
      }, { transaction });

      logger.info(`Password reset requested for: ${email}`);

      // Return the token (in real app, this would be sent via email)
      return resetToken;
    } catch (error) {
      logger.error('Password reset request failed:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  static async resetPassword(
    token: string, 
    newPassword: string,
    transaction?: Transaction
  ): Promise<void> {
    try {
      // Since resetPasswordToken fields don't exist in the User model,
      // this functionality needs to be implemented with a separate model
      throw new AppError(ErrorCode.INTERNAL_SERVER_ERROR, 'Password reset functionality needs to be implemented with a separate PasswordReset model', 501);

      // Hash new password
      const hashedPassword = await BcryptUtil.hashPassword(newPassword);

      // This code is unreachable due to the previous change, but would be:
      // await matchedUser.update({
      //   password: hashedPassword
      // }, { transaction });

      // This code is commented out as the resetPassword functionality needs to be implemented
      // with a separate PasswordReset model
      
      // // Revoke all refresh tokens
      // await AuthUtil.revokeAllUserTokens(matchedUser.id, transaction);

      // // Log password reset
      // await AuditLog.create({
      //   userId: matchedUser.id,
      //   action: 'PASSWORD_RESET_COMPLETED',
      //   resource: 'User',
      //   resourceId: matchedUser.id
      // }, { transaction });

      // logger.info(`Password reset completed for user: ${matchedUser.id}`);
    } catch (error) {
      logger.error('Password reset failed:', error);
      throw error;
    }
  }

  /**
   * Verify email with token
   */
  static async verifyEmail(userId: string, token: string, transaction?: Transaction): Promise<void> {
    try {
      const user = await User.findByPk(userId, { transaction });
      
      if (!user) {
        throw new NotFoundError('User');
      }

      // Since emailVerified fields don't exist in the model,
      // this functionality needs to be implemented differently
      throw new AppError(ErrorCode.INTERNAL_SERVER_ERROR, 'Email verification functionality needs to be implemented with proper fields in the User model', 501);

      // Log email verification
      await AuditLog.create({
        userId,
        action: 'EMAIL_VERIFIED',
        resource: 'User',
        resourceId: userId
      }, { transaction });

      logger.info(`Email verified for user: ${userId}`);
    } catch (error) {
      logger.error('Email verification failed:', error);
      throw error;
    }
  }

  /**
   * Get active sessions for a user
   */
  static async getActiveSessions(userId: string): Promise<RefreshToken[]> {
    try {
      const sessions = await RefreshToken.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']]
      });

      return sessions;
    } catch (error) {
      logger.error('Failed to get active sessions:', error);
      throw error;
    }
  }

  /**
   * Revoke a specific session
   */
  static async revokeSession(userId: string, tokenId: string, transaction?: Transaction): Promise<void> {
    try {
      const token = await RefreshToken.findOne({
        where: { id: tokenId, userId },
        transaction
      });

      if (!token) {
        throw new NotFoundError('Session');
      }

      await token.destroy({ transaction });

      logger.info(`Session revoked for user ${userId}: ${tokenId}`);
    } catch (error) {
      logger.error('Failed to revoke session:', error);
      throw error;
    }
  }
}