import { UserService } from '../../../src/services/user.service';
import { User } from '../../../src/models/User';
import { Role } from '../../../src/models/Role';
import { AuditLog } from '../../../src/models/AuditLog';
import { RefreshToken } from '../../../src/models/RefreshToken';
import { BcryptUtil } from '../../../src/utils/bcrypt.util';
import { ApiError } from '../../../src/utils/api-error';
import { Op } from 'sequelize';

// Mock dependencies
jest.mock('../../../src/models/User');
jest.mock('../../../src/models/Role');
jest.mock('../../../src/models/AuditLog');
jest.mock('../../../src/models/RefreshToken');
jest.mock('../../../src/utils/bcrypt.util');
jest.mock('../../../src/utils/logger', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return paginated users', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@example.com', roles: [] },
        { id: '2', email: 'user2@example.com', roles: [] }
      ];

      (User.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 2,
        rows: mockUsers
      });

      const result = await UserService.getAllUsers({}, { page: 1, limit: 10 });

      expect(result.users).toEqual(mockUsers);
      expect(result.total).toBe(2);
      expect(User.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Array),
        limit: 10,
        offset: 0,
        order: [['createdAt', 'DESC']],
        distinct: true
      });
    });

    it('should filter users by search term', async () => {
      const mockUsers = [{ id: '1', email: 'john@example.com' }];

      (User.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 1,
        rows: mockUsers
      });

      await UserService.getAllUsers({ search: 'john' }, { page: 1, limit: 10 });

      expect(User.findAndCountAll).toHaveBeenCalledWith({
        where: {
          [Op.or]: [
            { email: { [Op.like]: '%john%' } },
            { username: { [Op.like]: '%john%' } },
            { firstName: { [Op.like]: '%john%' } },
            { lastName: { [Op.like]: '%john%' } }
          ]
        },
        include: expect.any(Array),
        limit: 10,
        offset: 0,
        order: [['createdAt', 'DESC']],
        distinct: true
      });
    });

    it('should filter users by active status', async () => {
      const mockUsers = [{ id: '1', email: 'user@example.com', isActive: true }];

      (User.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 1,
        rows: mockUsers
      });

      await UserService.getAllUsers({ isActive: true }, { page: 1, limit: 10 });

      expect(User.findAndCountAll).toHaveBeenCalledWith({
        where: { isActive: true },
        include: expect.any(Array),
        limit: 10,
        offset: 0,
        order: [['createdAt', 'DESC']],
        distinct: true
      });
    });
  });

  describe('getUserById', () => {
    it('should return user with roles', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        roles: [{ id: 1, name: 'user' }]
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserService.getUserById('1');

      expect(result).toEqual(mockUser);
      expect(User.findByPk).toHaveBeenCalledWith('1', {
        include: expect.any(Array)
      });
    });

    it('should throw error if user not found', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(UserService.getUserById('1')).rejects.toThrow(
        new ApiError(404, 'User not found')
      );
    });
  });

  describe('createUser', () => {
    const createData = {
      email: 'new@example.com',
      username: 'newuser',
      password: 'Pass123!',
      firstName: 'New',
      lastName: 'User',
      roleIds: [1],
      createdBy: 'admin'
    };

    it('should create user successfully', async () => {
      const mockUser = {
        id: '1',
        email: createData.email,
        username: createData.username,
        setRoles: jest.fn()
      };

      const mockRoles = [{ id: 1, name: 'user' }];

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (BcryptUtil.hashPassword as jest.Mock).mockResolvedValue('hashed-password');
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (Role.findAll as jest.Mock).mockResolvedValue(mockRoles);
      (AuditLog.create as jest.Mock).mockResolvedValue({});

      const result = await UserService.createUser(createData);

      expect(result).toBe(mockUser);
      expect(BcryptUtil.hashPassword).toHaveBeenCalledWith(createData.password);
      expect(mockUser.setRoles).toHaveBeenCalledWith(mockRoles, expect.any(Object));
    });

    it('should throw error if email already exists', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ email: createData.email });

      await expect(UserService.createUser(createData)).rejects.toThrow(
        new ApiError(409, 'User with this email already exists')
      );
    });

    it('should throw error if username already exists', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ username: createData.username });

      await expect(UserService.createUser(createData)).rejects.toThrow(
        new ApiError(409, 'Username is already taken')
      );
    });

    it('should throw error if invalid role IDs', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (BcryptUtil.hashPassword as jest.Mock).mockResolvedValue('hashed-password');
      (User.create as jest.Mock).mockResolvedValue({ id: '1', setRoles: jest.fn() });
      (Role.findAll as jest.Mock).mockResolvedValue([]); // No roles found

      await expect(UserService.createUser(createData)).rejects.toThrow(
        new ApiError(400, 'One or more role IDs are invalid')
      );
    });
  });

  describe('updateUser', () => {
    const updateData = {
      email: 'updated@example.com',
      firstName: 'Updated',
      roleIds: [2]
    };

    it('should update user successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'old@example.com',
        update: jest.fn(),
        setRoles: jest.fn(),
        reload: jest.fn()
      };

      const mockRoles = [{ id: 2, name: 'admin' }];

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (Role.findAll as jest.Mock).mockResolvedValue(mockRoles);
      (AuditLog.create as jest.Mock).mockResolvedValue({});

      const result = await UserService.updateUser('1', updateData, 'admin');

      expect(mockUser.update).toHaveBeenCalledWith(
        { email: updateData.email, firstName: updateData.firstName },
        expect.any(Object)
      );
      expect(mockUser.setRoles).toHaveBeenCalledWith(mockRoles, expect.any(Object));
      expect(mockUser.reload).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(UserService.updateUser('1', updateData, 'admin')).rejects.toThrow(
        new ApiError(404, 'User not found')
      );
    });

    it('should throw error if email already in use', async () => {
      const mockUser = { id: '1', email: 'old@example.com' };
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (User.findOne as jest.Mock).mockResolvedValue({ email: updateData.email });

      await expect(UserService.updateUser('1', updateData, 'admin')).rejects.toThrow(
        new ApiError(409, 'Email is already in use')
      );
    });
  });

  describe('deleteUser', () => {
    it('should deactivate user successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        isSuperuser: false,
        update: jest.fn()
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (RefreshToken.destroy as jest.Mock).mockResolvedValue(1);
      (AuditLog.create as jest.Mock).mockResolvedValue({});

      await UserService.deleteUser('1', 'admin');

      expect(mockUser.update).toHaveBeenCalledWith({ isActive: false }, expect.any(Object));
      expect(RefreshToken.destroy).toHaveBeenCalledWith({
        where: { userId: '1' },
        transaction: undefined
      });
    });

    it('should throw error if user not found', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(UserService.deleteUser('1', 'admin')).rejects.toThrow(
        new ApiError(404, 'User not found')
      );
    });

    it('should throw error if trying to delete superuser', async () => {
      const mockUser = { id: '1', isSuperuser: true };
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      await expect(UserService.deleteUser('1', 'admin')).rejects.toThrow(
        new ApiError(403, 'Cannot delete superuser')
      );
    });
  });

  describe('updateUserRoles', () => {
    it('should update user roles successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        roles: [{ id: 1, name: 'user' }],
        setRoles: jest.fn()
      };

      const newRoles = [{ id: 2, name: 'admin' }, { id: 3, name: 'manager' }];

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (Role.findAll as jest.Mock).mockResolvedValue(newRoles);
      (AuditLog.create as jest.Mock).mockResolvedValue({});

      const result = await UserService.updateUserRoles('1', [2, 3], 'admin');

      expect(mockUser.setRoles).toHaveBeenCalledWith(newRoles, expect.any(Object));
      expect(AuditLog.create).toHaveBeenCalledWith({
        userId: 'admin',
        action: 'USER_ROLES_UPDATED',
        resource: 'User',
        resourceId: '1',
        details: {
          oldRoles: [1],
          newRoles: [2, 3]
        }
      }, expect.any(Object));
    });
  });

  describe('resetUserPassword', () => {
    it('should reset password successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        update: jest.fn()
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (BcryptUtil.hashPassword as jest.Mock).mockResolvedValue('hashed-new-password');
      (RefreshToken.destroy as jest.Mock).mockResolvedValue(1);
      (AuditLog.create as jest.Mock).mockResolvedValue({});

      await UserService.resetUserPassword('1', 'NewPass123!', 'admin');

      expect(BcryptUtil.hashPassword).toHaveBeenCalledWith('NewPass123!');
      expect(mockUser.update).toHaveBeenCalledWith(
        { password: 'hashed-new-password' },
        expect.any(Object)
      );
      expect(RefreshToken.destroy).toHaveBeenCalled();
    });
  });

  describe('getUserStatistics', () => {
    it('should return user statistics', async () => {
      const mockRoleStats = [
        { id: '1', roles: [{ name: 'user' }] },
        { id: '2', roles: [{ name: 'admin' }, { name: 'user' }] },
        { id: '3', roles: [{ name: 'user' }] }
      ];

      (User.count as jest.Mock)
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8)  // active
        .mockResolvedValueOnce(2)  // inactive
        .mockResolvedValueOnce(1); // superusers

      (User.findAll as jest.Mock).mockResolvedValue(mockRoleStats);

      const result = await UserService.getUserStatistics();

      expect(result).toEqual({
        total: 10,
        active: 8,
        inactive: 2,
        superusers: 1,
        byRole: {
          user: 3,
          admin: 1
        }
      });
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should bulk update user status', async () => {
      const mockUsers = [
        { id: '1', isSuperuser: false, update: jest.fn() },
        { id: '2', isSuperuser: false, update: jest.fn() }
      ];

      (User.findByPk as jest.Mock)
        .mockResolvedValueOnce(mockUsers[0])
        .mockResolvedValueOnce(mockUsers[1]);

      (RefreshToken.destroy as jest.Mock).mockResolvedValue(1);
      (AuditLog.create as jest.Mock).mockResolvedValue({});

      const result = await UserService.bulkUpdateStatus(['1', '2'], false, 'admin');

      expect(result.success).toEqual(['1', '2']);
      expect(result.failed).toEqual([]);
      expect(mockUsers[0].update).toHaveBeenCalledWith({ isActive: false }, expect.any(Object));
      expect(mockUsers[1].update).toHaveBeenCalledWith({ isActive: false }, expect.any(Object));
    });

    it('should handle mixed success and failure', async () => {
      const mockUser = { id: '1', isSuperuser: false, update: jest.fn() };

      (User.findByPk as jest.Mock)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null); // User not found

      (AuditLog.create as jest.Mock).mockResolvedValue({});

      const result = await UserService.bulkUpdateStatus(['1', '2'], true, 'admin');

      expect(result.success).toEqual(['1']);
      expect(result.failed).toEqual([{ id: '2', error: 'User not found' }]);
    });
  });
});