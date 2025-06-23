import { Transaction, Op, WhereOptions, Sequelize } from 'sequelize';
import { Menu } from '../models/Menu';
import { MenuPermission } from '../models/MenuPermission';
import { Role } from '../models/Role';
import { User } from '../models/User';
import { UserRole } from '../models/UserRole';
import { AuditLog } from '../models/AuditLog';
import { ApiError } from '../utils/api-error';
import { logger } from '../utils/logger';
import { sequelize } from '../config/database';
import {
  MenuNode,
  MenuPermissionData,
  BatchMenuPermissionUpdate,
  UserMenuResponse,
  MenuPermissionMatrix,
  MenuAccessCheck,
  MenuAccessResult,
  MenuBulkOperationResult,
  MenuTreeStatistics,
  MenuPermissionChange,
  MenuPermissionSummary,
  MenuFilter,
  CreateMenuData,
  UpdateMenuData
} from '../types/menu.types';
import { AuditService } from './audit.service';

export class MenuPermissionService {
  /**
   * Create a new menu item
   */
  static async createMenu(
    menuData: CreateMenuData,
    userId?: string
  ): Promise<Menu> {
    const transaction = await sequelize.transaction();
    
    try {
      // Validate parent menu exists if provided
      if (menuData.parentId) {
        const parentMenu = await Menu.findByPk(menuData.parentId, { transaction });
        if (!parentMenu) {
          throw new ApiError(404, 'Parent menu not found');
        }
      }

      // Create the menu
      const menu = await Menu.create(menuData, { transaction });

      // Audit log
      if (userId) {
        await AuditService.log({
          userId,
          action: 'CREATE_MENU',
          entityType: 'Menu',
          entityId: menu.id,
          details: { menuData },
          ipAddress: null,
          userAgent: null
        }, transaction);
      }

      await transaction.commit();
      
      // Fetch with associations
      const createdMenu = await Menu.findByPk(menu.id, {
        include: [{
          model: Menu,
          as: 'parent'
        }]
      });

      return createdMenu!;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error creating menu:', error);
      throw error;
    }
  }

  /**
   * Get a single menu by ID
   */
  static async getMenuById(menuId: string): Promise<Menu> {
    try {
      const menu = await Menu.findByPk(menuId, {
        include: [
          {
            model: Menu,
            as: 'parent'
          },
          {
            model: Menu,
            as: 'children',
            order: [['orderIndex', 'ASC']]
          }
        ]
      });

      if (!menu) {
        throw new ApiError(404, 'Menu not found');
      }

      return menu;
    } catch (error) {
      logger.error('Error getting menu by ID:', error);
      throw error;
    }
  }

  /**
   * Update a menu item
   */
  static async updateMenu(
    menuId: string,
    updateData: UpdateMenuData,
    userId?: string
  ): Promise<Menu> {
    const transaction = await sequelize.transaction();
    
    try {
      const menu = await Menu.findByPk(menuId, { transaction });
      if (!menu) {
        throw new ApiError(404, 'Menu not found');
      }

      // Validate new parent if changing
      if (updateData.parentId !== undefined && updateData.parentId !== menu.parentId) {
        if (updateData.parentId) {
          const parentMenu = await Menu.findByPk(updateData.parentId, { transaction });
          if (!parentMenu) {
            throw new ApiError(404, 'Parent menu not found');
          }

          // Prevent circular references
          const allChildren = await menu.getAllChildren();
          if (allChildren.some(child => child.id === updateData.parentId)) {
            throw new ApiError(400, 'Cannot set a child menu as parent');
          }
        }
      }

      // Track changes for audit
      const changes: any = {};
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof UpdateMenuData] !== menu[key as keyof Menu]) {
          changes[key] = {
            oldValue: menu[key as keyof Menu],
            newValue: updateData[key as keyof UpdateMenuData]
          };
        }
      });

      // Update the menu
      await menu.update(updateData, { transaction });

      // Audit log
      if (userId && Object.keys(changes).length > 0) {
        await AuditService.log({
          userId,
          action: 'UPDATE_MENU',
          entityType: 'Menu',
          entityId: menuId,
          details: { changes },
          ipAddress: null,
          userAgent: null
        }, transaction);
      }

      await transaction.commit();

      // Fetch updated menu with associations
      const updatedMenu = await Menu.findByPk(menuId, {
        include: [{
          model: Menu,
          as: 'parent'
        }]
      });

      return updatedMenu!;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error updating menu:', error);
      throw error;
    }
  }

  /**
   * Delete a menu item
   */
  static async deleteMenu(
    menuId: string,
    userId?: string
  ): Promise<void> {
    const transaction = await sequelize.transaction();
    
    try {
      const menu = await Menu.findByPk(menuId, {
        include: [{
          model: Menu,
          as: 'children'
        }],
        transaction
      });

      if (!menu) {
        throw new ApiError(404, 'Menu not found');
      }

      // Check if menu has children
      if (menu.children && menu.children.length > 0) {
        throw new ApiError(400, 'Cannot delete menu with child items');
      }

      // Delete associated permissions
      await MenuPermission.destroy({
        where: { menuId },
        transaction
      });

      // Delete the menu
      await menu.destroy({ transaction });

      // Audit log
      if (userId) {
        await AuditService.log({
          userId,
          action: 'DELETE_MENU',
          entityType: 'Menu',
          entityId: menuId,
          details: { menuTitle: menu.title },
          ipAddress: null,
          userAgent: null
        }, transaction);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      logger.error('Error deleting menu:', error);
      throw error;
    }
  }

  /**
   * Reorder menu items
   */
  static async reorderMenus(
    reorderData: Array<{ menuId: string; orderIndex: number }>,
    userId?: string
  ): Promise<void> {
    const transaction = await sequelize.transaction();
    
    try {
      // Validate all menus exist
      const menuIds = reorderData.map(item => item.menuId);
      const menus = await Menu.findAll({
        where: { id: { [Op.in]: menuIds } },
        transaction
      });

      if (menus.length !== menuIds.length) {
        throw new ApiError(400, 'One or more menus not found');
      }

      // Update order for each menu
      for (const item of reorderData) {
        await Menu.update(
          { orderIndex: item.orderIndex },
          { where: { id: item.menuId }, transaction }
        );
      }

      // Audit log
      if (userId) {
        await AuditService.log({
          userId,
          action: 'REORDER_MENUS',
          entityType: 'Menu',
          entityId: 'multiple',
          details: { reorderedCount: reorderData.length },
          ipAddress: null,
          userAgent: null
        }, transaction);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      logger.error('Error reordering menus:', error);
      throw error;
    }
  }

  /**
   * Move a menu to a different parent
   */
  static async moveMenu(
    menuId: string,
    newParentId: string | null,
    userId?: string
  ): Promise<Menu> {
    const transaction = await sequelize.transaction();
    
    try {
      const menu = await Menu.findByPk(menuId, { transaction });
      if (!menu) {
        throw new ApiError(404, 'Menu not found');
      }

      // Validate new parent
      if (newParentId) {
        const parentMenu = await Menu.findByPk(newParentId, { transaction });
        if (!parentMenu) {
          throw new ApiError(404, 'Parent menu not found');
        }

        // Prevent circular references
        const allChildren = await menu.getAllChildren();
        if (allChildren.some(child => child.id === newParentId)) {
          throw new ApiError(400, 'Cannot move menu to its own descendant');
        }

        // Prevent self-reference
        if (menuId === newParentId) {
          throw new ApiError(400, 'Cannot set menu as its own parent');
        }
      }

      const oldParentId = menu.parentId;

      // Update parent
      await menu.update({ parentId: newParentId }, { transaction });

      // Audit log
      if (userId) {
        await AuditService.log({
          userId,
          action: 'MOVE_MENU',
          entityType: 'Menu',
          entityId: menuId,
          details: { 
            oldParentId,
            newParentId,
            menuTitle: menu.title
          },
          ipAddress: null,
          userAgent: null
        }, transaction);
      }

      await transaction.commit();

      // Fetch updated menu
      const movedMenu = await Menu.findByPk(menuId, {
        include: [{
          model: Menu,
          as: 'parent'
        }]
      });

      return movedMenu!;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error moving menu:', error);
      throw error;
    }
  }

  /**
   * Get menu tree with permissions for a specific user
   */
  static async getUserMenuTree(userId: string): Promise<UserMenuResponse> {
    const transaction = await sequelize.transaction();
    
    try {
      // Get user with roles
      const user = await User.findByPk(userId, {
        include: [{
          model: Role,
          as: 'roles',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }],
        transaction
      });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Get all menu permissions for user's roles
      const roleIds = user.roles?.map(role => role.id) || [];
      
      if (roleIds.length === 0) {
        await transaction.commit();
        return {
          menus: [],
          totalCount: 0,
          activeCount: 0
        };
      }

      // Get all menus with permissions
      const menuPermissions = await MenuPermission.findAll({
        where: {
          roleId: { [Op.in]: roleIds },
          canView: true
        },
        include: [{
          model: Menu,
          as: 'menu',
          where: { isActive: true }
        }],
        transaction
      });

      // Build menu map with aggregated permissions
      const menuMap = new Map<string, MenuNode>();
      const menuPermissionMap = new Map<string, MenuPermissionSummary>();

      for (const mp of menuPermissions) {
        const menu = mp.menu!;
        const menuId = menu.id;

        // Aggregate permissions across all roles
        const existingPerms = menuPermissionMap.get(menuId) || {
          canView: false,
          canEdit: false,
          canDelete: false,
          canExport: false
        };

        menuPermissionMap.set(menuId, {
          canView: existingPerms.canView || mp.canView,
          canEdit: existingPerms.canEdit || mp.canEdit,
          canDelete: existingPerms.canDelete || mp.canDelete,
          canExport: existingPerms.canExport || mp.canExport
        });

        if (!menuMap.has(menuId)) {
          menuMap.set(menuId, {
            ...menu.toJSON(),
            children: [],
            permissions: menuPermissionMap.get(menuId)
          } as MenuNode);
        }
      }

      // Build tree structure
      const rootMenus: MenuNode[] = [];
      const allMenus = Array.from(menuMap.values());

      for (const menu of allMenus) {
        if (!menu.parentId) {
          rootMenus.push(menu);
        } else {
          const parent = menuMap.get(menu.parentId);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(menu);
          }
        }
      }

      // Sort menus by orderIndex
      const sortMenus = (menus: MenuNode[]) => {
        menus.sort((a, b) => a.orderIndex - b.orderIndex);
        menus.forEach(menu => {
          if (menu.children && menu.children.length > 0) {
            sortMenus(menu.children);
          }
        });
      };

      sortMenus(rootMenus);

      await transaction.commit();

      return {
        menus: rootMenus,
        totalCount: allMenus.length,
        activeCount: allMenus.length
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Error getting user menu tree:', error);
      throw error;
    }
  }

  /**
   * Get complete menu tree (admin only)
   */
  static async getCompleteMenuTree(filter: MenuFilter = {}): Promise<MenuNode[]> {
    try {
      const where: WhereOptions<Menu> = {};

      if (filter.isActive !== undefined) {
        where.isActive = filter.isActive;
      }

      if (filter.search) {
        where[Op.or] = [
          { title: { [Op.like]: `%${filter.search}%` } },
          { href: { [Op.like]: `%${filter.search}%` } }
        ];
      }

      if (filter.parentId !== undefined) {
        where.parentId = filter.parentId;
      }

      // Get all menus
      const menus = await Menu.findAll({
        where,
        order: [['orderIndex', 'ASC']]
      });

      // Build tree structure
      const menuMap = new Map<string, MenuNode>();
      const rootMenus: MenuNode[] = [];

      // First pass: create menu nodes
      for (const menu of menus) {
        menuMap.set(menu.id, {
          ...menu.toJSON(),
          children: []
        } as MenuNode);
      }

      // Second pass: build tree
      for (const menu of menus) {
        const menuNode = menuMap.get(menu.id)!;
        
        if (!menu.parentId) {
          rootMenus.push(menuNode);
        } else {
          const parent = menuMap.get(menu.parentId);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(menuNode);
          }
        }
      }

      return rootMenus;
    } catch (error) {
      logger.error('Error getting complete menu tree:', error);
      throw error;
    }
  }

  /**
   * Get menu permissions for a specific menu
   */
  static async getMenuPermissions(menuId: string): Promise<MenuPermission[]> {
    try {
      const menu = await Menu.findByPk(menuId);
      if (!menu) {
        throw new ApiError(404, 'Menu not found');
      }

      const permissions = await MenuPermission.findAll({
        where: { menuId },
        include: [{
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description']
        }]
      });

      return permissions;
    } catch (error) {
      logger.error('Error getting menu permissions:', error);
      throw error;
    }
  }

  /**
   * Update menu permissions for a role
   */
  static async updateRoleMenuPermissions(
    roleId: string,
    permissions: MenuPermissionData[],
    userId?: string
  ): Promise<MenuBulkOperationResult> {
    const transaction = await sequelize.transaction();
    
    try {
      const role = await Role.findByPk(roleId, { transaction });
      if (!role) {
        throw new ApiError(404, 'Role not found');
      }

      const success: string[] = [];
      const failed: Array<{ id: string; error: string }> = [];

      // Validate all menus exist
      const menuIds = permissions.map(p => p.menuId);
      const existingMenus = await Menu.findAll({
        where: { id: { [Op.in]: menuIds } },
        attributes: ['id'],
        transaction
      });

      const existingMenuIds = new Set(existingMenus.map(m => m.id));

      for (const permission of permissions) {
        try {
          if (!existingMenuIds.has(permission.menuId)) {
            failed.push({
              id: permission.menuId,
              error: 'Menu not found'
            });
            continue;
          }

          // Validate at least one permission is granted
          if (!permission.canView && !permission.canEdit && !permission.canDelete && !permission.canExport) {
            failed.push({
              id: permission.menuId,
              error: 'At least one permission must be granted'
            });
            continue;
          }

          // Get existing permission
          const existing = await MenuPermission.findOne({
            where: { menuId: permission.menuId, roleId },
            transaction
          });

          const changes: MenuPermissionChange['changes'] = [];

          if (existing) {
            // Track changes
            if (existing.canView !== permission.canView) {
              changes.push({ field: 'canView', oldValue: existing.canView, newValue: permission.canView });
            }
            if (existing.canEdit !== permission.canEdit) {
              changes.push({ field: 'canEdit', oldValue: existing.canEdit, newValue: permission.canEdit });
            }
            if (existing.canDelete !== permission.canDelete) {
              changes.push({ field: 'canDelete', oldValue: existing.canDelete, newValue: permission.canDelete });
            }
            if (existing.canExport !== permission.canExport) {
              changes.push({ field: 'canExport', oldValue: existing.canExport, newValue: permission.canExport });
            }

            // Update existing permission
            await existing.update({
              canView: permission.canView,
              canEdit: permission.canEdit,
              canDelete: permission.canDelete,
              canExport: permission.canExport
            }, { transaction });
          } else {
            // Create new permission
            await MenuPermission.create({
              menuId: permission.menuId,
              roleId,
              canView: permission.canView,
              canEdit: permission.canEdit,
              canDelete: permission.canDelete,
              canExport: permission.canExport
            }, { transaction });

            changes.push(
              { field: 'canView', oldValue: false, newValue: permission.canView },
              { field: 'canEdit', oldValue: false, newValue: permission.canEdit },
              { field: 'canDelete', oldValue: false, newValue: permission.canDelete },
              { field: 'canExport', oldValue: false, newValue: permission.canExport }
            );
          }

          // Audit log
          if (changes.length > 0 && userId) {
            await AuditService.log({
              userId,
              action: 'UPDATE_MENU_PERMISSION',
              entityType: 'MenuPermission',
              entityId: `${roleId}:${permission.menuId}`,
              details: { roleId, menuId: permission.menuId, changes },
              ipAddress: null,
              userAgent: null
            }, transaction);
          }

          success.push(permission.menuId);
        } catch (error: any) {
          failed.push({
            id: permission.menuId,
            error: error.message
          });
        }
      }

      await transaction.commit();

      return { success, failed };
    } catch (error) {
      await transaction.rollback();
      logger.error('Error updating role menu permissions:', error);
      throw error;
    }
  }

  /**
   * Batch update menu permissions
   */
  static async batchUpdateMenuPermissions(
    update: BatchMenuPermissionUpdate,
    userId?: string
  ): Promise<MenuBulkOperationResult> {
    const transaction = await sequelize.transaction();
    
    try {
      const { roleId, permissions, applyToChildren = false } = update;

      // Validate role exists
      const role = await Role.findByPk(roleId, { transaction });
      if (!role) {
        throw new ApiError(404, 'Role not found');
      }

      const success: string[] = [];
      const failed: Array<{ id: string; error: string }> = [];
      const processedMenuIds = new Set<string>();

      // Process each menu permission
      for (const perm of permissions) {
        try {
          const menu = await Menu.findByPk(perm.menuId, { transaction });
          if (!menu) {
            failed.push({ id: perm.menuId, error: 'Menu not found' });
            continue;
          }

          // Get menus to update (including children if specified)
          const menusToUpdate = [menu];
          if (applyToChildren) {
            const children = await menu.getAllChildren();
            menusToUpdate.push(...children);
          }

          // Update permissions for each menu
          for (const menuToUpdate of menusToUpdate) {
            if (processedMenuIds.has(menuToUpdate.id)) {
              continue;
            }

            const existing = await MenuPermission.findOne({
              where: { menuId: menuToUpdate.id, roleId },
              transaction
            });

            const updatedPermission = {
              menuId: menuToUpdate.id,
              roleId,
              canView: perm.canView ?? existing?.canView ?? false,
              canEdit: perm.canEdit ?? existing?.canEdit ?? false,
              canDelete: perm.canDelete ?? existing?.canDelete ?? false,
              canExport: perm.canExport ?? existing?.canExport ?? false
            };

            // Validate at least one permission
            if (!updatedPermission.canView && !updatedPermission.canEdit && 
                !updatedPermission.canDelete && !updatedPermission.canExport) {
              if (existing) {
                // If removing all permissions, delete the record
                await existing.destroy({ transaction });
              }
            } else {
              if (existing) {
                await existing.update(updatedPermission, { transaction });
              } else {
                await MenuPermission.create(updatedPermission, { transaction });
              }
            }

            processedMenuIds.add(menuToUpdate.id);
            success.push(menuToUpdate.id);
          }
        } catch (error: any) {
          failed.push({ id: perm.menuId, error: error.message });
        }
      }

      // Audit log
      if (userId && success.length > 0) {
        await AuditService.log({
          userId,
          action: 'BATCH_UPDATE_MENU_PERMISSIONS',
          entityType: 'MenuPermission',
          entityId: roleId,
          details: { 
            roleId, 
            updatedMenus: success.length, 
            failedMenus: failed.length,
            applyToChildren 
          },
          ipAddress: null,
          userAgent: null
        }, transaction);
      }

      await transaction.commit();

      return { success, failed };
    } catch (error) {
      await transaction.rollback();
      logger.error('Error batch updating menu permissions:', error);
      throw error;
    }
  }

  /**
   * Check if a user has access to a specific menu
   */
  static async checkMenuAccess(check: MenuAccessCheck): Promise<MenuAccessResult> {
    try {
      const { menuId, userId, permission } = check;

      // Get user with roles
      const user = await User.findByPk(userId, {
        include: [{
          model: Role,
          as: 'roles',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }]
      });

      if (!user) {
        return { allowed: false, reason: 'User not found' };
      }

      if (!user.roles || user.roles.length === 0) {
        return { allowed: false, reason: 'User has no roles assigned' };
      }

      // Check menu exists and is active
      const menu = await Menu.findByPk(menuId);
      if (!menu) {
        return { allowed: false, reason: 'Menu not found' };
      }

      if (!menu.isActive) {
        return { allowed: false, reason: 'Menu is not active' };
      }

      // Check permissions for each role
      const rolesThatGrantAccess: Array<{ roleId: string; roleName: string }> = [];
      
      for (const role of user.roles) {
        const menuPermission = await MenuPermission.findOne({
          where: { menuId, roleId: role.id }
        });

        if (menuPermission) {
          let hasPermission = false;

          switch (permission) {
            case 'view':
              hasPermission = menuPermission.canView;
              break;
            case 'edit':
              hasPermission = menuPermission.canEdit;
              break;
            case 'delete':
              hasPermission = menuPermission.canDelete;
              break;
            case 'export':
              hasPermission = menuPermission.canExport;
              break;
          }

          if (hasPermission) {
            rolesThatGrantAccess.push({
              roleId: role.id,
              roleName: role.name
            });
          }
        }
      }

      if (rolesThatGrantAccess.length > 0) {
        return {
          allowed: true,
          rolesThatGrantAccess
        };
      }

      return {
        allowed: false,
        reason: `User does not have ${permission} permission for this menu`
      };
    } catch (error) {
      logger.error('Error checking menu access:', error);
      throw error;
    }
  }

  /**
   * Get menu permission matrix for all roles
   */
  static async getMenuPermissionMatrix(): Promise<MenuPermissionMatrix[]> {
    try {
      const roles = await Role.findAll({
        attributes: ['id', 'name'],
        order: [['name', 'ASC']]
      });

      const menuPermissions = await MenuPermission.findAll({
        include: [{
          model: Menu,
          as: 'menu',
          attributes: ['id', 'title']
        }]
      });

      // Build matrix
      const matrix: MenuPermissionMatrix[] = [];

      for (const role of roles) {
        const permissions: Record<string, MenuPermissionSummary> = {};
        
        const rolePermissions = menuPermissions.filter(mp => mp.roleId === role.id);
        
        for (const mp of rolePermissions) {
          if (mp.menu) {
            permissions[mp.menuId] = {
              canView: mp.canView,
              canEdit: mp.canEdit,
              canDelete: mp.canDelete,
              canExport: mp.canExport
            };
          }
        }

        matrix.push({
          roleId: role.id,
          roleName: role.name,
          permissions
        });
      }

      return matrix;
    } catch (error) {
      logger.error('Error getting menu permission matrix:', error);
      throw error;
    }
  }

  /**
   * Get menu tree statistics
   */
  static async getMenuTreeStatistics(): Promise<MenuTreeStatistics> {
    try {
      const menus = await Menu.findAll();
      
      const totalMenus = menus.length;
      const activeMenus = menus.filter(m => m.isActive).length;
      const topLevelMenus = menus.filter(m => !m.parentId).length;

      // Calculate max depth
      let maxDepth = 0;
      const calculateDepth = async (menuId: string, currentDepth: number = 0): Promise<number> => {
        const children = menus.filter(m => m.parentId === menuId);
        if (children.length === 0) {
          return currentDepth;
        }
        
        const childDepths = await Promise.all(
          children.map(child => calculateDepth(child.id, currentDepth + 1))
        );
        
        return Math.max(...childDepths);
      };

      const depths = await Promise.all(
        menus.filter(m => !m.parentId).map(m => calculateDepth(m.id, 1))
      );
      
      maxDepth = Math.max(...depths, 0);

      // Calculate average children
      const parentMenus = menus.filter(m => 
        menus.some(child => child.parentId === m.id)
      );
      
      const averageChildrenPerMenu = parentMenus.length > 0
        ? menus.filter(m => m.parentId).length / parentMenus.length
        : 0;

      return {
        totalMenus,
        activeMenus,
        topLevelMenus,
        maxDepth,
        averageChildrenPerMenu: Math.round(averageChildrenPerMenu * 100) / 100
      };
    } catch (error) {
      logger.error('Error getting menu tree statistics:', error);
      throw error;
    }
  }

  /**
   * Remove all menu permissions for a role
   */
  static async removeAllRoleMenuPermissions(
    roleId: string,
    userId?: string
  ): Promise<void> {
    const transaction = await sequelize.transaction();
    
    try {
      const role = await Role.findByPk(roleId, { transaction });
      if (!role) {
        throw new ApiError(404, 'Role not found');
      }

      const deletedCount = await MenuPermission.destroy({
        where: { roleId },
        transaction
      });

      if (userId && deletedCount > 0) {
        await AuditService.log({
          userId,
          action: 'REMOVE_ALL_MENU_PERMISSIONS',
          entityType: 'Role',
          entityId: roleId,
          details: { roleId, deletedCount },
          ipAddress: null,
          userAgent: null
        }, transaction);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      logger.error('Error removing all role menu permissions:', error);
      throw error;
    }
  }
}