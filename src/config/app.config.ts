import dotenv from 'dotenv';
import { CorsOptions } from 'cors';

// Load environment variables
dotenv.config();

export interface AppConfig {
  env: string;
  port: number;
  host: string;
  appName: string;
  appVersion: string;
  apiPrefix: string;
  corsOptions: CorsOptions;
  jwtSecret: string;
  jwtExpiry: string;
  refreshTokenSecret: string;
  refreshTokenExpiry: string;
  bcryptRounds: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  swaggerEnabled: boolean;
  swaggerPath: string;
}

const config: AppConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  appName: process.env.APP_NAME || 'RBAC-System',
  appVersion: process.env.APP_VERSION || '1.0.0',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOptions: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true',
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  },
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  jwtExpiry: process.env.JWT_EXPIRY || '15m',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'your-super-secret-refresh-token-key',
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  swaggerEnabled: process.env.SWAGGER_ENABLED === 'true' || process.env.NODE_ENV !== 'production',
  swaggerPath: process.env.SWAGGER_PATH || '/api-docs',
};

// Validate required configuration in production
if (config.env === 'production') {
  const requiredEnvVars = [
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables in production: ${missingVars.join(', ')}`
    );
  }

  // Warn about default secrets
  if (
    config.jwtSecret === 'your-super-secret-jwt-key' ||
    config.refreshTokenSecret === 'your-super-secret-refresh-token-key'
  ) {
    console.warn('WARNING: Using default JWT secrets in production is insecure!');
  }
}

export default config;