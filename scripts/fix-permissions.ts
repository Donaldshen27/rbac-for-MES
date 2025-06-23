import { sequelize } from '../src/config/database';
import { Permission } from '../src/models';
import dotenv from 'dotenv';

dotenv.config();

async function fixPermissions() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Find permissions with wrong format
    const permissions = await Permission.findAll();
    
    console.log('\nChecking permission formats...');
    
    // Create correct permissions if they don't exist
    const correctPermissions = [
      { name: 'menu:read', description: 'View menus', resource: 'menu', action: 'read' },
      { name: 'menu:create', description: 'Create menus', resource: 'menu', action: 'create' },
      { name: 'menu:update', description: 'Update menus', resource: 'menu', action: 'update' },
      { name: 'menu:delete', description: 'Delete menus', resource: 'menu', action: 'delete' },
      { name: 'role:read', description: 'View roles', resource: 'role', action: 'read' },
      { name: 'role:create', description: 'Create roles', resource: 'role', action: 'create' },
      { name: 'role:update', description: 'Update roles', resource: 'role', action: 'update' },
      { name: 'role:delete', description: 'Delete roles', resource: 'role', action: 'delete' },
      { name: 'permission:read', description: 'View permissions', resource: 'permission', action: 'read' },
      { name: 'permission:create', description: 'Create permissions', resource: 'permission', action: 'create' },
      { name: 'permission:update', description: 'Update permissions', resource: 'permission', action: 'update' },
      { name: 'permission:delete', description: 'Delete permissions', resource: 'permission', action: 'delete' },
      { name: 'user:read', description: 'View users', resource: 'user', action: 'read' },
      { name: 'user:create', description: 'Create users', resource: 'user', action: 'create' },
      { name: 'user:update', description: 'Update users', resource: 'user', action: 'update' },
      { name: 'user:delete', description: 'Delete users', resource: 'user', action: 'delete' },
      { name: 'resource:read', description: 'View resources', resource: 'resource', action: 'read' },
      { name: 'resource:create', description: 'Create resources', resource: 'resource', action: 'create' },
      { name: 'resource:update', description: 'Update resources', resource: 'resource', action: 'update' },
      { name: 'resource:delete', description: 'Delete resources', resource: 'resource', action: 'delete' },
    ];

    for (const perm of correctPermissions) {
      const [created] = await Permission.findOrCreate({
        where: { name: perm.name },
        defaults: perm
      });
      
      if (created) {
        console.log(`✓ Created permission: ${perm.name}`);
      }
    }

    console.log('\nPermissions fixed!');
    console.log('\nNOTE: You need to re-run assign-permissions.ts to update role permissions.');
    
    await sequelize.close();
  } catch (error) {
    console.error('Error fixing permissions:', error);
    process.exit(1);
  }
}

fixPermissions();