import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable('role_permissions', {
      roleId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'role_id',
        references: {
          model: 'roles',
          key: 'id'
        },
        onDelete: 'CASCADE',
        primaryKey: true
      },
      permissionId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'permission_id',
        references: {
          model: 'permissions',
          key: 'id'
        },
        onDelete: 'CASCADE',
        primaryKey: true
      },
      grantedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'granted_at'
      },
      grantedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'granted_by',
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      }
    });

    // Create indexes
    await queryInterface.addIndex('role_permissions', ['role_id']);
    await queryInterface.addIndex('role_permissions', ['permission_id']);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('role_permissions');
  }
};