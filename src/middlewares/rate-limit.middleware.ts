import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { Request, Response } from 'express';
import { ResponseUtil } from '@utils/response';
import { ErrorCode } from '@types/index';
import appConfig from '@config/app.config';

/**
 * Default rate limit configuration
 */
const defaultOptions = {
  windowMs: appConfig.rateLimitWindowMs,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    ResponseUtil.error(
      res,
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Too many requests, please try again later',
      429,
      { retryAfter: Math.ceil(appConfig.rateLimitWindowMs / 1000) }
    );
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/api/v1/health';
  },
};

/**
 * General API rate limiter
 */
export const generalLimiter = rateLimit({
  ...defaultOptions,
  max: appConfig.rateLimitMaxRequests,
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  ...defaultOptions,
  max: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true,
});

/**
 * Rate limiter for password reset
 */
export const passwordResetLimiter = rateLimit({
  ...defaultOptions,
  max: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many password reset attempts, please try again later',
});

/**
 * Rate limiter for user registration
 */
export const registrationLimiter = rateLimit({
  ...defaultOptions,
  max: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many registration attempts, please try again later',
});

/**
 * Rate limiter for file uploads
 */
export const uploadLimiter = rateLimit({
  ...defaultOptions,
  max: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many upload requests, please try again later',
});

/**
 * Dynamic rate limiter based on user role
 */
export const createDynamicLimiter = (
  limits: { [role: string]: number },
  defaultLimit = 100
): RateLimitRequestHandler => {
  return rateLimit({
    ...defaultOptions,
    max: (req: Request) => {
      const user = (req as any).user;
      if (!user) return defaultLimit;

      // Superusers have no rate limit
      if (user.isSuperuser) return 0;

      // Check user roles for highest limit
      const userRoles = user.roles || [];
      let maxLimit = defaultLimit;

      userRoles.forEach((role: string) => {
        if (limits[role] && limits[role] > maxLimit) {
          maxLimit = limits[role];
        }
      });

      return maxLimit;
    },
  });
};

/**
 * IP-based rate limiter for public endpoints
 */
export const publicEndpointLimiter = rateLimit({
  ...defaultOptions,
  max: 30,
  windowMs: 60 * 1000, // 1 minute
  keyGenerator: (req: Request) => {
    // Use IP address as key
    return req.ip || 'unknown';
  },
});

/**
 * Create custom rate limiter
 */
export const createRateLimiter = (
  max: number,
  windowMs: number,
  message?: string
): RateLimitRequestHandler => {
  return rateLimit({
    ...defaultOptions,
    max,
    windowMs,
    message: message || defaultOptions.message,
  });
};