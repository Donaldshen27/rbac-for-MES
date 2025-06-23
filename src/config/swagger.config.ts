import swaggerJsdoc from 'swagger-jsdoc';
import { appConfig } from './app.config';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RBAC System API',
      version: appConfig.appVersion,
      description: 'A comprehensive Role-Based Access Control (RBAC) system designed for Manufacturing Execution Systems (MES) and other applications requiring sophisticated permission management.',
      contact: {
        name: 'RBAC System Team',
        url: 'https://github.com/Donaldshen27/rbac-for-MES',
        email: 'support@rbac-system.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${appConfig.port}${appConfig.apiPrefix}`,
        description: 'Development server'
      },
      {
        url: `http://staging.rbac-system.com${appConfig.apiPrefix}`,
        description: 'Staging server'
      },
      {
        url: `https://api.rbac-system.com${appConfig.apiPrefix}`,
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /auth/login endpoint'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'ERR_001'
                },
                details: {
                  type: 'string',
                  example: 'Detailed error information'
                }
              }
            }
          }
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1
            },
            limit: {
              type: 'integer',
              example: 20
            },
            total: {
              type: 'integer',
              example: 100
            },
            totalPages: {
              type: 'integer',
              example: 5
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000'
            },
            username: {
              type: 'string',
              example: 'john_doe'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com'
            },
            firstName: {
              type: 'string',
              example: 'John'
            },
            lastName: {
              type: 'string',
              example: 'Doe'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            isSuperuser: {
              type: 'boolean',
              example: false
            },
            roles: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Role'
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00Z'
            }
          }
        },
        Role: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000'
            },
            name: {
              type: 'string',
              example: 'admin'
            },
            description: {
              type: 'string',
              example: 'Administrator role with full access'
            },
            isSystem: {
              type: 'boolean',
              example: false
            },
            parentId: {
              type: 'string',
              format: 'uuid',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Permission: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string',
              example: 'user:create'
            },
            resource: {
              type: 'string',
              example: 'user'
            },
            action: {
              type: 'string',
              example: 'create'
            },
            description: {
              type: 'string',
              example: 'Create new users'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Menu: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string',
              example: 'Dashboard'
            },
            path: {
              type: 'string',
              example: '/dashboard'
            },
            icon: {
              type: 'string',
              example: 'dashboard'
            },
            parentId: {
              type: 'string',
              format: 'uuid',
              nullable: true
            },
            order: {
              type: 'integer',
              example: 1
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Resource: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string',
              example: 'user'
            },
            description: {
              type: 'string',
              example: 'User management resource'
            },
            permissionCount: {
              type: 'integer',
              example: 5
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        LoginCredentials: {
          type: 'object',
          required: ['login', 'password'],
          properties: {
            login: {
              type: 'string',
              description: 'Email or username',
              example: 'admin@example.com'
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'Admin@123'
            }
          }
        },
        TokenResponse: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            refreshToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            tokenType: {
              type: 'string',
              example: 'Bearer'
            },
            expiresIn: {
              type: 'integer',
              example: 900
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Authentication required',
                error: {
                  code: 'AUTH_001',
                  details: 'No authorization header provided'
                }
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Access forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Insufficient permissions',
                error: {
                  code: 'AUTH_004',
                  details: 'User does not have required permission'
                }
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Resource not found',
                error: {
                  code: 'NOT_FOUND',
                  details: 'The requested resource does not exist'
                }
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Validation failed',
                error: {
                  code: 'VALIDATION_ERROR',
                  details: 'Invalid input data'
                }
              }
            }
          }
        },
        ConflictError: {
          description: 'Conflict error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Resource already exists',
                error: {
                  code: 'CONFLICT',
                  details: 'A resource with the same identifier already exists'
                }
              }
            }
          }
        }
      },
      parameters: {
        idParam: {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Resource ID',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        },
        pageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          }
        },
        limitParam: {
          name: 'limit',
          in: 'query',
          description: 'Items per page',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20
          }
        },
        searchParam: {
          name: 'search',
          in: 'query',
          description: 'Search term',
          schema: {
            type: 'string'
          }
        },
        sortParam: {
          name: 'sort',
          in: 'query',
          description: 'Sort field',
          schema: {
            type: 'string'
          }
        },
        orderParam: {
          name: 'order',
          in: 'query',
          description: 'Sort order',
          schema: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'asc'
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication and authorization endpoints'
      },
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Roles',
        description: 'Role management endpoints'
      },
      {
        name: 'Permissions',
        description: 'Permission management endpoints'
      },
      {
        name: 'Resources',
        description: 'Resource management endpoints'
      },
      {
        name: 'Menus',
        description: 'Menu and navigation management endpoints'
      },
      {
        name: 'Health',
        description: 'System health and status endpoints'
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/swagger/*.yaml'
  ]
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);