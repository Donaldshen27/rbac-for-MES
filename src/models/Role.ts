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
import { User } from './User';
import { Permission } from './Permission';
import { Menu } from './Menu';

export class Role extends Model<
  InferAttributes<Role>,
  InferCreationAttributes<Role>
> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare description: string | null;
  declare isSystem: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare users?: NonAttribute<User[]>;
  declare permissions?: NonAttribute<Permission[]>;
  declare menus?: NonAttribute<Menu[]>;

  declare static associations: {
    users: Association<Role, User>;
    permissions: Association<Role, Permission>;
    menus: Association<Role, Menu>;
  };

  // Static methods
  static associate(models: any): void {
    Role.belongsToMany(models.User, {
      through: models.UserRole,
      as: 'users',
      foreignKey: 'roleId',
      otherKey: 'userId',
    });

    Role.belongsToMany(models.Permission, {
      through: models.RolePermission,
      as: 'permissions',
      foreignKey: 'roleId',
      otherKey: 'permissionId',
    });

    Role.hasMany(models.MenuPermission, {
      as: 'menuPermissions',
      foreignKey: 'roleId',
    });
  }

  // Instance methods
  async hasPermission(permissionName: string): Promise<boolean> {
    if (!this.permissions) {
      await this.reload({ include: ['permissions'] });
    }
    return this.permissions?.some(p => p.name === permissionName) || false;
  }

  async getUserCount(): Promise<number> {
    return (this as any).countUsers();
  }

  async getPermissionCount(): Promise<number> {
    return (this as any).countPermissions();
  }
}

Role.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 50],
        isValidRoleName(value: string) {
          if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
            throw new Error('Role name can only contain letters, numbers, underscores, and hyphens');
          }
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'System roles cannot be deleted',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    timestamps: true,
    indexes: [
      { fields: ['name'] },
      { fields: ['isSystem'] },
    ],
    hooks: {
      beforeDestroy: async (role: Role) => {
        if (role.isSystem) {
          throw new Error('System roles cannot be deleted');
        }
        const userCount = await role.getUserCount();
        if (userCount > 0) {
          throw new Error(`Cannot delete role with ${userCount} assigned users`);
        }
      },
    },
  }
);