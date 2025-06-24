import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { ApiResponse } from '../utils/response';
import { ApiError } from '../utils/api-error';
import { AuthRequest } from '../types/auth.types';
import { 
  UserFilter, 
  PaginationOptions, 
  CreateUserData,
  UpdateUserData,
  PaginatedResult,
  UserWithRoles
} from '../types/user.types';
import { logger } from '../utils/logger';
import { sequelize } from '../config/database';
import { getValidatedQuery } from '../middlewares/validation.middleware';

export class UserController {
  /**
   * Get all users with pagination and filtering
   * GET /api/users
   */
  static async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, search, isActive, roleIds, sortBy, sortOrder } = getValidatedQuery(req);

      const filter: UserFilter = {
        search: search as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        roleIds: roleIds ? (roleIds as string).split(',').map(Number) : undefined,
        sortBy: sortBy as any,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const pagination: PaginationOptions = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      const { users, total } = await UserService.getAllUsers(filter, pagination);

      const totalPages = Math.ceil(total / pagination.limit);
      const response: PaginatedResult<UserWithRoles> = {
        data: users,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages,
          hasNext: pagination.page < totalPages,
          hasPrev: pagination.page > 1
        }
      };

      res.json(ApiResponse.success(response, 'Users retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   * GET /api/users/:userId
   */
  static async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const user = await UserService.getUserById(userId);

      res.json(ApiResponse.success(user, 'User retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new user
   * POST /api/users
   */
  static async createUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const transaction = await sequelize.transaction();
    
    try {
      const createData: CreateUserData = {
        ...req.body,
        createdBy: req.user?.id
      };

      const user = await UserService.createUser(createData, transaction);
      await transaction.commit();

      res.status(201).json(ApiResponse.success(user, 'User created successfully'));
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * Update user
   * PUT /api/users/:userId
   */
  static async updateUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const transaction = await sequelize.transaction();
    
    try {
      const { userId } = req.params;
      const updateData: UpdateUserData = req.body;
      const updatedBy = req.user!.id;

      const user = await UserService.updateUser(userId, updateData, updatedBy, transaction);
      await transaction.commit();

      res.json(ApiResponse.success(user, 'User updated successfully'));
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * Delete user (soft delete)
   * DELETE /api/users/:userId
   */
  static async deleteUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const transaction = await sequelize.transaction();
    
    try {
      const { userId } = req.params;
      const deletedBy = req.user!.id;

      await UserService.deleteUser(userId, deletedBy, transaction);
      await transaction.commit();

      res.json(ApiResponse.success(null, 'User deleted successfully'));
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * Restore deleted user
   * POST /api/users/:userId/restore
   */
  static async restoreUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const transaction = await sequelize.transaction();
    
    try {
      const { userId } = req.params;
      const restoredBy = req.user!.id;

      const user = await UserService.restoreUser(userId, restoredBy, transaction);
      await transaction.commit();

      res.json(ApiResponse.success(user, 'User restored successfully'));
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * Update user roles
   * PUT /api/users/:userId/roles
   */
  static async updateUserRoles(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const transaction = await sequelize.transaction();
    
    try {
      const { userId } = req.params;
      const { roleIds } = req.body;
      const updatedBy = req.user!.id;

      const user = await UserService.updateUserRoles(userId, roleIds, updatedBy, transaction);
      await transaction.commit();

      res.json(ApiResponse.success(user, 'User roles updated successfully'));
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * Reset user password (admin action)
   * POST /api/users/:userId/reset-password
   */
  static async resetUserPassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const transaction = await sequelize.transaction();
    
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;
      const resetBy = req.user!.id;

      await UserService.resetUserPassword(userId, newPassword, resetBy, transaction);
      await transaction.commit();

      res.json(ApiResponse.success(null, 'Password reset successfully'));
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * Bulk update user status
   * POST /api/users/bulk/status
   */
  static async bulkUpdateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const transaction = await sequelize.transaction();
    
    try {
      const { userIds, isActive } = req.body;
      const updatedBy = req.user!.id;

      const result = await UserService.bulkUpdateStatus(userIds, isActive, updatedBy, transaction);
      await transaction.commit();

      res.json(ApiResponse.success(result, `Users ${isActive ? 'activated' : 'deactivated'} successfully`));
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * Bulk delete users
   * POST /api/users/bulk/delete
   */
  static async bulkDeleteUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const transaction = await sequelize.transaction();
    
    try {
      const { userIds } = req.body;
      const deletedBy = req.user!.id;

      const result = await UserService.bulkDeleteUsers(userIds, deletedBy, transaction);
      await transaction.commit();

      res.json(ApiResponse.success(result, 'Users deleted successfully'));
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * Get user statistics
   * GET /api/users/statistics
   */
  static async getUserStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const statistics = await UserService.getUserStatistics();
      res.json(ApiResponse.success(statistics, 'User statistics retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   * GET /api/users/profile
   */
  static async getUserProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await UserService.getUserById(userId);

      res.json(ApiResponse.success(user, 'Profile retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user profile
   * PUT /api/users/profile
   */
  static async updateUserProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const transaction = await sequelize.transaction();
    
    try {
      const userId = req.user!.id;
      const { firstName, lastName, email } = req.body;

      // Limited update for own profile
      const updateData: UpdateUserData = {
        firstName,
        lastName,
        email
      };

      const user = await UserService.updateUser(userId, updateData, userId, transaction);
      await transaction.commit();

      res.json(ApiResponse.success(user, 'Profile updated successfully'));
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * Export users
   * GET /api/users/export
   */
  static async exportUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { format = 'json', ...filterParams } = getValidatedQuery(req);

      const filter: UserFilter = {
        search: filterParams.search as string,
        isActive: filterParams.isActive !== undefined ? filterParams.isActive === 'true' : undefined,
        roleIds: filterParams.roleIds ? (filterParams.roleIds as string).split(',').map(Number) : undefined
      };

      // Get all users without pagination for export
      const { users } = await UserService.getAllUsers(filter, { page: 1, limit: 10000 });

      // Transform users for export
      const exportData = users.map(user => ({
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles?.map(r => r.name).join(', ') || '',
        isActive: user.isActive,
        isSuperuser: user.isSuperuser,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));

      if (format === 'csv') {
        // Set CSV headers
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
        
        // Create CSV content
        const headers = Object.keys(exportData[0]).join(',');
        const rows = exportData.map(user => 
          Object.values(user).map(val => 
            typeof val === 'string' && val.includes(',') ? `"${val}"` : val
          ).join(',')
        );
        
        const csv = [headers, ...rows].join('\n');
        res.send(csv);
      } else {
        res.json(ApiResponse.success(exportData, 'Users exported successfully'));
      }
    } catch (error) {
      next(error);
    }
  }
}