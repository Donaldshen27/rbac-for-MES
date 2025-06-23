import { Sequelize } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';
import path from 'path';
import fs from 'fs';
import { sequelize } from '../src/config/database';
import { logger } from '../src/utils/logger';

const migrationPath = path.join(__dirname, 'migrations');

// Ensure migrations directory exists
if (!fs.existsSync(migrationPath)) {
  fs.mkdirSync(migrationPath, { recursive: true });
}

const umzug = new Umzug({
  migrations: {
    glob: path.join(migrationPath, '*.ts'),
    resolve: ({ name, path: migrationPath }) => {
      const migration = require(migrationPath!);
      return {
        name,
        up: async ({ context }) => migration.default.up(context),
        down: async ({ context }) => migration.default.down(context)
      };
    }
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console
});

export async function runMigrations() {
  try {
    logger.info('Starting database migrations...');
    
    // Check pending migrations
    const pending = await umzug.pending();
    if (pending.length === 0) {
      logger.info('No pending migrations');
      return;
    }
    
    logger.info(`Found ${pending.length} pending migrations:`);
    pending.forEach(migration => {
      logger.info(`  - ${migration.name}`);
    });
    
    // Run migrations
    const executed = await umzug.up();
    
    logger.info(`Successfully executed ${executed.length} migrations:`);
    executed.forEach(migration => {
      logger.info(`  ✓ ${migration.name}`);
    });
    
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  }
}

export async function rollbackMigration(steps = 1) {
  try {
    logger.info(`Rolling back ${steps} migration(s)...`);
    
    const executed = await umzug.executed();
    if (executed.length === 0) {
      logger.info('No migrations to rollback');
      return;
    }
    
    const rolledBack = await umzug.down({ step: steps });
    
    logger.info(`Successfully rolled back ${rolledBack.length} migration(s):`);
    rolledBack.forEach(migration => {
      logger.info(`  ✓ ${migration.name}`);
    });
    
  } catch (error) {
    logger.error('Rollback failed:', error);
    throw error;
  }
}

export async function resetDatabase() {
  try {
    logger.warn('Resetting database - this will rollback all migrations!');
    
    const executed = await umzug.executed();
    if (executed.length === 0) {
      logger.info('No migrations to rollback');
      return;
    }
    
    const rolledBack = await umzug.down({ to: 0 });
    
    logger.info(`Successfully rolled back ${rolledBack.length} migration(s)`);
    
  } catch (error) {
    logger.error('Reset failed:', error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  const command = process.argv[2];
  
  (async () => {
    try {
      switch (command) {
        case 'up':
        case 'migrate':
          await runMigrations();
          break;
          
        case 'down':
        case 'rollback':
          const steps = parseInt(process.argv[3]) || 1;
          await rollbackMigration(steps);
          break;
          
        case 'reset':
          await resetDatabase();
          break;
          
        case 'status':
          const executed = await umzug.executed();
          const pending = await umzug.pending();
          
          console.log('\nExecuted migrations:');
          executed.forEach(m => console.log(`  ✓ ${m.name}`));
          
          console.log('\nPending migrations:');
          pending.forEach(m => console.log(`  - ${m.name}`));
          break;
          
        default:
          console.log(`
Database Migration Tool

Usage:
  npm run migrate:up       Run all pending migrations
  npm run migrate:down     Rollback last migration
  npm run migrate:down 3   Rollback last 3 migrations  
  npm run migrate:reset    Rollback all migrations
  npm run migrate:status   Show migration status
          `);
      }
      
      process.exit(0);
    } catch (error) {
      console.error('Migration error:', error);
      process.exit(1);
    }
  })();
}