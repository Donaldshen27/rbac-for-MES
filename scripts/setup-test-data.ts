import { sequelize } from '../src/config/database';
import { User, Role, Permission, Resource, Menu, MenuPermission } from '../src/models';
import dotenv from 'dotenv';

dotenv.config();

async function setupTestData() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Create or find Resources
    const [usersResource] = await Resource.findOrCreate({
      where: { name: 'users' },
      defaults: {
        name: 'users',
        description: 'User management module'
      }
    });
      Resource.create({
        name: 'roles',
        description: 'Role management module'
      }),
      Resource.create({
        name: 'permissions',
        description: 'Permission management module'
      }),
      Resource.create({
        name: 'menus',
        description: 'Menu management module'
      }),
      Resource.create({
        name: 'resources',
        description: 'Resource management module'
      })
    ]);
    console.log('✓ Created resources');

    // Create Permissions
    const permissionData = [
      // User permissions
      { name: 'users:read', description: 'View users', category: 'Users', action: 'read', resource: 'users' },
      { name: 'users:create', description: 'Create users', category: 'Users', action: 'create', resource: 'users' },
      { name: 'users:update', description: 'Update users', category: 'Users', action: 'update', resource: 'users' },
      { name: 'users:delete', description: 'Delete users', category: 'Users', action: 'delete', resource: 'users' },
      
      // Role permissions
      { name: 'roles:read', description: 'View roles', category: 'Roles', action: 'read', resource: 'roles' },
      { name: 'roles:create', description: 'Create roles', category: 'Roles', action: 'create', resource: 'roles' },
      { name: 'roles:update', description: 'Update roles', category: 'Roles', action: 'update', resource: 'roles' },
      { name: 'roles:delete', description: 'Delete roles', category: 'Roles', action: 'delete', resource: 'roles' },
      { name: 'roles:manage_permissions', description: 'Manage role permissions', category: 'Roles', action: 'manage', resource: 'roles' },
      
      // Permission permissions
      { name: 'permissions:read', description: 'View permissions', category: 'Permissions', action: 'read', resource: 'permissions' },
      { name: 'permissions:create', description: 'Create permissions', category: 'Permissions', action: 'create', resource: 'permissions' },
      { name: 'permissions:update', description: 'Update permissions', category: 'Permissions', action: 'update', resource: 'permissions' },
      { name: 'permissions:delete', description: 'Delete permissions', category: 'Permissions', action: 'delete', resource: 'permissions' },
      
      // Menu permissions
      { name: 'menus:read', description: 'View menus', category: 'Menus', action: 'read', resource: 'menus' },
      { name: 'menus:create', description: 'Create menus', category: 'Menus', action: 'create', resource: 'menus' },
      { name: 'menus:update', description: 'Update menus', category: 'Menus', action: 'update', resource: 'menus' },
      { name: 'menus:delete', description: 'Delete menus', category: 'Menus', action: 'delete', resource: 'menus' },
      { name: 'menus:manage_permissions', description: 'Manage menu permissions', category: 'Menus', action: 'manage', resource: 'menus' },
      
      // Resource permissions
      { name: 'resources:read', description: 'View resources', category: 'Resources', action: 'read', resource: 'resources' },
      { name: 'resources:create', description: 'Create resources', category: 'Resources', action: 'create', resource: 'resources' },
      { name: 'resources:update', description: 'Update resources', category: 'Resources', action: 'update', resource: 'resources' },
      { name: 'resources:delete', description: 'Delete resources', category: 'Resources', action: 'delete', resource: 'resources' }
    ];

    const permissions = await Promise.all(
      permissionData.map(p => Permission.create(p))
    );
    console.log('✓ Created permissions');

    // Create Roles
    const adminRole = await Role.create({
      name: 'Administrator',
      description: 'Full system access',
      isSystem: true
    });

    const managerRole = await Role.create({
      name: 'Manager',
      description: 'Manage users and roles',
      isSystem: false
    });

    const viewerRole = await Role.create({
      name: 'Viewer',
      description: 'Read-only access',
      isSystem: false
    });

    console.log('✓ Created roles');

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
    const testAdmin = await User.create({
      username: 'testadmin',
      email: 'testadmin@example.com',
      password: 'testadmin123',
      firstName: 'Test',
      lastName: 'Admin',
      isActive: true
    });

    const testManager = await User.create({
      username: 'testmanager',
      email: 'testmanager@example.com',
      password: 'testmanager123',
      firstName: 'Test',
      lastName: 'Manager',
      isActive: true
    });

    const testViewer = await User.create({
      username: 'testviewer',
      email: 'testviewer@example.com',
      password: 'testviewer123',
      firstName: 'Test',
      lastName: 'Viewer',
      isActive: true
    });

    // Assign admin role to the original admin user
    const adminUser = await User.findOne({ where: { username: 'admin' } });
    if (adminUser) {
      await adminUser.setRoles([adminRole]);
      console.log('✓ Assigned Administrator role to admin user');
    }

    // Assign roles to test users
    await testAdmin.setRoles([adminRole]);
    await testManager.setRoles([managerRole]);
    await testViewer.setRoles([viewerRole]);

    console.log('✓ Created test users and assigned roles');

    // Create Menu structure
    const dashboardMenu = await Menu.create({
      id: 'dashboard',
      title: 'Dashboard',
      href: '/dashboard',
      icon: 'dashboard',
      orderIndex: 1,
      isActive: true
    });

    const adminMenu = await Menu.create({
      id: 'admin',
      title: 'Administration',
      href: '/admin',
      icon: 'settings',
      orderIndex: 2,
      isActive: true
    });

    const usersMenu = await Menu.create({
      id: 'users',
      title: 'Users',
      href: '/admin/users',
      icon: 'users',
      parentId: adminMenu.id,
      orderIndex: 1,
      isActive: true
    });

    const rolesMenu = await Menu.create({
      id: 'roles',
      title: 'Roles',
      href: '/admin/roles',
      icon: 'lock',
      parentId: adminMenu.id,
      orderIndex: 2,
      isActive: true
    });

    const permissionsMenu = await Menu.create({
      id: 'permissions',
      title: 'Permissions',
      href: '/admin/permissions',
      icon: 'key',
      parentId: adminMenu.id,
      orderIndex: 3,
      isActive: true
    });

    const reportsMenu = await Menu.create({
      id: 'reports',
      title: 'Reports',
      href: '/reports',
      icon: 'chart',
      orderIndex: 3,
      isActive: true
    });

    console.log('✓ Created menu structure');

    // Set menu permissions using MenuPermission model
    // Dashboard - all roles can view
    await MenuPermission.create({
      menuId: dashboardMenu.id,
      roleId: adminRole.id,
      canView: true,
      canEdit: true,
      canDelete: true,
      canExport: true
    });
    await MenuPermission.create({
      menuId: dashboardMenu.id,
      roleId: managerRole.id,
      canView: true,
      canEdit: false,
      canDelete: false,
      canExport: true
    });
    await MenuPermission.create({
      menuId: dashboardMenu.id,
      roleId: viewerRole.id,
      canView: true,
      canEdit: false,
      canDelete: false,
      canExport: false
    });

    // Admin menu - only admin and manager roles
    await MenuPermission.create({
      menuId: adminMenu.id,
      roleId: adminRole.id,
      canView: true,
      canEdit: true,
      canDelete: true,
      canExport: true
    });
    await MenuPermission.create({
      menuId: adminMenu.id,
      roleId: managerRole.id,
      canView: true,
      canEdit: false,
      canDelete: false,
      canExport: false
    });

    // Users menu - admin full access, manager limited
    await MenuPermission.create({
      menuId: usersMenu.id,
      roleId: adminRole.id,
      canView: true,
      canEdit: true,
      canDelete: true,
      canExport: true
    });
    await MenuPermission.create({
      menuId: usersMenu.id,
      roleId: managerRole.id,
      canView: true,
      canEdit: true,
      canDelete: false,
      canExport: true
    });

    // Roles menu - admin full access, manager read-only
    await MenuPermission.create({
      menuId: rolesMenu.id,
      roleId: adminRole.id,
      canView: true,
      canEdit: true,
      canDelete: true,
      canExport: true
    });
    await MenuPermission.create({
      menuId: rolesMenu.id,
      roleId: managerRole.id,
      canView: true,
      canEdit: false,
      canDelete: false,
      canExport: false
    });

    // Permissions menu - admin only
    await MenuPermission.create({
      menuId: permissionsMenu.id,
      roleId: adminRole.id,
      canView: true,
      canEdit: true,
      canDelete: true,
      canExport: true
    });

    // Reports menu - all roles can view
    await MenuPermission.create({
      menuId: reportsMenu.id,
      roleId: adminRole.id,
      canView: true,
      canEdit: true,
      canDelete: true,
      canExport: true
    });
    await MenuPermission.create({
      menuId: reportsMenu.id,
      roleId: managerRole.id,
      canView: true,
      canEdit: false,
      canDelete: false,
      canExport: true
    });
    await MenuPermission.create({
      menuId: reportsMenu.id,
      roleId: viewerRole.id,
      canView: true,
      canEdit: false,
      canDelete: false,
      canExport: true
    });

    console.log('✓ Assigned permissions to menus');

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