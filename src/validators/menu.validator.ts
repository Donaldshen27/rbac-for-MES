import Joi from 'joi';
import { commonPatterns } from '@middlewares/validation.middleware';

/**
 * Menu ID pattern (alphanumeric, matching MES format)
 */
const menuIdPattern = /^[A-Za-z0-9]+$/;

/**
 * Create menu validation schema
 */
export const createMenuSchema = Joi.object({
  id: Joi.string()
    .trim()
    .pattern(menuIdPattern)
    .max(10)
    .required()
    .messages({
      'string.pattern.base': 'Menu ID can only contain letters and numbers',
      'string.max': 'Menu ID cannot exceed 10 characters',
      'any.required': 'Menu ID is required',
    }),
  parentId: Joi.string()
    .trim()
    .pattern(menuIdPattern)
    .max(10)
    .allow(null)
    .optional()
    .messages({
      'string.pattern.base': 'Parent ID can only contain letters and numbers',
      'string.max': 'Parent ID cannot exceed 10 characters',
    }),
  title: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Title cannot be empty',
      'string.max': 'Title cannot exceed 100 characters',
      'any.required': 'Title is required',
    }),
  href: Joi.string()
    .trim()
    .max(255)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'URL cannot exceed 255 characters',
    }),
  icon: Joi.string()
    .trim()
    .max(50)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'Icon class cannot exceed 50 characters',
    }),
  target: Joi.string()
    .valid('_self', '_blank', '_parent', '_top')
    .optional()
    .default('_self')
    .messages({
      'any.only': 'Target must be one of: _self, _blank, _parent, _top',
    }),
  orderIndex: Joi.number()
    .integer()
    .min(0)
    .optional()
    .default(0)
    .messages({
      'number.min': 'Order index cannot be negative',
    }),
  isActive: Joi.boolean()
    .optional()
    .default(true),
});

/**
 * Update menu validation schema
 */
export const updateMenuSchema = Joi.object({
  parentId: Joi.string()
    .trim()
    .pattern(menuIdPattern)
    .max(10)
    .allow(null)
    .optional()
    .messages({
      'string.pattern.base': 'Parent ID can only contain letters and numbers',
      'string.max': 'Parent ID cannot exceed 10 characters',
    }),
  title: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Title cannot be empty',
      'string.max': 'Title cannot exceed 100 characters',
    }),
  href: Joi.string()
    .trim()
    .max(255)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'URL cannot exceed 255 characters',
    }),
  icon: Joi.string()
    .trim()
    .max(50)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'Icon class cannot exceed 50 characters',
    }),
  target: Joi.string()
    .valid('_self', '_blank', '_parent', '_top')
    .optional()
    .messages({
      'any.only': 'Target must be one of: _self, _blank, _parent, _top',
    }),
  orderIndex: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Order index cannot be negative',
    }),
  isActive: Joi.boolean()
    .optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Menu ID parameter validation
 */
export const menuIdSchema = Joi.object({
  menuId: Joi.string()
    .trim()
    .pattern(menuIdPattern)
    .max(10)
    .required()
    .messages({
      'string.pattern.base': 'Invalid menu ID format',
      'string.max': 'Menu ID cannot exceed 10 characters',
      'any.required': 'Menu ID is required',
    }),
});

/**
 * Menu permissions validation
 */
export const menuPermissionsSchema = Joi.object({
  menuPermissions: Joi.array()
    .items(
      Joi.object({
        menuId: Joi.string()
          .trim()
          .pattern(menuIdPattern)
          .max(10)
          .required()
          .messages({
            'string.pattern.base': 'Invalid menu ID format',
            'any.required': 'Menu ID is required',
          }),
        canView: Joi.boolean()
          .optional()
          .default(false),
        canEdit: Joi.boolean()
          .optional()
          .default(false),
        canDelete: Joi.boolean()
          .optional()
          .default(false),
        canExport: Joi.boolean()
          .optional()
          .default(false),
      }).custom((value, helpers) => {
        // At least one permission must be true
        if (!value.canView && !value.canEdit && !value.canDelete && !value.canExport) {
          return helpers.error('any.invalid');
        }
        return value;
      }, 'At least one permission validation')
      .messages({
        'any.invalid': 'At least one permission must be granted',
      })
    )
    .min(1)
    .unique('menuId')
    .required()
    .messages({
      'array.min': 'At least one menu permission is required',
      'array.unique': 'Duplicate menu IDs are not allowed',
      'any.required': 'Menu permissions are required',
    }),
});

/**
 * Batch update menu permissions
 */
export const batchMenuPermissionsSchema = Joi.object({
  roleId: commonPatterns.uuid
    .required()
    .messages({
      'string.guid': 'Invalid role ID format',
      'any.required': 'Role ID is required',
    }),
  permissions: Joi.array()
    .items(
      Joi.object({
        menuId: Joi.string()
          .trim()
          .pattern(menuIdPattern)
          .max(10)
          .required()
          .messages({
            'string.pattern.base': 'Invalid menu ID format',
            'any.required': 'Menu ID is required',
          }),
        canView: Joi.boolean().required(),
        canEdit: Joi.boolean().required(),
        canDelete: Joi.boolean().required(),
        canExport: Joi.boolean().required(),
        applyToChildren: Joi.boolean()
          .optional()
          .default(false),
      })
    )
    .min(1)
    .unique('menuId')
    .required()
    .messages({
      'array.min': 'At least one permission is required',
      'array.unique': 'Duplicate menu IDs are not allowed',
      'any.required': 'Permissions are required',
    }),
});

/**
 * Import menu structure validation
 */
export const importMenuSchema = Joi.object({
  menus: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().required(),
        title: Joi.string().required(),
        href: Joi.string().allow('', null).optional(),
        icon: Joi.string().allow('', null).optional(),
        target: Joi.string().optional(),
        child: Joi.array().items(Joi.link('#menu')).optional(),
      }).id('menu')
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one menu item is required',
      'any.required': 'Menus array is required',
    }),
});