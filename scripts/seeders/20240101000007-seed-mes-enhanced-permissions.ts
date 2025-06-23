import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const permissions = [
      // Equipment and Maintenance permissions
      { name: 'equipment:create', resource: 'equipment', action: 'create', description: '创建设备' },
      { name: 'equipment:read', resource: 'equipment', action: 'read', description: '查看设备' },
      { name: 'equipment:update', resource: 'equipment', action: 'update', description: '更新设备' },
      { name: 'equipment:delete', resource: 'equipment', action: 'delete', description: '删除设备' },
      { name: 'equipment:monitor', resource: 'equipment', action: 'monitor', description: '监控设备状态' },
      { name: 'equipment:*', resource: 'equipment', action: '*', description: '设备管理所有权限' },
      
      { name: 'maintenance:create', resource: 'maintenance', action: 'create', description: '创建维护记录' },
      { name: 'maintenance:read', resource: 'maintenance', action: 'read', description: '查看维护记录' },
      { name: 'maintenance:update', resource: 'maintenance', action: 'update', description: '更新维护记录' },
      { name: 'maintenance:approve', resource: 'maintenance', action: 'approve', description: '审批维护计划' },
      { name: 'maintenance:*', resource: 'maintenance', action: '*', description: '维护管理所有权限' },
      
      // Inventory and Material permissions
      { name: 'inventory:view', resource: 'inventory', action: 'view', description: '查看库存' },
      { name: 'inventory:adjust', resource: 'inventory', action: 'adjust', description: '调整库存' },
      { name: 'inventory:transfer', resource: 'inventory', action: 'transfer', description: '库存转移' },
      { name: 'inventory:count', resource: 'inventory', action: 'count', description: '盘点库存' },
      { name: 'inventory:*', resource: 'inventory', action: '*', description: '库存管理所有权限' },
      
      { name: 'material:view', resource: 'material', action: 'view', description: '查看物料' },
      { name: 'material:create', resource: 'material', action: 'create', description: '创建物料' },
      { name: 'material:update', resource: 'material', action: 'update', description: '更新物料' },
      { name: 'material:issue', resource: 'material', action: 'issue', description: '物料发放' },
      { name: 'material:return', resource: 'material', action: 'return', description: '物料退回' },
      { name: 'material:*', resource: 'material', action: '*', description: '物料管理所有权限' },
      
      // Planning permissions
      { name: 'planning:create', resource: 'planning', action: 'create', description: '创建生产计划' },
      { name: 'planning:read', resource: 'planning', action: 'read', description: '查看生产计划' },
      { name: 'planning:update', resource: 'planning', action: 'update', description: '更新生产计划' },
      { name: 'planning:approve', resource: 'planning', action: 'approve', description: '审批生产计划' },
      { name: 'planning:schedule', resource: 'planning', action: 'schedule', description: '生产排程' },
      { name: 'planning:*', resource: 'planning', action: '*', description: '计划管理所有权限' },
      
      // Process and Product permissions
      { name: 'process:create', resource: 'process', action: 'create', description: '创建工艺' },
      { name: 'process:read', resource: 'process', action: 'read', description: '查看工艺' },
      { name: 'process:update', resource: 'process', action: 'update', description: '更新工艺' },
      { name: 'process:approve', resource: 'process', action: 'approve', description: '审批工艺' },
      { name: 'process:*', resource: 'process', action: '*', description: '工艺管理所有权限' },
      
      { name: 'product:create', resource: 'product', action: 'create', description: '创建产品' },
      { name: 'product:read', resource: 'product', action: 'read', description: '查看产品' },
      { name: 'product:update', resource: 'product', action: 'update', description: '更新产品' },
      { name: 'product:delete', resource: 'product', action: 'delete', description: '删除产品' },
      { name: 'product:*', resource: 'product', action: '*', description: '产品管理所有权限' },
      
      // Shift Management permissions
      { name: 'shift:view', resource: 'shift', action: 'view', description: '查看班次' },
      { name: 'shift:manage', resource: 'shift', action: 'manage', description: '管理班次' },
      { name: 'shift:assign', resource: 'shift', action: 'assign', description: '分配班次人员' },
      { name: 'shift:report', resource: 'shift', action: 'report', description: '班次报告' },
      { name: 'shift:*', resource: 'shift', action: '*', description: '班次管理所有权限' },
      
      // Analytics permissions
      { name: 'analytics:view', resource: 'analytics', action: 'view', description: '查看分析数据' },
      { name: 'analytics:create', resource: 'analytics', action: 'create', description: '创建分析报告' },
      { name: 'analytics:export', resource: 'analytics', action: 'export', description: '导出分析数据' },
      { name: 'analytics:configure', resource: 'analytics', action: 'configure', description: '配置分析参数' },
      { name: 'analytics:*', resource: 'analytics', action: '*', description: '数据分析所有权限' },
      
      // Traceability permissions
      { name: 'trace:view', resource: 'trace', action: 'view', description: '查看追溯信息' },
      { name: 'trace:export', resource: 'trace', action: 'export', description: '导出追溯数据' },
      { name: 'trace:*', resource: 'trace', action: '*', description: '追溯管理所有权限' },
      
      // OEE (Overall Equipment Effectiveness) permissions
      { name: 'oee:view', resource: 'oee', action: 'view', description: '查看OEE数据' },
      { name: 'oee:calculate', resource: 'oee', action: 'calculate', description: '计算OEE' },
      { name: 'oee:export', resource: 'oee', action: 'export', description: '导出OEE报告' },
      { name: 'oee:*', resource: 'oee', action: '*', description: 'OEE管理所有权限' },
      
      // SPC (Statistical Process Control) permissions
      { name: 'spc:view', resource: 'spc', action: 'view', description: '查看SPC数据' },
      { name: 'spc:configure', resource: 'spc', action: 'configure', description: '配置SPC参数' },
      { name: 'spc:analyze', resource: 'spc', action: 'analyze', description: '分析SPC数据' },
      { name: 'spc:*', resource: 'spc', action: '*', description: 'SPC管理所有权限' }
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
    const permissionNames = [
      'equipment:create', 'equipment:read', 'equipment:update', 'equipment:delete', 'equipment:monitor', 'equipment:*',
      'maintenance:create', 'maintenance:read', 'maintenance:update', 'maintenance:approve', 'maintenance:*',
      'inventory:view', 'inventory:adjust', 'inventory:transfer', 'inventory:count', 'inventory:*',
      'material:view', 'material:create', 'material:update', 'material:issue', 'material:return', 'material:*',
      'planning:create', 'planning:read', 'planning:update', 'planning:approve', 'planning:schedule', 'planning:*',
      'process:create', 'process:read', 'process:update', 'process:approve', 'process:*',
      'product:create', 'product:read', 'product:update', 'product:delete', 'product:*',
      'shift:view', 'shift:manage', 'shift:assign', 'shift:report', 'shift:*',
      'analytics:view', 'analytics:create', 'analytics:export', 'analytics:configure', 'analytics:*',
      'trace:view', 'trace:export', 'trace:*',
      'oee:view', 'oee:calculate', 'oee:export', 'oee:*',
      'spc:view', 'spc:configure', 'spc:analyze', 'spc:*'
    ];
    
    await queryInterface.bulkDelete('permissions', {
      name: permissionNames
    }, {});
  }
};