import { Request, Response } from 'express';
import permissionService from '@services/permission.service';
import { ResponseUtil } from '@utils/response';
import { logger } from '@utils/logger';
import { AuthRequest } from '../types/express';

interface IAuthRequest extends Request {
  user?: any;
}

export class PermissionController {
  async createPermission(req: Request, res: Response): Promise<void> {
    try {
      const permission = await permissionService.createPermission(req.body);

      ResponseUtil.created(res, { permission }, 'Permission created successfully');
    } catch (error: any) {
      logger.error('Error creating permission:', error);
      ResponseUtil.internalError(res, error.message);
    }
  }

  async getPermissions(req: Request, res: Response): Promise<void> {
    try {
      const result = await permissionService.getPermissions(req.query as any);

      ResponseUtil.success(res, result, 'Permissions retrieved successfully');
    } catch (error: any) {
      logger.error('Error getting permissions:', error);
      ResponseUtil.internalError(res, error.message);
    }
  }

  async getPermissionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const permission = await permissionService.getPermissionById(id);

      ResponseUtil.success(res, { permission }, 'Permission retrieved successfully');
    } catch (error: any) {
      logger.error('Error getting permission:', error);
      ResponseUtil.internalError(res, error.message);
    }
  }

  async updatePermission(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const permission = await permissionService.updatePermission(id, req.body);

      ResponseUtil.success(res, { permission }, 'Permission updated successfully');
    } catch (error: any) {
      logger.error('Error updating permission:', error);
      ResponseUtil.internalError(res, error.message);
    }
  }

  async deletePermission(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await permissionService.deletePermission(id);

      ResponseUtil.success(res, null, 'Permission deleted successfully');
    } catch (error: any) {
      logger.error('Error deleting permission:', error);
      ResponseUtil.internalError(res, error.message);
    }
  }

  async checkPermission(req: IAuthRequest, res: Response): Promise<void> {
    try {
      const { permission } = req.query;
      const userId = req.user!.id;

      const result = await permissionService.checkUserPermission(
        userId,
        permission as string
      );

      ResponseUtil.success(res, result, 'Permission check completed');
    } catch (error: any) {
      logger.error('Error checking permission:', error);
      ResponseUtil.internalError(res, error.message);
    }
  }

  async getRolePermissions(req: Request, res: Response): Promise<void> {
    try {
      const { roleId } = req.params;
      const permissions = await permissionService.getPermissionsByRoleId(roleId);

      ResponseUtil.success(res, { permissions }, 'Role permissions retrieved successfully');
    } catch (error: any) {
      logger.error('Error getting role permissions:', error);
      ResponseUtil.internalError(res, error.message);
    }
  }

  async updateRolePermissions(req: IAuthRequest, res: Response): Promise<void> {
    try {
      const { roleId } = req.params;
      const { permissionIds } = req.body;
      const grantedBy = req.user!.id;

      await permissionService.assignPermissionsToRole(roleId, permissionIds, grantedBy);

      ResponseUtil.success(res, null, 'Role permissions updated successfully');
    } catch (error: any) {
      logger.error('Error updating role permissions:', error);
      ResponseUtil.internalError(res, error.message);
    }
  }
}

export default new PermissionController();