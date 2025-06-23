import { Router } from 'express';
import permissionController from '@controllers/permission.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { requirePermission } from '@middlewares/permission.middleware';
import { validateRequest } from '@middlewares/validation.middleware';
import {
  createResourceSchema,
  updateResourceSchema,
  listResourcesSchema
} from '@validators/resource.validator';
import { validateId } from '@validators/common.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Resource routes
router.post(
  '/',
  requirePermission('resource:create'),
  validateRequest({ body: createResourceSchema }),
  permissionController.createResource
);

router.get(
  '/',
  requirePermission('resource:read'),
  validateRequest({ query: listResourcesSchema }),
  permissionController.getResources
);

router.get(
  '/:id',
  requirePermission('resource:read'),
  validateRequest({ params: validateId }),
  permissionController.getResourceById
);

router.put(
  '/:id',
  requirePermission('resource:update'),
  validateRequest({ params: validateId, body: updateResourceSchema }),
  permissionController.updateResource
);

router.delete(
  '/:id',
  requirePermission('resource:delete'),
  validateRequest({ params: validateId }),
  permissionController.deleteResource
);

export default router;