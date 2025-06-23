import { Op, WhereOptions, Order, Transaction } from 'sequelize';
import { AuditLog, AuditDetails } from '../models/AuditLog';
import { User } from '../models/User';
import { ApiError } from '../utils/api-error';
import { logger } from '../utils/logger';

export interface AuditFilter {
  userId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  resource: string | null;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  details: AuditDetails | null;
  createdAt: Date;
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export interface AuditStatistics {
  totalLogs: number;
  byAction: Record<string, number>;
  byResource: Record<string, number>;
  byUser: Array<{
    userId: string;
    email: string;
    username: string;
    count: number;
  }>;
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
}

export class AuditService {
  /**
   * Log a generic audit event
   */
  static async log(data: {
    userId?: string | null;
    action: string;
    resource?: string | null;
    resourceId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    details?: AuditDetails | null;
  }, transaction?: Transaction): Promise<AuditLog> {
    try {
      const auditLog = await AuditLog.create({
        userId: data.userId || null,
        action: data.action,
        resource: data.resource || null,
        resourceId: data.resourceId || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        details: data.details || null,
      }, { transaction });

      logger.debug(`Audit log created: ${data.action} on ${data.resource || 'system'}`);
      return auditLog;
    } catch (error) {
      logger.error('Failed to create audit log:', error);
      throw error;
    }
  }

  /**
   * Log authentication events
   */
  static async logAuth(data: {
    userId?: string | null;
    action: 'login' | 'logout' | 'register' | 'password_reset' | 'token_refresh' | 'failed_login';
    success: boolean;
    email?: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    details?: AuditDetails;
  }, transaction?: Transaction): Promise<AuditLog> {
    const details: AuditDetails = {
      success: data.success,
      ...data.details,
    };

    if (data.email) {
      details.email = data.email;
    }

    return this.log({
      userId: data.userId,
      action: `auth:${data.action}`,
      resource: 'auth',
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      details,
    }, transaction);
  }

  /**
   * Log user management events
   */
  static async logUserManagement(data: {
    userId: string;
    action: 'create' | 'update' | 'delete' | 'restore' | 'activate' | 'deactivate' | 'password_reset';
    targetUserId: string;
    changes?: Record<string, any>;
    ipAddress?: string | null;
    userAgent?: string | null;
  }, transaction?: Transaction): Promise<AuditLog> {
    const details: AuditDetails = {
      targetUserId: data.targetUserId,
    };

    if (data.changes) {
      details.changes = data.changes;
    }

    return this.log({
      userId: data.userId,
      action: `user:${data.action}`,
      resource: 'user',
      resourceId: data.targetUserId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      details,
    }, transaction);
  }

  /**
   * Log role management events
   */
  static async logRoleManagement(data: {
    userId: string;
    action: 'create' | 'update' | 'delete' | 'assign' | 'revoke';
    roleId?: string;
    roleName?: string;
    targetUserId?: string;
    changes?: Record<string, any>;
    ipAddress?: string | null;
    userAgent?: string | null;
  }, transaction?: Transaction): Promise<AuditLog> {
    const details: AuditDetails = {};

    if (data.roleId) details.roleId = data.roleId;
    if (data.roleName) details.roleName = data.roleName;
    if (data.targetUserId) details.targetUserId = data.targetUserId;
    if (data.changes) details.changes = data.changes;

    return this.log({
      userId: data.userId,
      action: `role:${data.action}`,
      resource: 'role',
      resourceId: data.roleId || data.targetUserId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      details,
    }, transaction);
  }

  /**
   * Log permission management events
   */
  static async logPermissionManagement(data: {
    userId: string;
    action: 'create' | 'update' | 'delete' | 'grant' | 'revoke';
    permissionId?: string;
    permissionName?: string;
    targetId?: string; // roleId or userId
    targetType?: 'role' | 'user';
    changes?: Record<string, any>;
    ipAddress?: string | null;
    userAgent?: string | null;
  }, transaction?: Transaction): Promise<AuditLog> {
    const details: AuditDetails = {};

    if (data.permissionId) details.permissionId = data.permissionId;
    if (data.permissionName) details.permissionName = data.permissionName;
    if (data.targetId) details.targetId = data.targetId;
    if (data.targetType) details.targetType = data.targetType;
    if (data.changes) details.changes = data.changes;

    return this.log({
      userId: data.userId,
      action: `permission:${data.action}`,
      resource: 'permission',
      resourceId: data.permissionId || data.targetId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      details,
    }, transaction);
  }

  /**
   * Log data access events
   */
  static async logDataAccess(data: {
    userId: string;
    action: 'view' | 'export' | 'download';
    resource: string;
    resourceId?: string;
    dataType?: string;
    recordCount?: number;
    ipAddress?: string | null;
    userAgent?: string | null;
  }, transaction?: Transaction): Promise<AuditLog> {
    const details: AuditDetails = {};

    if (data.dataType) details.dataType = data.dataType;
    if (data.recordCount !== undefined) details.recordCount = data.recordCount;

    return this.log({
      userId: data.userId,
      action: `data:${data.action}`,
      resource: data.resource,
      resourceId: data.resourceId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      details,
    }, transaction);
  }

  /**
   * Log system events
   */
  static async logSystem(data: {
    action: 'startup' | 'shutdown' | 'config_change' | 'error' | 'maintenance';
    details: AuditDetails;
    userId?: string | null;
  }, transaction?: Transaction): Promise<AuditLog> {
    return this.log({
      userId: data.userId,
      action: `system:${data.action}`,
      resource: 'system',
      details: data.details,
    }, transaction);
  }

  /**
   * Get audit logs with filtering and pagination
   */
  static async getAuditLogs(
    filter: AuditFilter = {},
    pagination: PaginationOptions = { page: 1, limit: 50 }
  ): Promise<{ logs: AuditLogEntry[]; total: number }> {
    try {
      const { page = 1, limit = 50 } = pagination;
      const offset = (page - 1) * limit;

      // Build where clause
      const where: WhereOptions<AuditLog> = {};

      if (filter.userId) {
        where.userId = filter.userId;
      }

      if (filter.action) {
        where.action = { [Op.like]: `%${filter.action}%` };
      }

      if (filter.resource) {
        where.resource = filter.resource;
      }

      if (filter.resourceId) {
        where.resourceId = filter.resourceId;
      }

      if (filter.ipAddress) {
        where.ipAddress = filter.ipAddress;
      }

      if (filter.startDate || filter.endDate) {
        where.createdAt = {};
        if (filter.startDate) {
          (where.createdAt as any)[Op.gte] = filter.startDate;
        }
        if (filter.endDate) {
          (where.createdAt as any)[Op.lte] = filter.endDate;
        }
      }

      // Build order
      const order: Order = [['createdAt', 'DESC']];

      // Query with user info
      const { count, rows } = await AuditLog.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'username'],
            required: false,
          },
        ],
        limit,
        offset,
        order,
      });

      logger.info(`Retrieved ${rows.length} audit logs (total: ${count})`);
      return {
        logs: rows as unknown as AuditLogEntry[],
        total: count,
      };
    } catch (error) {
      logger.error('Failed to get audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit log by ID
   */
  static async getAuditLogById(id: string): Promise<AuditLogEntry> {
    try {
      const auditLog = await AuditLog.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'username'],
          },
        ],
      });

      if (!auditLog) {
        throw new ApiError(404, 'Audit log not found');
      }

      return auditLog as unknown as AuditLogEntry;
    } catch (error) {
      logger.error(`Failed to get audit log ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get user activity logs
   */
  static async getUserActivity(
    userId: string,
    limit: number = 50
  ): Promise<AuditLogEntry[]> {
    try {
      const logs = await AuditLog.findAll({
        where: { userId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'username'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit,
      });

      return logs as unknown as AuditLogEntry[];
    } catch (error) {
      logger.error(`Failed to get user activity for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get resource history
   */
  static async getResourceHistory(
    resource: string,
    resourceId: string,
    limit: number = 50
  ): Promise<AuditLogEntry[]> {
    try {
      const logs = await AuditLog.findAll({
        where: { resource, resourceId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'username'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit,
      });

      return logs as unknown as AuditLogEntry[];
    } catch (error) {
      logger.error(`Failed to get resource history for ${resource}/${resourceId}:`, error);
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  static async getAuditStatistics(
    startDate?: Date,
    endDate?: Date
  ): Promise<AuditStatistics> {
    try {
      const where: WhereOptions<AuditLog> = {};
      
      if (startDate || endDate) {
        const dateFilter: any = {};
        if (startDate) {
          dateFilter[Op.gte] = startDate;
        }
        if (endDate) {
          dateFilter[Op.lte] = endDate;
        }
        where.createdAt = dateFilter;
      }

      // Get total count
      const totalLogs = await AuditLog.count({ where });

      // Get counts by action
      const actionCounts = await AuditLog.findAll({
        where,
        attributes: [
          'action',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        group: ['action'],
        raw: true,
      }) as any[];

      const byAction: Record<string, number> = {};
      actionCounts.forEach(item => {
        byAction[item.action] = parseInt(item.count);
      });

      // Get counts by resource
      const resourceCounts = await AuditLog.findAll({
        where: {
          ...where,
          resource: { [Op.ne]: null },
        },
        attributes: [
          'resource',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        group: ['resource'],
        raw: true,
      }) as any[];

      const byResource: Record<string, number> = {};
      resourceCounts.forEach(item => {
        if (item.resource) {
          byResource[item.resource] = parseInt(item.count);
        }
      });

      // Get top users by activity
      const userActivity = await AuditLog.findAll({
        where: {
          ...where,
          userId: { [Op.ne]: null },
        },
        attributes: [
          'userId',
          [sequelize.fn('COUNT', sequelize.col('AuditLog.id')), 'count'],
        ],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['email', 'username'],
          },
        ],
        group: ['userId', 'user.id', 'user.email', 'user.username'],
        order: [[sequelize.fn('COUNT', sequelize.col('AuditLog.id')), 'DESC']],
        limit: 10,
        raw: false,
      });

      const byUser = userActivity.map(item => ({
        userId: item.userId!,
        email: item.user?.email || '',
        username: item.user?.username || '',
        count: parseInt(item.get('count') as string),
      }));

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentLogs = await AuditLog.findAll({
        where: {
          createdAt: { [Op.gte]: sevenDaysAgo },
        },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'DESC']],
        raw: true,
      }) as any[];

      const recentActivity = recentLogs.map(item => ({
        date: item.date,
        count: parseInt(item.count),
      }));

      return {
        totalLogs,
        byAction,
        byResource,
        byUser,
        recentActivity,
      };
    } catch (error) {
      logger.error('Failed to get audit statistics:', error);
      throw error;
    }
  }

  /**
   * Clean up old audit logs
   */
  static async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const deletedCount = await AuditLog.destroy({
        where: {
          createdAt: { [Op.lt]: cutoffDate },
        },
      });

      logger.info(`Cleaned up ${deletedCount} audit logs older than ${daysToKeep} days`);
      
      // Log the cleanup action
      await this.logSystem({
        action: 'maintenance',
        details: {
          operation: 'audit_cleanup',
          daysToKeep,
          deletedCount,
          cutoffDate: cutoffDate.toISOString(),
        },
      });

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old audit logs:', error);
      throw error;
    }
  }

  /**
   * Search audit logs
   */
  static async searchLogs(
    searchTerm: string,
    pagination: PaginationOptions = { page: 1, limit: 50 }
  ): Promise<{ logs: AuditLogEntry[]; total: number }> {
    try {
      const { page = 1, limit = 50 } = pagination;
      const offset = (page - 1) * limit;

      const where: WhereOptions<AuditLog> = {
        [Op.or]: [
          { action: { [Op.like]: `%${searchTerm}%` } },
          { resource: { [Op.like]: `%${searchTerm}%` } },
          { resourceId: { [Op.like]: `%${searchTerm}%` } },
          { ipAddress: { [Op.like]: `%${searchTerm}%` } },
          sequelize.where(
            sequelize.cast(sequelize.col('details'), 'CHAR'),
            { [Op.like]: `%${searchTerm}%` }
          ),
        ],
      };

      const { count, rows } = await AuditLog.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'username'],
            required: false,
          },
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });

      return {
        logs: rows as unknown as AuditLogEntry[],
        total: count,
      };
    } catch (error) {
      logger.error('Failed to search audit logs:', error);
      throw error;
    }
  }
}

// Import sequelize at the end to avoid circular dependency
import { sequelize } from '../config/database';