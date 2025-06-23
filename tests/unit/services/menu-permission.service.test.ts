import { MenuPermissionService } from '../../../src/services/menu-permission.service';
import { Menu } from '../../../src/models/Menu';
import { MenuPermission } from '../../../src/models/MenuPermission';
import { Role } from '../../../src/models/Role';
import { User } from '../../../src/models/User';
import { UserRole } from '../../../src/models/UserRole';
import { AuditService } from '../../../src/services/audit.service';
import { ApiError } from '../../../src/utils/api-error';
import { sequelize } from '../../../src/config/database';

// Mock dependencies
jest.mock('../../../src/models/Menu');
jest.mock('../../../src/models/MenuPermission');
jest.mock('../../../src/models/Role');
jest.mock('../../../src/models/User');
jest.mock('../../../src/models/UserRole');
jest.mock('../../../src/services/audit.service');
jest.mock('../../../src/config/database', () => ({
  sequelize: {
    transaction: jest.fn()
  }
}));

describe('MenuPermissionService', () => {
  let mockTransaction: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn()
    };
    (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);
  });

  describe('getUserMenuTree', () => {
    it('should return empty menu tree for user with no roles', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        roles: []
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const result = await MenuPermissionService.getUserMenuTree(userId);

      expect(result).toEqual({
        menus: [],
        totalCount: 0,
        activeCount: 0
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should return menu tree with aggregated permissions', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        roles: [
          { id: 'role-1', name: 'Admin' },
          { id: 'role-2', name: 'Editor' }
        ]
      };

      const mockMenuPermissions = [
        {
          menuId: 'M1',
          roleId: 'role-1',
          canView: true,
          canEdit: true,
          canDelete: false,
          canExport: false,
          menu: {
            id: 'M1',
            parentId: null,
            title: 'Dashboard',
            orderIndex: 0,
            isActive: true,
            toJSON: () => ({
              id: 'M1',
              parentId: null,
              title: 'Dashboard',
              orderIndex: 0,
              isActive: true
            })
          }
        },
        {
          menuId: 'M2',
          roleId: 'role-2',
          canView: true,
          canEdit: false,
          canDelete: false,
          canExport: true,
          menu: {
            id: 'M2',
            parentId: null,
            title: 'Reports',
            orderIndex: 1,
            isActive: true,
            toJSON: () => ({
              id: 'M2',
              parentId: null,
              title: 'Reports',
              orderIndex: 1,
              isActive: true
            })
          }
        }
      ];

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (MenuPermission.findAll as jest.Mock).mockResolvedValue(mockMenuPermissions);

      const result = await MenuPermissionService.getUserMenuTree(userId);

      expect(result.menus).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.activeCount).toBe(2);
      expect(result.menus[0].permissions).toEqual({
        canView: true,
        canEdit: true,
        canDelete: false,
        canExport: false
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should throw error when user not found', async () => {
      const userId = 'invalid-user';
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(MenuPermissionService.getUserMenuTree(userId))
        .rejects
        .toThrow(new ApiError(404, 'User not found'));

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('getCompleteMenuTree', () => {
    it('should return complete menu tree', async () => {
      const mockMenus = [
        {
          id: 'M1',
          parentId: null,
          title: 'Dashboard',
          orderIndex: 0,
          isActive: true,
          toJSON: () => ({
            id: 'M1',
            parentId: null,
            title: 'Dashboard',
            orderIndex: 0,
            isActive: true
          })
        },
        {
          id: 'M2',
          parentId: 'M1',
          title: 'Analytics',
          orderIndex: 0,
          isActive: true,
          toJSON: () => ({
            id: 'M2',
            parentId: 'M1',
            title: 'Analytics',
            orderIndex: 0,
            isActive: true
          })
        }
      ];

      (Menu.findAll as jest.Mock).mockResolvedValue(mockMenus);

      const result = await MenuPermissionService.getCompleteMenuTree();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('M1');
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].id).toBe('M2');
    });

    it('should filter menus by search criteria', async () => {
      const mockMenus = [
        {
          id: 'M1',
          parentId: null,
          title: 'Dashboard',
          isActive: true,
          toJSON: () => ({
            id: 'M1',
            parentId: null,
            title: 'Dashboard',
            isActive: true
          })
        }
      ];

      (Menu.findAll as jest.Mock).mockResolvedValue(mockMenus);

      const result = await MenuPermissionService.getCompleteMenuTree({
        search: 'Dashboard',
        isActive: true
      });

      expect(Menu.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Object),
          order: [['orderIndex', 'ASC']]
        })
      );
    });
  });

  describe('updateRoleMenuPermissions', () => {
    it('should update menu permissions successfully', async () => {
      const roleId = 'role-123';
      const permissions = [
        {
          menuId: 'M1',
          roleId,
          canView: true,
          canEdit: true,
          canDelete: false,
          canExport: false
        }
      ];
      const userId = 'user-123';

      const mockRole = { id: roleId, name: 'Admin' };
      const mockMenus = [{ id: 'M1' }];

      (Role.findByPk as jest.Mock).mockResolvedValue(mockRole);
      (Menu.findAll as jest.Mock).mockResolvedValue(mockMenus);
      (MenuPermission.findOne as jest.Mock).mockResolvedValue(null);
      (MenuPermission.create as jest.Mock).mockResolvedValue({});

      const result = await MenuPermissionService.updateRoleMenuPermissions(
        roleId,
        permissions,
        userId
      );

      expect(result.success).toContain('M1');
      expect(result.failed).toHaveLength(0);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should validate at least one permission is granted', async () => {
      const roleId = 'role-123';
      const permissions = [
        {
          menuId: 'M1',
          roleId,
          canView: false,
          canEdit: false,
          canDelete: false,
          canExport: false
        }
      ];

      const mockRole = { id: roleId, name: 'Admin' };
      const mockMenus = [{ id: 'M1' }];

      (Role.findByPk as jest.Mock).mockResolvedValue(mockRole);
      (Menu.findAll as jest.Mock).mockResolvedValue(mockMenus);

      const result = await MenuPermissionService.updateRoleMenuPermissions(
        roleId,
        permissions
      );

      expect(result.success).toHaveLength(0);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toBe('At least one permission must be granted');
    });

    it('should throw error when role not found', async () => {
      (Role.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(
        MenuPermissionService.updateRoleMenuPermissions('invalid-role', [])
      ).rejects.toThrow(new ApiError(404, 'Role not found'));

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('checkMenuAccess', () => {
    it('should allow access when user has permission', async () => {
      const check = {
        menuId: 'M1',
        userId: 'user-123',
        permission: 'view' as const
      };

      const mockUser = {
        id: 'user-123',
        roles: [{ id: 'role-1', name: 'Admin' }]
      };

      const mockMenu = { id: 'M1', isActive: true };
      const mockMenuPermission = {
        canView: true,
        canEdit: false,
        canDelete: false,
        canExport: false
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (Menu.findByPk as jest.Mock).mockResolvedValue(mockMenu);
      (MenuPermission.findOne as jest.Mock).mockResolvedValue(mockMenuPermission);

      const result = await MenuPermissionService.checkMenuAccess(check);

      expect(result.allowed).toBe(true);
      expect(result.rolesThatGrantAccess).toHaveLength(1);
    });

    it('should deny access when menu is not active', async () => {
      const check = {
        menuId: 'M1',
        userId: 'user-123',
        permission: 'view' as const
      };

      const mockUser = {
        id: 'user-123',
        roles: [{ id: 'role-1', name: 'Admin' }]
      };

      const mockMenu = { id: 'M1', isActive: false };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (Menu.findByPk as jest.Mock).mockResolvedValue(mockMenu);

      const result = await MenuPermissionService.checkMenuAccess(check);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Menu is not active');
    });

    it('should deny access when user has no roles', async () => {
      const check = {
        menuId: 'M1',
        userId: 'user-123',
        permission: 'view' as const
      };

      const mockUser = {
        id: 'user-123',
        roles: []
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const result = await MenuPermissionService.checkMenuAccess(check);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('User has no roles assigned');
    });
  });

  describe('batchUpdateMenuPermissions', () => {
    it('should batch update permissions with applyToChildren', async () => {
      const update = {
        roleId: 'role-123',
        permissions: [
          {
            menuId: 'M1',
            canView: true,
            canEdit: true
          }
        ],
        applyToChildren: true
      };
      const userId = 'user-123';

      const mockRole = { id: 'role-123', name: 'Admin' };
      const mockMenu = {
        id: 'M1',
        getAllChildren: jest.fn().mockResolvedValue([
          { id: 'M2' },
          { id: 'M3' }
        ])
      };

      (Role.findByPk as jest.Mock).mockResolvedValue(mockRole);
      (Menu.findByPk as jest.Mock).mockResolvedValue(mockMenu);
      (MenuPermission.findOne as jest.Mock).mockResolvedValue(null);
      (MenuPermission.create as jest.Mock).mockResolvedValue({});

      const result = await MenuPermissionService.batchUpdateMenuPermissions(
        update,
        userId
      );

      expect(result.success).toContain('M1');
      expect(result.success).toContain('M2');
      expect(result.success).toContain('M3');
      expect(mockMenu.getAllChildren).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should remove permissions when all are false', async () => {
      const update = {
        roleId: 'role-123',
        permissions: [
          {
            menuId: 'M1',
            canView: false,
            canEdit: false,
            canDelete: false,
            canExport: false
          }
        ]
      };

      const mockRole = { id: 'role-123', name: 'Admin' };
      const mockMenu = { id: 'M1' };
      const mockExistingPermission = {
        destroy: jest.fn()
      };

      (Role.findByPk as jest.Mock).mockResolvedValue(mockRole);
      (Menu.findByPk as jest.Mock).mockResolvedValue(mockMenu);
      (MenuPermission.findOne as jest.Mock).mockResolvedValue(mockExistingPermission);

      const result = await MenuPermissionService.batchUpdateMenuPermissions(update);

      expect(mockExistingPermission.destroy).toHaveBeenCalled();
      expect(result.success).toContain('M1');
    });
  });

  describe('getMenuTreeStatistics', () => {
    it('should calculate menu tree statistics correctly', async () => {
      const mockMenus = [
        { id: 'M1', parentId: null, isActive: true },
        { id: 'M2', parentId: 'M1', isActive: true },
        { id: 'M3', parentId: 'M1', isActive: false },
        { id: 'M4', parentId: 'M2', isActive: true }
      ];

      (Menu.findAll as jest.Mock).mockResolvedValue(mockMenus);

      const result = await MenuPermissionService.getMenuTreeStatistics();

      expect(result.totalMenus).toBe(4);
      expect(result.activeMenus).toBe(3);
      expect(result.topLevelMenus).toBe(1);
      expect(result.maxDepth).toBe(3);
      expect(result.averageChildrenPerMenu).toBe(1.5);
    });
  });

  describe('removeAllRoleMenuPermissions', () => {
    it('should remove all menu permissions for a role', async () => {
      const roleId = 'role-123';
      const userId = 'user-123';
      const mockRole = { id: roleId, name: 'Admin' };

      (Role.findByPk as jest.Mock).mockResolvedValue(mockRole);
      (MenuPermission.destroy as jest.Mock).mockResolvedValue(5);

      await MenuPermissionService.removeAllRoleMenuPermissions(roleId, userId);

      expect(MenuPermission.destroy).toHaveBeenCalledWith({
        where: { roleId },
        transaction: mockTransaction
      });
      expect(AuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'REMOVE_ALL_MENU_PERMISSIONS',
          entityType: 'Role',
          entityId: roleId
        }),
        mockTransaction
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should throw error when role not found', async () => {
      (Role.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(
        MenuPermissionService.removeAllRoleMenuPermissions('invalid-role')
      ).rejects.toThrow(new ApiError(404, 'Role not found'));

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });
});