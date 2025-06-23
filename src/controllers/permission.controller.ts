import { Request, Response } from 'express';
import permissionService from '@services/permission.service';
import { successResponse, errorResponse } from '@utils/response';
import { IAuthRequest } from '@types/auth.types';
import logger from '@utils/logger';

export class PermissionController {
  async createPermission(req: Request, res: Response): Promise<Response> {
    try {
      const permission = await permissionService.createPermission(req.body);

      return successResponse(res, {
        statusCode: 201,
        message: 'Permission created successfully',
        data: { permission }
      });
    } catch (error: any) {
      logger.error('Error creating permission:', error);
      return errorResponse(res, error);
    }
  }

  async getPermissions(req: Request, res: Response): Promise<Response> {
    try {
      const result = await permissionService.getPermissions(req.query as any);

      return successResponse(res, {
        message: 'Permissions retrieved successfully',
        data: result
      });
    } catch (error: any) {
      logger.error('Error getting permissions:', error);
      return errorResponse(res, error);
    }
  }

  async getPermissionById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const permission = await permissionService.getPermissionById(id);

      return successResponse(res, {
        message: 'Permission retrieved successfully',
        data: { permission }
      });
    } catch (error: any) {
      logger.error('Error getting permission:', error);
      return errorResponse(res, error);
    }
  }

  async updatePermission(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const permission = await permissionService.updatePermission(id, req.body);

      return successResponse(res, {
        message: 'Permission updated successfully',
        data: { permission }
      });
    } catch (error: any) {
      logger.error('Error updating permission:', error);
      return errorResponse(res, error);
    }
  }

  async deletePermission(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      await permissionService.deletePermission(id);

      return successResponse(res, {
        message: 'Permission deleted successfully'
      });
    } catch (error: any) {
      logger.error('Error deleting permission:', error);
      return errorResponse(res, error);
    }
  }

  async checkPermission(req: IAuthRequest, res: Response): Promise<Response> {
    try {
      const { permission } = req.query;
      const userId = req.user!.id;

      const result = await permissionService.checkUserPermission(
        userId,
        permission as string
      );

      return successResponse(res, {
        message: 'Permission check completed',
        data: result
      });
    } catch (error: any) {
      logger.error('Error checking permission:', error);
      return errorResponse(res, error);
    }
  }

  async getRolePermissions(req: Request, res: Response): Promise<Response> {
    try {
      const { roleId } = req.params;
      const permissions = await permissionService.getPermissionsByRoleId(roleId);

      return successResponse(res, {
        message: 'Role permissions retrieved successfully',
        data: { permissions }
      });
    } catch (error: any) {
      logger.error('Error getting role permissions:', error);
      return errorResponse(res, error);
    }
  }

  async updateRolePermissions(req: IAuthRequest, res: Response): Promise<Response> {
    try {
      const { roleId } = req.params;
      const { permissionIds } = req.body;
      const grantedBy = req.user!.id;

      await permissionService.assignPermissionsToRole(roleId, permissionIds, grantedBy);

      return successResponse(res, {
        message: 'Role permissions updated successfully'
      });
    } catch (error: any) {
      logger.error('Error updating role permissions:', error);
      return errorResponse(res, error);
    }
  }

  async createResource(req: Request, res: Response): Promise<Response> {
    try {
      const resource = await permissionService.createResource(req.body);

      return successResponse(res, {
        statusCode: 201,
        message: 'Resource created successfully',
        data: { resource }
      });
    } catch (error: any) {
      logger.error('Error creating resource:', error);
      return errorResponse(res, error);
    }
  }

  async getResources(req: Request, res: Response): Promise<Response> {
    try {
      const result = await permissionService.getResources(req.query as any);

      return successResponse(res, {
        message: 'Resources retrieved successfully',
        data: result
      });
    } catch (error: any) {
      logger.error('Error getting resources:', error);
      return errorResponse(res, error);
    }
  }

  async getResourceById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const resource = await permissionService.getResourceById(id);

      return successResponse(res, {
        message: 'Resource retrieved successfully',
        data: { resource }
      });
    } catch (error: any) {
      logger.error('Error getting resource:', error);
      return errorResponse(res, error);
    }
  }

  async updateResource(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const resource = await permissionService.updateResource(id, req.body);

      return successResponse(res, {
        message: 'Resource updated successfully',
        data: { resource }
      });
    } catch (error: any) {
      logger.error('Error updating resource:', error);
      return errorResponse(res, error);
    }
  }

  async deleteResource(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      await permissionService.deleteResource(id);

      return successResponse(res, {
        message: 'Resource deleted successfully'
      });
    } catch (error: any) {
      logger.error('Error deleting resource:', error);
      return errorResponse(res, error);
    }
  }
}

export default new PermissionController();