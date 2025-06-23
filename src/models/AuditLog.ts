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

export interface AuditDetails {
  [key: string]: any;
}

export class AuditLog extends Model<
  InferAttributes<AuditLog>,
  InferCreationAttributes<AuditLog>
> {
  declare id: CreationOptional<string>;
  declare userId: ForeignKey<User['id']> | null;
  declare action: string;
  declare resource: string | null;
  declare resourceId: string | null;
  declare ipAddress: string | null;
  declare userAgent: string | null;
  declare details: AuditDetails | null;
  declare createdAt: CreationOptional<Date>;

  // Associations
  declare user?: NonAttribute<User>;

  declare static associations: {
    user: Association<AuditLog, User>;
  };

  // Static methods
  static associate(models: any): void {
    AuditLog.belongsTo(models.User, {
      as: 'user',
      foreignKey: 'userId',
    });
  }

  static async log(data: {
    userId?: string | null;
    action: string;
    resource?: string | null;
    resourceId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    details?: AuditDetails | null;
  }): Promise<AuditLog> {
    return AuditLog.create({
      userId: data.userId || null,
      action: data.action,
      resource: data.resource || null,
      resourceId: data.resourceId || null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      details: data.details || null,
    });
  }

  static async logAuth(data: {
    userId?: string | null;
    action: 'login' | 'logout' | 'register' | 'password_reset' | 'token_refresh';
    success: boolean;
    ipAddress?: string | null;
    userAgent?: string | null;
    details?: AuditDetails;
  }): Promise<AuditLog> {
    return AuditLog.log({
      userId: data.userId,
      action: `auth:${data.action}`,
      resource: 'auth',
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      details: {
        success: data.success,
        ...data.details,
      },
    });
  }

  static async logPermissionChange(data: {
    userId: string;
    action: 'grant' | 'revoke';
    targetUserId?: string;
    roleId?: string;
    permissionId?: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<AuditLog> {
    const details: AuditDetails = {};
    if (data.targetUserId) details.targetUserId = data.targetUserId;
    if (data.roleId) details.roleId = data.roleId;
    if (data.permissionId) details.permissionId = data.permissionId;

    return AuditLog.log({
      userId: data.userId,
      action: `permission:${data.action}`,
      resource: 'permission',
      resourceId: data.targetUserId || data.roleId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      details,
    });
  }
}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    resource: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    resourceId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      validate: {
        isIP: true,
      },
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    timestamps: false,
    indexes: [
      { fields: ['userId'] },
      { fields: ['action'] },
      { fields: ['resource', 'resourceId'] },
      { fields: ['createdAt'] },
    ],
  }
);