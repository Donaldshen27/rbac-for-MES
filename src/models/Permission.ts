import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Association,
  NonAttribute,
} from 'sequelize';
import { sequelize } from '@config/database';
import { Role } from './Role';

export class Permission extends Model<
  InferAttributes<Permission>,
  InferCreationAttributes<Permission>
> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare resource: string;
  declare action: string;
  declare description: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare roles?: NonAttribute<Role[]>;

  declare static associations: {
    roles: Association<Permission, Role>;
  };

  // Static methods
  static associate(models: any): void {
    Permission.belongsToMany(models.Role, {
      through: models.RolePermission,
      as: 'roles',
      foreignKey: 'permissionId',
      otherKey: 'roleId',
    });
  }

  // Instance methods
  async getRoleCount(): Promise<number> {
    return (this as any).countRoles();
  }

  static parsePermissionName(name: string): { resource: string; action: string } {
    const parts = name.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid permission name format. Expected format: resource:action');
    }
    return {
      resource: parts[0],
      action: parts[1],
    };
  }

  static formatPermissionName(resource: string, action: string): string {
    return `${resource}:${action}`;
  }
}

Permission.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isValidFormat(value: string) {
          if (!/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/.test(value)) {
            throw new Error('Permission name must follow the format: resource:action');
          }
        },
      },
    },
    resource: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isAlphanumericWithUnderscore(value: string) {
          if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
            throw new Error('Resource can only contain letters, numbers, underscores, and hyphens');
          }
        },
      },
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isAlphanumericWithUnderscore(value: string) {
          if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
            throw new Error('Action can only contain letters, numbers, underscores, and hyphens');
          }
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Permission',
    tableName: 'permissions',
    timestamps: true,
    indexes: [
      { fields: ['name'] },
      { fields: ['resource', 'action'] },
    ],
    hooks: {
      beforeValidate: (permission: Permission) => {
        // Auto-generate name from resource and action if not provided
        if (!permission.name && permission.resource && permission.action) {
          permission.name = Permission.formatPermissionName(
            permission.resource,
            permission.action
          );
        }
        // Auto-extract resource and action from name if not provided
        else if (permission.name && (!permission.resource || !permission.action)) {
          const { resource, action } = Permission.parsePermissionName(permission.name);
          permission.resource = permission.resource || resource;
          permission.action = permission.action || action;
        }
      },
      beforeDestroy: async (permission: Permission) => {
        const roleCount = await permission.getRoleCount();
        if (roleCount > 0) {
          throw new Error(`Cannot delete permission assigned to ${roleCount} roles`);
        }
      },
    },
  }
);