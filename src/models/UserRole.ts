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
import { User } from './User';
import { Role } from './Role';

export class UserRole extends Model<
  InferAttributes<UserRole>,
  InferCreationAttributes<UserRole>
> {
  declare userId: ForeignKey<User['id']>;
  declare roleId: ForeignKey<Role['id']>;
  declare assignedAt: CreationOptional<Date>;
  declare assignedBy: ForeignKey<User['id']> | null;

  // Associations
  declare user?: NonAttribute<User>;
  declare role?: NonAttribute<Role>;
  declare assigner?: NonAttribute<User>;

  declare static associations: {
    user: Association<UserRole, User>;
    role: Association<UserRole, Role>;
    assigner: Association<UserRole, User>;
  };

  // Static methods
  static associate(models: any): void {
    UserRole.belongsTo(models.User, {
      as: 'user',
      foreignKey: 'userId',
      targetKey: 'id',
    });

    UserRole.belongsTo(models.Role, {
      as: 'role',
      foreignKey: 'roleId',
      targetKey: 'id',
    });

    UserRole.belongsTo(models.User, {
      as: 'assigner',
      foreignKey: 'assignedBy',
      targetKey: 'id',
    });
  }
}

UserRole.init(
  {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    roleId: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: 'roles',
        key: 'id',
      },
    },
    assignedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    assignedBy: {
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
    modelName: 'UserRole',
    tableName: 'user_roles',
    timestamps: false,
    indexes: [
      { fields: ['userId'] },
      { fields: ['roleId'] },
    ],
  }
);