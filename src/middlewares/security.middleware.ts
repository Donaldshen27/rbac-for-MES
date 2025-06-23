import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { AppError } from '@utils/errors';
import { ErrorCode } from '../types';

/**
 * Security headers middleware using Helmet
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
});

/**
 * Prevent XSS attacks by sanitizing user input
 */
export const xssProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Set additional XSS protection headers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
};

/**
 * Prevent clickjacking attacks
 */
export const frameGuard = (req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('X-Frame-Options', 'DENY');
  next();
};

/**
 * Prevent MIME type sniffing
 */
export const noSniff = (req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
};

/**
 * Remove sensitive headers
 */
export const removePoweredBy = (req: Request, res: Response, next: NextFunction): void => {
  res.removeHeader('X-Powered-By');
  next();
};

/**
 * Validate content type for POST/PUT/PATCH requests
 */
export const validateContentType = (req: Request, res: Response, next: NextFunction): void => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Content-Type must be application/json',
        415
      );
    }
  }
  next();
};

/**
 * Prevent large payload attacks
 */
export const payloadLimit = (limit: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.get('content-length') || '0');
    const maxSize = parseSize(limit);
    
    if (contentLength > maxSize) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Request payload too large',
        413
      );
    }
    next();
  };
};

/**
 * Rate limiting headers
 */
export const rateLimitHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // These will be set by express-rate-limit, but we can add custom ones
  res.setHeader('X-RateLimit-Policy', 'sliding-window');
  next();
};

/**
 * HSTS (HTTP Strict Transport Security) for production
 */
export const hstsHeaders = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  next();
};

/**
 * Referrer policy
 */
export const referrerPolicy = (req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

/**
 * Permissions policy (formerly Feature policy)
 */
export const permissionsPolicy = (req: Request, res: Response, next: NextFunction): void => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  next();
};

// Helper function to parse size strings
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = size.toLowerCase().match(/^(\d+)(b|kb|mb|gb)?$/);
  if (!match) {
    throw new Error(`Invalid size format: ${size}`);
  }

  const value = parseInt(match[1]);
  const unit = match[2] || 'b';
  
  return value * units[unit];
}

/**
 * Combined security middleware
 */
export const security = [
  securityHeaders,
  xssProtection,
  frameGuard,
  noSniff,
  removePoweredBy,
  hstsHeaders,
  referrerPolicy,
  permissionsPolicy,
];