import { Request, Response, NextFunction } from 'express';
import { UserController } from '../../../src/controllers/user.controller';
import { UserService } from '../../../src/services/user.service';
import { ApiResponse } from '../../../src/utils/response';
import { ApiError } from '../../../src/utils/api-error';
import { sequelize } from '../../../src/config/database';

// Mock dependencies
jest.mock('../../../src/services/user.service');
jest.mock('../../../src/config/database', () => ({
  sequelize: {
    transaction: jest.fn()
  }
}));
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('UserController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockTransaction: any;

  beforeEach(() => {
    mockRequest = {
      params: {},
      query: {},
      body: {},
      user: { id: 'test-admin-id' }
    };

    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn()
    };

    (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should get all users with default pagination', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@example.com', username: 'user1' },
        { id: '2', email: 'user2@example.com', username: 'user2' }
      ];

      (UserService.getAllUsers as jest.Mock).mockResolvedValue({
        users: mockUsers,
        total: 2
      });

      await UserController.getAllUsers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(UserService.getAllUsers).toHaveBeenCalledWith(
        {
          search: undefined,
          isActive: undefined,
          roleIds: undefined,
          sortBy: undefined,
          sortOrder: undefined
        },
        { page: 1, limit: 10 }
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        ApiResponse.success(
          {
            data: mockUsers,
            pagination: {
              page: 1,
              limit: 10,
              total: 2,
              totalPages: 1,
              hasNext: false,
              hasPrev: false
            }
          },
          'Users retrieved successfully'
        )
      );
    });

    it('should get users with filters and custom pagination', async () => {
      mockRequest.query = {
        page: '2',
        limit: '20',
        search: 'john',
        isActive: 'true',
        roleIds: '1,2,3',
        sortBy: 'email',
        sortOrder: 'desc'
      };

      const mockUsers = [{ id: '1', email: 'john@example.com' }];

      (UserService.getAllUsers as jest.Mock).mockResolvedValue({
        users: mockUsers,
        total: 21
      });

      await UserController.getAllUsers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(UserService.getAllUsers).toHaveBeenCalledWith(
        {
          search: 'john',
          isActive: true,
          roleIds: [1, 2, 3],
          sortBy: 'email',
          sortOrder: 'desc'
        },
        { page: 2, limit: 20 }
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        ApiResponse.success(
          {
            data: mockUsers,
            pagination: {
              page: 2,
              limit: 20,
              total: 21,
              totalPages: 2,
              hasNext: false,
              hasPrev: true
            }
          },
          'Users retrieved successfully'
        )
      );
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      (UserService.getAllUsers as jest.Mock).mockRejectedValue(error);

      await UserController.getAllUsers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getUserById', () => {
    it('should get user by ID', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'user@example.com',
        username: 'testuser',
        roles: [{ id: 1, name: 'user' }]
      };

      mockRequest.params = { userId: 'user-id' };
      (UserService.getUserById as jest.Mock).mockResolvedValue(mockUser);

      await UserController.getUserById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(UserService.getUserById).toHaveBeenCalledWith('user-id');
      expect(mockResponse.json).toHaveBeenCalledWith(
        ApiResponse.success(mockUser, 'User retrieved successfully')
      );
    });

    it('should handle user not found', async () => {
      mockRequest.params = { userId: 'invalid-id' };
      const error = new ApiError(404, 'User not found');
      (UserService.getUserById as jest.Mock).mockRejectedValue(error);

      await UserController.getUserById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const createData = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'Test@1234',
        firstName: 'New',
        lastName: 'User',
        roleIds: [1]
      };

      const mockUser = {
        id: 'new-user-id',
        ...createData,
        password: undefined,
        createdAt: new Date()
      };

      mockRequest.body = createData;
      (UserService.createUser as jest.Mock).mockResolvedValue(mockUser);

      await UserController.createUser(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(sequelize.transaction).toHaveBeenCalled();
      expect(UserService.createUser).toHaveBeenCalledWith(
        { ...createData, createdBy: 'test-admin-id' },
        mockTransaction
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        ApiResponse.success(mockUser, 'User created successfully')
      );
    });

    it('should rollback transaction on error', async () => {
      mockRequest.body = { email: 'test@example.com' };
      const error = new ApiError(409, 'User already exists');
      (UserService.createUser as jest.Mock).mockRejectedValue(error);

      await UserController.createUser(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateUser', () => {
    it('should update user', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        isActive: false
      };

      const mockUser = {
        id: 'user-id',
        email: 'user@example.com',
        ...updateData
      };

      mockRequest.params = { userId: 'user-id' };
      mockRequest.body = updateData;
      (UserService.updateUser as jest.Mock).mockResolvedValue(mockUser);

      await UserController.updateUser(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(sequelize.transaction).toHaveBeenCalled();
      expect(UserService.updateUser).toHaveBeenCalledWith(
        'user-id',
        updateData,
        'test-admin-id',
        mockTransaction
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        ApiResponse.success(mockUser, 'User updated successfully')
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      mockRequest.params = { userId: 'user-id' };
      (UserService.deleteUser as jest.Mock).mockResolvedValue(undefined);

      await UserController.deleteUser(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(sequelize.transaction).toHaveBeenCalled();
      expect(UserService.deleteUser).toHaveBeenCalledWith(
        'user-id',
        'test-admin-id',
        mockTransaction
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        ApiResponse.success(null, 'User deleted successfully')
      );
    });
  });

  describe('restoreUser', () => {
    it('should restore deleted user', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'restored@example.com',
        isActive: true
      };

      mockRequest.params = { userId: 'user-id' };
      (UserService.restoreUser as jest.Mock).mockResolvedValue(mockUser);

      await UserController.restoreUser(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(sequelize.transaction).toHaveBeenCalled();
      expect(UserService.restoreUser).toHaveBeenCalledWith(
        'user-id',
        'test-admin-id',
        mockTransaction
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        ApiResponse.success(mockUser, 'User restored successfully')
      );
    });
  });

  describe('updateUserRoles', () => {
    it('should update user roles', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'user@example.com',
        roles: [{ id: 2, name: 'admin' }]
      };

      mockRequest.params = { userId: 'user-id' };
      mockRequest.body = { roleIds: [2] };
      (UserService.updateUserRoles as jest.Mock).mockResolvedValue(mockUser);

      await UserController.updateUserRoles(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(sequelize.transaction).toHaveBeenCalled();
      expect(UserService.updateUserRoles).toHaveBeenCalledWith(
        'user-id',
        [2],
        'test-admin-id',
        mockTransaction
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        ApiResponse.success(mockUser, 'User roles updated successfully')
      );
    });
  });

  describe('resetUserPassword', () => {
    it('should reset user password', async () => {
      mockRequest.params = { userId: 'user-id' };
      mockRequest.body = { newPassword: 'NewPassword@123' };
      (UserService.resetUserPassword as jest.Mock).mockResolvedValue(undefined);

      await UserController.resetUserPassword(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(sequelize.transaction).toHaveBeenCalled();
      expect(UserService.resetUserPassword).toHaveBeenCalledWith(
        'user-id',
        'NewPassword@123',
        'test-admin-id',
        mockTransaction
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        ApiResponse.success(null, 'Password reset successfully')
      );
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should bulk activate users', async () => {
      const result = {
        success: ['user1', 'user2'],
        failed: []
      };

      mockRequest.body = {
        userIds: ['user1', 'user2'],
        isActive: true
      };
      (UserService.bulkUpdateStatus as jest.Mock).mockResolvedValue(result);

      await UserController.bulkUpdateStatus(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(sequelize.transaction).toHaveBeenCalled();
      expect(UserService.bulkUpdateStatus).toHaveBeenCalledWith(
        ['user1', 'user2'],
        true,
        'test-admin-id',
        mockTransaction
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        ApiResponse.success(result, 'Users activated successfully')
      );
    });

    it('should bulk deactivate users', async () => {
      const result = {
        success: ['user1'],
        failed: [{ id: 'user2', error: 'Cannot deactivate superuser' }]
      };

      mockRequest.body = {
        userIds: ['user1', 'user2'],
        isActive: false
      };
      (UserService.bulkUpdateStatus as jest.Mock).mockResolvedValue(result);

      await UserController.bulkUpdateStatus(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        ApiResponse.success(result, 'Users deactivated successfully')
      );
    });
  });

  describe('bulkDeleteUsers', () => {
    it('should bulk delete users', async () => {
      const result = {
        success: ['user1', 'user2'],
        failed: []
      };

      mockRequest.body = { userIds: ['user1', 'user2'] };
      (UserService.bulkDeleteUsers as jest.Mock).mockResolvedValue(result);

      await UserController.bulkDeleteUsers(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(sequelize.transaction).toHaveBeenCalled();
      expect(UserService.bulkDeleteUsers).toHaveBeenCalledWith(
        ['user1', 'user2'],
        'test-admin-id',
        mockTransaction
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        ApiResponse.success(result, 'Users deleted successfully')
      );
    });
  });

  describe('getUserStatistics', () => {
    it('should get user statistics', async () => {
      const mockStats = {
        total: 100,
        active: 85,
        inactive: 15,
        superusers: 2,
        byRole: {
          admin: 5,
          user: 93
        }
      };

      (UserService.getUserStatistics as jest.Mock).mockResolvedValue(mockStats);

      await UserController.getUserStatistics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(UserService.getUserStatistics).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        ApiResponse.success(mockStats, 'User statistics retrieved successfully')
      );
    });
  });

  describe('getUserProfile', () => {
    it('should get current user profile', async () => {
      const mockUser = {
        id: 'test-admin-id',
        email: 'admin@example.com',
        username: 'admin'
      };

      (UserService.getUserById as jest.Mock).mockResolvedValue(mockUser);

      await UserController.getUserProfile(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(UserService.getUserById).toHaveBeenCalledWith('test-admin-id');
      expect(mockResponse.json).toHaveBeenCalledWith(
        ApiResponse.success(mockUser, 'Profile retrieved successfully')
      );
    });
  });

  describe('updateUserProfile', () => {
    it('should update current user profile', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Profile',
        email: 'newemail@example.com'
      };

      const mockUser = {
        id: 'test-admin-id',
        ...updateData
      };

      mockRequest.body = updateData;
      (UserService.updateUser as jest.Mock).mockResolvedValue(mockUser);

      await UserController.updateUserProfile(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(sequelize.transaction).toHaveBeenCalled();
      expect(UserService.updateUser).toHaveBeenCalledWith(
        'test-admin-id',
        updateData,
        'test-admin-id',
        mockTransaction
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        ApiResponse.success(mockUser, 'Profile updated successfully')
      );
    });
  });

  describe('exportUsers', () => {
    const mockUsers = [
      {
        id: '1',
        email: 'user1@example.com',
        username: 'user1',
        firstName: 'First',
        lastName: 'User',
        roles: [{ name: 'user' }, { name: 'admin' }],
        isActive: true,
        isSuperuser: false,
        lastLogin: new Date('2024-01-01'),
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ];

    it('should export users as JSON', async () => {
      mockRequest.query = { format: 'json' };
      (UserService.getAllUsers as jest.Mock).mockResolvedValue({
        users: mockUsers,
        total: 1
      });

      await UserController.exportUsers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(UserService.getAllUsers).toHaveBeenCalledWith(
        {
          search: undefined,
          isActive: undefined,
          roleIds: undefined
        },
        { page: 1, limit: 10000 }
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        ApiResponse.success(
          expect.arrayContaining([
            expect.objectContaining({
              id: '1',
              email: 'user1@example.com',
              username: 'user1',
              roles: 'user, admin'
            })
          ]),
          'Users exported successfully'
        )
      );
    });

    it('should export users as CSV', async () => {
      mockRequest.query = { format: 'csv' };
      (UserService.getAllUsers as jest.Mock).mockResolvedValue({
        users: mockUsers,
        total: 1
      });

      await UserController.exportUsers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="users.csv"'
      );
      expect(mockResponse.send).toHaveBeenCalledWith(expect.stringContaining('id,email,username'));
    });

    it('should export users with filters', async () => {
      mockRequest.query = {
        format: 'json',
        search: 'admin',
        isActive: 'true',
        roleIds: '1,2'
      };

      (UserService.getAllUsers as jest.Mock).mockResolvedValue({
        users: [],
        total: 0
      });

      await UserController.exportUsers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(UserService.getAllUsers).toHaveBeenCalledWith(
        {
          search: 'admin',
          isActive: true,
          roleIds: [1, 2]
        },
        { page: 1, limit: 10000 }
      );
    });
  });
});