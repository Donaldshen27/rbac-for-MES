import { Request, Response, NextFunction } from 'express';
import Joi, { Schema, ValidationOptions } from 'joi';
import { createValidationErrors } from '@utils/errors';

/**
 * Validation target types
 */
export enum ValidationTarget {
  BODY = 'body',
  QUERY = 'query',
  PARAMS = 'params',
  HEADERS = 'headers',
}

/**
 * Default validation options
 */
const defaultValidationOptions: ValidationOptions = {
  abortEarly: false, // Return all errors, not just the first one
  stripUnknown: true, // Remove unknown keys
  errors: {
    wrap: {
      label: '',
    },
  },
};

/**
 * Validation middleware factory
 */
export const validate = (
  schema: Schema,
  target: ValidationTarget = ValidationTarget.BODY,
  options: ValidationOptions = {}
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const validationOptions = { ...defaultValidationOptions, ...options };
    const dataToValidate = req[target];

    const { error, value } = schema.validate(dataToValidate, validationOptions);

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      
      throw createValidationErrors(errors);
    }

    // Replace the original data with the validated and transformed data
    req[target] = value;
    next();
  };
};

/**
 * Validate multiple targets at once
 */
export const validateMultiple = (validations: {
  [key in ValidationTarget]?: Schema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Array<{ field: string; message: string }> = [];

    Object.entries(validations).forEach(([target, schema]) => {
      if (schema) {
        const dataToValidate = req[target as ValidationTarget];
        const { error, value } = schema.validate(dataToValidate, defaultValidationOptions);

        if (error) {
          error.details.forEach(detail => {
            errors.push({
              field: `${target}.${detail.path.join('.')}`,
              message: detail.message,
            });
          });
        } else {
          // Replace with validated data
          (req as any)[target] = value;
        }
      }
    });

    if (errors.length > 0) {
      throw createValidationErrors(errors);
    }

    next();
  };
};

/**
 * Common validation patterns
 */
export const commonPatterns = {
  uuid: Joi.string().uuid({ version: 'uuidv4' }),
  email: Joi.string().email().lowercase().trim(),
  username: Joi.string().alphanum().min(3).max(30).lowercase().trim(),
  password: Joi.string().min(8).max(128),
  strongPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .message('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
  url: Joi.string().uri(),
  date: Joi.date().iso(),
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().pattern(/^-?\w+$/),
  },
};

/**
 * Helper to create pagination schema
 */
export const createPaginationSchema = (
  additionalFields: Record<string, Schema> = {}
): Schema => {
  return Joi.object({
    page: commonPatterns.pagination.page,
    limit: commonPatterns.pagination.limit,
    sort: commonPatterns.pagination.sort,
    ...additionalFields,
  });
};

/**
 * Helper to create search schema
 */
export const createSearchSchema = (
  searchableFields: string[],
  additionalFields: Record<string, Schema> = {}
): Schema => {
  return Joi.object({
    search: Joi.string().trim().allow(''),
    searchIn: Joi.string().valid(...searchableFields),
    ...commonPatterns.pagination,
    ...additionalFields,
  });
};

/**
 * Sanitize HTML to prevent XSS
 */
export const sanitizeHtml = (dirty: string): string => {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return dirty
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Custom Joi extensions
 */
export const extendedJoi = Joi.extend({
  type: 'string',
  base: Joi.string(),
  messages: {
    'string.sanitized': '{{#label}} contains potentially harmful content',
  },
  rules: {
    sanitized: {
      validate(value: string, helpers: any) {
        const sanitized = sanitizeHtml(value);
        if (sanitized !== value) {
          return helpers.error('string.sanitized');
        }
        return value;
      },
    },
  },
});