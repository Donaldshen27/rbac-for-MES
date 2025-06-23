import Joi from 'joi';

// Menu ID schema
export const menuIdSchema = Joi.object({
  menuId: Joi.string()
    .pattern(/^[A-Za-z0-9]+$/)
    .max(10)
    .required()
    .messages({
      'string.pattern.base': 'Menu ID can only contain letters and numbers',
      'string.max': 'Menu ID must be at most 10 characters',
      'any.required': 'Menu ID is required'
    })
});

// List menus query schema
export const listMenusSchema = Joi.object({
  search: Joi.string().trim().max(100).optional(),
  parentId: Joi.string().pattern(/^[A-Za-z0-9]+$/).max(10).optional().allow(null),
  isActive: Joi.boolean().optional(),
  sortBy: Joi.string().valid('title', 'orderIndex', 'createdAt').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional()
});

// Menu permission schema
const menuPermissionSchema = Joi.object({
  menuId: Joi.string()
    .pattern(/^[A-Za-z0-9]+$/)
    .max(10)
    .required(),
  canView: Joi.boolean().optional(),
  canEdit: Joi.boolean().optional(),
  canDelete: Joi.boolean().optional(),
  canExport: Joi.boolean().optional()
}).custom((value, helpers) => {
  // At least one permission should be set when updating
  if (value.canView === undefined && 
      value.canEdit === undefined && 
      value.canDelete === undefined && 
      value.canExport === undefined) {
    return helpers.error('custom.atLeastOnePermission');
  }
  return value;
}, 'atLeastOnePermission');

// Batch menu permission update schema
export const batchMenuPermissionSchema = Joi.object({
  roleId: Joi.string().uuid().required(),
  permissions: Joi.array()
    .items(menuPermissionSchema)
    .min(1)
    .required(),
  applyToChildren: Joi.boolean().optional().default(false)
}).messages({
  'custom.atLeastOnePermission': 'At least one permission must be specified'
});

// Check menu access schema
export const checkMenuAccessSchema = Joi.object({
  menuId: Joi.string()
    .pattern(/^[A-Za-z0-9]+$/)
    .max(10)
    .required(),
  userId: Joi.string().uuid().optional(),
  permission: Joi.string()
    .valid('view', 'edit', 'delete', 'export')
    .required()
});

// Create menu schema
export const createMenuSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[A-Za-z0-9]+$/)
    .max(10)
    .required()
    .messages({
      'string.pattern.base': 'Menu ID can only contain letters and numbers',
      'string.max': 'Menu ID must be at most 10 characters',
      'any.required': 'Menu ID is required'
    }),
  parentId: Joi.string()
    .pattern(/^[A-Za-z0-9]+$/)
    .max(10)
    .optional()
    .allow(null),
  title: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required(),
  href: Joi.string()
    .trim()
    .max(255)
    .optional()
    .allow(null),
  icon: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow(null),
  target: Joi.string()
    .valid('_self', '_blank', '_parent', '_top')
    .optional()
    .default('_self'),
  orderIndex: Joi.number()
    .integer()
    .min(0)
    .optional()
    .default(0),
  isActive: Joi.boolean()
    .optional()
    .default(true)
});

// Update menu schema
export const updateMenuSchema = Joi.object({
  parentId: Joi.string()
    .pattern(/^[A-Za-z0-9]+$/)
    .max(10)
    .optional()
    .allow(null),
  title: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional(),
  href: Joi.string()
    .trim()
    .max(255)
    .optional()
    .allow(null),
  icon: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow(null),
  target: Joi.string()
    .valid('_self', '_blank', '_parent', '_top')
    .optional(),
  orderIndex: Joi.number()
    .integer()
    .min(0)
    .optional(),
  isActive: Joi.boolean()
    .optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Move menu schema
export const moveMenuSchema = Joi.object({
  newParentId: Joi.string()
    .pattern(/^[A-Za-z0-9]+$/)
    .max(10)
    .allow(null)
    .required()
    .messages({
      'string.pattern.base': 'Parent ID can only contain letters and numbers',
      'any.required': 'New parent ID is required (use null for root level)'
    })
});

// Reorder menus schema
export const reorderMenusSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        menuId: Joi.string()
          .pattern(/^[A-Za-z0-9]+$/)
          .max(10)
          .required(),
        orderIndex: Joi.number()
          .integer()
          .min(0)
          .required()
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one menu item must be provided',
      'any.required': 'Items array is required'
    })
});

// Update role menu permissions schema (used in role routes)
export const updateRoleMenuPermissionsSchema = Joi.object({
  permissions: Joi.array()
    .items(
      Joi.object({
        menuId: Joi.string()
          .pattern(/^[A-Za-z0-9]+$/)
          .max(10)
          .required(),
        canView: Joi.boolean().required(),
        canEdit: Joi.boolean().required(),
        canDelete: Joi.boolean().required(),
        canExport: Joi.boolean().required()
      }).custom((value, helpers) => {
        // At least one permission must be true
        if (!value.canView && !value.canEdit && !value.canDelete && !value.canExport) {
          return helpers.error('custom.atLeastOneTrue');
        }
        return value;
      }, 'atLeastOneTrue')
    )
    .min(1)
    .required()
}).messages({
  'custom.atLeastOneTrue': 'At least one permission must be granted (canView, canEdit, canDelete, or canExport)'
});