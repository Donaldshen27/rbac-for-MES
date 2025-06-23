import { Request, Response, NextFunction } from 'express';
import { MenuPermissionService } from '../services/menu-permission.service';
import { ResponseUtil } from '../utils/response';
import { ApiError } from '../utils/api-error';
import { logger } from '../utils/logger';
import { 
  MenuFilter, 
  BatchMenuPermissionUpdate,
  MenuAccessCheck,
  MenuPermissionData,
  CreateMenuData,
  UpdateMenuData
} from '../types/menu.types';

export class MenuController {
  /**
   * Create a new menu item
   * POST /api/menus
   */
  static async createMenu(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const menuData: CreateMenuData = req.body;
      const userId = req.user!.id;

      const menu = await MenuPermissionService.createMenu(menuData, userId);

      ResponseUtil.created(res, { menu }, 'Menu created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get menu by ID
   * GET /api/menus/:menuId
   */
  static async getMenuById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { menuId } = req.params;
      
      const menu = await MenuPermissionService.getMenuById(menuId);

      ResponseUtil.success(res, { menu }, 'Menu retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a menu item
   * PUT /api/menus/:menuId
   */
  static async updateMenu(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { menuId } = req.params;
      const updateData: UpdateMenuData = req.body;
      const userId = req.user!.id;

      const menu = await MenuPermissionService.updateMenu(menuId, updateData, userId);

      ResponseUtil.success(res, { menu }, 'Menu updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a menu item
   * DELETE /api/menus/:menuId
   */
  static async deleteMenu(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { menuId } = req.params;
      const userId = req.user!.id;

      await MenuPermissionService.deleteMenu(menuId, userId);

      ResponseUtil.success(res, null, 'Menu deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reorder menu items
   * PUT /api/menus/reorder
   */
  static async reorderMenus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reorderData: Array<{ menuId: string; orderIndex: number }> = req.body.items;
      const userId = req.user!.id;

      if (!reorderData || !Array.isArray(reorderData)) {
        throw new ApiError(400, 'Items array is required');
      }

      await MenuPermissionService.reorderMenus(reorderData, userId);

      ResponseUtil.success(res, null, 'Menus reordered successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Move a menu to a different parent
   * PUT /api/menus/:menuId/move
   */
  static async moveMenu(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { menuId } = req.params;
      const { newParentId } = req.body;
      const userId = req.user!.id;

      if (newParentId !== null && typeof newParentId !== 'string') {
        throw new ApiError(400, 'New parent ID must be a string or null');
      }

      const menu = await MenuPermissionService.moveMenu(menuId, newParentId, userId);

      ResponseUtil.success(res, { menu }, 'Menu moved successfully');
    } catch (error) {
      next(error);
    }
  }
  /**
   * Get user menu tree based on permissions
   * GET /api/menus/user-menu
   */
  static async getUserMenuTree(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      
      const result = await MenuPermissionService.getUserMenuTree(userId);

      ResponseUtil.success(res, result, 'User menu tree retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get complete menu tree (admin only)
   * GET /api/menus
   */
  static async getCompleteMenuTree(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter: MenuFilter = {
        search: req.query.search as string,
        parentId: req.query.parentId as string || undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any
      };

      const menus = await MenuPermissionService.getCompleteMenuTree(filter);

      ResponseUtil.success(res, { menus }, 'Menu tree retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get permissions for a specific menu
   * GET /api/menus/:menuId/permissions
   */
  static async getMenuPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { menuId } = req.params;
      
      const permissions = await MenuPermissionService.getMenuPermissions(menuId);

      ResponseUtil.success(res, { permissions }, 'Menu permissions retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update menu permissions for a role
   * PUT /api/roles/:roleId/menu-permissions
   */
  static async updateRoleMenuPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roleId } = req.params;
      const permissions: MenuPermissionData[] = req.body.permissions;
      const userId = req.user!.id;

      if (!permissions || !Array.isArray(permissions)) {
        throw new ApiError(400, 'Permissions array is required');
      }

      const result = await MenuPermissionService.updateRoleMenuPermissions(
        roleId,
        permissions,
        userId
      );

      ResponseUtil.success(res, result, 'Menu permissions updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Batch update menu permissions
   * POST /api/menus/permissions/batch
   */
  static async batchUpdateMenuPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const update: BatchMenuPermissionUpdate = req.body;
      const userId = req.user!.id;

      if (!update.roleId || !update.permissions || !Array.isArray(update.permissions)) {
        throw new ApiError(400, 'Invalid batch update request');
      }

      const result = await MenuPermissionService.batchUpdateMenuPermissions(update, userId);

      ResponseUtil.success(res, result, 'Menu permissions batch updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check menu access for a user
   * POST /api/menus/check-access
   */
  static async checkMenuAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const check: MenuAccessCheck = {
        menuId: req.body.menuId,
        userId: req.body.userId || req.user!.id,
        permission: req.body.permission
      };

      if (!check.menuId || !check.permission) {
        throw new ApiError(400, 'Menu ID and permission are required');
      }

      if (!['view', 'edit', 'delete', 'export'].includes(check.permission)) {
        throw new ApiError(400, 'Invalid permission type');
      }

      const result = await MenuPermissionService.checkMenuAccess(check);

      ResponseUtil.success(res, result, 'Menu access check completed');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get menu permission matrix
   * GET /api/menus/permissions/matrix
   */
  static async getMenuPermissionMatrix(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const matrix = await MenuPermissionService.getMenuPermissionMatrix();

      ResponseUtil.success(res, { matrix }, 'Menu permission matrix retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get menu tree statistics
   * GET /api/menus/statistics
   */
  static async getMenuTreeStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const statistics = await MenuPermissionService.getMenuTreeStatistics();

      ResponseUtil.success(res, statistics, 'Menu tree statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove all menu permissions for a role
   * DELETE /api/roles/:roleId/menu-permissions
   */
  static async removeAllRoleMenuPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roleId } = req.params;
      const userId = req.user!.id;

      await MenuPermissionService.removeAllRoleMenuPermissions(roleId, userId);

      ResponseUtil.success(res, null, 'All menu permissions removed successfully');
    } catch (error) {
      next(error);
    }
  }
}