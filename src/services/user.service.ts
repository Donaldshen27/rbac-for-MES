import { Transaction, Op, WhereOptions, Order } from 'sequelize';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { AuditLog } from '../models/AuditLog';
import { BcryptUtil } from '../utils/bcrypt.util';
import { ApiError } from '../utils/api-error';
import { logger } from '../utils/logger';
import { 
  CreateUserData, 
  UpdateUserData, 
  UserFilter, 
  PaginationOptions,
  UserWithRoles,
  BulkOperationResult
} from '../types/user.types';

export class UserService {
  /**
   * Get all users with pagination and filtering
   */
  static async getAllUsers(
    filter: UserFilter = {},
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<{ users: User[]; total: number }> {
    try {
      const { page = 1, limit = 10 } = pagination;
      const offset = (page - 1) * limit;

      // Build where clause
      const where: WhereOptions<User> = {};

      if (filter.search) {
        where[Op.or] = [
          { email: { [Op.like]: `%${filter.search}%` } },
          { username: { [Op.like]: `%${filter.search}%` } },
          { firstName: { [Op.like]: `%${filter.search}%` } },
          { lastName: { [Op.like]: `%${filter.search}%` } }
        ];
      }

      if (filter.isActive !== undefined) {
        where.isActive = filter.isActive;
      }

      if (filter.roleIds && filter.roleIds.length > 0) {
        // This will be handled with include
      }

      // Build order clause
      const order: Order = [];
      if (filter.sortBy) {
        const direction = filter.sortOrder === 'desc' ? 'DESC' : 'ASC';
        order.push([filter.sortBy, direction]);
      } else {
        order.push(['createdAt', 'DESC']);
      }

      // Query with role filtering if needed
      const includeOptions = {
        model: Role,
        as: 'roles',
        attributes: ['id', 'name', 'description'],
        through: { attributes: [] }
      };

      if (filter.roleIds && filter.roleIds.length > 0) {
        includeOptions['where'] = { id: filter.roleIds };
        includeOptions['required'] = true;
      }

      const { count, rows } = await User.findAndCountAll({
        where,
        include: [includeOptions],
        limit,
        offset,
        order,
        distinct: true
      });

      logger.info(`Retrieved ${rows.length} users (total: ${count})`);
      return { users: rows, total: count };
    } catch (error) {
      logger.error('Failed to get users:', error);
      throw error;
    }
  }

  /**
   * Get user by ID with roles
   */
  static async getUserById(userId: string): Promise<UserWithRoles> {
    try {
      const user = await User.findByPk(userId, {
        include: [
          {
            model: Role,
            as: 'roles',
            attributes: ['id', 'name', 'description'],
            through: { attributes: [] }
          }
        ]
      });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      return user as UserWithRoles;
    } catch (error) {
      logger.error(`Failed to get user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await User.findOne({
        where: { email },
        include: [
          {
            model: Role,
            as: 'roles',
            attributes: ['id', 'name', 'description'],
            through: { attributes: [] }
          }
        ]
      });

      return user;
    } catch (error) {
      logger.error(`Failed to get user by email ${email}:`, error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  static async createUser(data: CreateUserData, transaction?: Transaction): Promise<UserWithRoles> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { email: data.email },
            { username: data.username }
          ]
        },
        transaction
      });

      if (existingUser) {
        if (existingUser.email === data.email) {
          throw new ApiError(409, 'User with this email already exists');
        }
        throw new ApiError(409, 'Username is already taken');
      }

      // Hash password
      const hashedPassword = await BcryptUtil.hashPassword(data.password);

      // Create user
      const user = await User.create({
        email: data.email,
        username: data.username,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        isActive: data.isActive !== undefined ? data.isActive : true,
        isSuperuser: data.isSuperuser || false
      }, { transaction });

      // Assign roles if provided
      if (data.roleIds && data.roleIds.length > 0) {
        const roles = await Role.findAll({
          where: { id: data.roleIds },
          transaction
        });

        if (roles.length !== data.roleIds.length) {
          throw new ApiError(400, 'One or more role IDs are invalid');
        }

        await user.setRoles(roles, { transaction });
        user.roles = roles;
      }

      // Create audit log
      await AuditLog.create({
        userId: data.createdBy,
        action: 'USER_CREATED',
        resource: 'User',
        resourceId: user.id,
        details: {
          email: user.email,
          username: user.username,
          roles: data.roleIds
        }
      }, { transaction });

      logger.info(`User created: ${user.email}`);
      return user as UserWithRoles;
    } catch (error) {
      logger.error('Failed to create user:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  static async updateUser(
    userId: string, 
    data: UpdateUserData,
    updatedBy: string,
    transaction?: Transaction
  ): Promise<UserWithRoles> {
    try {
      const user = await User.findByPk(userId, { transaction });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Check for duplicate email/username if being changed
      if (data.email && data.email !== user.email) {
        const existingEmail = await User.findOne({
          where: { email: data.email, id: { [Op.ne]: userId } },
          transaction
        });
        if (existingEmail) {
          throw new ApiError(409, 'Email is already in use');
        }
      }

      if (data.username && data.username !== user.username) {
        const existingUsername = await User.findOne({
          where: { username: data.username, id: { [Op.ne]: userId } },
          transaction
        });
        if (existingUsername) {
          throw new ApiError(409, 'Username is already taken');
        }
      }

      // Update user fields
      const updateData: any = {};
      const allowedFields = ['email', 'username', 'firstName', 'lastName', 'isActive', 'isSuperuser'];
      
      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          updateData[field] = data[field];
        }
      }

      if (Object.keys(updateData).length > 0) {
        await user.update(updateData, { transaction });
      }

      // Update roles if provided
      if (data.roleIds !== undefined) {
        const roles = await Role.findAll({
          where: { id: data.roleIds },
          transaction
        });

        if (roles.length !== data.roleIds.length) {
          throw new ApiError(400, 'One or more role IDs are invalid');
        }

        await user.setRoles(roles, { transaction });
        user.roles = roles;
      }

      // Create audit log
      await AuditLog.create({
        userId: updatedBy,
        action: 'USER_UPDATED',
        resource: 'User',
        resourceId: userId,
        details: {
          changes: updateData,
          roleIds: data.roleIds
        }
      }, { transaction });

      // Reload user with roles
      await user.reload({
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

      logger.info(`User updated: ${user.email}`);
      return user as UserWithRoles;
    } catch (error) {
      logger.error(`Failed to update user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Delete user (soft delete by deactivating)
   */
  static async deleteUser(
    userId: string, 
    deletedBy: string,
    transaction?: Transaction
  ): Promise<void> {
    try {
      const user = await User.findByPk(userId, { transaction });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Prevent deleting superuser
      if (user.isSuperuser) {
        throw new ApiError(403, 'Cannot delete superuser');
      }

      // Soft delete by deactivating
      await user.update({ isActive: false }, { transaction });

      // Revoke all refresh tokens
      const { RefreshToken } = await import('../models/RefreshToken');
      await RefreshToken.destroy({
        where: { userId },
        transaction
      });

      // Create audit log
      await AuditLog.create({
        userId: deletedBy,
        action: 'USER_DELETED',
        resource: 'User',
        resourceId: userId,
        details: {
          email: user.email,
          username: user.username
        }
      }, { transaction });

      logger.info(`User deleted (deactivated): ${user.email}`);
    } catch (error) {
      logger.error(`Failed to delete user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Restore deleted user
   */
  static async restoreUser(
    userId: string,
    restoredBy: string,
    transaction?: Transaction
  ): Promise<UserWithRoles> {
    try {
      const user = await User.findByPk(userId, { transaction });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      if (user.isActive) {
        throw new ApiError(400, 'User is already active');
      }

      await user.update({ isActive: true }, { transaction });

      // Create audit log
      await AuditLog.create({
        userId: restoredBy,
        action: 'USER_RESTORED',
        resource: 'User',
        resourceId: userId,
        details: {
          email: user.email,
          username: user.username
        }
      }, { transaction });

      // Reload with roles
      await user.reload({
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

      logger.info(`User restored: ${user.email}`);
      return user as UserWithRoles;
    } catch (error) {
      logger.error(`Failed to restore user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update user roles
   */
  static async updateUserRoles(
    userId: string,
    roleIds: number[],
    updatedBy: string,
    transaction?: Transaction
  ): Promise<UserWithRoles> {
    try {
      const user = await User.findByPk(userId, {
        include: [
          {
            model: Role,
            as: 'roles',
            through: { attributes: [] }
          }
        ],
        transaction
      });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Get old role IDs for audit
      const oldRoleIds = user.roles?.map(r => r.id) || [];

      // Validate new roles
      const roles = await Role.findAll({
        where: { id: roleIds },
        transaction
      });

      if (roles.length !== roleIds.length) {
        throw new ApiError(400, 'One or more role IDs are invalid');
      }

      // Update roles
      await user.setRoles(roles, { transaction });
      user.roles = roles;

      // Create audit log
      await AuditLog.create({
        userId: updatedBy,
        action: 'USER_ROLES_UPDATED',
        resource: 'User',
        resourceId: userId,
        details: {
          oldRoles: oldRoleIds,
          newRoles: roleIds
        }
      }, { transaction });

      logger.info(`User roles updated for: ${user.email}`);
      return user as UserWithRoles;
    } catch (error) {
      logger.error(`Failed to update user roles for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Reset user password (admin action)
   */
  static async resetUserPassword(
    userId: string,
    newPassword: string,
    resetBy: string,
    transaction?: Transaction
  ): Promise<void> {
    try {
      const user = await User.findByPk(userId, { transaction });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Hash new password
      const hashedPassword = await BcryptUtil.hashPassword(newPassword);
      await user.update({ password: hashedPassword }, { transaction });

      // Revoke all refresh tokens
      const { RefreshToken } = await import('../models/RefreshToken');
      await RefreshToken.destroy({
        where: { userId },
        transaction
      });

      // Create audit log
      await AuditLog.create({
        userId: resetBy,
        action: 'USER_PASSWORD_RESET',
        resource: 'User',
        resourceId: userId,
        details: {
          email: user.email,
          forcedLogout: true
        }
      }, { transaction });

      logger.info(`Password reset for user: ${user.email}`);
    } catch (error) {
      logger.error(`Failed to reset password for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Bulk activate/deactivate users
   */
  static async bulkUpdateStatus(
    userIds: string[],
    isActive: boolean,
    updatedBy: string,
    transaction?: Transaction
  ): Promise<BulkOperationResult> {
    const results: BulkOperationResult = {
      success: [],
      failed: []
    };

    try {
      for (const userId of userIds) {
        try {
          const user = await User.findByPk(userId, { transaction });
          
          if (!user) {
            results.failed.push({ id: userId, error: 'User not found' });
            continue;
          }

          if (user.isSuperuser && !isActive) {
            results.failed.push({ id: userId, error: 'Cannot deactivate superuser' });
            continue;
          }

          await user.update({ isActive }, { transaction });
          results.success.push(userId);

          // If deactivating, revoke tokens
          if (!isActive) {
            const { RefreshToken } = await import('../models/RefreshToken');
            await RefreshToken.destroy({
              where: { userId },
              transaction
            });
          }

        } catch (error) {
          results.failed.push({ 
            id: userId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      // Create audit log
      await AuditLog.create({
        userId: updatedBy,
        action: isActive ? 'USERS_ACTIVATED' : 'USERS_DEACTIVATED',
        resource: 'User',
        resourceId: results.success.join(','),
        details: {
          total: userIds.length,
          success: results.success.length,
          failed: results.failed.length
        }
      }, { transaction });

      logger.info(`Bulk status update completed: ${results.success.length} success, ${results.failed.length} failed`);
      return results;
    } catch (error) {
      logger.error('Bulk status update failed:', error);
      throw error;
    }
  }

  /**
   * Bulk delete users
   */
  static async bulkDeleteUsers(
    userIds: string[],
    deletedBy: string,
    transaction?: Transaction
  ): Promise<BulkOperationResult> {
    const results: BulkOperationResult = {
      success: [],
      failed: []
    };

    try {
      for (const userId of userIds) {
        try {
          await this.deleteUser(userId, deletedBy, transaction);
          results.success.push(userId);
        } catch (error) {
          results.failed.push({ 
            id: userId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      logger.info(`Bulk delete completed: ${results.success.length} success, ${results.failed.length} failed`);
      return results;
    } catch (error) {
      logger.error('Bulk delete failed:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    superusers: number;
    byRole: Record<string, number>;
  }> {
    try {
      const [total, active, inactive, superusers] = await Promise.all([
        User.count(),
        User.count({ where: { isActive: true } }),
        User.count({ where: { isActive: false } }),
        User.count({ where: { isSuperuser: true } })
      ]);

      // Count users by role
      const roleStats = await User.findAll({
        include: [
          {
            model: Role,
            as: 'roles',
            attributes: ['name'],
            through: { attributes: [] }
          }
        ],
        attributes: ['id']
      });

      const byRole: Record<string, number> = {};
      roleStats.forEach(user => {
        user.roles?.forEach(role => {
          byRole[role.name] = (byRole[role.name] || 0) + 1;
        });
      });

      return {
        total,
        active,
        inactive,
        superusers,
        byRole
      };
    } catch (error) {
      logger.error('Failed to get user statistics:', error);
      throw error;
    }
  }

  /**
   * Check if user has specific role
   */
  static async userHasRole(userId: string, roleName: string): Promise<boolean> {
    try {
      const user = await User.findByPk(userId, {
        include: [
          {
            model: Role,
            as: 'roles',
            where: { name: roleName },
            required: false
          }
        ]
      });

      return user !== null && user.roles !== undefined && user.roles.length > 0;
    } catch (error) {
      logger.error(`Failed to check user role for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if user has any of the specified roles
   */
  static async userHasAnyRole(userId: string, roleNames: string[]): Promise<boolean> {
    try {
      const user = await User.findByPk(userId, {
        include: [
          {
            model: Role,
            as: 'roles',
            where: { name: { [Op.in]: roleNames } },
            required: false
          }
        ]
      });

      return user !== null && user.roles !== undefined && user.roles.length > 0;
    } catch (error) {
      logger.error(`Failed to check user roles for ${userId}:`, error);
      throw error;
    }
  }
}