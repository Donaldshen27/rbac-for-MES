import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const timestamp = new Date();
    
    const roles = [
      {
        id: uuidv4(),
        name: 'super_admin',
        description: '超级管理员 - 拥有所有权限',
        is_system: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        name: 'production_manager',
        description: '生产经理 - 管理生产相关功能',
        is_system: false,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        name: 'quality_inspector',
        description: '质检员 - 管理质量相关功能',
        is_system: false,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        name: 'operator',
        description: '操作员 - 基础操作权限',
        is_system: false,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        name: 'viewer',
        description: '查看者 - 只读权限',
        is_system: false,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        name: 'system_admin',
        description: '系统管理员 - 管理系统配置和用户',
        is_system: true,
        created_at: timestamp,
        updated_at: timestamp
      }
    ];

    await queryInterface.bulkInsert('roles', roles);

    // Store role IDs for permission assignment
    const [insertedRoles] = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles WHERE name IN ('super_admin', 'production_manager', 'quality_inspector', 'operator', 'viewer', 'system_admin')`
    );

    // Get permission IDs
    const [permissions] = await queryInterface.sequelize.query(
      `SELECT id, name FROM permissions`
    );

    const roleMap = new Map((insertedRoles as any[]).map(r => [r.name, r.id]));
    const permissionMap = new Map((permissions as any[]).map(p => [p.name, p.id]));

    // Define role-permission mappings
    const rolePermissions: Array<{ roleId: string; permissionId: string }> = [];

    // Super admin gets all permissions (handled by isSuperuser flag, but we can add some explicit ones)
    const superAdminId = roleMap.get('super_admin');
    if (superAdminId) {
      permissions.forEach((perm: any) => {
        rolePermissions.push({
          roleId: superAdminId,
          permissionId: perm.id
        });
      });
    }

    // System admin permissions
    const systemAdminId = roleMap.get('system_admin');
    if (systemAdminId) {
      const systemAdminPerms = [
        'user:*', 'role:*', 'permission:*', 'menu:*', 'system:*', 'audit:read', 'resource:*'
      ];
      systemAdminPerms.forEach(permName => {
        const permId = permissionMap.get(permName);
        if (permId) {
          rolePermissions.push({
            roleId: systemAdminId,
            permissionId: permId
          });
        }
      });
    }

    // Production manager permissions
    const prodManagerId = roleMap.get('production_manager');
    if (prodManagerId) {
      const prodManagerPerms = [
        'production:*', 'report:view', 'report:export', 'user:read', 'quality:view'
      ];
      prodManagerPerms.forEach(permName => {
        const permId = permissionMap.get(permName);
        if (permId) {
          rolePermissions.push({
            roleId: prodManagerId,
            permissionId: permId
          });
        }
      });
    }

    // Quality inspector permissions
    const qualityInspectorId = roleMap.get('quality_inspector');
    if (qualityInspectorId) {
      const qualityPerms = [
        'quality:*', 'production:view', 'report:view', 'report:export', 'user:read'
      ];
      qualityPerms.forEach(permName => {
        const permId = permissionMap.get(permName);
        if (permId) {
          rolePermissions.push({
            roleId: qualityInspectorId,
            permissionId: permId
          });
        }
      });
    }

    // Operator permissions
    const operatorId = roleMap.get('operator');
    if (operatorId) {
      const operatorPerms = [
        'production:view', 'production:report_work', 'quality:view', 'user:read'
      ];
      operatorPerms.forEach(permName => {
        const permId = permissionMap.get(permName);
        if (permId) {
          rolePermissions.push({
            roleId: operatorId,
            permissionId: permId
          });
        }
      });
    }

    // Viewer permissions
    const viewerId = roleMap.get('viewer');
    if (viewerId) {
      const viewerPerms = [
        'user:read', 'role:read', 'permission:read', 'menu:read',
        'production:view', 'quality:view', 'report:view'
      ];
      viewerPerms.forEach(permName => {
        const permId = permissionMap.get(permName);
        if (permId) {
          rolePermissions.push({
            roleId: viewerId,
            permissionId: permId
          });
        }
      });
    }

    // Insert role-permission associations
    if (rolePermissions.length > 0) {
      const rolePermissionsWithTimestamp = rolePermissions.map(rp => ({
        role_id: rp.roleId,
        permission_id: rp.permissionId,
        granted_at: timestamp
      }));

      await queryInterface.bulkInsert('role_permissions', rolePermissionsWithTimestamp);
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    // Delete role-permission associations first
    await queryInterface.bulkDelete('role_permissions', {}, {});
    // Then delete roles
    await queryInterface.bulkDelete('roles', {}, {});
  }
};