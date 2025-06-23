import { sequelize } from '../src/config/database';
import { Role, Permission } from '../src/models';
import dotenv from 'dotenv';

dotenv.config();

async function assignPermissions() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Get all permissions
    const permissions = await Permission.findAll();
    console.log(`Found ${permissions.length} permissions`);

    // Find Administrator role
    const adminRole = await Role.findOne({ where: { name: 'Administrator' } });
    if (!adminRole) {
      console.error('Administrator role not found!');
      process.exit(1);
    }

    console.log(`Assigning all permissions to Administrator role...`);
    await adminRole.setPermissions(permissions);
    
    // Verify
    const updatedRole = await Role.findByPk(adminRole.id, {
      include: [{
        model: Permission,
        as: 'permissions'
      }]
    });

    console.log(`✓ Administrator role now has ${updatedRole?.permissions?.length || 0} permissions`);

    // Assign read permissions to other roles
    const readPermissions = permissions.filter(p => p.name.endsWith(':read'));
    
    const viewerRole = await Role.findOne({ where: { name: 'Viewer' } });
    if (viewerRole) {
      await viewerRole.setPermissions(readPermissions);
      console.log(`✓ Viewer role assigned ${readPermissions.length} read permissions`);
    }

    const managerRole = await Role.findOne({ where: { name: 'Manager' } });
    if (managerRole) {
      const managerPerms = permissions.filter(p => 
        p.name.startsWith('users:') || 
        p.name.startsWith('roles:') ||
        p.name === 'menus:read' ||
        p.name === 'permissions:read'
      );
      await managerRole.setPermissions(managerPerms);
      console.log(`✓ Manager role assigned ${managerPerms.length} permissions`);
    }

    console.log('\nPermissions assigned successfully!');
    await sequelize.close();
  } catch (error) {
    console.error('Error assigning permissions:', error);
    process.exit(1);
  }
}

assignPermissions();