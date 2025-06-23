import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const resources = [
      { id: uuidv4(), name: 'user', description: '用户管理' },
      { id: uuidv4(), name: 'role', description: '角色管理' },
      { id: uuidv4(), name: 'permission', description: '权限管理' },
      { id: uuidv4(), name: 'menu', description: '菜单管理' },
      { id: uuidv4(), name: 'production', description: '生产管理' },
      { id: uuidv4(), name: 'quality', description: '质量管理' },
      { id: uuidv4(), name: 'report', description: '报表管理' },
      { id: uuidv4(), name: 'system', description: '系统管理' },
      { id: uuidv4(), name: 'audit', description: '审计日志' },
      { id: uuidv4(), name: 'resource', description: '资源管理' }
    ];

    const timestamp = new Date();
    const resourcesWithTimestamps = resources.map(resource => ({
      ...resource,
      created_at: timestamp,
      updated_at: timestamp
    }));

    await queryInterface.bulkInsert('resources', resourcesWithTimestamps);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.bulkDelete('resources', {}, {});
  }
};