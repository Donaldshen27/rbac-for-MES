import { database } from '../src/config/database';
import { logger } from '../src/utils/logger';

const testConnection = async () => {
  try {
    logger.info('Testing database connection...');
    await database.connect();
    logger.info('Database connection test successful!');
    await database.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Database connection test failed:', error);
    process.exit(1);
  }
};

testConnection();