import { sequelize } from '../src/config/database';
import { Role, Permission } from '../src/models';
import dotenv from 'dotenv';

dotenv.config();

async function assignAllPermissions() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Get all permissions
    const permissions = await Permission.findAll();
    console.log(`Found ${permissions.length} permissions total`);

    // Find Administrator role
    const adminRole = await Role.findOne({ where: { name: 'Administrator' } });
    if (!adminRole) {
      console.error('Administrator role not found!');
      process.exit(1);
    }

    console.log(`Assigning ALL permissions to Administrator role...`);
    await adminRole.setPermissions(permissions);
    
    // Verify
    const updatedRole = await Role.findByPk(adminRole.id, {
      include: [{
        model: Permission,
        as: 'permissions'
      }]
    });

    console.log(`✓ Administrator role now has ${updatedRole?.permissions?.length || 0} permissions`);

    console.log('\nAll permissions assigned successfully!');
    await sequelize.close();
  } catch (error) {
    console.error('Error assigning permissions:', error);
    process.exit(1);
  }
}

assignAllPermissions();