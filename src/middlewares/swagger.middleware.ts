import swaggerUi from 'swagger-ui-express';
import { Router } from 'express';
import { swaggerSpec } from '../config/swagger.config';
import { appConfig } from '../config/app.config';

/**
 * Create Swagger documentation router
 */
export const createSwaggerRouter = (): Router => {
  const router = Router();

  // Serve Swagger JSON spec
  router.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Custom CSS for Swagger UI
  const customCss = `
    .swagger-ui .topbar { 
      display: none;
    }
    .swagger-ui .info .title {
      color: #333;
    }
    .swagger-ui .scheme-container {
      background: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
    }
    .swagger-ui .btn.authorize {
      background-color: #4CAF50;
      color: white;
    }
    .swagger-ui .btn.authorize.unlocked {
      background-color: #f44336;
    }
  `;

  // Swagger UI options
  const swaggerOptions: swaggerUi.SwaggerUiOptions = {
    customCss,
    customSiteTitle: 'RBAC System API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true,
      validatorUrl: null,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha'
    }
  };

  // Serve Swagger UI
  router.use('/', swaggerUi.serve);
  router.get('/', swaggerUi.setup(swaggerSpec, swaggerOptions));

  return router;
};

/**
 * Apply Swagger documentation to Express app
 */
export const setupSwagger = (app: any): void => {
  if (appConfig.swaggerEnabled) {
    app.use(appConfig.swaggerPath, createSwaggerRouter());
    
    console.log(`📚 Swagger documentation available at: ${appConfig.swaggerPath}`);
  }
};