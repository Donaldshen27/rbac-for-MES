import { Request, Response, NextFunction } from 'express';
import { RoleService } from '../services/role.service';
import { ResponseUtil } from '../utils/response';
import { ApiError } from '../utils/api-error';
import { logger } from '../utils/logger';
import { PaginationOptions } from '../types/user.types';
import { RoleFilter, RolePermissionUpdate, RoleCloneData } from '../types/role.types';
import { getValidatedQuery } from '../middlewares/validation.middleware';

export class RoleController {
  /**
   * Get all roles
   * GET /api/roles
   */
  static async getAllRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = getValidatedQuery(req);
      const filter: RoleFilter = {
        search: query.search as string,
        isSystem: query.isSystem !== undefined ? query.isSystem === 'true' : undefined,
        hasUsers: query.hasUsers !== undefined ? query.hasUsers === 'true' : undefined,
        sortBy: query.sortBy as any,
        sortOrder: query.sortOrder as any
      };

      const pagination: PaginationOptions = {
        page: parseInt(query.page as string) || 1,
        limit: parseInt(query.limit as string) || 10
      };

      const result = await RoleService.getAllRoles(filter, pagination);

      ResponseUtil.success(res, result, 'Roles retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get role by ID
   * GET /api/roles/:roleId
   */
  static async getRoleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roleId } = req.params;
      
      const role = await RoleService.getRoleById(roleId);

      ResponseUtil.success(res, { role }, 'Role retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new role
   * POST /api/roles
   */
  static async createRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roleData = {
        ...req.body,
        createdBy: req.user!.id
      };

      const role = await RoleService.createRole(roleData);

      ResponseUtil.created(res, { role }, 'Role created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update role
   * PUT /api/roles/:roleId
   */
  static async updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roleId } = req.params;
      const updateData = req.body;
      const updatedBy = req.user!.id;

      const role = await RoleService.updateRole(roleId, updateData, updatedBy);

      ResponseUtil.success(res, { role }, 'Role updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete role
   * DELETE /api/roles/:roleId
   */
  static async deleteRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roleId } = req.params;
      const deletedBy = req.user!.id;

      await RoleService.deleteRole(roleId, deletedBy);

      ResponseUtil.success(res, null, 'Role deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update role permissions
   * PATCH /api/roles/:roleId/permissions
   */
  static async updateRolePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roleId } = req.params;
      const update: RolePermissionUpdate = req.body;
      const updatedBy = req.user!.id;

      const role = await RoleService.updateRolePermissions(roleId, update, updatedBy);

      ResponseUtil.success(res, { role }, 'Role permissions updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clone role
   * POST /api/roles/:roleId/clone
   */
  static async cloneRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roleId } = req.params;
      const cloneData: RoleCloneData = {
        sourceRoleId: roleId,
        ...req.body
      };
      const clonedBy = req.user!.id;

      const role = await RoleService.cloneRole(cloneData, clonedBy);

      ResponseUtil.created(res, { role }, 'Role cloned successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk delete roles
   * POST /api/roles/bulk-delete
   */
  static async bulkDeleteRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roleIds } = req.body;
      const deletedBy = req.user!.id;

      const result = await RoleService.bulkDeleteRoles(roleIds, deletedBy);

      ResponseUtil.success(
        res,
        { result }, 
        `Bulk delete completed: ${result.success.length} succeeded, ${result.failed.length} failed`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get role statistics
   * GET /api/roles/statistics
   */
  static async getRoleStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const statistics = await RoleService.getRoleStatistics();

      ResponseUtil.success(res, { statistics }, 'Role statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get role users
   * GET /api/roles/:roleId/users
   */
  static async getRoleUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roleId } = req.params;
      const pagination: PaginationOptions = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10
      };

      const result = await RoleService.getRoleUsers(roleId, pagination);

      const totalPages = Math.ceil(result.total / pagination.limit);

      ResponseUtil.success(res, {
        users: result.users,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: result.total,
          totalPages,
          hasNext: pagination.page < totalPages,
          hasPrev: pagination.page > 1
        }
      }, 'Role users retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign users to role
   * POST /api/roles/:roleId/users
   */
  static async assignUsersToRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roleId } = req.params;
      const { userIds } = req.body;
      const assignedBy = req.user!.id;

      const result = await RoleService.assignUsersToRole(roleId, userIds, assignedBy);

      ResponseUtil.success(
        res,
        { result },
        `Users assigned: ${result.success.length} succeeded, ${result.failed.length} failed`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove users from role
   * DELETE /api/roles/:roleId/users
   */
  static async removeUsersFromRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roleId } = req.params;
      const { userIds } = req.body;
      const removedBy = req.user!.id;

      const result = await RoleService.removeUsersFromRole(roleId, userIds, removedBy);

      ResponseUtil.success(
        res,
        { result },
        `Users removed: ${result.success.length} succeeded, ${result.failed.length} failed`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get role hierarchy
   * GET /api/roles/hierarchy
   */
  static async getRoleHierarchy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hierarchy = await RoleService.getRoleHierarchy();

      ResponseUtil.success(res, { hierarchy }, 'Role hierarchy retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get role menu permissions
   * GET /api/roles/:roleId/menu-permissions
   */
  static async getRoleMenuPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roleId } = req.params;

      const menuPermissions = await RoleService.getRoleMenuPermissions(roleId);

      ResponseUtil.success(res, { menuPermissions }, 'Menu permissions retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update role menu permissions
   * PUT /api/roles/:roleId/menu-permissions
   */
  static async updateRoleMenuPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roleId } = req.params;
      const { menuPermissions } = req.body;
      const updatedBy = req.user!.id;

      await RoleService.updateRoleMenuPermissions(roleId, menuPermissions, updatedBy);

      ResponseUtil.success(res, null, 'Menu permissions updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if role has permission
   * GET /api/roles/:roleId/has-permission/:permissionName
   */
  static async checkRolePermission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roleId, permissionName } = req.params;

      const hasPermission = await RoleService.roleHasPermission(roleId, permissionName);

      ResponseUtil.success(res, { hasPermission }, 'Permission check completed');
    } catch (error) {
      next(error);
    }
  }
}