import { Sequelize } from 'sequelize';
import dbConfig from './database.config';
import { logger } from '@utils/logger';

class Database {
  private static instance: Database;
  private sequelize: Sequelize;

  private constructor() {
    this.sequelize = new Sequelize(dbConfig);
    this.setupHooks();
  }

  private setupHooks(): void {
    // Log all SQL queries in development
    if (process.env.NODE_ENV === 'development') {
      this.sequelize.beforeConnect(() => {
        logger.debug('Attempting to connect to database...');
      });

      this.sequelize.afterConnect(() => {
        logger.info('Database connection established successfully');
      });

      this.sequelize.beforeDisconnect(() => {
        logger.debug('Disconnecting from database...');
      });

      this.sequelize.afterDisconnect(() => {
        logger.info('Database connection closed');
      });
    }
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getSequelize(): Sequelize {
    return this.sequelize;
  }

  public async connect(): Promise<void> {
    try {
      await this.sequelize.authenticate();
      logger.info('Database connection has been established successfully.');
    } catch (error) {
      logger.error('Unable to connect to the database:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.sequelize.close();
      logger.info('Database connection closed.');
    } catch (error) {
      logger.error('Error closing database connection:', error);
      throw error;
    }
  }

  public async sync(force = false): Promise<void> {
    try {
      await this.sequelize.sync({ force });
      logger.info(`Database synchronized${force ? ' (forced)' : ''}.`);
    } catch (error) {
      logger.error('Error synchronizing database:', error);
      throw error;
    }
  }

  public async transaction<T>(
    callback: (t: any) => Promise<T>
  ): Promise<T> {
    return this.sequelize.transaction(callback);
  }
}

// Export singleton instance
export const database = Database.getInstance();
export const sequelize = database.getSequelize();

// Export Sequelize and DataTypes for model definitions
export { Sequelize, DataTypes, Model, Op, QueryTypes } from 'sequelize';
export type {
  Transaction,
  FindOptions,
  CreateOptions,
  UpdateOptions,
  DestroyOptions,
  CountOptions,
  ValidationError,
} from 'sequelize';