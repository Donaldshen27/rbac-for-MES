import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const timestamp = new Date();
    
    // Additional MES-specific roles
    const roles = [
      {
        id: uuidv4(),
        name: 'maintenance_supervisor',
        description: '设备维护主管 - 管理设备维护和保养',
        is_system: false,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        name: 'warehouse_manager',
        description: '仓库经理 - 管理物料和库存',
        is_system: false,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        name: 'shift_supervisor',
        description: '班组长 - 管理班组生产和人员',
        is_system: false,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        name: 'material_handler',
        description: '物料员 - 处理物料领用和归还',
        is_system: false,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        name: 'planning_manager',
        description: '计划经理 - 管理生产计划和排程',
        is_system: false,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        name: 'quality_manager',
        description: '质量经理 - 高级质量管理权限',
        is_system: false,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        name: 'process_engineer',
        description: '工艺工程师 - 管理工艺路线和参数',
        is_system: false,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        name: 'data_analyst',
        description: '数据分析师 - 分析生产和质量数据',
        is_system: false,
        created_at: timestamp,
        updated_at: timestamp
      }
    ];

    await queryInterface.bulkInsert('roles', roles);

    // Get inserted role IDs
    const [insertedRoles] = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles WHERE name IN ('maintenance_supervisor', 'warehouse_manager', 'shift_supervisor', 'material_handler', 'planning_manager', 'quality_manager', 'process_engineer', 'data_analyst')`
    );

    // Get permission IDs
    const [permissions] = await queryInterface.sequelize.query(
      `SELECT id, name FROM permissions`
    );

    const roleMap = new Map((insertedRoles as any[]).map(r => [r.name, r.id]));
    const permissionMap = new Map((permissions as any[]).map(p => [p.name, p.id]));

    // Define role-permission mappings
    const rolePermissions: Array<{ roleId: string; permissionId: string }> = [];

    // Maintenance supervisor permissions
    const maintenanceId = roleMap.get('maintenance_supervisor');
    if (maintenanceId) {
      const maintenancePerms = [
        'equipment:*', 'maintenance:*', 'production:view', 'report:view', 'report:export', 'user:read'
      ];
      maintenancePerms.forEach(permName => {
        const permId = permissionMap.get(permName);
        if (permId) {
          rolePermissions.push({
            roleId: maintenanceId,
            permissionId: permId
          });
        }
      });
    }

    // Warehouse manager permissions
    const warehouseId = roleMap.get('warehouse_manager');
    if (warehouseId) {
      const warehousePerms = [
        'inventory:*', 'material:*', 'production:view', 'report:view', 'report:export', 'user:read'
      ];
      warehousePerms.forEach(permName => {
        const permId = permissionMap.get(permName);
        if (permId) {
          rolePermissions.push({
            roleId: warehouseId,
            permissionId: permId
          });
        }
      });
    }

    // Shift supervisor permissions
    const shiftId = roleMap.get('shift_supervisor');
    if (shiftId) {
      const shiftPerms = [
        'production:view', 'production:update_work_order', 'production:report_work', 
        'quality:view', 'quality:manage_defects', 'user:read', 'shift:*'
      ];
      shiftPerms.forEach(permName => {
        const permId = permissionMap.get(permName);
        if (permId) {
          rolePermissions.push({
            roleId: shiftId,
            permissionId: permId
          });
        }
      });
    }

    // Material handler permissions
    const materialId = roleMap.get('material_handler');
    if (materialId) {
      const materialPerms = [
        'material:view', 'material:issue', 'material:return', 'inventory:view', 'production:view', 'user:read'
      ];
      materialPerms.forEach(permName => {
        const permId = permissionMap.get(permName);
        if (permId) {
          rolePermissions.push({
            roleId: materialId,
            permissionId: permId
          });
        }
      });
    }

    // Planning manager permissions
    const planningId = roleMap.get('planning_manager');
    if (planningId) {
      const planningPerms = [
        'planning:*', 'production:*', 'inventory:view', 'report:*', 'user:read'
      ];
      planningPerms.forEach(permName => {
        const permId = permissionMap.get(permName);
        if (permId) {
          rolePermissions.push({
            roleId: planningId,
            permissionId: permId
          });
        }
      });
    }

    // Quality manager permissions
    const qualityManagerId = roleMap.get('quality_manager');
    if (qualityManagerId) {
      const qualityManagerPerms = [
        'quality:*', 'production:view', 'report:*', 'user:read', 'user:update', 'role:assign'
      ];
      qualityManagerPerms.forEach(permName => {
        const permId = permissionMap.get(permName);
        if (permId) {
          rolePermissions.push({
            roleId: qualityManagerId,
            permissionId: permId
          });
        }
      });
    }

    // Process engineer permissions
    const processId = roleMap.get('process_engineer');
    if (processId) {
      const processPerms = [
        'process:*', 'product:*', 'production:view', 'quality:view', 'report:view', 'user:read'
      ];
      processPerms.forEach(permName => {
        const permId = permissionMap.get(permName);
        if (permId) {
          rolePermissions.push({
            roleId: processId,
            permissionId: permId
          });
        }
      });
    }

    // Data analyst permissions
    const analystId = roleMap.get('data_analyst');
    if (analystId) {
      const analystPerms = [
        'report:*', 'analytics:*', 'production:view', 'quality:view', 'inventory:view', 'user:read'
      ];
      analystPerms.forEach(permName => {
        const permId = permissionMap.get(permName);
        if (permId) {
          rolePermissions.push({
            roleId: analystId,
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
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name IN ('maintenance_supervisor', 'warehouse_manager', 'shift_supervisor', 'material_handler', 'planning_manager', 'quality_manager', 'process_engineer', 'data_analyst')`
    );
    
    const roleIds = (roles as any[]).map(r => r.id);
    if (roleIds.length > 0) {
      await queryInterface.bulkDelete('role_permissions', {
        role_id: roleIds
      }, {});
    }
    
    // Then delete roles
    await queryInterface.bulkDelete('roles', {
      name: ['maintenance_supervisor', 'warehouse_manager', 'shift_supervisor', 'material_handler', 'planning_manager', 'quality_manager', 'process_engineer', 'data_analyst']
    }, {});
  }
};