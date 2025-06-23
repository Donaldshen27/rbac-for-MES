import Joi from 'joi';
import { commonPatterns, createPaginationSchema } from '@middlewares/validation.middleware';

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
});

/**
 * Update role permissions validation
 */
export const updateRolePermissionsSchema = Joi.object({
  permissionIds: Joi.array()
    .items(commonPatterns.uuid)
    .unique()
    .required()
    .messages({
      'array.unique': 'Duplicate permission IDs are not allowed',
      'any.required': 'Permission IDs are required',
    }),
});

/**
 * Add permission to role validation
 */
export const addPermissionToRoleSchema = Joi.object({
  permissionId: commonPatterns.uuid
    .required()
    .messages({
      'string.guid': 'Invalid permission ID format',
      'any.required': 'Permission ID is required',
    }),
});

/**
 * Remove permission from role validation
 */
export const removePermissionFromRoleSchema = Joi.object({
  roleId: commonPatterns.uuid
    .required()
    .messages({
      'string.guid': 'Invalid role ID format',
      'any.required': 'Role ID is required',
    }),
  permissionId: commonPatterns.uuid
    .required()
    .messages({
      'string.guid': 'Invalid permission ID format',
      'any.required': 'Permission ID is required',
    }),
});

/**
 * Clone role validation
 */
export const cloneRoleSchema = Joi.object({
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
  includePermissions: Joi.boolean()
    .optional()
    .default(true),
});