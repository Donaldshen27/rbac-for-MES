import { Router } from 'express';
import permissionController from '@controllers/permission.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { requirePermission } from '@middlewares/permission.middleware';
import { validateRequest } from '@middlewares/validation.middleware';
import {
  createPermissionSchema,
  updatePermissionSchema,
  listPermissionsSchema,
  checkPermissionSchema
} from '@validators/permission.validator';
import { validateId } from '@validators/common.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Permission routes
router.post(
  '/',
  requirePermission('permissions:create'),
  validateRequest({ body: createPermissionSchema }),
  permissionController.createPermission
);

router.get(
  '/',
  requirePermission('permissions:read'),
  validateRequest({ query: listPermissionsSchema }),
  permissionController.getPermissions
);

router.get(
  '/check',
  validateRequest({ query: checkPermissionSchema }),
  permissionController.checkPermission
);

router.get(
  '/:id',
  requirePermission('permissions:read'),
  validateRequest({ params: validateId }),
  permissionController.getPermissionById
);

router.put(
  '/:id',
  requirePermission('permissions:update'),
  validateRequest({ params: validateId, body: updatePermissionSchema }),
  permissionController.updatePermission
);

router.delete(
  '/:id',
  requirePermission('permissions:delete'),
  validateRequest({ params: validateId }),
  permissionController.deletePermission
);

export default router;