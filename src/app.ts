import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import { appConfig } from '@config/index';
import { logger, morganStream } from '@utils/logger';
import {
  errorHandler,
  notFoundHandler,
  handleUncaughtErrors,
  gracefulShutdown,
  requestId,
  requestLogger,
  security,
  generalLimiter,
  validateContentType,
} from '@middlewares/index';
import { ResponseUtil } from '@utils/response';
import morgan from 'morgan';
import routes from './routes';

// Load environment variables
dotenv.config();

// Handle uncaught errors
handleUncaughtErrors();

// Create Express app
const app: Application = express();

// Basic middleware
app.use(requestId);
app.use(requestLogger);

// Security middleware
app.use(security);

// Rate limiting
app.use(generalLimiter);

// CORS
app.use(cors(appConfig.corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(validateContentType);

// Compression
app.use(compression());

// HTTP request logging
app.use(morgan('combined', { stream: morganStream }));

// Health check endpoint
app.get(`${appConfig.apiPrefix}/health`, (_req: Request, res: Response) => {
  ResponseUtil.success(res, {
    status: 'healthy',
    version: appConfig.appVersion,
    timestamp: new Date().toISOString(),
    environment: appConfig.env,
    services: {
      database: 'checking', // Will be implemented with actual DB check
    },
  });
});

// API Routes
app.use(appConfig.apiPrefix, routes);

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

// Start server
if (require.main === module) {
  const server = app.listen(appConfig.port, appConfig.host, () => {
    logger.info(`🚀 ${appConfig.appName} server is running`);
    logger.info(`📍 URL: http://${appConfig.host}:${appConfig.port}`);
    logger.info(`📚 Environment: ${appConfig.env}`);
    logger.info(`🔧 API Prefix: ${appConfig.apiPrefix}`);
    if (appConfig.swaggerEnabled) {
      logger.info(`📋 API Docs: http://${appConfig.host}:${appConfig.port}${appConfig.swaggerPath}`);
    }
  });

  // Handle graceful shutdown
  gracefulShutdown(server);
}

export default app;