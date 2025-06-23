import { Request, Response, NextFunction } from 'express';
import { MenuController } from '../../../src/controllers/menu.controller';
import { MenuPermissionService } from '../../../src/services/menu-permission.service';
import { ResponseUtil } from '../../../src/utils/response';
import { ApiError } from '../../../src/utils/api-error';

// Mock dependencies
jest.mock('../../../src/services/menu-permission.service');
jest.mock('../../../src/utils/response');
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('MenuController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      user: { id: 'user-123' },
      params: {},
      query: {},
      body: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
  });

  describe('createMenu', () => {
    it('should create a new menu successfully', async () => {
      const menuData = {
        id: 'M1',
        title: 'Dashboard',
        href: '/dashboard',
        icon: 'dashboard',
        parentId: null,
        orderIndex: 0
      };

      const createdMenu = { ...menuData, isActive: true };

      mockReq.body = menuData;
      (MenuPermissionService.createMenu as jest.Mock).mockResolvedValue(createdMenu);

      await MenuController.createMenu(mockReq as Request, mockRes as Response, mockNext);

      expect(MenuPermissionService.createMenu).toHaveBeenCalledWith(menuData, 'user-123');
      expect(ResponseUtil.created).toHaveBeenCalledWith(
        mockRes,
        { menu: createdMenu },
        'Menu created successfully'
      );
    });

    it('should handle errors when creating menu', async () => {
      const error = new Error('Create failed');
      mockReq.body = { id: 'M1', title: 'Test' };
      
      (MenuPermissionService.createMenu as jest.Mock).mockRejectedValue(error);

      await MenuController.createMenu(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getMenuById', () => {
    it('should retrieve menu by ID successfully', async () => {
      const menuId = 'M1';
      const menu = {
        id: menuId,
        title: 'Dashboard',
        parent: null,
        children: []
      };

      mockReq.params = { menuId };
      (MenuPermissionService.getMenuById as jest.Mock).mockResolvedValue(menu);

      await MenuController.getMenuById(mockReq as Request, mockRes as Response, mockNext);

      expect(MenuPermissionService.getMenuById).toHaveBeenCalledWith(menuId);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockRes,
        { menu },
        'Menu retrieved successfully'
      );
    });
  });

  describe('updateMenu', () => {
    it('should update menu successfully', async () => {
      const menuId = 'M1';
      const updateData = { title: 'Updated Dashboard', icon: 'new-icon' };
      const updatedMenu = { id: menuId, ...updateData };

      mockReq.params = { menuId };
      mockReq.body = updateData;
      
      (MenuPermissionService.updateMenu as jest.Mock).mockResolvedValue(updatedMenu);

      await MenuController.updateMenu(mockReq as Request, mockRes as Response, mockNext);

      expect(MenuPermissionService.updateMenu).toHaveBeenCalledWith(menuId, updateData, 'user-123');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockRes,
        { menu: updatedMenu },
        'Menu updated successfully'
      );
    });
  });

  describe('deleteMenu', () => {
    it('should delete menu successfully', async () => {
      const menuId = 'M1';
      mockReq.params = { menuId };

      (MenuPermissionService.deleteMenu as jest.Mock).mockResolvedValue(undefined);

      await MenuController.deleteMenu(mockReq as Request, mockRes as Response, mockNext);

      expect(MenuPermissionService.deleteMenu).toHaveBeenCalledWith(menuId, 'user-123');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockRes,
        null,
        'Menu deleted successfully'
      );
    });
  });

  describe('reorderMenus', () => {
    it('should reorder menus successfully', async () => {
      const reorderData = [
        { menuId: 'M1', orderIndex: 0 },
        { menuId: 'M2', orderIndex: 1 }
      ];

      mockReq.body = { items: reorderData };
      (MenuPermissionService.reorderMenus as jest.Mock).mockResolvedValue(undefined);

      await MenuController.reorderMenus(mockReq as Request, mockRes as Response, mockNext);

      expect(MenuPermissionService.reorderMenus).toHaveBeenCalledWith(reorderData, 'user-123');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockRes,
        null,
        'Menus reordered successfully'
      );
    });

    it('should validate items array is required', async () => {
      mockReq.body = {};

      await MenuController.reorderMenus(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Items array is required'
        })
      );
    });
  });

  describe('moveMenu', () => {
    it('should move menu to new parent successfully', async () => {
      const menuId = 'M2';
      const newParentId = 'M1';
      const movedMenu = { id: menuId, parentId: newParentId };

      mockReq.params = { menuId };
      mockReq.body = { newParentId };
      
      (MenuPermissionService.moveMenu as jest.Mock).mockResolvedValue(movedMenu);

      await MenuController.moveMenu(mockReq as Request, mockRes as Response, mockNext);

      expect(MenuPermissionService.moveMenu).toHaveBeenCalledWith(menuId, newParentId, 'user-123');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockRes,
        { menu: movedMenu },
        'Menu moved successfully'
      );
    });

    it('should allow moving menu to root (null parent)', async () => {
      const menuId = 'M2';
      const movedMenu = { id: menuId, parentId: null };

      mockReq.params = { menuId };
      mockReq.body = { newParentId: null };
      
      (MenuPermissionService.moveMenu as jest.Mock).mockResolvedValue(movedMenu);

      await MenuController.moveMenu(mockReq as Request, mockRes as Response, mockNext);

      expect(MenuPermissionService.moveMenu).toHaveBeenCalledWith(menuId, null, 'user-123');
    });

    it('should validate newParentId type', async () => {
      mockReq.params = { menuId: 'M1' };
      mockReq.body = { newParentId: 123 }; // Invalid type

      await MenuController.moveMenu(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'New parent ID must be a string or null'
        })
      );
    });
  });

  describe('getUserMenuTree', () => {
    it('should get user menu tree successfully', async () => {
      const menuTree = {
        menus: [
          { id: 'M1', title: 'Dashboard', permissions: { canView: true } }
        ],
        totalCount: 1,
        activeCount: 1
      };

      (MenuPermissionService.getUserMenuTree as jest.Mock).mockResolvedValue(menuTree);

      await MenuController.getUserMenuTree(mockReq as Request, mockRes as Response, mockNext);

      expect(MenuPermissionService.getUserMenuTree).toHaveBeenCalledWith('user-123');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockRes,
        menuTree,
        'User menu tree retrieved successfully'
      );
    });
  });

  describe('batchUpdateMenuPermissions', () => {
    it('should batch update menu permissions successfully', async () => {
      const update = {
        roleId: 'role-123',
        permissions: [
          { menuId: 'M1', canView: true, canEdit: true }
        ],
        applyToChildren: true
      };

      const result = { success: ['M1'], failed: [] };

      mockReq.body = update;
      (MenuPermissionService.batchUpdateMenuPermissions as jest.Mock).mockResolvedValue(result);

      await MenuController.batchUpdateMenuPermissions(mockReq as Request, mockRes as Response, mockNext);

      expect(MenuPermissionService.batchUpdateMenuPermissions).toHaveBeenCalledWith(update, 'user-123');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockRes,
        result,
        'Menu permissions batch updated successfully'
      );
    });

    it('should validate batch update request', async () => {
      mockReq.body = { roleId: 'role-123' }; // Missing permissions

      await MenuController.batchUpdateMenuPermissions(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Invalid batch update request'
        })
      );
    });
  });

  describe('checkMenuAccess', () => {
    it('should check menu access successfully', async () => {
      const checkData = {
        menuId: 'M1',
        userId: 'user-123',
        permission: 'view' as const
      };

      const result = {
        allowed: true,
        rolesThatGrantAccess: [{ roleId: 'role-1', roleName: 'Admin' }]
      };

      mockReq.body = checkData;
      (MenuPermissionService.checkMenuAccess as jest.Mock).mockResolvedValue(result);

      await MenuController.checkMenuAccess(mockReq as Request, mockRes as Response, mockNext);

      expect(MenuPermissionService.checkMenuAccess).toHaveBeenCalledWith(checkData);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockRes,
        result,
        'Menu access check completed'
      );
    });

    it('should use current user ID if not provided', async () => {
      const checkData = {
        menuId: 'M1',
        permission: 'edit'
      };

      mockReq.body = checkData;
      (MenuPermissionService.checkMenuAccess as jest.Mock).mockResolvedValue({ allowed: false });

      await MenuController.checkMenuAccess(mockReq as Request, mockRes as Response, mockNext);

      expect(MenuPermissionService.checkMenuAccess).toHaveBeenCalledWith({
        menuId: 'M1',
        userId: 'user-123',
        permission: 'edit'
      });
    });

    it('should validate required fields', async () => {
      mockReq.body = { menuId: 'M1' }; // Missing permission

      await MenuController.checkMenuAccess(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Menu ID and permission are required'
        })
      );
    });

    it('should validate permission type', async () => {
      mockReq.body = { menuId: 'M1', permission: 'invalid' };

      await MenuController.checkMenuAccess(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Invalid permission type'
        })
      );
    });
  });
});