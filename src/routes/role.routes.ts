import { Router } from 'express';
import { RoleController } from '../controllers/role.controller';
import { MenuController } from '../controllers/menu.controller';
import permissionController from '../controllers/permission.controller';
import { authenticate, requirePermission, requireRole } from '../middlewares/auth.middleware';
import { validate, ValidationTarget } from '../middlewares/validation.middleware';
import {
  createRoleSchema,
  updateRoleSchema,
  roleIdSchema,
  listRolesSchema,
  updateRolePermissionsSchema,
  cloneRoleSchema,
  bulkDeleteRolesSchema,
  userRoleOperationSchema,
  updateMenuPermissionsSchema,
  checkPermissionParamsSchema
} from '../validators/role.validator';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Role statistics and hierarchy (read-only operations)
router.get('/statistics', requirePermission('roles:read'), RoleController.getRoleStatistics);
router.get('/hierarchy', requirePermission('roles:read'), RoleController.getRoleHierarchy);

// Bulk operations
router.post('/bulk-delete', 
  requirePermission('roles:delete'), 
  validate(bulkDeleteRolesSchema), 
  RoleController.bulkDeleteRoles
);

// List and search roles
router.get('/', 
  requirePermission('roles:read'), 
  validate(listRolesSchema, ValidationTarget.QUERY), 
  RoleController.getAllRoles
);

// Create new role
router.post('/', 
  requirePermission('roles:create'), 
  validate(createRoleSchema), 
  RoleController.createRole
);

// Get role by ID
router.get('/:roleId', 
  requirePermission('roles:read'), 
  validate(roleIdSchema, ValidationTarget.PARAMS), 
  RoleController.getRoleById
);

// Update role
router.put('/:roleId', 
  requirePermission('roles:update'), 
  validate(roleIdSchema, ValidationTarget.PARAMS), 
  validate(updateRoleSchema), 
  RoleController.updateRole
);

// Delete role
router.delete('/:roleId', 
  requirePermission('roles:delete'), 
  validate(roleIdSchema, ValidationTarget.PARAMS), 
  RoleController.deleteRole
);

// Clone role
router.post('/:roleId/clone', 
  requirePermission('roles:create'), 
  validate(roleIdSchema, ValidationTarget.PARAMS), 
  validate(cloneRoleSchema), 
  RoleController.cloneRole
);

// Permission management
router.get('/:roleId/permissions',
  requirePermission('roles:read'),
  validate(roleIdSchema, ValidationTarget.PARAMS),
  permissionController.getRolePermissions
);

router.patch('/:roleId/permissions', 
  requirePermission('roles:update'), 
  validate(roleIdSchema, ValidationTarget.PARAMS), 
  validate(updateRolePermissionsSchema), 
  RoleController.updateRolePermissions
);

router.put('/:roleId/permissions',
  requirePermission('roles:update'),
  validate(roleIdSchema, ValidationTarget.PARAMS),
  validate(updateRolePermissionsSchema),
  permissionController.updateRolePermissions
);

// Check if role has permission
router.get('/:roleId/has-permission/:permissionName', 
  requirePermission('roles:read'), 
  validate(checkPermissionParamsSchema, ValidationTarget.PARAMS), 
  RoleController.checkRolePermission
);

// User assignment management
router.get('/:roleId/users', 
  requirePermission('roles:read'), 
  validate(roleIdSchema, ValidationTarget.PARAMS), 
  RoleController.getRoleUsers
);

router.post('/:roleId/users', 
  requirePermission('roles:update'), 
  validate(roleIdSchema, ValidationTarget.PARAMS), 
  validate(userRoleOperationSchema), 
  RoleController.assignUsersToRole
);

router.delete('/:roleId/users', 
  requirePermission('roles:update'), 
  validate(roleIdSchema, ValidationTarget.PARAMS), 
  validate(userRoleOperationSchema), 
  RoleController.removeUsersFromRole
);

// Menu permissions management
router.put('/:roleId/menu-permissions', 
  requirePermission('menus:update'), 
  validate(roleIdSchema, ValidationTarget.PARAMS), 
  validate(updateMenuPermissionsSchema), 
  MenuController.updateRoleMenuPermissions
);

router.delete('/:roleId/menu-permissions',
  requirePermission('menus:update'),
  validate(roleIdSchema, ValidationTarget.PARAMS),
  MenuController.removeAllRoleMenuPermissions
);

export default router;