import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable('menus', {
      id: {
        type: DataTypes.STRING(10),
        primaryKey: true,
        allowNull: false,
        comment: 'Menu ID from MES JSON'
      },
      parentId: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'parent_id',
        references: {
          model: 'menus',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      href: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      icon: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      target: {
        type: DataTypes.STRING(20),
        defaultValue: '_self',
        allowNull: false
      },
      orderIndex: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        field: 'order_index'
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: 'is_active'
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at'
      }
    });

    // Create indexes
    await queryInterface.addIndex('menus', ['parent_id']);
    await queryInterface.addIndex('menus', ['is_active']);
    await queryInterface.addIndex('menus', ['order_index']);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('menus');
  }
};