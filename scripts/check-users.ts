import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

async function checkUsers() {
  const sequelize = new Sequelize({
    database: process.env.DB_NAME || 'rbac_system',
    username: process.env.DB_USER || 'rbac_user',
    password: process.env.DB_PASSWORD || 'rbac_password',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: false,
  });

  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    const [results] = await sequelize.query('SELECT id, username, email FROM users');
    console.log('Users in database:', results);

    if (results.length === 0) {
      console.log('\nNo users found. Creating admin user...');
      
      // Create admin user with hashed password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await sequelize.query(
        `INSERT INTO users (username, email, password, is_active, created_at, updated_at) 
         VALUES ('admin', 'admin@example.com', :password, true, NOW(), NOW())`,
        {
          replacements: { password: hashedPassword }
        }
      );
      
      console.log('Admin user created successfully!');
      console.log('Username: admin');
      console.log('Password: admin123');
    }

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();