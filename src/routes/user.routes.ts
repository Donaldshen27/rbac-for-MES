import { Router } from 'express';
import Joi from 'joi';
import { UserController } from '../controllers/user.controller';
import { authenticate, requireRole, requirePermission } from '../middlewares/auth.middleware';
import { validate, ValidationTarget } from '../middlewares/validation.middleware';
import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  listUsersSchema,
  updateUserPasswordSchema,
  bulkUserOperationSchema
} from '../validators/user.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// User statistics (requires admin role)
router.get(
  '/statistics',
  requireRole(['admin', 'superadmin']),
  UserController.getUserStatistics
);

// Export users (requires permission)
router.get(
  '/export',
  requirePermission('users:export'),
  validate(listUsersSchema, ValidationTarget.QUERY),
  UserController.exportUsers
);

// Bulk operations (requires admin role)
router.post(
  '/bulk/status',
  requireRole(['admin', 'superadmin']),
  validate(bulkUserOperationSchema, ValidationTarget.BODY),
  UserController.bulkUpdateStatus
);

router.post(
  '/bulk/delete',
  requireRole(['admin', 'superadmin']),
  validate(bulkUserOperationSchema, ValidationTarget.BODY),
  UserController.bulkDeleteUsers
);

// Current user profile endpoints
router.get(
  '/profile',
  UserController.getUserProfile
);

router.put(
  '/profile',
  validate(
    Joi.object({
      firstName: Joi.string().trim().min(1).max(50).pattern(/^[a-zA-Z\s'-]+$/).optional(),
      lastName: Joi.string().trim().min(1).max(50).pattern(/^[a-zA-Z\s'-]+$/).optional(),
      email: Joi.string().email().optional()
    }).min(1),
    ValidationTarget.BODY
  ),
  UserController.updateUserProfile
);

// List users (requires permission)
router.get(
  '/',
  requirePermission('users:read'),
  validate(listUsersSchema, ValidationTarget.QUERY),
  UserController.getAllUsers
);

// Create user (requires permission)
router.post(
  '/',
  requirePermission('users:create'),
  validate(createUserSchema, ValidationTarget.BODY),
  UserController.createUser
);

// Get user by ID (requires permission)
router.get(
  '/:userId',
  requirePermission('users:read'),
  validate(userIdSchema, ValidationTarget.PARAMS),
  UserController.getUserById
);

// Update user (requires permission)
router.put(
  '/:userId',
  requirePermission('users:update'),
  validate(userIdSchema, ValidationTarget.PARAMS),
  validate(updateUserSchema, ValidationTarget.BODY),
  UserController.updateUser
);

// Delete user (requires permission)
router.delete(
  '/:userId',
  requirePermission('users:delete'),
  validate(userIdSchema, ValidationTarget.PARAMS),
  UserController.deleteUser
);

// Restore user (requires admin role)
router.post(
  '/:userId/restore',
  requireRole(['admin', 'superadmin']),
  validate(userIdSchema, ValidationTarget.PARAMS),
  UserController.restoreUser
);

// Update user roles (requires permission)
router.put(
  '/:userId/roles',
  requirePermission('users:manage-roles'),
  validate(userIdSchema, ValidationTarget.PARAMS),
  validate(
    Joi.object({
      roleIds: Joi.array().items(Joi.string().uuid()).unique().required()
    }),
    ValidationTarget.BODY
  ),
  UserController.updateUserRoles
);

// Reset user password (requires admin role)
router.post(
  '/:userId/reset-password',
  requireRole(['admin', 'superadmin']),
  validate(userIdSchema, ValidationTarget.PARAMS),
  validate(updateUserPasswordSchema, ValidationTarget.BODY),
  UserController.resetUserPassword
);

export default router;