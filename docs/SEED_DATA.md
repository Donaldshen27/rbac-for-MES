# MES RBAC System - Seed Data Documentation

## Overview
This document describes the seed data structure for the Manufacturing Execution System (MES) RBAC implementation. The seed data provides a comprehensive starting point with roles, permissions, menus, and demo users tailored for manufacturing operations.

## Seed Data Files

### Core Seeders (Original)
1. **20240101000001-seed-resources.ts** - Basic system resources
2. **20240101000002-seed-permissions.ts** - Core permissions for each resource
3. **20240101000003-seed-roles.ts** - Default system roles
4. **20240101000004-seed-default-users.ts** - Demo users with assigned roles
5. **20240101000005-seed-mes-menus.ts** - MES-specific menu structure

### Enhanced MES Seeders (Additional)
1. **20240101000000-seed-enhanced-resources.ts** - Additional MES resources
2. **20240101000006-seed-mes-enhanced-roles.ts** - Specialized MES roles
3. **20240101000007-seed-mes-enhanced-permissions.ts** - Extended MES permissions
4. **20240101000008-seed-mes-enhanced-menus.ts** - Additional menu items
5. **20240101000009-seed-mes-enhanced-users.ts** - Additional demo users

## Resources

### Core Resources
- **user** - User management
- **role** - Role management
- **permission** - Permission management
- **menu** - Menu management
- **production** - Production operations
- **quality** - Quality management
- **report** - Reporting
- **system** - System configuration
- **audit** - Audit logging
- **resource** - Resource management

### Enhanced MES Resources
- **equipment** - Equipment management
- **maintenance** - Maintenance operations
- **inventory** - Inventory management
- **material** - Material handling
- **planning** - Production planning
- **process** - Process management
- **product** - Product management
- **shift** - Shift management
- **analytics** - Data analytics
- **trace** - Production traceability
- **oee** - Overall Equipment Effectiveness
- **spc** - Statistical Process Control

## Roles

### Core Roles

1. **super_admin** (System Role)
   - Description: 超级管理员 - 拥有所有权限
   - Access: Full system access
   - Special: is_superuser flag set

2. **system_admin** (System Role)
   - Description: 系统管理员 - 管理系统配置和用户
   - Permissions: user:*, role:*, permission:*, menu:*, system:*, audit:read, resource:*
   - Access: Full administrative access

3. **production_manager**
   - Description: 生产经理 - 管理生产相关功能
   - Permissions: production:*, report:view, report:export, user:read, quality:view
   - Access: Production management and reporting

4. **quality_inspector**
   - Description: 质检员 - 管理质量相关功能
   - Permissions: quality:*, production:view, report:view, report:export, user:read
   - Access: Quality management and inspection

5. **operator**
   - Description: 操作员 - 基础操作权限
   - Permissions: production:view, production:report_work, quality:view, user:read
   - Access: Basic production operations

6. **viewer**
   - Description: 查看者 - 只读权限
   - Permissions: Various read-only permissions across all modules
   - Access: Read-only access to most areas

### Enhanced MES Roles

1. **maintenance_supervisor**
   - Description: 设备维护主管 - 管理设备维护和保养
   - Permissions: equipment:*, maintenance:*, production:view, report:view/export
   - Access: Equipment and maintenance management

2. **warehouse_manager**
   - Description: 仓库经理 - 管理物料和库存
   - Permissions: inventory:*, material:*, production:view, report:view/export
   - Access: Warehouse and inventory management

3. **shift_supervisor**
   - Description: 班组长 - 管理班组生产和人员
   - Permissions: production operations, shift:*, quality:view/manage_defects
   - Access: Shift management and production supervision

4. **material_handler**
   - Description: 物料员 - 处理物料领用和归还
   - Permissions: material:view/issue/return, inventory:view, production:view
   - Access: Material handling operations

5. **planning_manager**
   - Description: 计划经理 - 管理生产计划和排程
   - Permissions: planning:*, production:*, inventory:view, report:*
   - Access: Production planning and scheduling

6. **quality_manager**
   - Description: 质量经理 - 高级质量管理权限
   - Permissions: quality:*, production:view, report:*, user:read/update, role:assign
   - Access: Advanced quality management

7. **process_engineer**
   - Description: 工艺工程师 - 管理工艺路线和参数
   - Permissions: process:*, product:*, production:view, quality:view
   - Access: Process and product engineering

8. **data_analyst**
   - Description: 数据分析师 - 分析生产和质量数据
   - Permissions: report:*, analytics:*, production:view, quality:view
   - Access: Data analysis and reporting

## Permissions

### Permission Naming Convention
Permissions follow the pattern: `resource:action`
- Wildcard support: `resource:*` (all actions), `*:action` (action on all resources), `*:*` (all permissions)

### Core Permissions by Resource

**User Management**
- user:create - 创建用户
- user:read - 查看用户
- user:update - 更新用户
- user:delete - 删除用户
- user:* - 用户管理所有权限

**Production Management**
- production:view - 查看生产数据
- production:create_work_order - 创建工单
- production:update_work_order - 更新工单
- production:delete_work_order - 删除工单
- production:report_work - 报工
- production:* - 生产管理所有权限

**Quality Management**
- quality:view - 查看质量数据
- quality:manage_defects - 管理缺陷
- quality:approve - 质量审批
- quality:* - 质量管理所有权限

### Enhanced MES Permissions

**Equipment & Maintenance**
- equipment:create/read/update/delete/monitor
- maintenance:create/read/update/approve

**Inventory & Material**
- inventory:view/adjust/transfer/count
- material:view/create/update/issue/return

**Planning & Process**
- planning:create/read/update/approve/schedule
- process:create/read/update/approve

**Analytics & Monitoring**
- analytics:view/create/export/configure
- oee:view/calculate/export
- spc:view/configure/analyze
- trace:view/export

## Menu Structure

### Main Menu Categories
1. **基础数据** - Master data management
   - 产品定义, 产品BOM, 工艺路线, 工序定义, 设备定义
   - 设备类型, 物料定义, 班次定义 (enhanced)

2. **生产管理** - Production management
   - 生产工单 (工单管理, 排产计划)
   - 生产流转卡, 生产报工, 生产看板
   - 生产追溯, 异常管理 (enhanced)

3. **库存管理** (Enhanced) - Inventory management
   - 物料领用, 物料退回, 库存查询
   - 库存盘点, 库存调整

4. **设备管理** (Enhanced) - Equipment management
   - 设备监控, 维护计划, 维护记录, OEE分析

5. **质量管理** - Quality management
   - 缺陷管理, 质检报告
   - SPC控制, 质检标准, 不良品处理 (enhanced)

6. **报表管理** - Report management
   - 生产报表, 质量报表, 设备报表
   - 库存报表, 综合分析, 自定义报表 (enhanced)

7. **系统管理** - System management
   - 用户管理, 角色管理, 权限管理, 菜单管理, 审计日志
   - 系统配置, 数据备份, 系统监控 (enhanced)

## Demo Users

### Core Demo Users (Password: Admin@123)
1. **superadmin** - Super administrator
2. **prod_manager** - Production manager
3. **quality_user** - Quality inspector
4. **operator1** - Operator
5. **viewer1** - Viewer

### Enhanced Demo Users (Password: Admin@123)
1. **maintenance_sup** - 张维护 (Maintenance Supervisor)
2. **warehouse_mgr** - 李仓库 (Warehouse Manager)
3. **shift_sup1** - 王班长 (Shift Supervisor)
4. **material_handler1** - 陈物料 (Material Handler)
5. **planning_mgr** - 赵计划 (Planning Manager)
6. **quality_mgr** - 孙质量 (Quality Manager)
7. **process_eng1** - 刘工艺 (Process Engineer)
8. **data_analyst1** - 周分析 (Data Analyst)

## Running Seed Data

### Commands
```bash
# Run all pending seeders
npm run seed:up

# Check seeder status
npm run seed:status

# Rollback last seeder
npm run seed:down

# Rollback all seeders
npm run seed:reset

# Full database reset (migrations + seeds)
npm run db:reset
```

### Seeder Features
- **Idempotent**: Uses Umzug to track executed seeders
- **Rollback Support**: Each seeder has up/down methods
- **Dependency Management**: Proper order of execution
- **Transaction Support**: Database consistency maintained

## Best Practices

1. **Testing**: Always test seed data in development before production
2. **Passwords**: Change default passwords immediately in production
3. **Permissions**: Review and adjust permissions based on actual requirements
4. **Menu Access**: Configure menu permissions based on role requirements
5. **Audit Trail**: Monitor audit logs for permission usage

## Customization Guide

To add custom seed data:

1. Create a new seeder file with timestamp prefix
2. Implement both `up` and `down` methods
3. Use UUIDs for consistent IDs
4. Handle foreign key dependencies properly
5. Test rollback functionality

Example seeder template:
```typescript
import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const timestamp = new Date();
    // Add your seed data here
  },
  
  down: async (queryInterface: QueryInterface): Promise<void> => {
    // Remove your seed data here
  }
};
```

## Troubleshooting

### Common Issues

1. **Foreign Key Constraints**: Ensure parent records exist before inserting child records
2. **Duplicate Keys**: Check for existing data before inserting
3. **Permission Dependencies**: Create resources before permissions
4. **Menu Hierarchy**: Insert parent menus before child menus

### Debug Commands
```bash
# Check migration status
npm run migrate:status

# View database logs
tail -f logs/app.log

# Test specific seeder
npx ts-node scripts/seeders/[seeder-file].ts
```