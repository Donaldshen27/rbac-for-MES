import { Transaction } from 'sequelize';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { Role } from '../models/Role';
import { AuthUtil } from '../utils/auth.util';
import { BcryptUtil } from '../utils/bcrypt.util';
import { JWTUtil } from '../utils/jwt.util';
import { ApiError } from '../utils/api-error';
import logger from '../utils/logger';
import { LoginCredentials, RegisterData, TokenPair, TokenPayload } from '../types/auth.types';
import { AuditLog } from '../models/AuditLog';

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
        throw new ApiError(409, 'User with this email already exists');
      }

      // Check if username is taken
      if (data.username) {
        const existingUsername = await User.findOne({
          where: { username: data.username },
          transaction
        });

        if (existingUsername) {
          throw new ApiError(409, 'Username is already taken');
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
        phone: data.phone,
        status: 'active'
      }, { transaction });

      // If roleIds provided, assign roles
      if (data.roleIds && data.roleIds.length > 0) {
        const roles = await Role.findAll({
          where: { id: data.roleIds },
          transaction
        });

        if (roles.length !== data.roleIds.length) {
          throw new ApiError(400, 'One or more role IDs are invalid');
        }

        await user.setRoles(roles, { transaction });
      } else {
        // Assign default role if exists
        const defaultRole = await Role.findOne({
          where: { name: 'user' },
          transaction
        });

        if (defaultRole) {
          await user.setRoles([defaultRole], { transaction });
        }
      }

      // Generate tokens
      const tokens = await AuthUtil.generateUserTokens(user, transaction);

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
      const user = await User.findOne({
        where: credentials.username.includes('@') 
          ? { email: credentials.username }
          : { username: credentials.username },
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
        throw new ApiError(401, 'Invalid credentials');
      }

      // Check if user is active
      if (user.status !== 'active') {
        throw new ApiError(403, `Account is ${user.status}`);
      }

      // Verify password
      const isPasswordValid = await BcryptUtil.comparePassword(credentials.password, user.password);
      if (!isPasswordValid) {
        // Update failed login attempts
        await user.increment('failedLoginAttempts', { transaction });
        
        // Lock account after 5 failed attempts
        if (user.failedLoginAttempts >= 4) {
          await user.update({ status: 'locked' }, { transaction });
          throw new ApiError(403, 'Account has been locked due to multiple failed login attempts');
        }

        throw new ApiError(401, 'Invalid credentials');
      }

      // Reset failed login attempts
      if (user.failedLoginAttempts > 0) {
        await user.update({ 
          failedLoginAttempts: 0,
          lastLoginAt: new Date()
        }, { transaction });
      } else {
        await user.update({ lastLoginAt: new Date() }, { transaction });
      }

      // Generate tokens
      const tokens = await AuthUtil.generateUserTokens(user, transaction);

      // Log login
      await AuditLog.create({
        userId: user.id,
        action: 'USER_LOGIN',
        resource: 'User',
        resourceId: user.id,
        details: {
          loginMethod: credentials.username.includes('@') ? 'email' : 'username'
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
          userId: payload.userId 
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
        throw new ApiError(401, 'Invalid refresh token');
      }

      // Check if token is expired
      if (new Date() > storedToken.expiresAt) {
        await storedToken.destroy({ transaction });
        throw new ApiError(401, 'Refresh token has expired');
      }

      // Check if user is active
      if (storedToken.user.status !== 'active') {
        throw new ApiError(403, `Account is ${storedToken.user.status}`);
      }

      // Revoke old refresh token
      await storedToken.destroy({ transaction });

      // Generate new tokens
      const tokens = await AuthUtil.generateUserTokens(storedToken.user, transaction);

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
  static async logout(userId: number, refreshToken?: string, transaction?: Transaction): Promise<void> {
    try {
      if (refreshToken) {
        // Revoke specific refresh token
        await AuthUtil.revokeRefreshToken(refreshToken, transaction);
      } else {
        // Revoke all user tokens
        await AuthUtil.revokeAllUserTokens(userId, transaction);
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
    userId: number, 
    currentPassword: string, 
    newPassword: string,
    transaction?: Transaction
  ): Promise<void> {
    try {
      const user = await User.findByPk(userId, { transaction });
      
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Verify current password
      const isPasswordValid = await BcryptUtil.comparePassword(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new ApiError(401, 'Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await BcryptUtil.hashPassword(newPassword);

      // Update password
      await user.update({ 
        password: hashedPassword,
        passwordChangedAt: new Date()
      }, { transaction });

      // Revoke all refresh tokens (force re-login)
      await AuthUtil.revokeAllUserTokens(userId, transaction);

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

      // Save reset token
      await user.update({
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: resetTokenExpiry
      }, { transaction });

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
      // Find all users with unexpired reset tokens
      const users = await User.findAll({
        where: {
          resetPasswordToken: { [User.sequelize!.Sequelize.Op.ne]: null },
          resetPasswordExpires: { [User.sequelize!.Sequelize.Op.gt]: new Date() }
        },
        transaction
      });

      // Find the user with matching token
      let matchedUser: User | null = null;
      for (const user of users) {
        const isTokenValid = await BcryptUtil.comparePassword(token, user.resetPasswordToken!);
        if (isTokenValid) {
          matchedUser = user;
          break;
        }
      }

      if (!matchedUser) {
        throw new ApiError(400, 'Invalid or expired reset token');
      }

      // Hash new password
      const hashedPassword = await BcryptUtil.hashPassword(newPassword);

      // Update password and clear reset token
      await matchedUser.update({
        password: hashedPassword,
        passwordChangedAt: new Date(),
        resetPasswordToken: null,
        resetPasswordExpires: null
      }, { transaction });

      // Revoke all refresh tokens
      await AuthUtil.revokeAllUserTokens(matchedUser.id, transaction);

      // Log password reset
      await AuditLog.create({
        userId: matchedUser.id,
        action: 'PASSWORD_RESET_COMPLETED',
        resource: 'User',
        resourceId: matchedUser.id
      }, { transaction });

      logger.info(`Password reset completed for user: ${matchedUser.id}`);
    } catch (error) {
      logger.error('Password reset failed:', error);
      throw error;
    }
  }

  /**
   * Verify email with token
   */
  static async verifyEmail(userId: number, token: string, transaction?: Transaction): Promise<void> {
    try {
      const user = await User.findByPk(userId, { transaction });
      
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      if (user.emailVerified) {
        throw new ApiError(400, 'Email already verified');
      }

      // In a real app, you would verify the token
      // For now, we'll just mark as verified
      await user.update({
        emailVerified: true,
        emailVerifiedAt: new Date()
      }, { transaction });

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
  static async getActiveSessions(userId: number): Promise<RefreshToken[]> {
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
  static async revokeSession(userId: number, tokenId: string, transaction?: Transaction): Promise<void> {
    try {
      const token = await RefreshToken.findOne({
        where: { id: tokenId, userId },
        transaction
      });

      if (!token) {
        throw new ApiError(404, 'Session not found');
      }

      await token.destroy({ transaction });

      logger.info(`Session revoked for user ${userId}: ${tokenId}`);
    } catch (error) {
      logger.error('Failed to revoke session:', error);
      throw error;
    }
  }
}