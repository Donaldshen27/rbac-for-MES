import { sequelize } from '../src/config/database';
import { User } from '../src/models/User';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function createAdminUser() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Check if admin user exists
    const adminUser = await User.findOne({ where: { username: 'admin' } });
    
    if (adminUser) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user (password will be hashed by the model's beforeCreate hook)
    const newAdmin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',  // Raw password - will be hashed by the model
      isActive: true
    });

    console.log('Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('User ID:', newAdmin.id);

    await sequelize.close();
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();