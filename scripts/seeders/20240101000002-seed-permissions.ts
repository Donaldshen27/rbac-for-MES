import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const permissions = [
      // User permissions
      { name: 'user:create', resource: 'user', action: 'create', description: '创建用户' },
      { name: 'user:read', resource: 'user', action: 'read', description: '查看用户' },
      { name: 'user:update', resource: 'user', action: 'update', description: '更新用户' },
      { name: 'user:delete', resource: 'user', action: 'delete', description: '删除用户' },
      { name: 'user:*', resource: 'user', action: '*', description: '用户管理所有权限' },
      
      // Role permissions
      { name: 'role:create', resource: 'role', action: 'create', description: '创建角色' },
      { name: 'role:read', resource: 'role', action: 'read', description: '查看角色' },
      { name: 'role:update', resource: 'role', action: 'update', description: '更新角色' },
      { name: 'role:delete', resource: 'role', action: 'delete', description: '删除角色' },
      { name: 'role:assign', resource: 'role', action: 'assign', description: '分配角色' },
      { name: 'role:*', resource: 'role', action: '*', description: '角色管理所有权限' },
      
      // Permission permissions
      { name: 'permission:create', resource: 'permission', action: 'create', description: '创建权限' },
      { name: 'permission:read', resource: 'permission', action: 'read', description: '查看权限' },
      { name: 'permission:update', resource: 'permission', action: 'update', description: '更新权限' },
      { name: 'permission:delete', resource: 'permission', action: 'delete', description: '删除权限' },
      { name: 'permission:assign', resource: 'permission', action: 'assign', description: '分配权限' },
      { name: 'permission:*', resource: 'permission', action: '*', description: '权限管理所有权限' },
      
      // Menu permissions
      { name: 'menu:create', resource: 'menu', action: 'create', description: '创建菜单' },
      { name: 'menu:read', resource: 'menu', action: 'read', description: '查看菜单' },
      { name: 'menu:update', resource: 'menu', action: 'update', description: '更新菜单' },
      { name: 'menu:delete', resource: 'menu', action: 'delete', description: '删除菜单' },
      { name: 'menu:*', resource: 'menu', action: '*', description: '菜单管理所有权限' },
      
      // Production permissions
      { name: 'production:view', resource: 'production', action: 'view', description: '查看生产数据' },
      { name: 'production:create_work_order', resource: 'production', action: 'create_work_order', description: '创建工单' },
      { name: 'production:update_work_order', resource: 'production', action: 'update_work_order', description: '更新工单' },
      { name: 'production:delete_work_order', resource: 'production', action: 'delete_work_order', description: '删除工单' },
      { name: 'production:report_work', resource: 'production', action: 'report_work', description: '报工' },
      { name: 'production:*', resource: 'production', action: '*', description: '生产管理所有权限' },
      
      // Quality permissions
      { name: 'quality:view', resource: 'quality', action: 'view', description: '查看质量数据' },
      { name: 'quality:manage_defects', resource: 'quality', action: 'manage_defects', description: '管理缺陷' },
      { name: 'quality:approve', resource: 'quality', action: 'approve', description: '质量审批' },
      { name: 'quality:*', resource: 'quality', action: '*', description: '质量管理所有权限' },
      
      // Report permissions
      { name: 'report:view', resource: 'report', action: 'view', description: '查看报表' },
      { name: 'report:export', resource: 'report', action: 'export', description: '导出报表' },
      { name: 'report:create', resource: 'report', action: 'create', description: '创建报表' },
      { name: 'report:*', resource: 'report', action: '*', description: '报表管理所有权限' },
      
      // System permissions
      { name: 'system:read', resource: 'system', action: 'read', description: '查看系统信息' },
      { name: 'system:config', resource: 'system', action: 'config', description: '系统配置' },
      { name: 'system:manage_users', resource: 'system', action: 'manage_users', description: '管理系统用户' },
      { name: 'system:*', resource: 'system', action: '*', description: '系统管理所有权限' },
      
      // Audit permissions
      { name: 'audit:read', resource: 'audit', action: 'read', description: '查看审计日志' },
      { name: 'audit:export', resource: 'audit', action: 'export', description: '导出审计日志' },
      { name: 'audit:*', resource: 'audit', action: '*', description: '审计日志所有权限' },
      
      // Resource permissions
      { name: 'resource:create', resource: 'resource', action: 'create', description: '创建资源' },
      { name: 'resource:read', resource: 'resource', action: 'read', description: '查看资源' },
      { name: 'resource:update', resource: 'resource', action: 'update', description: '更新资源' },
      { name: 'resource:delete', resource: 'resource', action: 'delete', description: '删除资源' },
      { name: 'resource:*', resource: 'resource', action: '*', description: '资源管理所有权限' }
    ];

    const timestamp = new Date();
    const permissionsWithIds = permissions.map(permission => ({
      id: uuidv4(),
      ...permission,
      created_at: timestamp,
      updated_at: timestamp
    }));

    await queryInterface.bulkInsert('permissions', permissionsWithIds);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.bulkDelete('permissions', {}, {});
  }
};