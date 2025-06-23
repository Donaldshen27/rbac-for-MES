import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  NonAttribute,
  Association,
} from 'sequelize';
import { sequelize } from '@config/database';
import { Role } from './Role';
import { Permission } from './Permission';
import { User } from './User';

export class RolePermission extends Model<
  InferAttributes<RolePermission>,
  InferCreationAttributes<RolePermission>
> {
  declare roleId: ForeignKey<Role['id']>;
  declare permissionId: ForeignKey<Permission['id']>;
  declare grantedAt: CreationOptional<Date>;
  declare grantedBy: ForeignKey<User['id']> | null;

  // Associations
  declare role?: NonAttribute<Role>;
  declare permission?: NonAttribute<Permission>;
  declare granter?: NonAttribute<User>;

  declare static associations: {
    role: Association<RolePermission, Role>;
    permission: Association<RolePermission, Permission>;
    granter: Association<RolePermission, User>;
  };

  // Static methods
  static associate(models: any): void {
    RolePermission.belongsTo(models.Role, {
      as: 'role',
      foreignKey: 'roleId',
    });

    RolePermission.belongsTo(models.Permission, {
      as: 'permission',
      foreignKey: 'permissionId',
    });

    RolePermission.belongsTo(models.User, {
      as: 'granter',
      foreignKey: 'grantedBy',
    });
  }
}

RolePermission.init(
  {
    roleId: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: 'roles',
        key: 'id',
      },
    },
    permissionId: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: 'permissions',
        key: 'id',
      },
    },
    grantedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    grantedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'RolePermission',
    tableName: 'role_permissions',
    timestamps: false,
    indexes: [
      { fields: ['roleId'] },
      { fields: ['permissionId'] },
    ],
  }
);