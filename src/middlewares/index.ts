// Error handling
export { 
  errorHandler, 
  notFoundHandler, 
  asyncHandler,
  handleUncaughtErrors,
  gracefulShutdown 
} from './error.middleware';

// Async handling
export { 
  asyncMiddleware, 
  wrapAsync, 
  wrapController 
} from './async.middleware';

// Request logging
export { 
  requestId, 
  requestLogger, 
  detailedRequestLogger,
  sanitizeBody 
} from './request-logger.middleware';

// Security
export { 
  security,
  securityHeaders,
  xssProtection,
  frameGuard,
  noSniff,
  removePoweredBy,
  validateContentType,
  payloadLimit,
  rateLimitHeaders,
  hstsHeaders,
  referrerPolicy,
  permissionsPolicy
} from './security.middleware';

// Rate limiting
export {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  registrationLimiter,
  uploadLimiter,
  publicEndpointLimiter,
  createDynamicLimiter,
  createRateLimiter
} from './rate-limit.middleware';

// Validation
export {
  validate,
  validateMultiple,
  ValidationTarget,
  commonPatterns,
  createPaginationSchema,
  createSearchSchema,
  extendedJoi,
  sanitizeHtml
} from './validation.middleware';

// Permission checking
export {
  requirePermission,
  requireRole,
  requireOwnershipOrPermission,
  requireSuperuser,
  requireDynamicPermission,
  requireResourcePermission,
  requireAny,
  auditPermissionCheck
} from './permission.middleware';