import { Request, Response, NextFunction } from 'express';
import { logger } from '@utils/logger';
import { 
  AppError, 
  isAppError, 
  isOperationalError,
  handleSequelizeError 
} from '@utils/errors';
import { ResponseUtil } from '@utils/response';
import { ErrorCode } from '../types';
import { ValidationError as JoiValidationError } from 'joi';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

// 404 Not Found handler
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new AppError(
    ErrorCode.NOT_FOUND,
    `Cannot ${req.method} ${req.originalUrl}`,
    404
  );
  next(error);
};

// Global error handler
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error details
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: (req as any).userId,
  });

  // Handle specific error types
  let error: AppError;

  if (isAppError(err)) {
    error = err;
  } else if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    error = handleSequelizeError(err);
  } else if (err instanceof JoiValidationError) {
    const details = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    error = new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      400,
      true,
      details
    );
  } else if (err instanceof TokenExpiredError) {
    error = new AppError(
      ErrorCode.AUTH_TOKEN_EXPIRED,
      'Token has expired',
      401
    );
  } else if (err instanceof JsonWebTokenError) {
    error = new AppError(
      ErrorCode.AUTH_TOKEN_INVALID,
      'Invalid token',
      401
    );
  } else if (err.name === 'UnauthorizedError') {
    error = new AppError(
      ErrorCode.AUTH_TOKEN_INVALID,
      err.message || 'Unauthorized',
      401
    );
  } else if (err.name === 'PayloadTooLargeError') {
    error = new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Request payload too large',
      413
    );
  } else {
    // Unhandled errors
    error = new AppError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      process.env.NODE_ENV === 'production' 
        ? 'An internal server error occurred' 
        : err.message,
      500,
      false
    );
  }

  // Send error response
  ResponseUtil.error(
    res,
    error.code,
    error.message,
    error.statusCode,
    error.details,
    req.originalUrl
  );

  // In production, notify monitoring service for non-operational errors
  if (process.env.NODE_ENV === 'production' && !isOperationalError(error)) {
    // TODO: Send to monitoring service (e.g., Sentry, DataDog)
    logger.error('Non-operational error occurred:', {
      error: error.toJSON(),
      request: {
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
        body: req.body,
      },
    });
  }
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Express error handling for uncaught errors
export const handleUncaughtErrors = (): void => {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    // Give time to log the error before shutting down
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Give time to log the error before shutting down
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
};

// Graceful shutdown handler
export const gracefulShutdown = (server: any): void => {
  const shutdown = (signal: string) => {
    logger.info(`${signal} signal received: closing HTTP server`);
    server.close(() => {
      logger.info('HTTP server closed');
      // Close database connections
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};