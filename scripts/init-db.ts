import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { logger } from '../src/utils/logger';

dotenv.config();

const initDatabase = async () => {
  const dbName = process.env.DB_NAME || 'rbac_system';
  const testDbName = `${dbName}_test`;
  
  try {
    // Create connection without database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    // Create main database
    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    logger.info(`Database '${dbName}' created or already exists`);

    // Create test database
    if (process.env.NODE_ENV !== 'production') {
      await connection.execute(
        `CREATE DATABASE IF NOT EXISTS \`${testDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      logger.info(`Test database '${testDbName}' created or already exists`);
    }

    await connection.end();
    logger.info('Database initialization completed');
  } catch (error) {
    logger.error('Database initialization failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  initDatabase();
}

export default initDatabase;