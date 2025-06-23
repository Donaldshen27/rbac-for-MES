import { User, Role, Permission } from '../models';
import { JWTUtil } from './jwt.util';
import { BcryptUtil } from './bcrypt.util';
import { AppError } from './errors';
import { v4 as uuidv4 } from 'uuid';
import { RefreshToken } from '../models';
import { AuthTokens } from '../types';
import { config } from '../config';

export class AuthUtil {
  static async generateUserTokens(user: User): Promise<AuthTokens> {
    // Get user roles and permissions
    const roles = await user.getRoles({
      attributes: ['name'],
      include: [
        {
          model: Permission,
          attributes: ['name'],
          through: { attributes: [] }
        }
      ]
    });

    const roleNames = roles.map(role => role.name);
    const permissions = new Set<string>();

    // Collect all permissions from roles
    roles.forEach(role => {
      role.permissions?.forEach(permission => {
        permissions.add(permission.name);
      });
    });

    // Generate tokens
    const tokenId = uuidv4();
    const tokenPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      roles: roleNames,
      permissions: Array.from(permissions)
    };

    const tokens = JWTUtil.generateTokenPair(tokenPayload, tokenId);

    // Store refresh token in database
    await RefreshToken.create({
      id: tokenId,
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + this.getRefreshTokenExpiryMs())
    });

    // Update last login
    await user.update({ lastLogin: new Date() });

    return tokens;
  }

  static async validateLogin(username: string, password: string): Promise<User> {
    // Find user by username or email
    const user = await User.findOne({
      where: {
        [User.sequelize!.Op.or]: [
          { username },
          { email: username }
        ]
      }
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401, 'AUTH_001');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Account disabled', 403, 'AUTH_005');
    }

    // Verify password
    const isValidPassword = await BcryptUtil.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401, 'AUTH_001');
    }

    return user;
  }

  static async revokeRefreshToken(token: string): Promise<void> {
    const refreshToken = await RefreshToken.findOne({
      where: { token }
    });

    if (refreshToken) {
      await refreshToken.destroy();
    }
  }

  static async revokeAllUserTokens(userId: string): Promise<void> {
    await RefreshToken.destroy({
      where: { userId }
    });
  }

  static async cleanExpiredTokens(): Promise<number> {
    const result = await RefreshToken.destroy({
      where: {
        expiresAt: {
          [RefreshToken.sequelize!.Op.lt]: new Date()
        }
      }
    });

    return result;
  }

  private static getRefreshTokenExpiryMs(): number {
    const expiry = config.jwt.refreshExpiresIn;
    
    if (typeof expiry === 'number') {
      return expiry * 1000;
    }

    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 7 * 24 * 60 * 60 * 1000; // Default 7 days
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }

  static async getUserPermissions(userId: string): Promise<string[]> {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          include: [
            {
              model: Permission,
              through: { attributes: [] }
            }
          ]
        }
      ]
    });

    if (!user) {
      return [];
    }

    const permissions = new Set<string>();

    user.roles?.forEach(role => {
      role.permissions?.forEach(permission => {
        permissions.add(permission.name);
      });
    });

    return Array.from(permissions);
  }
}