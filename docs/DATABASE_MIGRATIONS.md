# Database Migrations Documentation

## Overview
This document explains the database migration system for the RBAC system, including how to run migrations, manage seed data, and maintain the database schema.

## Migration System

### Technology Stack
- **Sequelize**: ORM for database operations
- **Umzug**: Migration tool for running migrations and seeders
- **TypeScript**: All migrations and seeders are written in TypeScript

### Directory Structure
```
scripts/
├── migrations/          # Database schema migrations
│   ├── 20240101000001-create-users-table.ts
│   ├── 20240101000002-create-roles-table.ts
│   ├── 20240101000003-create-resources-table.ts
│   ├── 20240101000004-create-permissions-table.ts
│   ├── 20240101000005-create-menus-table.ts
│   ├── 20240101000006-create-user-roles-table.ts
│   ├── 20240101000007-create-role-permissions-table.ts
│   ├── 20240101000008-create-menu-permissions-table.ts
│   ├── 20240101000009-create-refresh-tokens-table.ts
│   └── 20240101000010-create-audit-logs-table.ts
├── seeders/            # Initial data seeders
│   ├── 20240101000001-seed-resources.ts
│   ├── 20240101000002-seed-permissions.ts
│   ├── 20240101000003-seed-roles.ts
│   ├── 20240101000004-seed-default-users.ts
│   └── 20240101000005-seed-mes-menus.ts
├── run-migrations.ts   # Migration runner script
├── run-seeders.ts      # Seeder runner script
└── setup-database.ts   # Complete database setup script
```

## Running Migrations

### Quick Setup
To set up the database with all migrations and seed data:
```bash
npm run db:setup
```

This will:
1. Test database connection
2. Run all pending migrations
3. Run all seed data
4. Display default login credentials

### Migration Commands

#### Run Migrations
```bash
# Run all pending migrations
npm run migrate:up

# Check migration status
npm run migrate:status

# Rollback last migration
npm run migrate:down

# Rollback last 3 migrations
npm run migrate:down 3

# Reset all migrations (rollback all)
npm run migrate:reset
```

#### Seed Data
```bash
# Run all pending seeders
npm run seed:up

# Check seeder status
npm run seed:status

# Rollback last seeder
npm run seed:down

# Rollback last 3 seeders
npm run seed:down 3

# Reset all seeders
npm run seed:reset
```

#### Complete Reset
```bash
# Reset database (rollback all, then migrate and seed)
npm run db:reset
```

## Migration Files

### Table Creation Order
1. **Core Tables** (no dependencies)
   - users
   - roles
   - resources
   - permissions
   - menus

2. **Junction Tables** (depend on core tables)
   - user_roles
   - role_permissions
   - menu_permissions

3. **Security Tables**
   - refresh_tokens
   - audit_logs

### Migration Structure
Each migration file exports an object with `up` and `down` methods:

```typescript
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    // Create table
    await queryInterface.createTable('table_name', {
      // column definitions
    });
    
    // Create indexes
    await queryInterface.addIndex('table_name', ['column']);
  },
  
  down: async (queryInterface: QueryInterface): Promise<void> => {
    // Drop table (indexes are dropped automatically)
    await queryInterface.dropTable('table_name');
  }
};
```

## Seed Data

### Default Data Created

#### 1. Resources
- user, role, permission, menu
- production, quality, report, system
- audit, resource

#### 2. Permissions
Complete permission set following pattern `resource:action`:
- User management: user:create, user:read, user:update, user:delete, user:*
- Role management: role:create, role:read, role:update, role:delete, role:assign, role:*
- Permission management: permission:create, permission:read, permission:update, permission:delete, permission:assign, permission:*
- Menu management: menu:read, menu:update, menu:*
- Production: production:view, production:create_work_order, production:update_work_order, production:delete_work_order, production:report_work, production:*
- Quality: quality:view, quality:manage_defects, quality:approve, quality:*
- Reports: report:view, report:export, report:create, report:*
- System: system:read, system:config, system:manage_users, system:*
- Audit: audit:read, audit:export, audit:*
- Resource: resource:create, resource:read, resource:update, resource:delete, resource:*

#### 3. Roles
- **super_admin**: System role with all permissions
- **system_admin**: Manages system configuration and users
- **production_manager**: Manages production operations
- **quality_inspector**: Manages quality control
- **operator**: Basic operational tasks
- **viewer**: Read-only access

#### 4. Default Users
All default users have password: `Admin@123`

| Username | Email | Role | Description |
|----------|-------|------|-------------|
| superadmin | admin@rbac-system.com | super_admin | Super administrator |
| prod_manager | prod.manager@rbac-system.com | production_manager | Production manager demo |
| quality_user | quality@rbac-system.com | quality_inspector | Quality inspector demo |
| operator1 | operator1@rbac-system.com | operator | Operator demo |
| viewer1 | viewer@rbac-system.com | viewer | Read-only user demo |

#### 5. MES Menu Structure
Complete hierarchical menu structure for MES:
- 基础数据 (Base Data)
  - 产品定义 (Product Definition)
  - 产品BOM (Product BOM)
  - 工艺路线 (Process Route)
  - 工序定义 (Operation Definition)
  - 设备定义 (Equipment Definition)
- 生产管理 (Production Management)
  - 生产工单 (Production Orders)
    - 工单管理 (Order Management)
    - 排产计划 (Production Schedule)
  - 生产流转卡 (Production Flow Card)
  - 生产报工 (Production Report)
  - 生产看板 (Production Dashboard)
- 质量管理 (Quality Management)
  - 缺陷管理 (Defect Management)
  - 质检报告 (Quality Report)
- 报表管理 (Report Management)
  - 生产报表 (Production Report)
  - 质量报表 (Quality Report)
  - 设备报表 (Equipment Report)
- 系统管理 (System Management)
  - 用户管理 (User Management)
  - 角色管理 (Role Management)
  - 权限管理 (Permission Management)
  - 菜单管理 (Menu Management)
  - 审计日志 (Audit Log)

## Development Workflow

### Creating New Migrations
```bash
# Create a new migration file manually
touch scripts/migrations/$(date +%Y%m%d%H%M%S)-your-migration-name.ts
```

### Migration Best Practices

1. **Naming Convention**
   - Use timestamp prefix: `YYYYMMDDHHMMSS-description.ts`
   - Be descriptive: `create-users-table`, `add-email-to-users`

2. **Always Include Rollback**
   - Every `up` method must have a corresponding `down` method
   - Test rollback before committing

3. **Index Strategy**
   - Add indexes for foreign keys
   - Add indexes for frequently queried columns
   - Consider composite indexes for common query patterns

4. **Data Types**
   - Use UUID for primary keys
   - Use appropriate string lengths
   - Consider NULL vs NOT NULL carefully

5. **Foreign Key Constraints**
   - Always define ON DELETE behavior
   - Use CASCADE for dependent data
   - Use SET NULL for optional relationships

## Troubleshooting

### Common Issues

#### Migration Failed
```bash
# Check migration status
npm run migrate:status

# Rollback failed migration
npm run migrate:down

# Fix the migration file, then run again
npm run migrate:up
```

#### Seeder Failed
```bash
# Check what seeders have run
npm run seed:status

# Rollback problematic seeder
npm run seed:down

# Fix and re-run
npm run seed:up
```

#### Complete Reset
If database is in inconsistent state:
```bash
# Nuclear option - drops all tables
npm run db:reset
```

### Manual Database Access
```bash
# Connect to MySQL
mysql -u root -p rbac_system

# Check migration history
SELECT * FROM SequelizeMeta;

# Check seeder history  
SELECT * FROM SequelizeSeeders;
```

## Production Considerations

### Before Production

1. **Review All Migrations**
   - Ensure all foreign keys are correct
   - Verify indexes are optimized
   - Check data types are appropriate

2. **Test Migration Path**
   - Run migrations on staging environment
   - Test rollback procedures
   - Verify data integrity

3. **Backup Strategy**
   - Always backup before migrations
   - Test restore procedures
   - Have rollback plan ready

### Production Migration Process

1. **Backup Database**
   ```bash
   mysqldump -u root -p rbac_system > backup-$(date +%Y%m%d).sql
   ```

2. **Run Migrations**
   ```bash
   NODE_ENV=production npm run migrate:up
   ```

3. **Verify**
   ```bash
   npm run migrate:status
   ```

4. **Monitor**
   - Check application logs
   - Verify functionality
   - Monitor performance

## Maintenance

### Regular Tasks

1. **Archive Old Audit Logs**
   - Create migration to partition audit_logs table
   - Archive data older than retention period

2. **Clean Expired Tokens**
   - Already handled by auth utility
   - Can create scheduled job

3. **Optimize Indexes**
   - Monitor slow queries
   - Add indexes as needed
   - Remove unused indexes

### Adding New Features

When adding new features that require schema changes:

1. Create migration for new tables/columns
2. Create seeder for initial data (if needed)
3. Update models in `src/models/`
4. Update this documentation
5. Test migration up and down
6. Commit all changes together

---

Document Version: 1.0
Last Updated: 2024-01-01
Author: RBAC System Team