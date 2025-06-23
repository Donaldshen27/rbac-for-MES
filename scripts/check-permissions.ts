import { sequelize } from '../src/config/database';
import { Role, Permission, RolePermission } from '../src/models';
import dotenv from 'dotenv';

dotenv.config();

async function checkPermissions() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Check permissions count
    const permissionCount = await Permission.count();
    console.log(`\nTotal permissions in database: ${permissionCount}`);

    // Check roles
    const roles = await Role.findAll({
      include: [{
        model: Permission,
        as: 'permissions'
      }]
    });

    console.log(`\nRoles and their permissions:`);
    for (const role of roles) {
      console.log(`\n${role.name} (${role.id}):`);
      if (role.permissions && role.permissions.length > 0) {
        console.log(`  Has ${role.permissions.length} permissions:`);
        role.permissions.forEach(p => console.log(`    - ${p.name}`));
      } else {
        console.log(`  No permissions assigned`);
      }
    }

    // Check RolePermission table directly
    const rolePermCount = await RolePermission.count();
    console.log(`\nTotal role-permission mappings: ${rolePermCount}`);

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPermissions();