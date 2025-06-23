import { Router } from 'express';
import resourceController from '@controllers/resource.controller';
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
  resourceController.createResource
);

router.get(
  '/',
  requirePermission('resource:read'),
  validateRequest({ query: listResourcesSchema }),
  resourceController.getResources
);

router.get(
  '/:id',
  requirePermission('resource:read'),
  validateRequest({ params: validateId }),
  resourceController.getResourceById
);

router.put(
  '/:id',
  requirePermission('resource:update'),
  validateRequest({ params: validateId, body: updateResourceSchema }),
  resourceController.updateResource
);

router.delete(
  '/:id',
  requirePermission('resource:delete'),
  validateRequest({ params: validateId }),
  resourceController.deleteResource
);

export default router;