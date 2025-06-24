import { Request, Response } from 'express';
import permissionService from '@services/permission.service';
import { ResponseUtil } from '@utils/response';
import { logger } from '@utils/logger';
import { getValidatedQuery } from '../middlewares/validation.middleware';

export class ResourceController {
  async createResource(req: Request, res: Response): Promise<void> {
    try {
      const resource = await permissionService.createResource(req.body);

      ResponseUtil.created(res, { resource }, 'Resource created successfully');
    } catch (error: any) {
      logger.error('Error creating resource:', error);
      ResponseUtil.internalError(res, error.message);
    }
  }

  async getResources(req: Request, res: Response): Promise<void> {
    try {
      const result = await permissionService.getResources(getValidatedQuery(req) as any);

      ResponseUtil.success(res, result, 'Resources retrieved successfully');
    } catch (error: any) {
      logger.error('Error getting resources:', error);
      ResponseUtil.internalError(res, error.message);
    }
  }

  async getResourceById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const resource = await permissionService.getResourceById(id);

      ResponseUtil.success(res, { resource }, 'Resource retrieved successfully');
    } catch (error: any) {
      logger.error('Error getting resource:', error);
      ResponseUtil.internalError(res, error.message);
    }
  }

  async updateResource(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const resource = await permissionService.updateResource(id, req.body);

      ResponseUtil.success(res, { resource }, 'Resource updated successfully');
    } catch (error: any) {
      logger.error('Error updating resource:', error);
      ResponseUtil.internalError(res, error.message);
    }
  }

  async deleteResource(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await permissionService.deleteResource(id);

      ResponseUtil.success(res, null, 'Resource deleted successfully');
    } catch (error: any) {
      logger.error('Error deleting resource:', error);
      ResponseUtil.internalError(res, error.message);
    }
  }
}

export default new ResourceController();