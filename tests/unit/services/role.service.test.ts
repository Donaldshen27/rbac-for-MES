import { Role } from '../../../src/models/Role';
import { User } from '../../../src/models/User';
import { Permission } from '../../../src/models/Permission';
import { MenuPermission } from '../../../src/models/MenuPermission';
import { AuditLog } from '../../../src/models/AuditLog';
import { RoleService } from '../../../src/services/role.service';
import { ApiError } from '../../../src/utils/api-error';
import { sequelize } from '../../../src/config/database';

// Mock the models and database
jest.mock('../../../src/models/Role');
jest.mock('../../../src/models/User');
jest.mock('../../../src/models/Permission');
jest.mock('../../../src/models/MenuPermission');
jest.mock('../../../src/models/AuditLog');
jest.mock('../../../src/config/database', () => ({
  sequelize: {
    transaction: jest.fn()
  }
}));

describe('RoleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllRoles', () => {
    it('should return roles with pagination', async () => {
      const mockRoles = [
        {
          id: '1',
          name: 'admin',
          description: 'Administrator',
          isSystem: true,
          permissions: [{ id: '1', name: 'user:create' }],
          toJSON: function() { return { ...this, toJSON: undefined, getUserCount: undefined }; },
          getUserCount: jest.fn().mockResolvedValue(5)
        },
        {
          id: '2',
          name: 'user',
          description: 'Regular User',
          isSystem: false,
          permissions: [],
          toJSON: function() { return { ...this, toJSON: undefined, getUserCount: undefined }; },
          getUserCount: jest.fn().mockResolvedValue(10)
        }
      ];

      Role.findAndCountAll = jest.fn().mockResolvedValue({
        count: 2,
        rows: mockRoles
      });

      const result = await RoleService.getAllRoles(
        { search: 'admin' },
        { page: 1, limit: 10 }
      );

      expect(Role.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.any(Object),
        include: expect.any(Array),
        limit: 10,
        offset: 0,
        order: [['name', 'ASC']],
        distinct: true
      }));

      expect(result.roles).toHaveLength(2);
      expect(result.roles[0].userCount).toBe(5);
      expect(result.roles[1].userCount).toBe(10);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      });
    });

    it('should filter roles by hasUsers', async () => {
      const mockRoles = [
        {
          id: '1',
          name: 'admin',
          permissions: [],
          toJSON: function() { return { ...this, toJSON: undefined, getUserCount: undefined }; },
          getUserCount: jest.fn().mockResolvedValue(5)
        },
        {
          id: '2',
          name: 'empty_role',
          permissions: [],
          toJSON: function() { return { ...this, toJSON: undefined, getUserCount: undefined }; },
          getUserCount: jest.fn().mockResolvedValue(0)
        }
      ];

      Role.findAndCountAll = jest.fn().mockResolvedValue({
        count: 2,
        rows: mockRoles
      });

      const result = await RoleService.getAllRoles(
        { hasUsers: true },
        { page: 1, limit: 10 }
      );

      expect(result.roles).toHaveLength(1);
      expect(result.roles[0].name).toBe('admin');
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('getRoleById', () => {
    it('should return role with full details', async () => {
      const mockRole = {
        id: '1',
        name: 'admin',
        description: 'Administrator',
        isSystem: true,
        permissions: [{ id: '1', name: 'user:create' }],
        users: [{ id: '1', email: 'admin@test.com' }],
        toJSON: function() { return { ...this, toJSON: undefined }; }
      };

      Role.findByPk = jest.fn().mockResolvedValue(mockRole);

      const result = await RoleService.getRoleById('1');

      expect(Role.findByPk).toHaveBeenCalledWith('1', {
        include: expect.any(Array)
      });
      expect(result.id).toBe('1');
      expect(result.userCount).toBe(1);
      expect(result.permissionCount).toBe(1);
    });

    it('should throw error when role not found', async () => {
      Role.findByPk = jest.fn().mockResolvedValue(null);

      await expect(RoleService.getRoleById('999')).rejects.toThrow(
        new ApiError(404, 'Role not found')
      );
    });
  });

  describe('createRole', () => {
    it('should create role with permissions', async () => {
      const mockTransaction = {};
      Role.findOne = jest.fn().mockResolvedValue(null);
      Role.create = jest.fn().mockResolvedValue({
        id: '1',
        name: 'new_role',
        description: 'New Role',
        isSystem: false,
        permissions: [],
        toJSON: function() { return { ...this, toJSON: undefined }; }
      });
      Permission.findAll = jest.fn().mockResolvedValue([
        { id: '1', name: 'user:read' },
        { id: '2', name: 'user:write' }
      ]);
      AuditLog.create = jest.fn();

      const mockSetPermissions = jest.fn();
      Role.create.mockResolvedValue({
        id: '1',
        name: 'new_role',
        description: 'New Role',
        isSystem: false,
        permissions: [],
        setPermissions: mockSetPermissions,
        toJSON: function() { return { ...this, toJSON: undefined, setPermissions: undefined }; }
      });

      const result = await RoleService.createRole({
        name: 'new_role',
        description: 'New Role',
        permissionIds: ['1', '2'],
        createdBy: 'user1'
      }, mockTransaction);

      expect(Role.create).toHaveBeenCalledWith({
        name: 'new_role',
        description: 'New Role',
        isSystem: false
      }, { transaction: mockTransaction });

      expect(mockSetPermissions).toHaveBeenCalled();
      expect(AuditLog.create).toHaveBeenCalled();
      expect(result.name).toBe('new_role');
    });

    it('should throw error when role already exists', async () => {
      Role.findOne = jest.fn().mockResolvedValue({ id: '1', name: 'existing' });

      await expect(RoleService.createRole({
        name: 'existing',
        description: 'Test'
      })).rejects.toThrow(new ApiError(409, 'Role with this name already exists'));
    });
  });

  describe('updateRole', () => {
    it('should update role and permissions', async () => {
      const mockTransaction = {};
      const mockRole = {
        id: '1',
        name: 'old_name',
        description: 'Old description',
        permissions: [],
        update: jest.fn(),
        setPermissions: jest.fn()
      };

      Role.findByPk = jest.fn().mockResolvedValue(mockRole);
      Role.findOne = jest.fn().mockResolvedValue(null);
      Permission.findAll = jest.fn().mockResolvedValue([
        { id: '1', name: 'user:read' }
      ]);
      AuditLog.create = jest.fn();

      // Mock getRoleById
      jest.spyOn(RoleService, 'getRoleById').mockResolvedValue({
        id: '1',
        name: 'new_name',
        description: 'New description',
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userCount: 0,
        permissionCount: 1
      });

      const result = await RoleService.updateRole(
        '1',
        {
          name: 'new_name',
          description: 'New description',
          permissionIds: ['1']
        },
        'user1',
        mockTransaction
      );

      expect(mockRole.update).toHaveBeenCalledWith({
        name: 'new_name',
        description: 'New description'
      }, { transaction: mockTransaction });

      expect(mockRole.setPermissions).toHaveBeenCalled();
      expect(AuditLog.create).toHaveBeenCalled();
      expect(result.name).toBe('new_name');
    });

    it('should throw error when role not found', async () => {
      Role.findByPk = jest.fn().mockResolvedValue(null);

      await expect(RoleService.updateRole('999', { name: 'test' }, 'user1'))
        .rejects.toThrow(new ApiError(404, 'Role not found'));
    });
  });

  describe('deleteRole', () => {
    it('should delete role', async () => {
      const mockTransaction = {};
      const mockRole = {
        id: '1',
        name: 'test_role',
        isSystem: false,
        getUserCount: jest.fn().mockResolvedValue(0),
        destroy: jest.fn()
      };

      Role.findByPk = jest.fn().mockResolvedValue(mockRole);
      AuditLog.create = jest.fn();

      await RoleService.deleteRole('1', 'user1', mockTransaction);

      expect(mockRole.destroy).toHaveBeenCalledWith({ transaction: mockTransaction });
      expect(AuditLog.create).toHaveBeenCalled();
    });

    it('should throw error when trying to delete system role', async () => {
      const mockRole = {
        id: '1',
        name: 'admin',
        isSystem: true
      };

      Role.findByPk = jest.fn().mockResolvedValue(mockRole);

      await expect(RoleService.deleteRole('1', 'user1'))
        .rejects.toThrow(new ApiError(403, 'System roles cannot be deleted'));
    });

    it('should throw error when role has users', async () => {
      const mockRole = {
        id: '1',
        name: 'test_role',
        isSystem: false,
        getUserCount: jest.fn().mockResolvedValue(5)
      };

      Role.findByPk = jest.fn().mockResolvedValue(mockRole);

      await expect(RoleService.deleteRole('1', 'user1'))
        .rejects.toThrow(new ApiError(400, 'Cannot delete role with 5 assigned users'));
    });
  });

  describe('cloneRole', () => {
    it('should clone role with permissions', async () => {
      const mockTransaction = {};
      const mockSourceRole = {
        id: '1',
        name: 'source_role',
        permissions: [{ id: '1', name: 'user:read' }]
      };
      const mockNewRole = {
        id: '2',
        name: 'cloned_role',
        setPermissions: jest.fn()
      };

      Role.findByPk = jest.fn().mockResolvedValue(mockSourceRole);
      Role.findOne = jest.fn().mockResolvedValue(null);
      Role.create = jest.fn().mockResolvedValue(mockNewRole);
      MenuPermission.findAll = jest.fn().mockResolvedValue([]);
      AuditLog.create = jest.fn();

      jest.spyOn(RoleService, 'getRoleById').mockResolvedValue({
        id: '2',
        name: 'cloned_role',
        description: 'Cloned from source_role',
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userCount: 0,
        permissionCount: 1
      });

      const result = await RoleService.cloneRole({
        sourceRoleId: '1',
        newRoleName: 'cloned_role',
        includePermissions: true,
        includeMenuPermissions: false
      }, 'user1', mockTransaction);

      expect(Role.create).toHaveBeenCalledWith({
        name: 'cloned_role',
        description: 'Cloned from source_role',
        isSystem: false
      }, { transaction: mockTransaction });

      expect(mockNewRole.setPermissions).toHaveBeenCalledWith(
        mockSourceRole.permissions,
        { transaction: mockTransaction }
      );

      expect(result.name).toBe('cloned_role');
    });
  });

  describe('getRoleStatistics', () => {
    it('should return role statistics', async () => {
      const mockRoles = [
        {
          id: '1',
          name: 'admin',
          isSystem: true,
          users: [{ id: '1' }, { id: '2' }],
          permissions: [{ id: '1' }, { id: '2' }, { id: '3' }]
        },
        {
          id: '2',
          name: 'user',
          isSystem: false,
          users: [{ id: '3' }],
          permissions: [{ id: '1' }]
        },
        {
          id: '3',
          name: 'empty',
          isSystem: false,
          users: [],
          permissions: []
        }
      ];

      Role.count = jest.fn()
        .mockResolvedValueOnce(3)  // total
        .mockResolvedValueOnce(1)  // system
        .mockResolvedValueOnce(2); // custom

      Role.findAll = jest.fn().mockResolvedValue(mockRoles);

      const result = await RoleService.getRoleStatistics();

      expect(result).toEqual({
        total: 3,
        system: 1,
        custom: 2,
        withUsers: 2,
        withoutUsers: 1,
        avgPermissionsPerRole: 1.3,
        mostUsedRoles: [
          { id: '1', name: 'admin', userCount: 2 },
          { id: '2', name: 'user', userCount: 1 }
        ]
      });
    });
  });

  describe('assignUsersToRole', () => {
    it('should assign users to role', async () => {
      const mockTransaction = {};
      const mockRole = { id: '1', name: 'test_role' };
      const mockUser1 = {
        id: 'user1',
        roles: [],
        addRole: jest.fn()
      };
      const mockUser2 = {
        id: 'user2',
        roles: [{ id: '1' }],
        addRole: jest.fn()
      };

      Role.findByPk = jest.fn().mockResolvedValue(mockRole);
      User.findByPk = jest.fn()
        .mockResolvedValueOnce(mockUser1)
        .mockResolvedValueOnce(mockUser2)
        .mockResolvedValueOnce(null);
      AuditLog.create = jest.fn();

      const result = await RoleService.assignUsersToRole(
        '1',
        ['user1', 'user2', 'user3'],
        'admin',
        mockTransaction
      );

      expect(result.success).toEqual(['user1']);
      expect(result.failed).toHaveLength(2);
      expect(result.failed[0].error).toBe('User already has this role');
      expect(result.failed[1].error).toBe('User not found');
      expect(mockUser1.addRole).toHaveBeenCalledWith(mockRole, { transaction: mockTransaction });
    });
  });

  describe('updateRoleMenuPermissions', () => {
    it('should update role menu permissions', async () => {
      const mockTransaction = {};
      const mockRole = { id: '1', name: 'test_role' };

      Role.findByPk = jest.fn().mockResolvedValue(mockRole);
      MenuPermission.destroy = jest.fn();
      MenuPermission.bulkCreate = jest.fn();
      AuditLog.create = jest.fn();

      const menuPermissions = [
        { menuId: 'menu1', canView: true, canEdit: false, canDelete: false, canExport: true }
      ];

      await RoleService.updateRoleMenuPermissions('1', menuPermissions, 'admin', mockTransaction);

      expect(MenuPermission.destroy).toHaveBeenCalledWith({
        where: { roleId: '1' },
        transaction: mockTransaction
      });

      expect(MenuPermission.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            roleId: '1',
            menuId: 'menu1',
            canView: true,
            canEdit: false
          })
        ]),
        { transaction: mockTransaction }
      );

      expect(AuditLog.create).toHaveBeenCalled();
    });
  });
});