import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable('user_roles', {
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        primaryKey: true
      },
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
      assignedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'assigned_at'
      },
      assignedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'assigned_by',
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      }
    });

    // Create indexes
    await queryInterface.addIndex('user_roles', ['user_id']);
    await queryInterface.addIndex('user_roles', ['role_id']);
    await queryInterface.addIndex('user_roles', ['assigned_at']);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('user_roles');
  }
};