import Joi from 'joi';
import { commonPatterns, createPaginationSchema, createSearchSchema } from '@middlewares/validation.middleware';

/**
 * Create user validation schema
 */
export const createUserSchema = Joi.object({
  username: commonPatterns.username
    .required()
    .messages({
      'string.alphanum': 'Username can only contain letters and numbers',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 30 characters',
      'any.required': 'Username is required',
    }),
  email: commonPatterns.email
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  password: commonPatterns.strongPassword
    .required()
    .messages({
      'any.required': 'Password is required',
    }),
  firstName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .messages({
      'string.pattern.base': 'First name can only contain letters, spaces, hyphens, and apostrophes',
    }),
  lastName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .messages({
      'string.pattern.base': 'Last name can only contain letters, spaces, hyphens, and apostrophes',
    }),
  roleIds: Joi.array()
    .items(commonPatterns.uuid)
    .unique()
    .optional()
    .messages({
      'array.unique': 'Duplicate role IDs are not allowed',
    }),
  isActive: Joi.boolean()
    .optional()
    .default(true),
});

/**
 * Update user validation schema
 */
export const updateUserSchema = Joi.object({
  email: commonPatterns.email
    .optional()
    .messages({
      'string.email': 'Please provide a valid email address',
    }),
  firstName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .optional()
    .messages({
      'string.pattern.base': 'First name can only contain letters, spaces, hyphens, and apostrophes',
    }),
  lastName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .optional()
    .messages({
      'string.pattern.base': 'Last name can only contain letters, spaces, hyphens, and apostrophes',
    }),
  isActive: Joi.boolean()
    .optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * User ID parameter validation
 */
export const userIdSchema = Joi.object({
  userId: commonPatterns.uuid
    .required()
    .messages({
      'string.guid': 'Invalid user ID format',
      'any.required': 'User ID is required',
    }),
});

/**
 * List users query validation
 */
export const listUsersSchema = createSearchSchema(
  ['username', 'email', 'firstName', 'lastName'],
  {
    role: Joi.string().trim().optional(),
    isActive: Joi.boolean().optional(),
    createdFrom: commonPatterns.date.optional(),
    createdTo: commonPatterns.date.optional(),
  }
);

/**
 * Assign role to user validation
 */
export const assignRoleSchema = Joi.object({
  roleId: commonPatterns.uuid
    .required()
    .messages({
      'string.guid': 'Invalid role ID format',
      'any.required': 'Role ID is required',
    }),
});

/**
 * Remove role from user validation
 */
export const removeRoleSchema = Joi.object({
  userId: commonPatterns.uuid
    .required()
    .messages({
      'string.guid': 'Invalid user ID format',
      'any.required': 'User ID is required',
    }),
  roleId: commonPatterns.uuid
    .required()
    .messages({
      'string.guid': 'Invalid role ID format',
      'any.required': 'Role ID is required',
    }),
});

/**
 * Bulk user operations validation
 */
export const bulkUserOperationSchema = Joi.object({
  userIds: Joi.array()
    .items(commonPatterns.uuid)
    .min(1)
    .max(100)
    .unique()
    .required()
    .messages({
      'array.min': 'At least one user ID is required',
      'array.max': 'Cannot process more than 100 users at once',
      'array.unique': 'Duplicate user IDs are not allowed',
      'any.required': 'User IDs are required',
    }),
  operation: Joi.string()
    .valid('activate', 'deactivate', 'delete')
    .required()
    .messages({
      'any.only': 'Invalid operation. Must be one of: activate, deactivate, delete',
      'any.required': 'Operation is required',
    }),
});

/**
 * Update user password (admin)
 */
export const updateUserPasswordSchema = Joi.object({
  newPassword: commonPatterns.strongPassword
    .required()
    .messages({
      'any.required': 'New password is required',
    }),
  sendNotification: Joi.boolean()
    .optional()
    .default(true),
});