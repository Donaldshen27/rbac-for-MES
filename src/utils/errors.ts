import { ErrorCode } from '@types/index';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number,
    isOperational = true,
    details?: any
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(code: ErrorCode = ErrorCode.AUTH_INVALID_CREDENTIALS, message = 'Authentication failed') {
    super(code, message, 401, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS, message, 403, true);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id 
      ? `${resource} with id ${id} not found`
      : `${resource} not found`;
    super(ErrorCode.NOT_FOUND, message, 404, true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.CONFLICT) {
    super(code, message, 409, true);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Too many requests, please try again later',
      429,
      true,
      { retryAfter }
    );
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: any) {
    super(
      ErrorCode.DATABASE_ERROR,
      'Database operation failed',
      500,
      false,
      process.env.NODE_ENV === 'development' ? { message, originalError } : undefined
    );
  }
}

// Error factory functions
export const createValidationError = (field: string, message: string): ValidationError => {
  return new ValidationError('Validation failed', [{ field, message }]);
};

export const createValidationErrors = (errors: Array<{ field: string; message: string }>): ValidationError => {
  return new ValidationError('Validation failed', errors);
};

// Sequelize error handler
export const handleSequelizeError = (error: any): AppError => {
  if (error.name === 'SequelizeValidationError') {
    const details = error.errors.map((err: any) => ({
      field: err.path,
      message: err.message,
    }));
    return new ValidationError('Validation failed', details);
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    const field = error.errors[0]?.path || 'field';
    const value = error.errors[0]?.value;
    return new ConflictError(`${field} '${value}' already exists`);
  }

  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return new ValidationError('Invalid reference to related resource');
  }

  if (error.name === 'SequelizeDatabaseError') {
    return new DatabaseError(error.message, error);
  }

  // Default to database error
  return new DatabaseError('An unexpected database error occurred', error);
};

// Type guards
export const isAppError = (error: any): error is AppError => {
  return error instanceof AppError;
};

export const isOperationalError = (error: any): boolean => {
  if (isAppError(error)) {
    return error.isOperational;
  }
  return false;
};