import { sequelize } from '../src/config/database';
import { logger } from '../src/utils/logger';
import { runMigrations } from './run-migrations';
import { runSeeders } from './run-seeders';

async function setupDatabase() {
  try {
    logger.info('Setting up database...');
    
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    // Run migrations
    logger.info('Running migrations...');
    await runMigrations();
    
    // Run seeders
    logger.info('Running seeders...');
    await runSeeders();
    
    logger.info('Database setup completed successfully!');
    
    // Display default credentials
    console.log('\n========================================');
    console.log('Default Super Admin Credentials:');
    console.log('Username: superadmin');
    console.log('Password: Admin@123');
    console.log('========================================\n');
    
    console.log('Other Demo Users (all with password: Admin@123):');
    console.log('- prod_manager (Production Manager)');
    console.log('- quality_user (Quality Inspector)');
    console.log('- operator1 (Operator)');
    console.log('- viewer1 (Viewer)');
    console.log('========================================\n');
    
  } catch (error) {
    logger.error('Database setup failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase();
}