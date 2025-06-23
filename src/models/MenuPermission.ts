import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  NonAttribute,
  Association,
} from 'sequelize';
import { sequelize } from '@config/database';
import { Menu } from './Menu';
import { Role } from './Role';

export class MenuPermission extends Model<
  InferAttributes<MenuPermission>,
  InferCreationAttributes<MenuPermission>
> {
  declare menuId: ForeignKey<Menu['id']>;
  declare roleId: ForeignKey<Role['id']>;
  declare canView: CreationOptional<boolean>;
  declare canEdit: CreationOptional<boolean>;
  declare canDelete: CreationOptional<boolean>;
  declare canExport: CreationOptional<boolean>;

  // Associations
  declare menu?: NonAttribute<Menu>;
  declare role?: NonAttribute<Role>;

  declare static associations: {
    menu: Association<MenuPermission, Menu>;
    role: Association<MenuPermission, Role>;
  };

  // Static methods
  static associate(models: any): void {
    MenuPermission.belongsTo(models.Menu, {
      as: 'menu',
      foreignKey: 'menuId',
    });

    MenuPermission.belongsTo(models.Role, {
      as: 'role',
      foreignKey: 'roleId',
    });
  }

  // Instance methods
  hasAnyPermission(): boolean {
    return this.canView || this.canEdit || this.canDelete || this.canExport;
  }

  getPermissionSummary(): string {
    const permissions: string[] = [];
    if (this.canView) permissions.push('view');
    if (this.canEdit) permissions.push('edit');
    if (this.canDelete) permissions.push('delete');
    if (this.canExport) permissions.push('export');
    return permissions.join(', ');
  }
}

MenuPermission.init(
  {
    menuId: {
      type: DataTypes.STRING(10),
      primaryKey: true,
      references: {
        model: 'menus',
        key: 'id',
      },
    },
    roleId: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: 'roles',
        key: 'id',
      },
    },
    canView: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    canEdit: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    canDelete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    canExport: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'MenuPermission',
    tableName: 'menu_permissions',
    timestamps: false,
    indexes: [
      { fields: ['menuId'] },
      { fields: ['roleId'] },
    ],
    validate: {
      hasAtLeastOnePermission() {
        if (!this.canView && !this.canEdit && !this.canDelete && !this.canExport) {
          throw new Error('At least one permission must be granted');
        }
      },
    },
  }
);