import { sequelize } from '@config/database';
import { User } from './User';
import { Role } from './Role';
import { Permission } from './Permission';
import { Resource } from './Resource';
import { Menu } from './Menu';
import { RefreshToken } from './RefreshToken';
import { AuditLog } from './AuditLog';
import { UserRole } from './UserRole';
import { RolePermission } from './RolePermission';
import { MenuPermission } from './MenuPermission';

// Define models object for associations
const models = {
  User,
  Role,
  Permission,
  Resource,
  Menu,
  RefreshToken,
  AuditLog,
  UserRole,
  RolePermission,
  MenuPermission,
};

// Initialize associations
Object.values(models).forEach((model: any) => {
  if (model.associate) {
    model.associate(models);
  }
});

// Export all models
export {
  User,
  Role,
  Permission,
  Resource,
  Menu,
  RefreshToken,
  AuditLog,
  UserRole,
  RolePermission,
  MenuPermission,
};

// Export sequelize instance
export { sequelize };

// Export a function to sync all models
export const syncModels = async (force = false): Promise<void> => {
  await sequelize.sync({ force });
};

// Export model types
export type Models = typeof models;