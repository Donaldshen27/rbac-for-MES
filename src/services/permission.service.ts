import { Transaction, Op, WhereOptions } from 'sequelize';
import { Permission, Role, RolePermission, Resource } from '@models';
import {
  IPermission,
  IPermissionCreate,
  IPermissionUpdate,
  IPermissionFilters,
  IPermissionPaginationResult,
  IPermissionWithRoles,
  IPermissionCheckResult,
  IResource,
  IResourceCreate,
  IResourceFilters,
  IResourcePaginationResult,
} from '@types/permission.types';
import { ApiError } from '@utils/ApiError';
import { sequelize } from '@config/database';
import logger from '@utils/logger';

export class PermissionService {
  async createPermission(data: IPermissionCreate): Promise<IPermission> {
    const transaction = await sequelize.transaction();

    try {
      const existingPermission = await Permission.findOne({
        where: {
          [Op.or]: [
            { name: data.name || Permission.formatPermissionName(data.resource, data.action) },
            { resource: data.resource, action: data.action }
          ]
        }
      });

      if (existingPermission) {
        throw new ApiError(409, 'Permission already exists');
      }

      const permission = await Permission.create(data, { transaction });

      await transaction.commit();

      logger.info(`Permission created: ${permission.name}`);

      return permission.toJSON() as IPermission;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getPermissions(filters: IPermissionFilters): Promise<IPermissionPaginationResult> {
    const {
      resource,
      action,
      search,
      page = 1,
      limit = 20
    } = filters;

    const where: WhereOptions<Permission> = {};

    if (resource) {
      where.resource = resource;
    }

    if (action) {
      where.action = action;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Permission.findAndCountAll({
      where,
      limit,
      offset,
      order: [['resource', 'ASC'], ['action', 'ASC']]
    });

    const permissions = rows.map(permission => permission.toJSON() as IPermission);

    return {
      permissions,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getPermissionById(id: string): Promise<IPermissionWithRoles> {
    const permission = await Permission.findByPk(id, {
      include: [{
        model: Role,
        as: 'roles',
        attributes: ['id', 'name'],
        through: { attributes: [] }
      }]
    });

    if (!permission) {
      throw new ApiError(404, 'Permission not found');
    }

    const permissionData = permission.toJSON() as IPermissionWithRoles;

    for (const role of permissionData.roles || []) {
      const userCount = await (permission as any).countUsers({ where: { roleId: role.id } });
      role.userCount = userCount;
    }

    return permissionData;
  }

  async updatePermission(id: string, data: IPermissionUpdate): Promise<IPermission> {
    const transaction = await sequelize.transaction();

    try {
      const permission = await Permission.findByPk(id);

      if (!permission) {
        throw new ApiError(404, 'Permission not found');
      }

      await permission.update(data, { transaction });

      await transaction.commit();

      logger.info(`Permission updated: ${permission.name}`);

      return permission.toJSON() as IPermission;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async deletePermission(id: string): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      const permission = await Permission.findByPk(id);

      if (!permission) {
        throw new ApiError(404, 'Permission not found');
      }

      const roleCount = await permission.getRoleCount();
      if (roleCount > 0) {
        throw new ApiError(400, `Cannot delete permission assigned to ${roleCount} roles`);
      }

      await permission.destroy({ transaction });

      await transaction.commit();

      logger.info(`Permission deleted: ${permission.name}`);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async checkUserPermission(userId: string, permissionName: string): Promise<IPermissionCheckResult> {
    const user = await sequelize.models.User.findByPk(userId, {
      include: [{
        model: Role,
        as: 'roles',
        include: [{
          model: Permission,
          as: 'permissions',
          where: { name: permissionName },
          required: false
        }]
      }]
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const userData = user.toJSON() as any;

    if (userData.isSuperuser) {
      return {
        hasPermission: true,
        source: 'superuser'
      };
    }

    for (const role of userData.roles || []) {
      if (role.permissions && role.permissions.length > 0) {
        return {
          hasPermission: true,
          source: `role:${role.name}`
        };
      }
    }

    const parts = permissionName.split(':');
    if (parts.length === 2) {
      const resource = parts[0];
      const wildcardPermission = `${resource}:*`;

      for (const role of userData.roles || []) {
        const hasWildcard = await Permission.count({
          include: [{
            model: Role,
            as: 'roles',
            where: { id: role.id },
            required: true
          }],
          where: { name: wildcardPermission }
        });

        if (hasWildcard > 0) {
          return {
            hasPermission: true,
            source: `role:${role.name} (wildcard)`
          };
        }
      }
    }

    return {
      hasPermission: false
    };
  }

  async getPermissionsByRoleId(roleId: string): Promise<IPermission[]> {
    const role = await Role.findByPk(roleId, {
      include: [{
        model: Permission,
        as: 'permissions',
        through: { attributes: ['grantedAt', 'grantedBy'] }
      }]
    });

    if (!role) {
      throw new ApiError(404, 'Role not found');
    }

    const roleData = role.toJSON() as any;
    return roleData.permissions || [];
  }

  async assignPermissionsToRole(
    roleId: string,
    permissionIds: string[],
    grantedBy: string
  ): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      const role = await Role.findByPk(roleId);
      if (!role) {
        throw new ApiError(404, 'Role not found');
      }

      const roleData = role.toJSON() as any;
      if (roleData.isSystem) {
        throw new ApiError(400, 'Cannot modify permissions for system roles');
      }

      await RolePermission.destroy({
        where: { roleId },
        transaction
      });

      if (permissionIds.length > 0) {
        const permissions = await Permission.findAll({
          where: { id: permissionIds }
        });

        if (permissions.length !== permissionIds.length) {
          throw new ApiError(400, 'One or more permissions not found');
        }

        const rolePermissions = permissionIds.map(permissionId => ({
          roleId,
          permissionId,
          grantedBy
        }));

        await RolePermission.bulkCreate(rolePermissions, { transaction });
      }

      await transaction.commit();

      logger.info(`Permissions updated for role ${roleId}: ${permissionIds.length} permissions assigned`);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async createResource(data: IResourceCreate): Promise<IResource> {
    const transaction = await sequelize.transaction();

    try {
      const existingResource = await Resource.findOne({
        where: { name: data.name }
      });

      if (existingResource) {
        throw new ApiError(409, 'Resource already exists');
      }

      const resource = await Resource.create(data, { transaction });

      await transaction.commit();

      logger.info(`Resource created: ${resource.name}`);

      return resource.toJSON() as IResource;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getResources(filters: IResourceFilters): Promise<IResourcePaginationResult> {
    const {
      search,
      page = 1,
      limit = 20
    } = filters;

    const where: WhereOptions<Resource> = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Resource.findAndCountAll({
      where,
      limit,
      offset,
      order: [['name', 'ASC']]
    });

    const resources = await Promise.all(
      rows.map(async (resource) => {
        const permissionCount = await Permission.count({
          where: { resource: resource.name }
        });

        return {
          ...resource.toJSON(),
          permissionCount
        } as IResource;
      })
    );

    return {
      resources,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getResourceById(id: string): Promise<IResource> {
    const resource = await Resource.findByPk(id);

    if (!resource) {
      throw new ApiError(404, 'Resource not found');
    }

    const permissionCount = await Permission.count({
      where: { resource: resource.name }
    });

    return {
      ...resource.toJSON(),
      permissionCount
    } as IResource;
  }

  async updateResource(id: string, data: Partial<IResourceCreate>): Promise<IResource> {
    const transaction = await sequelize.transaction();

    try {
      const resource = await Resource.findByPk(id);

      if (!resource) {
        throw new ApiError(404, 'Resource not found');
      }

      if (data.name && data.name !== resource.name) {
        const existingResource = await Resource.findOne({
          where: { name: data.name }
        });

        if (existingResource) {
          throw new ApiError(409, 'Resource name already exists');
        }
      }

      await resource.update(data, { transaction });

      await transaction.commit();

      logger.info(`Resource updated: ${resource.name}`);

      const permissionCount = await Permission.count({
        where: { resource: resource.name }
      });

      return {
        ...resource.toJSON(),
        permissionCount
      } as IResource;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async deleteResource(id: string): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      const resource = await Resource.findByPk(id);

      if (!resource) {
        throw new ApiError(404, 'Resource not found');
      }

      const permissionCount = await Permission.count({
        where: { resource: resource.name }
      });

      if (permissionCount > 0) {
        throw new ApiError(400, `Cannot delete resource with ${permissionCount} associated permissions`);
      }

      await resource.destroy({ transaction });

      await transaction.commit();

      logger.info(`Resource deleted: ${resource.name}`);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export default new PermissionService();