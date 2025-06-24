import { Router } from 'express';
import { MenuController } from '../controllers/menu.controller';
import { authenticate, requirePermission } from '../middlewares/auth.middleware';
import { validate, ValidationTarget } from '../middlewares/validation.middleware';
import {
  menuIdSchema,
  batchMenuPermissionSchema,
  checkMenuAccessSchema,
  listMenusSchema,
  createMenuSchema,
  updateMenuSchema,
  moveMenuSchema,
  reorderMenusSchema
} from '../validators/menu.validator';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// User menu tree (filtered by permissions)
router.get('/user-menu', MenuController.getUserMenuTree);

// Menu statistics
router.get('/statistics', requirePermission('menus:read'), MenuController.getMenuTreeStatistics);

// Permission matrix
router.get('/permissions/matrix', requirePermission('menus:read'), MenuController.getMenuPermissionMatrix);

// Reorder menus
router.put('/reorder',
  requirePermission('menus:update'),
  validate(reorderMenusSchema),
  MenuController.reorderMenus
);

// Complete menu tree (admin only)
router.get('/', 
  requirePermission('menus:read'), 
  validate(listMenusSchema, ValidationTarget.QUERY),
  MenuController.getCompleteMenuTree
);

// Create new menu
router.post('/',
  requirePermission('menus:create'),
  validate(createMenuSchema),
  MenuController.createMenu
);

// Get single menu by ID
router.get('/:menuId',
  requirePermission('menus:read'),
  validate(menuIdSchema, ValidationTarget.PARAMS),
  MenuController.getMenuById
);

// Update menu
router.put('/:menuId',
  requirePermission('menus:update'),
  validate(menuIdSchema, ValidationTarget.PARAMS),
  validate(updateMenuSchema),
  MenuController.updateMenu
);

// Delete menu
router.delete('/:menuId',
  requirePermission('menus:delete'),
  validate(menuIdSchema, ValidationTarget.PARAMS),
  MenuController.deleteMenu
);

// Move menu to different parent
router.put('/:menuId/move',
  requirePermission('menus:update'),
  validate(menuIdSchema, ValidationTarget.PARAMS),
  validate(moveMenuSchema),
  MenuController.moveMenu
);

// Get permissions for a specific menu
router.get('/:menuId/permissions', 
  requirePermission('menus:read'), 
  validate(menuIdSchema, ValidationTarget.PARAMS), 
  MenuController.getMenuPermissions
);

// Batch update menu permissions
router.post('/permissions/batch', 
  requirePermission('menus:update'), 
  validate(batchMenuPermissionSchema), 
  MenuController.batchUpdateMenuPermissions
);

// Check menu access
router.post('/check-access', 
  requirePermission('menus:read'), 
  validate(checkMenuAccessSchema), 
  MenuController.checkMenuAccess
);

export default router;