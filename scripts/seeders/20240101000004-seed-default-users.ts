import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const timestamp = new Date();
    
    // Hash the default password
    const defaultPassword = await bcrypt.hash('Admin@123', 10);
    
    // Create default super admin user
    const superAdminId = uuidv4();
    await queryInterface.bulkInsert('users', [
      {
        id: superAdminId,
        username: 'superadmin',
        email: 'admin@rbac-system.com',
        password: defaultPassword,
        first_name: 'Super',
        last_name: 'Admin',
        is_active: true,
        is_superuser: true,
        created_at: timestamp,
        updated_at: timestamp
      }
    ]);

    // Get the super_admin role
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1`
    );

    if (roles.length > 0) {
      const superAdminRoleId = (roles[0] as any).id;
      
      // Assign super_admin role to the user
      await queryInterface.bulkInsert('user_roles', [
        {
          user_id: superAdminId,
          role_id: superAdminRoleId,
          assigned_at: timestamp
        }
      ]);
    }

    // Create demo users for testing
    const demoUsers = [
      {
        id: uuidv4(),
        username: 'prod_manager',
        email: 'prod.manager@rbac-system.com',
        password: defaultPassword,
        first_name: 'Production',
        last_name: 'Manager',
        is_active: true,
        is_superuser: false,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        username: 'quality_user',
        email: 'quality@rbac-system.com',
        password: defaultPassword,
        first_name: 'Quality',
        last_name: 'Inspector',
        is_active: true,
        is_superuser: false,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        username: 'operator1',
        email: 'operator1@rbac-system.com',
        password: defaultPassword,
        first_name: 'John',
        last_name: 'Operator',
        is_active: true,
        is_superuser: false,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: uuidv4(),
        username: 'viewer1',
        email: 'viewer@rbac-system.com',
        password: defaultPassword,
        first_name: 'View',
        last_name: 'Only',
        is_active: true,
        is_superuser: false,
        created_at: timestamp,
        updated_at: timestamp
      }
    ];

    await queryInterface.bulkInsert('users', demoUsers);

    // Get role IDs
    const [allRoles] = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles WHERE name IN ('production_manager', 'quality_inspector', 'operator', 'viewer')`
    );

    const roleMap = new Map((allRoles as any[]).map(r => [r.name, r.id]));

    // Assign roles to demo users
    const userRoles = [
      {
        user_id: demoUsers[0].id, // prod_manager
        role_id: roleMap.get('production_manager'),
        assigned_at: timestamp,
        assigned_by: superAdminId
      },
      {
        user_id: demoUsers[1].id, // quality_user
        role_id: roleMap.get('quality_inspector'),
        assigned_at: timestamp,
        assigned_by: superAdminId
      },
      {
        user_id: demoUsers[2].id, // operator1
        role_id: roleMap.get('operator'),
        assigned_at: timestamp,
        assigned_by: superAdminId
      },
      {
        user_id: demoUsers[3].id, // viewer1
        role_id: roleMap.get('viewer'),
        assigned_at: timestamp,
        assigned_by: superAdminId
      }
    ].filter(ur => ur.role_id); // Filter out any undefined role_ids

    if (userRoles.length > 0) {
      await queryInterface.bulkInsert('user_roles', userRoles);
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    // Delete user-role associations first
    await queryInterface.bulkDelete('user_roles', {}, {});
    // Then delete users
    await queryInterface.bulkDelete('users', {}, {});
  }
};