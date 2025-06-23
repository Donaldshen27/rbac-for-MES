import { Transaction, Op, WhereOptions, Order, Sequelize } from 'sequelize';
import { Role } from '../models/Role';
import { User } from '../models/User';
import { Permission } from '../models/Permission';
import { MenuPermission } from '../models/MenuPermission';
import { AuditLog } from '../models/AuditLog';
import { ApiError } from '../utils/api-error';
import { logger } from '../utils/logger';
import { sequelize } from '../config/database';
import {
  CreateRoleData,
  UpdateRoleData,
  RoleFilter,
  RoleWithDetails,
  RoleListResponse,
  BulkRoleOperationResult,
  RoleStatistics,
  RolePermissionUpdate,
  RoleMenuPermissions,
  RoleCloneData,
  RoleHierarchy
} from '../types/role.types';
import { PaginationOptions } from '../types/user.types';

export class RoleService {
  /**
   * Get all roles with pagination and filtering
   */
  static async getAllRoles(
    filter: RoleFilter = {},
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<RoleListResponse> {
    try {
      const { page = 1, limit = 10 } = pagination;
      const offset = (page - 1) * limit;

      // Build where clause
      const where: WhereOptions<Role> = {};

      if (filter.search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${filter.search}%` } },
          { description: { [Op.like]: `%${filter.search}%` } }
        ];
      }

      if (filter.isSystem !== undefined) {
        where.isSystem = filter.isSystem;
      }

      // Build order clause
      const order: Order = [];
      if (filter.sortBy) {
        const direction = filter.sortOrder === 'desc' ? 'DESC' : 'ASC';
        order.push([filter.sortBy, direction]);
      } else {
        order.push(['name', 'ASC']);
      }

      // Include options
      const includeOptions: any[] = [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'name', 'resource', 'action', 'description'],
          through: { attributes: [] },
          required: false
        }
      ];

      // Get roles with counts
      const { count, rows } = await Role.findAndCountAll({
        where,
        include: includeOptions,
        limit,
        offset,
        order,
        distinct: true
      });

      // Add user counts
      const rolesWithCounts = await Promise.all(
        rows.map(async (role) => {
          const userCount = await role.getUserCount();
          const permissionCount = role.permissions?.length || 0;
          
          return {
            ...role.toJSON(),
            userCount,
            permissionCount
          } as RoleWithDetails;
        })
      );

      // Filter by hasUsers if specified
      let filteredRoles = rolesWithCounts;
      let filteredCount = count;

      if (filter.hasUsers !== undefined) {
        filteredRoles = rolesWithCounts.filter(role => 
          filter.hasUsers ? role.userCount! > 0 : role.userCount! === 0
        );
        filteredCount = filteredRoles.length;
        
        // Re-paginate if filtering changed results
        filteredRoles = filteredRoles.slice(0, limit);
      }

      const totalPages = Math.ceil(filteredCount / limit);

      logger.info(`Retrieved ${filteredRoles.length} roles (total: ${filteredCount})`);
      
      return {
        roles: filteredRoles,
        pagination: {
          page,
          limit,
          total: filteredCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Failed to get roles:', error);
      throw error;
    }
  }

  /**
   * Get role by ID with full details
   */
  static async getRoleById(roleId: string): Promise<RoleWithDetails> {
    try {
      const role = await Role.findByPk(roleId, {
        include: [
          {
            model: Permission,
            as: 'permissions',
            attributes: ['id', 'name', 'resource', 'action', 'description'],
            through: { attributes: [] }
          },
          {
            model: User,
            as: 'users',
            attributes: ['id', 'email', 'username', 'firstName', 'lastName'],
            through: { attributes: [] }
          }
        ]
      });

      if (!role) {
        throw new ApiError(404, 'Role not found');
      }

      const userCount = role.users?.length || 0;
      const permissionCount = role.permissions?.length || 0;

      return {
        ...role.toJSON(),
        userCount,
        permissionCount
      } as RoleWithDetails;
    } catch (error) {
      logger.error(`Failed to get role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Get role by name
   */
  static async getRoleByName(name: string): Promise<Role | null> {
    try {
      const role = await Role.findOne({
        where: { name },
        include: [
          {
            model: Permission,
            as: 'permissions',
            attributes: ['id', 'name', 'resource', 'action'],
            through: { attributes: [] }
          }
        ]
      });

      return role;
    } catch (error) {
      logger.error(`Failed to get role by name ${name}:`, error);
      throw error;
    }
  }

  /**
   * Create a new role
   */
  static async createRole(
    data: CreateRoleData,
    transaction?: Transaction
  ): Promise<RoleWithDetails> {
    try {
      // Check if role already exists
      const existingRole = await Role.findOne({
        where: { name: data.name },
        transaction
      });

      if (existingRole) {
        throw new ApiError(409, 'Role with this name already exists');
      }

      // Create role
      const role = await Role.create({
        name: data.name,
        description: data.description,
        isSystem: data.isSystem || false
      }, { transaction });

      // Assign permissions if provided
      if (data.permissionIds && data.permissionIds.length > 0) {
        const permissions = await Permission.findAll({
          where: { id: data.permissionIds },
          transaction
        });

        if (permissions.length !== data.permissionIds.length) {
          throw new ApiError(400, 'One or more permission IDs are invalid');
        }

        await (role as any).setPermissions(permissions, { transaction });
        role.permissions = permissions;
      }

      // Create audit log
      await AuditLog.create({
        userId: data.createdBy,
        action: 'ROLE_CREATED',
        resource: 'Role',
        resourceId: role.id,
        details: {
          name: role.name,
          permissions: data.permissionIds
        }
      }, { transaction });

      logger.info(`Role created: ${role.name}`);
      
      return {
        ...role.toJSON(),
        userCount: 0,
        permissionCount: role.permissions?.length || 0
      } as RoleWithDetails;
    } catch (error) {
      logger.error('Failed to create role:', error);
      throw error;
    }
  }

  /**
   * Update role
   */
  static async updateRole(
    roleId: string,
    data: UpdateRoleData,
    updatedBy: string,
    transaction?: Transaction
  ): Promise<RoleWithDetails> {
    try {
      const role = await Role.findByPk(roleId, {
        include: ['permissions'],
        transaction
      });

      if (!role) {
        throw new ApiError(404, 'Role not found');
      }

      // Check if name is being changed to an existing name
      if (data.name && data.name !== role.name) {
        const existingRole = await Role.findOne({
          where: { name: data.name, id: { [Op.ne]: roleId } },
          transaction
        });
        if (existingRole) {
          throw new ApiError(409, 'Role name is already in use');
        }
      }

      // Update role fields
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;

      if (Object.keys(updateData).length > 0) {
        await role.update(updateData, { transaction });
      }

      // Update permissions if provided
      if (data.permissionIds !== undefined) {
        const permissions = await Permission.findAll({
          where: { id: data.permissionIds },
          transaction
        });

        if (permissions.length !== data.permissionIds.length) {
          throw new ApiError(400, 'One or more permission IDs are invalid');
        }

        await (role as any).setPermissions(permissions, { transaction });
        role.permissions = permissions;
      }

      // Create audit log
      await AuditLog.create({
        userId: updatedBy,
        action: 'ROLE_UPDATED',
        resource: 'Role',
        resourceId: roleId,
        details: {
          changes: updateData,
          permissionIds: data.permissionIds
        }
      }, { transaction });

      // Get updated role with details
      const updatedRole = await this.getRoleById(roleId);

      logger.info(`Role updated: ${role.name}`);
      return updatedRole;
    } catch (error) {
      logger.error(`Failed to update role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Delete role
   */
  static async deleteRole(
    roleId: string,
    deletedBy: string,
    transaction?: Transaction
  ): Promise<void> {
    try {
      const role = await Role.findByPk(roleId, { transaction });

      if (!role) {
        throw new ApiError(404, 'Role not found');
      }

      if (role.isSystem) {
        throw new ApiError(403, 'System roles cannot be deleted');
      }

      const userCount = await role.getUserCount();
      if (userCount > 0) {
        throw new ApiError(400, `Cannot delete role with ${userCount} assigned users`);
      }

      // Delete role (cascades to role_permissions and menu_permissions)
      await role.destroy({ transaction });

      // Create audit log
      await AuditLog.create({
        userId: deletedBy,
        action: 'ROLE_DELETED',
        resource: 'Role',
        resourceId: roleId,
        details: {
          name: role.name
        }
      }, { transaction });

      logger.info(`Role deleted: ${role.name}`);
    } catch (error) {
      logger.error(`Failed to delete role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Update role permissions (add/remove specific permissions)
   */
  static async updateRolePermissions(
    roleId: string,
    update: RolePermissionUpdate,
    updatedBy: string,
    transaction?: Transaction
  ): Promise<RoleWithDetails> {
    try {
      const role = await Role.findByPk(roleId, {
        include: ['permissions'],
        transaction
      });

      if (!role) {
        throw new ApiError(404, 'Role not found');
      }

      const currentPermissionIds = role.permissions?.map(p => p.id) || [];
      let newPermissionIds = [...currentPermissionIds];

      // Remove permissions
      if (update.remove && update.remove.length > 0) {
        newPermissionIds = newPermissionIds.filter(id => !update.remove!.includes(id));
      }

      // Add permissions
      if (update.add && update.add.length > 0) {
        const toAdd = update.add.filter(id => !newPermissionIds.includes(id));
        newPermissionIds.push(...toAdd);
      }

      // Validate all permission IDs
      const permissions = await Permission.findAll({
        where: { id: newPermissionIds },
        transaction
      });

      if (permissions.length !== newPermissionIds.length) {
        throw new ApiError(400, 'One or more permission IDs are invalid');
      }

      // Update permissions
      await (role as any).setPermissions(permissions, { transaction });

      // Create audit log
      await AuditLog.create({
        userId: updatedBy,
        action: 'ROLE_PERMISSIONS_UPDATED',
        resource: 'Role',
        resourceId: roleId,
        details: {
          added: update.add || [],
          removed: update.remove || [],
          total: newPermissionIds.length
        }
      }, { transaction });

      const updatedRole = await this.getRoleById(roleId);
      logger.info(`Role permissions updated for: ${role.name}`);
      return updatedRole;
    } catch (error) {
      logger.error(`Failed to update role permissions for ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Clone an existing role
   */
  static async cloneRole(
    data: RoleCloneData,
    clonedBy: string,
    transaction?: Transaction
  ): Promise<RoleWithDetails> {
    try {
      const sourceRole = await Role.findByPk(data.sourceRoleId, {
        include: ['permissions'],
        transaction
      });

      if (!sourceRole) {
        throw new ApiError(404, 'Source role not found');
      }

      // Check if new role name already exists
      const existingRole = await Role.findOne({
        where: { name: data.newRoleName },
        transaction
      });

      if (existingRole) {
        throw new ApiError(409, 'Role with this name already exists');
      }

      // Create new role
      const newRole = await Role.create({
        name: data.newRoleName,
        description: data.description || `Cloned from ${sourceRole.name}`,
        isSystem: false
      }, { transaction });

      // Clone permissions if requested
      if (data.includePermissions && sourceRole.permissions) {
        await (newRole as any).setPermissions(sourceRole.permissions, { transaction });
      }

      // Clone menu permissions if requested
      if (data.includeMenuPermissions) {
        const sourceMenuPermissions = await MenuPermission.findAll({
          where: { roleId: data.sourceRoleId },
          transaction
        });

        if (sourceMenuPermissions.length > 0) {
          const newMenuPermissions = sourceMenuPermissions.map(mp => ({
            menuId: mp.menuId,
            roleId: newRole.id,
            canView: mp.canView,
            canEdit: mp.canEdit,
            canDelete: mp.canDelete,
            canExport: mp.canExport
          }));

          await MenuPermission.bulkCreate(newMenuPermissions, { transaction });
        }
      }

      // Create audit log
      await AuditLog.create({
        userId: clonedBy,
        action: 'ROLE_CLONED',
        resource: 'Role',
        resourceId: newRole.id,
        details: {
          sourceRoleId: data.sourceRoleId,
          sourceRoleName: sourceRole.name,
          newRoleName: data.newRoleName,
          includePermissions: data.includePermissions,
          includeMenuPermissions: data.includeMenuPermissions
        }
      }, { transaction });

      const clonedRole = await this.getRoleById(newRole.id);
      logger.info(`Role cloned: ${sourceRole.name} -> ${newRole.name}`);
      return clonedRole;
    } catch (error) {
      logger.error('Failed to clone role:', error);
      throw error;
    }
  }

  /**
   * Bulk delete roles
   */
  static async bulkDeleteRoles(
    roleIds: string[],
    deletedBy: string,
    transaction?: Transaction
  ): Promise<BulkRoleOperationResult> {
    const results: BulkRoleOperationResult = {
      success: [],
      failed: []
    };

    try {
      for (const roleId of roleIds) {
        try {
          await this.deleteRole(roleId, deletedBy, transaction);
          results.success.push(roleId);
        } catch (error) {
          results.failed.push({
            id: roleId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      logger.info(`Bulk delete completed: ${results.success.length} success, ${results.failed.length} failed`);
      return results;
    } catch (error) {
      logger.error('Bulk delete failed:', error);
      throw error;
    }
  }

  /**
   * Get role statistics
   */
  static async getRoleStatistics(): Promise<RoleStatistics> {
    try {
      const [total, system, custom] = await Promise.all([
        Role.count(),
        Role.count({ where: { isSystem: true } }),
        Role.count({ where: { isSystem: false } })
      ]);

      // Get roles with user counts
      const rolesWithUsers = await Role.findAll({
        include: [
          {
            model: User,
            as: 'users',
            attributes: ['id'],
            through: { attributes: [] }
          },
          {
            model: Permission,
            as: 'permissions',
            attributes: ['id'],
            through: { attributes: [] }
          }
        ]
      });

      let withUsers = 0;
      let totalPermissions = 0;
      const roleUserCounts: Array<{ id: string; name: string; userCount: number }> = [];

      rolesWithUsers.forEach(role => {
        const userCount = role.users?.length || 0;
        if (userCount > 0) {
          withUsers++;
          roleUserCounts.push({
            id: role.id,
            name: role.name,
            userCount
          });
        }
        totalPermissions += role.permissions?.length || 0;
      });

      // Sort by user count and get top 5
      const mostUsedRoles = roleUserCounts
        .sort((a, b) => b.userCount - a.userCount)
        .slice(0, 5);

      const avgPermissionsPerRole = total > 0 ? totalPermissions / total : 0;

      return {
        total,
        system,
        custom,
        withUsers,
        withoutUsers: total - withUsers,
        avgPermissionsPerRole: Math.round(avgPermissionsPerRole * 10) / 10,
        mostUsedRoles
      };
    } catch (error) {
      logger.error('Failed to get role statistics:', error);
      throw error;
    }
  }

  /**
   * Get users assigned to a role
   */
  static async getRoleUsers(
    roleId: string,
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<{ users: User[]; total: number }> {
    try {
      const role = await Role.findByPk(roleId);
      if (!role) {
        throw new ApiError(404, 'Role not found');
      }

      const { page = 1, limit = 10 } = pagination;
      const offset = (page - 1) * limit;

      const users = await User.findAndCountAll({
        include: [
          {
            model: Role,
            as: 'roles',
            where: { id: roleId },
            attributes: [],
            through: { attributes: [] }
          }
        ],
        limit,
        offset,
        distinct: true
      });

      return { users: users.rows, total: users.count };
    } catch (error) {
      logger.error(`Failed to get users for role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Assign users to a role
   */
  static async assignUsersToRole(
    roleId: string,
    userIds: string[],
    assignedBy: string,
    transaction?: Transaction
  ): Promise<BulkRoleOperationResult> {
    const results: BulkRoleOperationResult = {
      success: [],
      failed: []
    };

    try {
      const role = await Role.findByPk(roleId, { transaction });
      if (!role) {
        throw new ApiError(404, 'Role not found');
      }

      for (const userId of userIds) {
        try {
          const user = await User.findByPk(userId, {
            include: ['roles'],
            transaction
          });

          if (!user) {
            results.failed.push({ id: userId, error: 'User not found' });
            continue;
          }

          // Check if user already has this role
          const hasRole = user.roles?.some(r => r.id === roleId);
          if (hasRole) {
            results.failed.push({ id: userId, error: 'User already has this role' });
            continue;
          }

          // Add role to user
          await (user as any).addRole(role, { transaction });
          results.success.push(userId);
        } catch (error) {
          results.failed.push({
            id: userId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Create audit log
      await AuditLog.create({
        userId: assignedBy,
        action: 'USERS_ASSIGNED_TO_ROLE',
        resource: 'Role',
        resourceId: roleId,
        details: {
          roleName: role.name,
          total: userIds.length,
          success: results.success.length,
          failed: results.failed.length,
          userIds: results.success
        }
      }, { transaction });

      logger.info(`Users assigned to role ${role.name}: ${results.success.length} success, ${results.failed.length} failed`);
      return results;
    } catch (error) {
      logger.error(`Failed to assign users to role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Remove users from a role
   */
  static async removeUsersFromRole(
    roleId: string,
    userIds: string[],
    removedBy: string,
    transaction?: Transaction
  ): Promise<BulkRoleOperationResult> {
    const results: BulkRoleOperationResult = {
      success: [],
      failed: []
    };

    try {
      const role = await Role.findByPk(roleId, { transaction });
      if (!role) {
        throw new ApiError(404, 'Role not found');
      }

      for (const userId of userIds) {
        try {
          const user = await User.findByPk(userId, {
            include: ['roles'],
            transaction
          });

          if (!user) {
            results.failed.push({ id: userId, error: 'User not found' });
            continue;
          }

          // Check if user has this role
          const hasRole = user.roles?.some(r => r.id === roleId);
          if (!hasRole) {
            results.failed.push({ id: userId, error: 'User does not have this role' });
            continue;
          }

          // Remove role from user
          await (user as any).removeRole(role, { transaction });
          results.success.push(userId);
        } catch (error) {
          results.failed.push({
            id: userId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Create audit log
      await AuditLog.create({
        userId: removedBy,
        action: 'USERS_REMOVED_FROM_ROLE',
        resource: 'Role',
        resourceId: roleId,
        details: {
          roleName: role.name,
          total: userIds.length,
          success: results.success.length,
          failed: results.failed.length,
          userIds: results.success
        }
      }, { transaction });

      logger.info(`Users removed from role ${role.name}: ${results.success.length} success, ${results.failed.length} failed`);
      return results;
    } catch (error) {
      logger.error(`Failed to remove users from role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Get role hierarchy (for visualization)
   */
  static async getRoleHierarchy(): Promise<RoleHierarchy[]> {
    try {
      const roles = await Role.findAll({
        include: [
          {
            model: Permission,
            as: 'permissions',
            attributes: ['id'],
            through: { attributes: [] }
          },
          {
            model: User,
            as: 'users',
            attributes: ['id'],
            through: { attributes: [] }
          }
        ],
        order: [['isSystem', 'DESC'], ['name', 'ASC']]
      });

      return roles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        permissionCount: role.permissions?.length || 0,
        userCount: role.users?.length || 0
      }));
    } catch (error) {
      logger.error('Failed to get role hierarchy:', error);
      throw error;
    }
  }

  /**
   * Check if role has specific permission
   */
  static async roleHasPermission(roleId: string, permissionName: string): Promise<boolean> {
    try {
      const role = await Role.findByPk(roleId, {
        include: [
          {
            model: Permission,
            as: 'permissions',
            where: { name: permissionName },
            required: false
          }
        ]
      });

      return role !== null && role.permissions !== undefined && role.permissions.length > 0;
    } catch (error) {
      logger.error(`Failed to check role permission for ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Get role menu permissions
   */
  static async getRoleMenuPermissions(roleId: string): Promise<RoleMenuPermissions> {
    try {
      const role = await Role.findByPk(roleId);
      if (!role) {
        throw new ApiError(404, 'Role not found');
      }

      const menuPermissions = await MenuPermission.findAll({
        where: { roleId },
        attributes: ['menuId', 'canView', 'canEdit', 'canDelete', 'canExport']
      });

      return {
        roleId,
        menuPermissions: menuPermissions.map(mp => ({
          menuId: mp.menuId,
          canView: mp.canView,
          canEdit: mp.canEdit,
          canDelete: mp.canDelete,
          canExport: mp.canExport
        }))
      };
    } catch (error) {
      logger.error(`Failed to get menu permissions for role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Update role menu permissions
   */
  static async updateRoleMenuPermissions(
    roleId: string,
    menuPermissions: RoleMenuPermissions['menuPermissions'],
    updatedBy: string,
    transaction?: Transaction
  ): Promise<void> {
    try {
      const role = await Role.findByPk(roleId, { transaction });
      if (!role) {
        throw new ApiError(404, 'Role not found');
      }

      // Delete existing menu permissions
      await MenuPermission.destroy({
        where: { roleId },
        transaction
      });

      // Create new menu permissions
      if (menuPermissions.length > 0) {
        const permissionsToCreate = menuPermissions.map(mp => ({
          roleId,
          menuId: mp.menuId,
          canView: mp.canView || false,
          canEdit: mp.canEdit || false,
          canDelete: mp.canDelete || false,
          canExport: mp.canExport || false
        }));

        await MenuPermission.bulkCreate(permissionsToCreate, { transaction });
      }

      // Create audit log
      await AuditLog.create({
        userId: updatedBy,
        action: 'ROLE_MENU_PERMISSIONS_UPDATED',
        resource: 'Role',
        resourceId: roleId,
        details: {
          roleName: role.name,
          menuCount: menuPermissions.length
        }
      }, { transaction });

      logger.info(`Menu permissions updated for role: ${role.name}`);
    } catch (error) {
      logger.error(`Failed to update menu permissions for role ${roleId}:`, error);
      throw error;
    }
  }
}