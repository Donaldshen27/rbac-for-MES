import appConfig from './app.config';
import dbConfig from './database.config';

export const config = {
  env: appConfig.env,
  port: appConfig.port,
  host: appConfig.host,
  app: {
    name: appConfig.appName,
    version: appConfig.appVersion,
    apiPrefix: appConfig.apiPrefix
  },
  cors: appConfig.corsOptions,
  jwt: {
    secret: appConfig.jwtSecret,
    expiresIn: appConfig.jwtExpiry,
    refreshSecret: appConfig.refreshTokenSecret,
    refreshExpiresIn: appConfig.refreshTokenExpiry
  },
  security: {
    saltRounds: appConfig.bcryptRounds
  },
  rateLimit: {
    windowMs: appConfig.rateLimitWindowMs,
    maxRequests: appConfig.rateLimitMaxRequests
  },
  swagger: {
    enabled: appConfig.swaggerEnabled,
    path: appConfig.swaggerPath
  },
  database: dbConfig
};

export type Config = typeof config;