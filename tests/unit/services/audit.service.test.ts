import { AuditService } from '../../../src/services/audit.service';
import { AuditLog } from '../../../src/models/AuditLog';
import { User } from '../../../src/models/User';
import { ApiError } from '../../../src/utils/api-error';
import { sequelize } from '../../../src/config/database';
import { Op } from 'sequelize';

// Mock dependencies
jest.mock('../../../src/models/AuditLog');
jest.mock('../../../src/models/User');
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/config/database', () => ({
  sequelize: {
    fn: jest.fn(),
    col: jest.fn(),
    cast: jest.fn(),
    where: jest.fn(),
  },
}));

describe('AuditService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should create a new audit log entry', async () => {
      const mockData = {
        userId: 'user123',
        action: 'user:login',
        resource: 'auth',
        resourceId: 'session123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        details: { success: true },
      };

      const mockAuditLog = {
        id: 'audit123',
        ...mockData,
        createdAt: new Date(),
      };

      (AuditLog.create as jest.Mock).mockResolvedValue(mockAuditLog);

      const result = await AuditService.log(mockData);

      expect(AuditLog.create).toHaveBeenCalledWith(
        {
          userId: mockData.userId,
          action: mockData.action,
          resource: mockData.resource,
          resourceId: mockData.resourceId,
          ipAddress: mockData.ipAddress,
          userAgent: mockData.userAgent,
          details: mockData.details,
        },
        { transaction: undefined }
      );
      expect(result).toEqual(mockAuditLog);
    });

    it('should handle null values correctly', async () => {
      const mockData = {
        action: 'system:startup',
      };

      const mockAuditLog = {
        id: 'audit123',
        userId: null,
        action: mockData.action,
        resource: null,
        resourceId: null,
        ipAddress: null,
        userAgent: null,
        details: null,
        createdAt: new Date(),
      };

      (AuditLog.create as jest.Mock).mockResolvedValue(mockAuditLog);

      const result = await AuditService.log(mockData);

      expect(AuditLog.create).toHaveBeenCalledWith(
        {
          userId: null,
          action: mockData.action,
          resource: null,
          resourceId: null,
          ipAddress: null,
          userAgent: null,
          details: null,
        },
        { transaction: undefined }
      );
      expect(result).toEqual(mockAuditLog);
    });

    it('should pass transaction if provided', async () => {
      const mockTransaction = {} as any;
      const mockData = { action: 'test' };

      await AuditService.log(mockData, mockTransaction);

      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.any(Object),
        { transaction: mockTransaction }
      );
    });
  });

  describe('logAuth', () => {
    it('should log authentication events with success status', async () => {
      const mockData = {
        userId: 'user123',
        action: 'login' as const,
        success: true,
        email: 'test@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      const mockAuditLog = { id: 'audit123' };
      (AuditLog.create as jest.Mock).mockResolvedValue(mockAuditLog);

      const result = await AuditService.logAuth(mockData);

      expect(AuditLog.create).toHaveBeenCalledWith(
        {
          userId: mockData.userId,
          action: 'auth:login',
          resource: 'auth',
          resourceId: null,
          ipAddress: mockData.ipAddress,
          userAgent: mockData.userAgent,
          details: {
            success: true,
            email: mockData.email,
          },
        },
        { transaction: undefined }
      );
      expect(result).toEqual(mockAuditLog);
    });

    it('should merge additional details', async () => {
      const mockData = {
        action: 'failed_login' as const,
        success: false,
        details: { reason: 'Invalid password' },
      };

      await AuditService.logAuth(mockData);

      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          details: {
            success: false,
            reason: 'Invalid password',
          },
        }),
        expect.any(Object)
      );
    });
  });

  describe('logUserManagement', () => {
    it('should log user management events', async () => {
      const mockData = {
        userId: 'admin123',
        action: 'update' as const,
        targetUserId: 'user456',
        changes: { email: 'newemail@example.com' },
        ipAddress: '192.168.1.1',
      };

      const mockAuditLog = { id: 'audit123' };
      (AuditLog.create as jest.Mock).mockResolvedValue(mockAuditLog);

      const result = await AuditService.logUserManagement(mockData);

      expect(AuditLog.create).toHaveBeenCalledWith(
        {
          userId: mockData.userId,
          action: 'user:update',
          resource: 'user',
          resourceId: mockData.targetUserId,
          ipAddress: mockData.ipAddress,
          userAgent: null,
          details: {
            targetUserId: mockData.targetUserId,
            changes: mockData.changes,
          },
        },
        { transaction: undefined }
      );
      expect(result).toEqual(mockAuditLog);
    });
  });

  describe('logRoleManagement', () => {
    it('should log role management events', async () => {
      const mockData = {
        userId: 'admin123',
        action: 'assign' as const,
        roleId: 'role123',
        roleName: 'Administrator',
        targetUserId: 'user456',
        ipAddress: '192.168.1.1',
      };

      const mockAuditLog = { id: 'audit123' };
      (AuditLog.create as jest.Mock).mockResolvedValue(mockAuditLog);

      const result = await AuditService.logRoleManagement(mockData);

      expect(AuditLog.create).toHaveBeenCalledWith(
        {
          userId: mockData.userId,
          action: 'role:assign',
          resource: 'role',
          resourceId: mockData.roleId,
          ipAddress: mockData.ipAddress,
          userAgent: null,
          details: {
            roleId: mockData.roleId,
            roleName: mockData.roleName,
            targetUserId: mockData.targetUserId,
          },
        },
        { transaction: undefined }
      );
      expect(result).toEqual(mockAuditLog);
    });
  });

  describe('logPermissionManagement', () => {
    it('should log permission management events', async () => {
      const mockData = {
        userId: 'admin123',
        action: 'grant' as const,
        permissionId: 'perm123',
        permissionName: 'user.create',
        targetId: 'role456',
        targetType: 'role' as const,
        ipAddress: '192.168.1.1',
      };

      const mockAuditLog = { id: 'audit123' };
      (AuditLog.create as jest.Mock).mockResolvedValue(mockAuditLog);

      const result = await AuditService.logPermissionManagement(mockData);

      expect(AuditLog.create).toHaveBeenCalledWith(
        {
          userId: mockData.userId,
          action: 'permission:grant',
          resource: 'permission',
          resourceId: mockData.permissionId,
          ipAddress: mockData.ipAddress,
          userAgent: null,
          details: {
            permissionId: mockData.permissionId,
            permissionName: mockData.permissionName,
            targetId: mockData.targetId,
            targetType: mockData.targetType,
          },
        },
        { transaction: undefined }
      );
      expect(result).toEqual(mockAuditLog);
    });
  });

  describe('logDataAccess', () => {
    it('should log data access events', async () => {
      const mockData = {
        userId: 'user123',
        action: 'export' as const,
        resource: 'users',
        dataType: 'csv',
        recordCount: 100,
        ipAddress: '192.168.1.1',
      };

      const mockAuditLog = { id: 'audit123' };
      (AuditLog.create as jest.Mock).mockResolvedValue(mockAuditLog);

      const result = await AuditService.logDataAccess(mockData);

      expect(AuditLog.create).toHaveBeenCalledWith(
        {
          userId: mockData.userId,
          action: 'data:export',
          resource: mockData.resource,
          resourceId: null,
          ipAddress: mockData.ipAddress,
          userAgent: null,
          details: {
            dataType: mockData.dataType,
            recordCount: mockData.recordCount,
          },
        },
        { transaction: undefined }
      );
      expect(result).toEqual(mockAuditLog);
    });
  });

  describe('logSystem', () => {
    it('should log system events', async () => {
      const mockData = {
        action: 'startup' as const,
        details: { version: '1.0.0', environment: 'production' },
        userId: 'system',
      };

      const mockAuditLog = { id: 'audit123' };
      (AuditLog.create as jest.Mock).mockResolvedValue(mockAuditLog);

      const result = await AuditService.logSystem(mockData);

      expect(AuditLog.create).toHaveBeenCalledWith(
        {
          userId: mockData.userId,
          action: 'system:startup',
          resource: 'system',
          resourceId: null,
          ipAddress: null,
          userAgent: null,
          details: mockData.details,
        },
        { transaction: undefined }
      );
      expect(result).toEqual(mockAuditLog);
    });
  });

  describe('getAuditLogs', () => {
    it('should retrieve audit logs with pagination', async () => {
      const mockLogs = [
        {
          id: 'audit1',
          userId: 'user123',
          action: 'user:login',
          createdAt: new Date(),
          user: { id: 'user123', email: 'test@example.com', username: 'testuser' },
        },
        {
          id: 'audit2',
          userId: 'user456',
          action: 'user:logout',
          createdAt: new Date(),
          user: { id: 'user456', email: 'test2@example.com', username: 'testuser2' },
        },
      ];

      (AuditLog.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 2,
        rows: mockLogs,
      });

      const result = await AuditService.getAuditLogs(
        {},
        { page: 1, limit: 10 }
      );

      expect(AuditLog.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'username'],
            required: false,
          },
        ],
        limit: 10,
        offset: 0,
        order: [['createdAt', 'DESC']],
      });
      expect(result).toEqual({
        logs: mockLogs,
        total: 2,
      });
    });

    it('should apply filters correctly', async () => {
      const filter = {
        userId: 'user123',
        action: 'login',
        resource: 'auth',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
      };

      (AuditLog.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 0,
        rows: [],
      });

      await AuditService.getAuditLogs(filter);

      expect(AuditLog.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: filter.userId,
            action: { [Op.like]: '%login%' },
            resource: filter.resource,
            createdAt: {
              [Op.gte]: filter.startDate,
              [Op.lte]: filter.endDate,
            },
          },
        })
      );
    });
  });

  describe('getAuditLogById', () => {
    it('should retrieve a specific audit log', async () => {
      const mockLog = {
        id: 'audit123',
        userId: 'user123',
        action: 'user:login',
        user: { id: 'user123', email: 'test@example.com', username: 'testuser' },
      };

      (AuditLog.findByPk as jest.Mock).mockResolvedValue(mockLog);

      const result = await AuditService.getAuditLogById('audit123');

      expect(AuditLog.findByPk).toHaveBeenCalledWith('audit123', {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'username'],
          },
        ],
      });
      expect(result).toEqual(mockLog);
    });

    it('should throw 404 if audit log not found', async () => {
      (AuditLog.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(
        AuditService.getAuditLogById('nonexistent')
      ).rejects.toThrow(new ApiError(404, 'Audit log not found'));
    });
  });

  describe('getUserActivity', () => {
    it('should retrieve user activity logs', async () => {
      const mockLogs = [
        {
          id: 'audit1',
          userId: 'user123',
          action: 'user:login',
          createdAt: new Date(),
        },
        {
          id: 'audit2',
          userId: 'user123',
          action: 'user:update',
          createdAt: new Date(),
        },
      ];

      (AuditLog.findAll as jest.Mock).mockResolvedValue(mockLogs);

      const result = await AuditService.getUserActivity('user123', 20);

      expect(AuditLog.findAll).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'username'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: 20,
      });
      expect(result).toEqual(mockLogs);
    });
  });

  describe('getResourceHistory', () => {
    it('should retrieve resource history', async () => {
      const mockLogs = [
        {
          id: 'audit1',
          resource: 'user',
          resourceId: 'user123',
          action: 'user:create',
        },
        {
          id: 'audit2',
          resource: 'user',
          resourceId: 'user123',
          action: 'user:update',
        },
      ];

      (AuditLog.findAll as jest.Mock).mockResolvedValue(mockLogs);

      const result = await AuditService.getResourceHistory('user', 'user123', 30);

      expect(AuditLog.findAll).toHaveBeenCalledWith({
        where: { resource: 'user', resourceId: 'user123' },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'username'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: 30,
      });
      expect(result).toEqual(mockLogs);
    });
  });

  describe('getAuditStatistics', () => {
    it('should retrieve audit statistics', async () => {
      // Mock total count
      (AuditLog.count as jest.Mock).mockResolvedValue(100);

      // Mock action counts
      (AuditLog.findAll as jest.Mock)
        .mockResolvedValueOnce([
          { action: 'user:login', count: '50' },
          { action: 'user:logout', count: '30' },
        ])
        // Mock resource counts
        .mockResolvedValueOnce([
          { resource: 'user', count: '60' },
          { resource: 'role', count: '20' },
        ])
        // Mock user activity
        .mockResolvedValueOnce([
          {
            userId: 'user123',
            get: jest.fn().mockReturnValue('40'),
            user: { email: 'test@example.com', username: 'testuser' },
          },
        ])
        // Mock recent activity
        .mockResolvedValueOnce([
          { date: '2023-12-01', count: '10' },
          { date: '2023-12-02', count: '15' },
        ]);

      const result = await AuditService.getAuditStatistics();

      expect(result).toEqual({
        totalLogs: 100,
        byAction: {
          'user:login': 50,
          'user:logout': 30,
        },
        byResource: {
          user: 60,
          role: 20,
        },
        byUser: [
          {
            userId: 'user123',
            email: 'test@example.com',
            username: 'testuser',
            count: 40,
          },
        ],
        recentActivity: [
          { date: '2023-12-01', count: 10 },
          { date: '2023-12-02', count: 15 },
        ],
      });
    });
  });

  describe('cleanupOldLogs', () => {
    it('should delete old audit logs', async () => {
      const daysToKeep = 90;
      const deletedCount = 50;

      (AuditLog.destroy as jest.Mock).mockResolvedValue(deletedCount);
      (AuditLog.create as jest.Mock).mockResolvedValue({});

      const result = await AuditService.cleanupOldLogs(daysToKeep);

      expect(AuditLog.destroy).toHaveBeenCalledWith({
        where: {
          createdAt: { [Op.lt]: expect.any(Date) },
        },
      });
      expect(result).toBe(deletedCount);

      // Verify system log was created
      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'system:maintenance',
          resource: 'system',
          details: expect.objectContaining({
            operation: 'audit_cleanup',
            daysToKeep,
            deletedCount,
          }),
        }),
        expect.any(Object)
      );
    });
  });

  describe('searchLogs', () => {
    it('should search audit logs', async () => {
      const searchTerm = 'login';
      const mockLogs = [
        {
          id: 'audit1',
          action: 'user:login',
          createdAt: new Date(),
        },
        {
          id: 'audit2',
          action: 'auth:login',
          createdAt: new Date(),
        },
      ];

      (AuditLog.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 2,
        rows: mockLogs,
      });

      const result = await AuditService.searchLogs(searchTerm);

      expect(AuditLog.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            [Op.or]: expect.arrayContaining([
              { action: { [Op.like]: '%login%' } },
              { resource: { [Op.like]: '%login%' } },
              { resourceId: { [Op.like]: '%login%' } },
              { ipAddress: { [Op.like]: '%login%' } },
            ]),
          },
        })
      );
      expect(result).toEqual({
        logs: mockLogs,
        total: 2,
      });
    });
  });
});