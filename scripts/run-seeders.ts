import { Sequelize } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';
import path from 'path';
import fs from 'fs';
import { sequelize } from '../src/config/database';
import { logger } from '../src/utils/logger';

const seederPath = path.join(__dirname, 'seeders');

// Ensure seeders directory exists
if (!fs.existsSync(seederPath)) {
  fs.mkdirSync(seederPath, { recursive: true });
}

// Create a separate table for tracking seeders
class SeederStorage extends SequelizeStorage {
  constructor(options: any) {
    super({
      ...options,
      tableName: 'SequelizeSeeders'
    });
  }
}

const umzug = new Umzug({
  migrations: {
    glob: path.join(seederPath, '*.ts'),
    resolve: ({ name, path: seederPath }) => {
      const seeder = require(seederPath!);
      return {
        name,
        up: async ({ context }) => seeder.default.up(context),
        down: async ({ context }) => seeder.default.down(context)
      };
    }
  },
  context: sequelize.getQueryInterface(),
  storage: new SeederStorage({ sequelize }),
  logger: console
});

export async function runSeeders() {
  try {
    logger.info('Starting database seeding...');
    
    // Check pending seeders
    const pending = await umzug.pending();
    if (pending.length === 0) {
      logger.info('No pending seeders');
      return;
    }
    
    logger.info(`Found ${pending.length} pending seeders:`);
    pending.forEach(seeder => {
      logger.info(`  - ${seeder.name}`);
    });
    
    // Run seeders
    const executed = await umzug.up();
    
    logger.info(`Successfully executed ${executed.length} seeders:`);
    executed.forEach(seeder => {
      logger.info(`  ✓ ${seeder.name}`);
    });
    
  } catch (error) {
    logger.error('Seeding failed:', error);
    throw error;
  }
}

export async function rollbackSeeder(steps = 1) {
  try {
    logger.info(`Rolling back ${steps} seeder(s)...`);
    
    const executed = await umzug.executed();
    if (executed.length === 0) {
      logger.info('No seeders to rollback');
      return;
    }
    
    const rolledBack = await umzug.down({ step: steps });
    
    logger.info(`Successfully rolled back ${rolledBack.length} seeder(s):`);
    rolledBack.forEach(seeder => {
      logger.info(`  ✓ ${seeder.name}`);
    });
    
  } catch (error) {
    logger.error('Rollback failed:', error);
    throw error;
  }
}

export async function resetSeeders() {
  try {
    logger.warn('Resetting seeders - this will rollback all seed data!');
    
    const executed = await umzug.executed();
    if (executed.length === 0) {
      logger.info('No seeders to rollback');
      return;
    }
    
    const rolledBack = await umzug.down({ to: 0 });
    
    logger.info(`Successfully rolled back ${rolledBack.length} seeder(s)`);
    
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
        case 'seed':
          await runSeeders();
          break;
          
        case 'down':
        case 'rollback':
          const steps = parseInt(process.argv[3]) || 1;
          await rollbackSeeder(steps);
          break;
          
        case 'reset':
          await resetSeeders();
          break;
          
        case 'status':
          const executed = await umzug.executed();
          const pending = await umzug.pending();
          
          console.log('\nExecuted seeders:');
          executed.forEach(s => console.log(`  ✓ ${s.name}`));
          
          console.log('\nPending seeders:');
          pending.forEach(s => console.log(`  - ${s.name}`));
          break;
          
        default:
          console.log(`
Database Seeder Tool

Usage:
  npm run seed:up          Run all pending seeders
  npm run seed:down        Rollback last seeder
  npm run seed:down 3      Rollback last 3 seeders  
  npm run seed:reset       Rollback all seeders
  npm run seed:status      Show seeder status
          `);
      }
      
      process.exit(0);
    } catch (error) {
      console.error('Seeder error:', error);
      process.exit(1);
    }
  })();
}