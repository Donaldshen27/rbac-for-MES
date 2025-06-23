import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const timestamp = new Date();
    
    // Additional MES-specific resources
    const resources = [
      {
        id: uuidv4(),
        name: 'equipment',
        description: '设备管理资源',
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        name: 'maintenance',
        description: '维护管理资源',
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        name: 'inventory',
        description: '库存管理资源',
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        name: 'material',
        description: '物料管理资源',
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        name: 'planning',
        description: '计划管理资源',
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        name: 'process',
        description: '工艺管理资源',
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        name: 'product',
        description: '产品管理资源',
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        name: 'shift',
        description: '班次管理资源',
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        name: 'analytics',
        description: '数据分析资源',
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        name: 'trace',
        description: '追溯管理资源',
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        name: 'oee',
        description: 'OEE管理资源',
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        name: 'spc',
        description: 'SPC管理资源',
        created_at: timestamp,
        updated_at: timestamp
      }
    ];

    await queryInterface.bulkInsert('resources', resources);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const resourceNames = [
      'equipment', 'maintenance', 'inventory', 'material', 'planning', 
      'process', 'product', 'shift', 'analytics', 'trace', 'oee', 'spc'
    ];
    
    await queryInterface.bulkDelete('resources', {
      name: resourceNames
    }, {});
  }
};