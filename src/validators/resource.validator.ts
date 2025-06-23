import Joi from 'joi';
import { commonPatterns, createPaginationSchema } from '@middlewares/validation.middleware';

/**
 * Resource name pattern
 */
const resourceNamePattern = /^[a-zA-Z0-9_-]+$/;

/**
 * Create resource validation schema
 */
export const createResourceSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(resourceNamePattern)
    .required()
    .messages({
      'string.pattern.base': 'Resource name can only contain letters, numbers, underscores, and hyphens',
      'string.min': 'Resource name must be at least 2 characters long',
      'string.max': 'Resource name cannot exceed 50 characters',
      'any.required': 'Resource name is required',
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
 * Update resource validation schema
 */
export const updateResourceSchema = Joi.object({
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
 * Resource ID parameter validation
 */
export const resourceIdSchema = Joi.object({
  resourceId: commonPatterns.uuid
    .required()
    .messages({
      'string.guid': 'Invalid resource ID format',
      'any.required': 'Resource ID is required',
    }),
});

/**
 * List resources query validation
 */
export const listResourcesSchema = createPaginationSchema({
  search: Joi.string().trim().optional(),
});