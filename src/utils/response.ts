import { Response } from 'express';
import { ApiResponse, ApiError, PaginatedResponse } from '@types/index';

export class ResponseUtil {
  // Success responses
  static success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode = 200
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T, message = 'Resource created successfully'): Response {
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
  ): Response {
    const totalPages = Math.ceil(total / limit);
    const paginatedResponse: PaginatedResponse<T> = {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
    return this.success(res, paginatedResponse, message);
  }

  // Error responses
  static error(
    res: Response,
    code: string,
    message: string,
    statusCode: number,
    details?: any,
    path?: string
  ): Response {
    const error: ApiError = {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: path || res.req?.originalUrl,
    };

    const response: ApiResponse = {
      success: false,
      error,
    };

    return res.status(statusCode).json(response);
  }

  static badRequest(res: Response, message = 'Bad request', details?: any): Response {
    return this.error(res, 'BAD_REQUEST', message, 400, details);
  }

  static unauthorized(res: Response, message = 'Unauthorized'): Response {
    return this.error(res, 'UNAUTHORIZED', message, 401);
  }

  static forbidden(res: Response, message = 'Forbidden'): Response {
    return this.error(res, 'FORBIDDEN', message, 403);
  }

  static notFound(res: Response, resource = 'Resource'): Response {
    return this.error(res, 'NOT_FOUND', `${resource} not found`, 404);
  }

  static conflict(res: Response, message: string): Response {
    return this.error(res, 'CONFLICT', message, 409);
  }

  static validationError(res: Response, errors: Array<{ field: string; message: string }>): Response {
    return this.error(res, 'VALIDATION_ERROR', 'Validation failed', 422, errors);
  }

  static tooManyRequests(res: Response, retryAfter?: number): Response {
    if (retryAfter) {
      res.setHeader('Retry-After', retryAfter);
    }
    return this.error(res, 'TOO_MANY_REQUESTS', 'Too many requests', 429, { retryAfter });
  }

  static internalError(res: Response, message = 'Internal server error'): Response {
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'An internal server error occurred' 
      : message;
    return this.error(res, 'INTERNAL_ERROR', errorMessage, 500);
  }

  // Helper methods
  static setHeaders(res: Response, headers: Record<string, string | number>): void {
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }

  static setCorsHeaders(res: Response): void {
    this.setHeaders(res, {
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': 86400, // 24 hours
    });
  }

  static setPaginationHeaders(res: Response, page: number, limit: number, total: number): void {
    const totalPages = Math.ceil(total / limit);
    this.setHeaders(res, {
      'X-Page': page,
      'X-Limit': limit,
      'X-Total-Count': total,
      'X-Total-Pages': totalPages,
      'X-Has-Next': page < totalPages ? 'true' : 'false',
      'X-Has-Prev': page > 1 ? 'true' : 'false',
    });
  }
}

// Convenience exports
export const {
  success,
  created,
  noContent,
  paginated,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  validationError,
  tooManyRequests,
  internalError,
} = ResponseUtil;

// Static ApiResponse helper for controllers
export class ApiResponse {
  static success<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
    };
  }

  static error(code: string, message: string, details?: any): ApiResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
      },
    };
  }
}