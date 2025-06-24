import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
  // Add category field to permissions table if it doesn't exist
  const permissionsTable = await queryInterface.describeTable('permissions');
  if (!permissionsTable.category) {
    await queryInterface.addColumn('permissions', 'category', {
      type: DataTypes.STRING(50),
      allowNull: true
    });
  }

  // Add isActive field to roles table if it doesn't exist
  const rolesTable = await queryInterface.describeTable('roles');
  if (!rolesTable.is_active) {
    await queryInterface.addColumn('roles', 'is_active', {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });
  }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
  // Remove category field from permissions table
  const permissionsTable = await queryInterface.describeTable('permissions');
  if (permissionsTable.category) {
    await queryInterface.removeColumn('permissions', 'category');
  }

  // Remove isActive field from roles table
  const rolesTable = await queryInterface.describeTable('roles');
  if (rolesTable.is_active) {
    await queryInterface.removeColumn('roles', 'is_active');
  }
  }
};