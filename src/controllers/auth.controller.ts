import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { ApiResponse } from '../utils/response';
import { ValidationError, AppError } from '../utils/errors';
import { ErrorCode } from '../types';
import { logger } from '../utils/logger';

export class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const registerData = {
        ...req.body,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      };

      const { user, tokens } = await AuthService.register(registerData);

      // Remove sensitive data
      const userResponse = {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles || [],
        isActive: user.isActive,
        createdAt: user.createdAt
      };

      res.status(201).json(
        ApiResponse.success({
          user: userResponse,
          tokens
        }, 'User registered successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const credentials = {
        ...req.body,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      };

      const { user, tokens } = await AuthService.login(credentials);

      // Remove sensitive data
      const userResponse = {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles || [],
        isActive: user.isActive,
        lastLogin: user.lastLogin
      };

      res.json(
        ApiResponse.success({
          user: userResponse,
          tokens
        }, 'Login successful')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new ValidationError('Refresh token is required');
      }

      const tokens = await AuthService.refreshToken(refreshToken);

      res.json(
        ApiResponse.success(tokens, 'Token refreshed successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { refreshToken } = req.body;

      await AuthService.logout(userId, refreshToken);

      res.json(
        ApiResponse.success(null, 'Logout successful')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout from all devices
   * POST /api/auth/logout-all
   */
  static async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;

      await AuthService.logout(userId);

      res.json(
        ApiResponse.success(null, 'Logged out from all devices')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;

      const userResponse = {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles || [],
        isActive: user.isActive,
        isSuperuser: user.isSuperuser,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      res.json(
        ApiResponse.success({ user: userResponse }, 'Profile retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   * PUT /api/auth/me
   */
  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { firstName, lastName, username } = req.body;

      const user = await UserService.updateUser(
        userId,
        {
          firstName,
          lastName,
          username
        },
        userId // User is updating their own profile
      );

      const userResponse = {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        updatedAt: user.updatedAt
      };

      res.json(
        ApiResponse.success({ user: userResponse }, 'Profile updated successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * POST /api/auth/change-password
   */
  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;

      await AuthService.changePassword(userId, currentPassword, newPassword);

      res.json(
        ApiResponse.success(null, 'Password changed successfully. Please login again.')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   * POST /api/auth/forgot-password
   */
  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      const message = await AuthService.requestPasswordReset(email);

      res.json(
        ApiResponse.success(null, message)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password with token
   * POST /api/auth/reset-password
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      await AuthService.resetPassword(token, newPassword);

      res.json(
        ApiResponse.success(null, 'Password reset successful. Please login with your new password.')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify email
   * POST /api/auth/verify-email
   */
  static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { token } = req.body;

      await AuthService.verifyEmail(userId, token);

      res.json(
        ApiResponse.success(null, 'Email verified successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resend verification email
   * POST /api/auth/resend-verification
   */
  static async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // This would typically generate and send a new verification email
      throw new AppError(ErrorCode.INTERNAL_SERVER_ERROR, 'Email verification not implemented', 501);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active sessions
   * GET /api/auth/sessions
   */
  static async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;

      const sessions = await AuthService.getActiveSessions(userId);

      const sessionResponse = sessions.map(session => ({
        id: session.id,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        isCurrent: false // TODO: Need a way to identify current session without body in GET request
      }));

      res.json(
        ApiResponse.success({ sessions: sessionResponse }, 'Sessions retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke a session
   * DELETE /api/auth/sessions/:sessionId
   */
  static async revokeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { sessionId } = req.params;

      await AuthService.revokeSession(userId, sessionId);

      res.json(
        ApiResponse.success(null, 'Session revoked successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate token (for microservices)
   * POST /api/auth/validate
   */
  static async validateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // The authenticate middleware has already validated the token
      // If we reach here, the token is valid
      const user = req.user!;

      res.json(
        ApiResponse.success({
          valid: true,
          user: {
            id: user.id,
            email: user.email,
            roles: user.roles || [],
            permissions: [] // Would need to fetch permissions
          }
        }, 'Token is valid')
      );
    } catch (error) {
      next(error);
    }
  }
}