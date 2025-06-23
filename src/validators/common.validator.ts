import Joi from 'joi';
import { commonPatterns } from '@middlewares/validation.middleware';

/**
 * ID parameter validation (generic)
 */
export const idParamSchema = Joi.object({
  id: commonPatterns.uuid
    .required()
    .messages({
      'string.guid': 'Invalid ID format',
      'any.required': 'ID is required',
    }),
});

/**
 * Multiple IDs validation
 */
export const idsSchema = Joi.object({
  ids: Joi.array()
    .items(commonPatterns.uuid)
    .min(1)
    .max(100)
    .unique()
    .required()
    .messages({
      'array.min': 'At least one ID is required',
      'array.max': 'Cannot process more than 100 items at once',
      'array.unique': 'Duplicate IDs are not allowed',
      'any.required': 'IDs are required',
    }),
});

/**
 * Date range validation
 */
export const dateRangeSchema = Joi.object({
  startDate: commonPatterns.date
    .optional()
    .messages({
      'date.base': 'Invalid start date format',
    }),
  endDate: commonPatterns.date
    .optional()
    .when('startDate', {
      is: Joi.exist(),
      then: Joi.date().greater(Joi.ref('startDate')),
    })
    .messages({
      'date.base': 'Invalid end date format',
      'date.greater': 'End date must be after start date',
    }),
});

/**
 * Search with filters validation
 */
export const searchWithFiltersSchema = Joi.object({
  q: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Search query must not be empty',
      'string.max': 'Search query is too long',
    }),
  filters: Joi.object()
    .pattern(
      Joi.string(),
      Joi.alternatives().try(
        Joi.string(),
        Joi.number(),
        Joi.boolean(),
        Joi.array().items(Joi.string())
      )
    )
    .optional(),
  ...commonPatterns.pagination,
});

/**
 * Export/download validation
 */
export const exportSchema = Joi.object({
  format: Joi.string()
    .valid('csv', 'xlsx', 'json', 'pdf')
    .optional()
    .default('csv')
    .messages({
      'any.only': 'Invalid export format. Must be one of: csv, xlsx, json, pdf',
    }),
  fields: Joi.array()
    .items(Joi.string())
    .optional()
    .messages({
      'array.base': 'Fields must be an array of strings',
    }),
  filters: Joi.object().optional(),
});

/**
 * Audit log query validation
 */
export const auditLogQuerySchema = Joi.object({
  userId: commonPatterns.uuid.optional(),
  action: Joi.string().trim().optional(),
  resource: Joi.string().trim().optional(),
  resourceId: commonPatterns.uuid.optional(),
  startDate: commonPatterns.date.optional(),
  endDate: commonPatterns.date.optional(),
  ...commonPatterns.pagination,
}).custom((value, helpers) => {
  if (value.startDate && value.endDate && value.endDate <= value.startDate) {
    return helpers.error('any.invalid');
  }
  return value;
}, 'Date range validation').messages({
  'any.invalid': 'End date must be after start date',
});

/**
 * File upload validation
 */
export const fileUploadSchema = Joi.object({
  file: Joi.object({
    mimetype: Joi.string()
      .required()
      .messages({
        'any.required': 'File type is required',
      }),
    size: Joi.number()
      .max(10 * 1024 * 1024) // 10MB
      .required()
      .messages({
        'number.max': 'File size cannot exceed 10MB',
        'any.required': 'File size is required',
      }),
  }).unknown(true).required()
    .messages({
      'any.required': 'File is required',
    }),
});

/**
 * Batch operation result
 */
export const batchOperationResultSchema = Joi.object({
  success: Joi.number().integer().min(0).required(),
  failed: Joi.number().integer().min(0).required(),
  errors: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().required(),
        error: Joi.string().required(),
      })
    )
    .optional(),
});

/**
 * Generic ID validation
 */
export const validateId = idParamSchema;