import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const timestamp = new Date();
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    
    // Additional MES demo users
    const users = [
      {
        id: uuidv4(),
        username: 'maintenance_sup',
        email: 'maintenance.supervisor@mes.com',
        password: hashedPassword,
        first_name: '张',
        last_name: '维护',
        is_active: true,
        is_superuser: false,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        username: 'warehouse_mgr',
        email: 'warehouse.manager@mes.com',
        password: hashedPassword,
        first_name: '李',
        last_name: '仓库',
        is_active: true,
        is_superuser: false,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        username: 'shift_sup1',
        email: 'shift.supervisor1@mes.com',
        password: hashedPassword,
        first_name: '王',
        last_name: '班长',
        is_active: true,
        is_superuser: false,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        username: 'material_handler1',
        email: 'material.handler1@mes.com',
        password: hashedPassword,
        first_name: '陈',
        last_name: '物料',
        is_active: true,
        is_superuser: false,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        username: 'planning_mgr',
        email: 'planning.manager@mes.com',
        password: hashedPassword,
        first_name: '赵',
        last_name: '计划',
        is_active: true,
        is_superuser: false,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        username: 'quality_mgr',
        email: 'quality.manager@mes.com',
        password: hashedPassword,
        first_name: '孙',
        last_name: '质量',
        is_active: true,
        is_superuser: false,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        username: 'process_eng1',
        email: 'process.engineer1@mes.com',
        password: hashedPassword,
        first_name: '刘',
        last_name: '工艺',
        is_active: true,
        is_superuser: false,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        username: 'data_analyst1',
        email: 'data.analyst1@mes.com',
        password: hashedPassword,
        first_name: '周',
        last_name: '分析',
        is_active: true,
        is_superuser: false,
        created_at: timestamp,
        updated_at: timestamp
      }
    ];

    await queryInterface.bulkInsert('users', users);

    // Get role IDs
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles WHERE name IN ('maintenance_supervisor', 'warehouse_manager', 'shift_supervisor', 'material_handler', 'planning_manager', 'quality_manager', 'process_engineer', 'data_analyst')`
    );

    // Get user IDs
    const [insertedUsers] = await queryInterface.sequelize.query(
      `SELECT id, username FROM users WHERE username IN ('maintenance_sup', 'warehouse_mgr', 'shift_sup1', 'material_handler1', 'planning_mgr', 'quality_mgr', 'process_eng1', 'data_analyst1')`
    );

    const roleMap = new Map((roles as any[]).map(r => [r.name, r.id]));
    const userMap = new Map((insertedUsers as any[]).map(u => [u.username, u.id]));

    const userRoles = [
      { userId: userMap.get('maintenance_sup'), roleId: roleMap.get('maintenance_supervisor') },
      { userId: userMap.get('warehouse_mgr'), roleId: roleMap.get('warehouse_manager') },
      { userId: userMap.get('shift_sup1'), roleId: roleMap.get('shift_supervisor') },
      { userId: userMap.get('material_handler1'), roleId: roleMap.get('material_handler') },
      { userId: userMap.get('planning_mgr'), roleId: roleMap.get('planning_manager') },
      { userId: userMap.get('quality_mgr'), roleId: roleMap.get('quality_manager') },
      { userId: userMap.get('process_eng1'), roleId: roleMap.get('process_engineer') },
      { userId: userMap.get('data_analyst1'), roleId: roleMap.get('data_analyst') }
    ];

    const userRolesWithTimestamp = userRoles
      .filter(ur => ur.userId && ur.roleId)
      .map(ur => ({
        user_id: ur.userId,
        role_id: ur.roleId,
        assigned_at: timestamp
      }));

    if (userRolesWithTimestamp.length > 0) {
      await queryInterface.bulkInsert('user_roles', userRolesWithTimestamp);
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    // Delete user-role associations
    const [users] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE username IN ('maintenance_sup', 'warehouse_mgr', 'shift_sup1', 'material_handler1', 'planning_mgr', 'quality_mgr', 'process_eng1', 'data_analyst1')`
    );
    
    const userIds = (users as any[]).map(u => u.id);
    if (userIds.length > 0) {
      await queryInterface.bulkDelete('user_roles', {
        user_id: userIds
      }, {});
    }
    
    // Delete users
    await queryInterface.bulkDelete('users', {
      username: ['maintenance_sup', 'warehouse_mgr', 'shift_sup1', 'material_handler1', 'planning_mgr', 'quality_mgr', 'process_eng1', 'data_analyst1']
    }, {});
  }
};