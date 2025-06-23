import Joi from 'joi';
import { commonPatterns, createPaginationSchema } from '@middlewares/validation.middleware';

/**
 * Permission name pattern
 */
const permissionNamePattern = /^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/;
const resourceActionPattern = /^[a-zA-Z0-9_-]+$/;

/**
 * Create permission validation schema
 */
export const createPermissionSchema = Joi.object({
  name: Joi.string()
    .trim()
    .pattern(permissionNamePattern)
    .required()
    .messages({
      'string.pattern.base': 'Permission name must follow the format: resource:action',
      'any.required': 'Permission name is required',
    }),
  resource: Joi.string()
    .trim()
    .pattern(resourceActionPattern)
    .required()
    .messages({
      'string.pattern.base': 'Resource can only contain letters, numbers, underscores, and hyphens',
      'any.required': 'Resource is required',
    }),
  action: Joi.string()
    .trim()
    .pattern(resourceActionPattern)
    .required()
    .messages({
      'string.pattern.base': 'Action can only contain letters, numbers, underscores, and hyphens',
      'any.required': 'Action is required',
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters',
    }),
});

/**
 * Update permission validation schema
 */
export const updatePermissionSchema = Joi.object({
  description: Joi.string()
    .trim()
    .max(500)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters',
    }),
});

/**
 * Permission ID parameter validation
 */
export const permissionIdSchema = Joi.object({
  permissionId: commonPatterns.uuid
    .required()
    .messages({
      'string.guid': 'Invalid permission ID format',
      'any.required': 'Permission ID is required',
    }),
});

/**
 * List permissions query validation
 */
export const listPermissionsSchema = createPaginationSchema({
  search: Joi.string().trim().optional(),
  resource: Joi.string()
    .trim()
    .pattern(resourceActionPattern)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid resource format',
    }),
  action: Joi.string()
    .trim()
    .pattern(resourceActionPattern)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid action format',
    }),
});

/**
 * Check permission validation
 */
export const checkPermissionSchema = Joi.object({
  permission: Joi.alternatives()
    .try(
      Joi.string().trim().pattern(permissionNamePattern),
      Joi.array().items(Joi.string().trim().pattern(permissionNamePattern)).min(1)
    )
    .required()
    .messages({
      'string.pattern.base': 'Permission must follow the format: resource:action',
      'array.min': 'At least one permission is required',
      'any.required': 'Permission is required',
    }),
  requireAll: Joi.boolean()
    .optional()
    .default(false)
    .when('permission', {
      is: Joi.array(),
      then: Joi.boolean(),
      otherwise: Joi.forbidden(),
    }),
});

/**
 * Bulk create permissions validation
 */
export const bulkCreatePermissionsSchema = Joi.object({
  permissions: Joi.array()
    .items(
      Joi.object({
        name: Joi.string()
          .trim()
          .pattern(permissionNamePattern)
          .required()
          .messages({
            'string.pattern.base': 'Permission name must follow the format: resource:action',
            'any.required': 'Permission name is required',
          }),
        resource: Joi.string()
          .trim()
          .pattern(resourceActionPattern)
          .required()
          .messages({
            'string.pattern.base': 'Resource can only contain letters, numbers, underscores, and hyphens',
            'any.required': 'Resource is required',
          }),
        action: Joi.string()
          .trim()
          .pattern(resourceActionPattern)
          .required()
          .messages({
            'string.pattern.base': 'Action can only contain letters, numbers, underscores, and hyphens',
            'any.required': 'Action is required',
          }),
        description: Joi.string()
          .trim()
          .max(500)
          .allow('', null)
          .optional(),
      })
    )
    .min(1)
    .max(50)
    .unique('name')
    .required()
    .messages({
      'array.min': 'At least one permission is required',
      'array.max': 'Cannot create more than 50 permissions at once',
      'array.unique': 'Duplicate permission names are not allowed',
      'any.required': 'Permissions array is required',
    }),
});