import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import permissionService from '@services/permission.service';
import { Permission, Role, RolePermission, Resource, User } from '@models';
import { sequelize } from '@config/database';
import { ApiError } from '@utils/ApiError';

jest.mock('@utils/logger', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('PermissionService', () => {
  let transaction: any;

  beforeEach(async () => {
    transaction = await sequelize.transaction();
    jest.spyOn(sequelize, 'transaction').mockResolvedValue(transaction);
    jest.spyOn(transaction, 'commit').mockResolvedValue(undefined);
    jest.spyOn(transaction, 'rollback').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createPermission', () => {
    it('should create a new permission successfully', async () => {
      const mockPermission = {
        id: 'perm-id',
        name: 'user:create',
        resource: 'user',
        action: 'create',
        description: 'Create users',
        toJSON: () => ({
          id: 'perm-id',
          name: 'user:create',
          resource: 'user',
          action: 'create',
          description: 'Create users'
        })
      };

      jest.spyOn(Permission, 'findOne').mockResolvedValue(null);
      jest.spyOn(Permission, 'create').mockResolvedValue(mockPermission as any);

      const result = await permissionService.createPermission({
        resource: 'user',
        action: 'create',
        description: 'Create users'
      });

      expect(result).toEqual({
        id: 'perm-id',
        name: 'user:create',
        resource: 'user',
        action: 'create',
        description: 'Create users'
      });
      expect(transaction.commit).toHaveBeenCalled();
    });

    it('should throw error if permission already exists', async () => {
      jest.spyOn(Permission, 'findOne').mockResolvedValue({ id: 'existing-id' } as any);

      await expect(
        permissionService.createPermission({
          resource: 'user',
          action: 'create'
        })
      ).rejects.toThrow(ApiError);

      expect(transaction.rollback).toHaveBeenCalled();
    });
  });

  describe('getPermissions', () => {
    it('should return paginated permissions', async () => {
      const mockPermissions = [
        {
          toJSON: () => ({
            id: 'perm-1',
            name: 'user:create',
            resource: 'user',
            action: 'create'
          })
        },
        {
          toJSON: () => ({
            id: 'perm-2',
            name: 'user:read',
            resource: 'user',
            action: 'read'
          })
        }
      ];

      jest.spyOn(Permission, 'findAndCountAll').mockResolvedValue({
        count: 2,
        rows: mockPermissions as any
      });

      const result = await permissionService.getPermissions({
        page: 1,
        limit: 20
      });

      expect(result).toEqual({
        permissions: [
          {
            id: 'perm-1',
            name: 'user:create',
            resource: 'user',
            action: 'create'
          },
          {
            id: 'perm-2',
            name: 'user:read',
            resource: 'user',
            action: 'read'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1
        }
      });
    });

    it('should filter permissions by resource and action', async () => {
      jest.spyOn(Permission, 'findAndCountAll').mockResolvedValue({
        count: 0,
        rows: []
      });

      await permissionService.getPermissions({
        resource: 'user',
        action: 'create',
        page: 1,
        limit: 20
      });

      expect(Permission.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            resource: 'user',
            action: 'create'
          }
        })
      );
    });
  });

  describe('getPermissionById', () => {
    it('should return permission with roles', async () => {
      const mockPermission = {
        id: 'perm-id',
        name: 'user:create',
        toJSON: () => ({
          id: 'perm-id',
          name: 'user:create',
          roles: [
            { id: 'role-1', name: 'admin' }
          ]
        }),
        countUsers: jest.fn().mockResolvedValue(5)
      };

      jest.spyOn(Permission, 'findByPk').mockResolvedValue(mockPermission as any);

      const result = await permissionService.getPermissionById('perm-id');

      expect(result).toEqual({
        id: 'perm-id',
        name: 'user:create',
        roles: [
          { id: 'role-1', name: 'admin', userCount: 5 }
        ]
      });
    });

    it('should throw error if permission not found', async () => {
      jest.spyOn(Permission, 'findByPk').mockResolvedValue(null);

      await expect(
        permissionService.getPermissionById('invalid-id')
      ).rejects.toThrow(ApiError);
    });
  });

  describe('updatePermission', () => {
    it('should update permission description', async () => {
      const mockPermission = {
        id: 'perm-id',
        update: jest.fn().mockResolvedValue(true),
        toJSON: () => ({
          id: 'perm-id',
          name: 'user:create',
          description: 'Updated description'
        })
      };

      jest.spyOn(Permission, 'findByPk').mockResolvedValue(mockPermission as any);

      const result = await permissionService.updatePermission('perm-id', {
        description: 'Updated description'
      });

      expect(result).toEqual({
        id: 'perm-id',
        name: 'user:create',
        description: 'Updated description'
      });
      expect(mockPermission.update).toHaveBeenCalled();
      expect(transaction.commit).toHaveBeenCalled();
    });
  });

  describe('deletePermission', () => {
    it('should delete permission successfully', async () => {
      const mockPermission = {
        id: 'perm-id',
        getRoleCount: jest.fn().mockResolvedValue(0),
        destroy: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(Permission, 'findByPk').mockResolvedValue(mockPermission as any);

      await permissionService.deletePermission('perm-id');

      expect(mockPermission.destroy).toHaveBeenCalled();
      expect(transaction.commit).toHaveBeenCalled();
    });

    it('should throw error if permission is assigned to roles', async () => {
      const mockPermission = {
        id: 'perm-id',
        getRoleCount: jest.fn().mockResolvedValue(3)
      };

      jest.spyOn(Permission, 'findByPk').mockResolvedValue(mockPermission as any);

      await expect(
        permissionService.deletePermission('perm-id')
      ).rejects.toThrow(ApiError);

      expect(transaction.rollback).toHaveBeenCalled();
    });
  });

  describe('checkUserPermission', () => {
    it('should return true for superuser', async () => {
      const mockUser = {
        toJSON: () => ({
          id: 'user-id',
          isSuperuser: true,
          roles: []
        })
      };

      jest.spyOn(sequelize.models.User, 'findByPk').mockResolvedValue(mockUser as any);

      const result = await permissionService.checkUserPermission('user-id', 'user:create');

      expect(result).toEqual({
        hasPermission: true,
        source: 'superuser'
      });
    });

    it('should check role permissions', async () => {
      const mockUser = {
        toJSON: () => ({
          id: 'user-id',
          isSuperuser: false,
          roles: [
            {
              name: 'admin',
              permissions: [{ name: 'user:create' }]
            }
          ]
        })
      };

      jest.spyOn(sequelize.models.User, 'findByPk').mockResolvedValue(mockUser as any);

      const result = await permissionService.checkUserPermission('user-id', 'user:create');

      expect(result).toEqual({
        hasPermission: true,
        source: 'role:admin'
      });
    });

    it('should check wildcard permissions', async () => {
      const mockUser = {
        toJSON: () => ({
          id: 'user-id',
          isSuperuser: false,
          roles: [{ id: 'role-1', name: 'admin', permissions: [] }]
        })
      };

      jest.spyOn(sequelize.models.User, 'findByPk').mockResolvedValue(mockUser as any);
      jest.spyOn(Permission, 'count').mockResolvedValue(1);

      const result = await permissionService.checkUserPermission('user-id', 'user:create');

      expect(result).toEqual({
        hasPermission: true,
        source: 'role:admin (wildcard)'
      });
    });

    it('should return false if no permission found', async () => {
      const mockUser = {
        toJSON: () => ({
          id: 'user-id',
          isSuperuser: false,
          roles: []
        })
      };

      jest.spyOn(sequelize.models.User, 'findByPk').mockResolvedValue(mockUser as any);

      const result = await permissionService.checkUserPermission('user-id', 'user:create');

      expect(result).toEqual({
        hasPermission: false
      });
    });
  });

  describe('assignPermissionsToRole', () => {
    it('should assign permissions to role', async () => {
      const mockRole = {
        id: 'role-id',
        toJSON: () => ({ isSystem: false })
      };

      jest.spyOn(Role, 'findByPk').mockResolvedValue(mockRole as any);
      jest.spyOn(RolePermission, 'destroy').mockResolvedValue(0);
      jest.spyOn(Permission, 'findAll').mockResolvedValue([
        { id: 'perm-1' },
        { id: 'perm-2' }
      ] as any);
      jest.spyOn(RolePermission, 'bulkCreate').mockResolvedValue([]);

      await permissionService.assignPermissionsToRole(
        'role-id',
        ['perm-1', 'perm-2'],
        'user-id'
      );

      expect(RolePermission.destroy).toHaveBeenCalledWith({
        where: { roleId: 'role-id' },
        transaction
      });
      expect(RolePermission.bulkCreate).toHaveBeenCalled();
      expect(transaction.commit).toHaveBeenCalled();
    });

    it('should throw error for system roles', async () => {
      const mockRole = {
        id: 'role-id',
        toJSON: () => ({ isSystem: true })
      };

      jest.spyOn(Role, 'findByPk').mockResolvedValue(mockRole as any);

      await expect(
        permissionService.assignPermissionsToRole('role-id', [], 'user-id')
      ).rejects.toThrow(ApiError);

      expect(transaction.rollback).toHaveBeenCalled();
    });
  });

  describe('Resource Management', () => {
    describe('createResource', () => {
      it('should create a new resource', async () => {
        const mockResource = {
          id: 'resource-id',
          name: 'inventory',
          description: 'Inventory management',
          toJSON: () => ({
            id: 'resource-id',
            name: 'inventory',
            description: 'Inventory management'
          })
        };

        jest.spyOn(Resource, 'findOne').mockResolvedValue(null);
        jest.spyOn(Resource, 'create').mockResolvedValue(mockResource as any);

        const result = await permissionService.createResource({
          name: 'inventory',
          description: 'Inventory management'
        });

        expect(result).toEqual({
          id: 'resource-id',
          name: 'inventory',
          description: 'Inventory management'
        });
        expect(transaction.commit).toHaveBeenCalled();
      });
    });

    describe('getResources', () => {
      it('should return resources with permission count', async () => {
        const mockResources = [
          {
            name: 'user',
            toJSON: () => ({ id: 'res-1', name: 'user' })
          }
        ];

        jest.spyOn(Resource, 'findAndCountAll').mockResolvedValue({
          count: 1,
          rows: mockResources as any
        });
        jest.spyOn(Permission, 'count').mockResolvedValue(5);

        const result = await permissionService.getResources({
          page: 1,
          limit: 20
        });

        expect(result).toEqual({
          resources: [
            { id: 'res-1', name: 'user', permissionCount: 5 }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1
          }
        });
      });
    });

    describe('deleteResource', () => {
      it('should delete resource without permissions', async () => {
        const mockResource = {
          id: 'resource-id',
          name: 'inventory',
          destroy: jest.fn().mockResolvedValue(true)
        };

        jest.spyOn(Resource, 'findByPk').mockResolvedValue(mockResource as any);
        jest.spyOn(Permission, 'count').mockResolvedValue(0);

        await permissionService.deleteResource('resource-id');

        expect(mockResource.destroy).toHaveBeenCalled();
        expect(transaction.commit).toHaveBeenCalled();
      });

      it('should throw error if resource has permissions', async () => {
        const mockResource = {
          id: 'resource-id',
          name: 'user'
        };

        jest.spyOn(Resource, 'findByPk').mockResolvedValue(mockResource as any);
        jest.spyOn(Permission, 'count').mockResolvedValue(10);

        await expect(
          permissionService.deleteResource('resource-id')
        ).rejects.toThrow(ApiError);

        expect(transaction.rollback).toHaveBeenCalled();
      });
    });
  });
});