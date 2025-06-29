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
import bcrypt from 'bcrypt';
import { Role } from './Role';
import { RefreshToken } from './RefreshToken';
import { AuditLog } from './AuditLog';

export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  declare id: CreationOptional<string>;
  declare username: string;
  declare email: string;
  declare password: string;
  declare firstName: string | null;
  declare lastName: string | null;
  declare isActive: CreationOptional<boolean>;
  declare isSuperuser: CreationOptional<boolean>;
  declare lastLogin: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare roles?: NonAttribute<Role[]>;
  declare refreshTokens?: NonAttribute<RefreshToken[]>;
  declare auditLogs?: NonAttribute<AuditLog[]>;

  declare static associations: {
    roles: Association<User, Role>;
    refreshTokens: Association<User, RefreshToken>;
    auditLogs: Association<User, AuditLog>;
  };

  // Association methods for roles (belongsToMany)
  declare getRoles: () => Promise<Role[]>;
  declare setRoles: (roles: Role[] | string[]) => Promise<void>;
  declare addRole: (role: Role | string) => Promise<void>;
  declare addRoles: (roles: Role[] | string[]) => Promise<void>;
  declare removeRole: (role: Role | string) => Promise<void>;
  declare removeRoles: (roles: Role[] | string[]) => Promise<void>;
  declare hasRole: (role: Role | string) => Promise<boolean>;
  declare hasRoles: (roles: Role[] | string[]) => Promise<boolean>;
  declare countRoles: () => Promise<number>;
  declare createRole: (role: any) => Promise<Role>;

  // Instance methods
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  async setPassword(password: string): Promise<void> {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
    this.password = await bcrypt.hash(password, rounds);
  }

  getFullName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.firstName || this.lastName || this.username;
  }

  toJSON(): any {
    const values = { ...this.get() };
    const result: any = { ...values };
    if ('password' in result) {
      delete result.password;
    }
    return result;
  }

  // Static methods
  static associate(models: any): void {
    User.belongsToMany(models.Role, {
      through: models.UserRole,
      as: 'roles',
      foreignKey: 'userId',
      otherKey: 'roleId',
      sourceKey: 'id',
      targetKey: 'id',
    });

    User.hasMany(models.RefreshToken, {
      as: 'refreshTokens',
      foreignKey: 'userId',
      sourceKey: 'id',
    });

    User.hasMany(models.AuditLog, {
      as: 'auditLogs',
      foreignKey: 'userId',
      sourceKey: 'id',
    });
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        isAlphanumericWithUnderscore(value: string) {
          if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            throw new Error('Username can only contain letters, numbers, and underscores');
          }
        },
      },
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    isSuperuser: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
    },
    updatedAt: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    indexes: [
      { fields: ['username'] },
      { fields: ['email'] },
      { fields: ['isActive'] },
      { fields: ['createdAt'] },
    ],
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          await user.setPassword(user.password);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          await user.setPassword(user.password);
        }
      },
    },
  }
);