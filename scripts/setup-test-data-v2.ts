import { sequelize } from '../src/config/database';
import { User, Role, Permission, Resource, Menu, MenuPermission } from '../src/models';
import dotenv from 'dotenv';

dotenv.config();

async function setupTestData() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Check if data already exists
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    const existingRoles = await Role.count();
    
    if (existingRoles > 0) {
      console.log('Test data already exists. Checking admin role assignment...');
      
      // Just ensure admin has the Administrator role
      const adminRole = await Role.findOne({ where: { name: 'Administrator' } });
      if (existingAdmin && adminRole) {
        const hasRole = await existingAdmin.hasRole(adminRole);
        if (!hasRole) {
          await existingAdmin.addRole(adminRole);
          console.log('✓ Assigned Administrator role to admin user');
        } else {
          console.log('✓ Admin user already has Administrator role');
        }
      }
      
      console.log('\nTest data is ready!');
      console.log('\nTest Users:');
      console.log('1. admin/admin123 - Administrator role');
      
      await sequelize.close();
      return;
    }

    console.log('Setting up fresh test data...');

    // Create Resources
    const resources = await Promise.all([
      Resource.findOrCreate({
        where: { name: 'users' },
        defaults: { 
          name: 'users',
          description: 'User management module' 
        }
      }),
      Resource.findOrCreate({
        where: { name: 'roles' },
        defaults: { 
          name: 'roles',
          description: 'Role management module' 
        }
      }),
      Resource.findOrCreate({
        where: { name: 'permissions' },
        defaults: { 
          name: 'permissions',
          description: 'Permission management module' 
        }
      }),
      Resource.findOrCreate({
        where: { name: 'menus' },
        defaults: { 
          name: 'menus',
          description: 'Menu management module' 
        }
      }),
      Resource.findOrCreate({
        where: { name: 'resources' },
        defaults: { 
          name: 'resources',
          description: 'Resource management module' 
        }
      })
    ]);
    console.log('✓ Created/found resources');

    // Create Permissions
    const permissionData = [
      // User permissions
      { name: 'users:read', description: 'View users', resource: 'users', action: 'read' },
      { name: 'users:create', description: 'Create users', resource: 'users', action: 'create' },
      { name: 'users:update', description: 'Update users', resource: 'users', action: 'update' },
      { name: 'users:delete', description: 'Delete users', resource: 'users', action: 'delete' },
      
      // Role permissions
      { name: 'roles:read', description: 'View roles', resource: 'roles', action: 'read' },
      { name: 'roles:create', description: 'Create roles', resource: 'roles', action: 'create' },
      { name: 'roles:update', description: 'Update roles', resource: 'roles', action: 'update' },
      { name: 'roles:delete', description: 'Delete roles', resource: 'roles', action: 'delete' },
      { name: 'roles:manage_permissions', description: 'Manage role permissions', resource: 'roles', action: 'manage' },
      
      // Permission permissions
      { name: 'permissions:read', description: 'View permissions', resource: 'permissions', action: 'read' },
      { name: 'permissions:create', description: 'Create permissions', resource: 'permissions', action: 'create' },
      { name: 'permissions:update', description: 'Update permissions', resource: 'permissions', action: 'update' },
      { name: 'permissions:delete', description: 'Delete permissions', resource: 'permissions', action: 'delete' },
      
      // Menu permissions
      { name: 'menus:read', description: 'View menus', resource: 'menus', action: 'read' },
      { name: 'menus:create', description: 'Create menus', resource: 'menus', action: 'create' },
      { name: 'menus:update', description: 'Update menus', resource: 'menus', action: 'update' },
      { name: 'menus:delete', description: 'Delete menus', resource: 'menus', action: 'delete' },
      { name: 'menus:manage_permissions', description: 'Manage menu permissions', resource: 'menus', action: 'manage' },
      
      // Resource permissions
      { name: 'resources:read', description: 'View resources', resource: 'resources', action: 'read' },
      { name: 'resources:create', description: 'Create resources', resource: 'resources', action: 'create' },
      { name: 'resources:update', description: 'Update resources', resource: 'resources', action: 'update' },
      { name: 'resources:delete', description: 'Delete resources', resource: 'resources', action: 'delete' }
    ];

    const permissions: Permission[] = [];
    for (const perm of permissionData) {
      const [permission] = await Permission.findOrCreate({
        where: { name: perm.name },
        defaults: perm
      });
      permissions.push(permission);
    }
    console.log('✓ Created/found permissions');

    // Create Roles
    const [adminRole] = await Role.findOrCreate({
      where: { name: 'Administrator' },
      defaults: {
        name: 'Administrator',
        description: 'Full system access',
        isSystem: true
      }
    });

    const [managerRole] = await Role.findOrCreate({
      where: { name: 'Manager' },
      defaults: {
        name: 'Manager',
        description: 'Manage users and roles',
        isSystem: false
      }
    });

    const [viewerRole] = await Role.findOrCreate({
      where: { name: 'Viewer' },
      defaults: {
        name: 'Viewer',
        description: 'Read-only access',
        isSystem: false
      }
    });

    console.log('✓ Created/found roles');

    // Assign permissions to roles
    // Admin gets all permissions
    await adminRole.setPermissions(permissions);

    // Manager gets user and role management permissions
    const managerPermissions = permissions.filter(p => 
      p.name.startsWith('users:') || 
      p.name.startsWith('roles:') ||
      p.name === 'menus:read' ||
      p.name === 'permissions:read'
    );
    await managerRole.setPermissions(managerPermissions);

    // Viewer gets read-only permissions
    const viewerPermissions = permissions.filter(p => p.name.endsWith(':read'));
    await viewerRole.setPermissions(viewerPermissions);

    console.log('✓ Assigned permissions to roles');

    // Create test users
    const [testAdmin] = await User.findOrCreate({
      where: { username: 'testadmin' },
      defaults: {
        username: 'testadmin',
        email: 'testadmin@example.com',
        password: 'testadmin123',
        firstName: 'Test',
        lastName: 'Admin',
        isActive: true
      }
    });

    const [testManager] = await User.findOrCreate({
      where: { username: 'testmanager' },
      defaults: {
        username: 'testmanager',
        email: 'testmanager@example.com',
        password: 'testmanager123',
        firstName: 'Test',
        lastName: 'Manager',
        isActive: true
      }
    });

    const [testViewer] = await User.findOrCreate({
      where: { username: 'testviewer' },
      defaults: {
        username: 'testviewer',
        email: 'testviewer@example.com',
        password: 'testviewer123',
        firstName: 'Test',
        lastName: 'Viewer',
        isActive: true
      }
    });

    // Assign admin role to the original admin user
    if (existingAdmin) {
      await existingAdmin.setRoles([adminRole]);
      console.log('✓ Assigned Administrator role to admin user');
    }

    // Assign roles to test users
    await testAdmin.setRoles([adminRole]);
    await testManager.setRoles([managerRole]);
    await testViewer.setRoles([viewerRole]);

    console.log('✓ Created test users and assigned roles');

    // Create Menu structure
    const dashboardMenu = await Menu.findOrCreate({
      where: { id: 'dashboard' },
      defaults: {
        id: 'dashboard',
        title: 'Dashboard',
        href: '/dashboard',
        icon: 'dashboard',
        orderIndex: 1,
        isActive: true
      }
    });

    const adminMenu = await Menu.findOrCreate({
      where: { id: 'admin' },
      defaults: {
        id: 'admin',
        title: 'Administration',
        href: '/admin',
        icon: 'settings',
        orderIndex: 2,
        isActive: true
      }
    });

    const usersMenu = await Menu.findOrCreate({
      where: { id: 'admin-users' },
      defaults: {
        id: 'admin-users',
        title: 'Users',
        href: '/admin/users',
        icon: 'users',
        parentId: adminMenu[0].id,
        orderIndex: 1,
        isActive: true
      }
    });

    const rolesMenu = await Menu.findOrCreate({
      where: { id: 'admin-roles' },
      defaults: {
        id: 'admin-roles',
        title: 'Roles',
        href: '/admin/roles',
        icon: 'lock',
        parentId: adminMenu[0].id,
        orderIndex: 2,
        isActive: true
      }
    });

    const permissionsMenu = await Menu.findOrCreate({
      where: { id: 'admin-permissions' },
      defaults: {
        id: 'admin-permissions',
        title: 'Permissions',
        href: '/admin/permissions',
        icon: 'key',
        parentId: adminMenu[0].id,
        orderIndex: 3,
        isActive: true
      }
    });

    const reportsMenu = await Menu.findOrCreate({
      where: { id: 'reports' },
      defaults: {
        id: 'reports',
        title: 'Reports',
        href: '/reports',
        icon: 'chart',
        orderIndex: 3,
        isActive: true
      }
    });

    console.log('✓ Created menu structure');

    console.log('\n=== Test Data Setup Complete ===');
    console.log('\nTest Users:');
    console.log('1. admin/admin123 - Administrator role (all permissions)');
    console.log('2. testadmin/testadmin123 - Administrator role');
    console.log('3. testmanager/testmanager123 - Manager role');
    console.log('4. testviewer/testviewer123 - Viewer role');

    await sequelize.close();
  } catch (error) {
    console.error('Error setting up test data:', error);
    process.exit(1);
  }
}

setupTestData();