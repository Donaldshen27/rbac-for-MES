import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable('menu_permissions', {
      menuId: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: 'menu_id',
        references: {
          model: 'menus',
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
      canView: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        field: 'can_view'
      },
      canEdit: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        field: 'can_edit'
      },
      canDelete: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        field: 'can_delete'
      },
      canExport: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        field: 'can_export'
      }
    });

    // Create indexes
    await queryInterface.addIndex('menu_permissions', ['menu_id']);
    await queryInterface.addIndex('menu_permissions', ['role_id']);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('menu_permissions');
  }
};