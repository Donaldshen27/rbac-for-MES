import Joi from 'joi';
import { commonPatterns, createPaginationSchema } from '../middlewares/validation.middleware';

/**
 * Create role validation schema
 */
export const createRoleSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Role name can only contain letters, numbers, underscores, and hyphens',
      'string.min': 'Role name must be at least 2 characters long',
      'string.max': 'Role name cannot exceed 50 characters',
      'any.required': 'Role name is required',
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters',
    }),
  isSystem: Joi.boolean()
    .optional()
    .default(false),
  permissionIds: Joi.array()
    .items(commonPatterns.uuid)
    .unique()
    .optional()
    .messages({
      'array.unique': 'Duplicate permission IDs are not allowed',
    }),
});

/**
 * Update role validation schema
 */
export const updateRoleSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .optional()
    .messages({
      'string.pattern.base': 'Role name can only contain letters, numbers, underscores, and hyphens',
      'string.min': 'Role name must be at least 2 characters long',
      'string.max': 'Role name cannot exceed 50 characters',
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters',
    }),
  permissionIds: Joi.array()
    .items(commonPatterns.uuid)
    .unique()
    .optional()
    .messages({
      'array.unique': 'Duplicate permission IDs are not allowed',
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Role ID parameter validation
 */
export const roleIdSchema = Joi.object({
  roleId: commonPatterns.uuid
    .required()
    .messages({
      'string.guid': 'Invalid role ID format',
      'any.required': 'Role ID is required',
    }),
});

/**
 * List roles query validation
 */
export const listRolesSchema = createPaginationSchema({
  search: Joi.string().trim().optional(),
  isSystem: Joi.boolean().optional(),
  hasUsers: Joi.boolean().optional(),
  sortBy: Joi.string()
    .valid('name', 'createdAt', 'updatedAt')
    .optional(),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .default('asc'),
});

/**
 * Update role permissions validation
 */
export const updateRolePermissionsSchema = Joi.object({
  add: Joi.array()
    .items(commonPatterns.uuid)
    .unique()
    .optional()
    .messages({
      'array.unique': 'Duplicate permission IDs are not allowed',
    }),
  remove: Joi.array()
    .items(commonPatterns.uuid)
    .unique()
    .optional()
    .messages({
      'array.unique': 'Duplicate permission IDs are not allowed',
    }),
}).or('add', 'remove').messages({
  'object.missing': 'Either add or remove permissions must be specified',
});

/**
 * Clone role validation
 */
export const cloneRoleSchema = Joi.object({
  newRoleName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Role name can only contain letters, numbers, underscores, and hyphens',
      'string.min': 'Role name must be at least 2 characters long',
      'string.max': 'Role name cannot exceed 50 characters',
      'any.required': 'New role name is required',
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters',
    }),
  includePermissions: Joi.boolean()
    .optional()
    .default(true),
  includeMenuPermissions: Joi.boolean()
    .optional()
    .default(false),
});

/**
 * Bulk delete roles validation
 */
export const bulkDeleteRolesSchema = Joi.object({
  roleIds: Joi.array()
    .items(commonPatterns.uuid)
    .min(1)
    .unique()
    .required()
    .messages({
      'array.min': 'At least one role ID must be provided',
      'array.unique': 'Duplicate role IDs are not allowed',
      'any.required': 'Role IDs are required',
    }),
});

/**
 * Assign/Remove users to role validation
 */
export const userRoleOperationSchema = Joi.object({
  userIds: Joi.array()
    .items(commonPatterns.uuid)
    .min(1)
    .unique()
    .required()
    .messages({
      'array.min': 'At least one user ID must be provided',
      'array.unique': 'Duplicate user IDs are not allowed',
      'any.required': 'User IDs are required',
    }),
});

/**
 * Update role menu permissions validation
 */
export const updateMenuPermissionsSchema = Joi.object({
  menuPermissions: Joi.array()
    .items(
      Joi.object({
        menuId: Joi.string()
          .trim()
          .required()
          .messages({
            'any.required': 'Menu ID is required',
          }),
        canView: Joi.boolean().optional().default(false),
        canEdit: Joi.boolean().optional().default(false),
        canDelete: Joi.boolean().optional().default(false),
        canExport: Joi.boolean().optional().default(false),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one menu permission must be provided',
      'any.required': 'Menu permissions are required',
    }),
});

/**
 * Check role permission params validation
 */
export const checkPermissionParamsSchema = Joi.object({
  roleId: commonPatterns.uuid
    .required()
    .messages({
      'string.guid': 'Invalid role ID format',
      'any.required': 'Role ID is required',
    }),
  permissionName: Joi.string()
    .trim()
    .required()
    .messages({
      'any.required': 'Permission name is required',
    }),
});