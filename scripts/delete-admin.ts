import { sequelize } from '../src/config/database';
import { User } from '../src/models/User';
import dotenv from 'dotenv';

dotenv.config();

async function deleteAdminUser() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Delete admin user
    const result = await User.destroy({ where: { username: 'admin' } });
    
    if (result > 0) {
      console.log('Admin user deleted successfully');
    } else {
      console.log('Admin user not found');
    }

    await sequelize.close();
  } catch (error) {
    console.error('Error deleting admin user:', error);
    process.exit(1);
  }
}

deleteAdminUser();