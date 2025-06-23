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
import crypto from 'crypto';

export class RefreshToken extends Model<
  InferAttributes<RefreshToken>,
  InferCreationAttributes<RefreshToken>
> {
  declare id: CreationOptional<string>;
  declare userId: ForeignKey<User['id']>;
  declare token: string;
  declare expiresAt: Date;
  declare ipAddress: CreationOptional<string | null>;
  declare userAgent: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;

  // Associations
  declare user?: NonAttribute<User>;

  declare static associations: {
    user: Association<RefreshToken, User>;
  };

  // Static methods
  static associate(models: any): void {
    RefreshToken.belongsTo(models.User, {
      as: 'user',
      foreignKey: 'userId',
    });
  }

  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static calculateExpiry(): Date {
    const expiry = process.env.REFRESH_TOKEN_EXPIRY || '7d';
    const match = expiry.match(/^(\d+)([hdwmy])$/);
    
    if (!match) {
      throw new Error('Invalid refresh token expiry format');
    }

    const value = parseInt(match[1]);
    const unit = match[2];
    const now = new Date();

    switch (unit) {
      case 'h': // hours
        now.setHours(now.getHours() + value);
        break;
      case 'd': // days
        now.setDate(now.getDate() + value);
        break;
      case 'w': // weeks
        now.setDate(now.getDate() + value * 7);
        break;
      case 'm': // months
        now.setMonth(now.getMonth() + value);
        break;
      case 'y': // years
        now.setFullYear(now.getFullYear() + value);
        break;
    }

    return now;
  }

  // Instance methods
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  async revoke(): Promise<void> {
    await this.destroy();
  }
}

RefreshToken.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    token: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    ipAddress: {
      type: DataTypes.STRING(45), // Supports IPv6
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'RefreshToken',
    tableName: 'refresh_tokens',
    timestamps: false,
    indexes: [
      { fields: ['token'] },
      { fields: ['userId'] },
      { fields: ['expiresAt'] },
    ],
    hooks: {
      beforeCreate: (token: RefreshToken) => {
        if (!token.token) {
          token.token = RefreshToken.generateToken();
        }
        if (!token.expiresAt) {
          token.expiresAt = RefreshToken.calculateExpiry();
        }
        if (!token.createdAt) {
          token.createdAt = new Date();
        }
      },
    },
  }
);