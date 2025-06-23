import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Association,
  NonAttribute,
  ForeignKey,
} from 'sequelize';
import { sequelize } from '@config/database';

export class Menu extends Model<
  InferAttributes<Menu, { omit: 'children' | 'parent' }>,
  InferCreationAttributes<Menu, { omit: 'children' | 'parent' }>
> {
  declare id: string;
  declare parentId: ForeignKey<Menu['id']> | null;
  declare title: string;
  declare href: string | null;
  declare icon: string | null;
  declare target: CreationOptional<string>;
  declare orderIndex: CreationOptional<number>;
  declare isActive: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare parent?: NonAttribute<Menu>;
  declare children?: NonAttribute<Menu[]>;

  declare static associations: {
    parent: Association<Menu, Menu>;
    children: Association<Menu, Menu>;
  };

  // Static methods
  static associate(models: any): void {
    Menu.belongsTo(Menu, {
      as: 'parent',
      foreignKey: 'parentId',
    });

    Menu.hasMany(Menu, {
      as: 'children',
      foreignKey: 'parentId',
    });

    Menu.hasMany(models.MenuPermission, {
      as: 'permissions',
      foreignKey: 'menuId',
    });
  }

  // Instance methods
  async getFullPath(): Promise<string> {
    const path: string[] = [this.title];
    let current: Menu | null = this;

    while (current.parentId) {
      current = await Menu.findByPk(current.parentId);
      if (current) {
        path.unshift(current.title);
      } else {
        break;
      }
    }

    return path.join(' > ');
  }

  async getAllChildren(): Promise<Menu[]> {
    const children: Menu[] = [];
    const queue: Menu[] = [this];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const directChildren = await Menu.findAll({
        where: { parentId: current.id },
      });
      children.push(...directChildren);
      queue.push(...directChildren);
    }

    return children;
  }
}

Menu.init(
  {
    id: {
      type: DataTypes.STRING(10),
      primaryKey: true,
      validate: {
        isValidMenuId(value: string) {
          if (!/^[A-Za-z0-9]+$/.test(value)) {
            throw new Error('Menu ID can only contain letters and numbers');
          }
        },
      },
    },
    parentId: {
      type: DataTypes.STRING(10),
      allowNull: true,
      references: {
        model: 'menus',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    href: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    target: {
      type: DataTypes.STRING(20),
      defaultValue: '_self',
      allowNull: false,
      validate: {
        isIn: [['_self', '_blank', '_parent', '_top']],
      },
    },
    orderIndex: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Menu',
    tableName: 'menus',
    timestamps: true,
    indexes: [
      { fields: ['parentId'] },
      { fields: ['isActive'] },
      { fields: ['orderIndex'] },
    ],
    hooks: {
      beforeDestroy: async (menu: Menu) => {
        // Check if menu has children
        const childCount = await Menu.count({ where: { parentId: menu.id } });
        if (childCount > 0) {
          throw new Error('Cannot delete menu with child items');
        }
      },
    },
  }
);