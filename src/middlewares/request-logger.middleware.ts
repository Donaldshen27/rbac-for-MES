import { Request, Response, NextFunction } from 'express';
import { logger } from '@utils/logger';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request to include request ID
declare global {
  namespace Express {
    interface Request {
      id?: string;
      startTime?: number;
    }
  }
}

/**
 * Adds a unique request ID to each request
 */
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  req.id = req.headers['x-request-id'] as string || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
};

/**
 * Logs incoming requests and outgoing responses
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  req.startTime = Date.now();

  // Log request
  logger.info({
    type: 'request',
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: (req as any).userId,
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - (req.startTime || 0);
    
    logger.info({
      type: 'response',
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length'),
      userId: (req as any).userId,
    });

    // Log slow requests
    if (duration > 1000) {
      logger.warn({
        type: 'slow-request',
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
      });
    }
  });

  next();
};

/**
 * Sanitizes request body for logging (removes sensitive data)
 */
export const sanitizeBody = (body: any): any => {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'refreshToken', 'secret', 'apiKey'];

  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
};

/**
 * Enhanced request logger with body logging (sanitized)
 */
export const detailedRequestLogger = (req: Request, _res: Response, next: NextFunction): void => {
  req.startTime = Date.now();

  // Log detailed request
  const logData: any = {
    type: 'detailed-request',
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    headers: {
      'content-type': req.get('content-type'),
      'user-agent': req.get('user-agent'),
      authorization: req.get('authorization') ? '[PRESENT]' : '[ABSENT]',
    },
    query: req.query,
    params: req.params,
  };

  // Only log body for non-GET requests
  if (req.method !== 'GET' && req.body) {
    logData.body = sanitizeBody(req.body);
  }

  logger.debug(logData);

  next();
};