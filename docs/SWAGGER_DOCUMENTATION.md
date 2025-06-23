# Swagger API Documentation

## Overview

The RBAC System provides comprehensive API documentation using Swagger/OpenAPI 3.0. The documentation is interactive, allowing you to test API endpoints directly from your browser.

## Accessing the Documentation

### Development Environment
- URL: `http://localhost:3000/api-docs`
- The documentation is enabled by default in development mode

### Production Environment
- URL: `https://api.yourdomain.com/api-docs`
- Can be disabled by setting `SWAGGER_ENABLED=false` in environment variables

## Features

### 1. Interactive API Testing
- **Try It Out**: Test endpoints directly from the documentation
- **Authentication**: Use the "Authorize" button to add JWT tokens
- **Request/Response Examples**: View sample requests and responses
- **Parameter Validation**: See required and optional parameters

### 2. Authentication

To test authenticated endpoints:

1. First, obtain a JWT token by calling the `/auth/login` endpoint
2. Click the "Authorize" button at the top of the page
3. Enter your token in the format: `Bearer YOUR_JWT_TOKEN`
4. Click "Authorize" to apply the token to all requests

The token will persist across page refreshes.

### 3. API Sections

The API is organized into the following sections:

#### Authentication (`/auth`)
- User registration and login
- Token refresh and logout
- Profile management
- Password operations
- Session management

#### Users (`/users`)
- User CRUD operations
- Bulk operations
- User statistics
- Role assignments
- Export functionality

#### Roles (`/roles`)
- Role management
- Role hierarchy
- Permission assignments
- User-role associations
- Role cloning

#### Permissions (`/permissions`)
- Permission CRUD operations
- Permission checking
- Resource-action mapping
- Role-permission management

#### Resources (`/resources`)
- Resource management
- Permission counting
- Resource-permission associations

#### Menus (`/menus`)
- Menu hierarchy management
- User-specific menus
- Menu permissions
- Reordering and moving

#### Health (`/health`)
- System health checks
- Version information

## Configuration

### Environment Variables

```env
# Enable/disable Swagger documentation
SWAGGER_ENABLED=true

# Swagger documentation path
SWAGGER_PATH=/api-docs

# API version (shown in docs)
APP_VERSION=1.0.0
```

### Swagger Configuration

The Swagger configuration is located in `src/config/swagger.config.ts`:

```typescript
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RBAC System API',
      version: '1.0.0',
      description: 'Role-Based Access Control System API'
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/swagger/*.yaml']
};
```

## API Documentation Structure

### 1. Path Definitions
Each endpoint is documented with:
- Summary and description
- Operation ID
- Security requirements
- Parameters (path, query, body)
- Request/response schemas
- Error responses

Example:
```yaml
paths:
  /users:
    get:
      tags:
        - Users
      summary: List users
      description: Get a paginated list of users
      operationId: getUsers
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/pageParam'
        - $ref: '#/components/parameters/limitParam'
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserList'
```

### 2. Schema Definitions
Reusable schemas for request/response bodies:
- User, Role, Permission, Menu, Resource models
- Pagination metadata
- Error responses
- Token responses

### 3. Security Definitions
- Bearer token authentication
- Permission requirements documented per endpoint

## Best Practices

### 1. Testing Endpoints
- Always authenticate first for protected endpoints
- Use realistic test data
- Check error responses for proper error handling
- Test pagination and filtering parameters

### 2. Development Workflow
1. Make API changes in code
2. Update Swagger documentation
3. Test changes in Swagger UI
4. Verify request/response formats

### 3. Documentation Updates
When adding new endpoints:
1. Add path definition in appropriate `.yaml` file
2. Define schemas for new data structures
3. Include all possible response codes
4. Add meaningful descriptions and examples

## Common Operations

### 1. User Registration and Login
```bash
# Register
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "username": "newuser",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}

# Login
POST /api/v1/auth/login
{
  "login": "user@example.com",
  "password": "SecurePass123!"
}
```

### 2. Managing Roles and Permissions
```bash
# Create role
POST /api/v1/roles
{
  "name": "manager",
  "description": "Manager role"
}

# Assign permissions
PUT /api/v1/roles/{roleId}/permissions
{
  "permissionIds": ["perm-id-1", "perm-id-2"]
}
```

### 3. User Management
```bash
# List users with filters
GET /api/v1/users?page=1&limit=20&isActive=true

# Update user roles
PUT /api/v1/users/{userId}/roles
{
  "roleIds": ["role-id-1", "role-id-2"]
}
```

## Troubleshooting

### Common Issues

1. **Swagger UI not loading**
   - Check if `SWAGGER_ENABLED=true`
   - Verify the swagger path is correct
   - Check for JavaScript errors in console

2. **Authorization not working**
   - Ensure token format is `Bearer <token>`
   - Check token expiration
   - Verify token has required permissions

3. **Try it out not working**
   - Check CORS configuration
   - Verify API server is running
   - Check network requests in browser tools

### Debug Mode

Enable detailed Swagger logs:
```typescript
// In swagger.middleware.ts
console.log('Swagger spec:', JSON.stringify(swaggerSpec, null, 2));
```

## Security Considerations

1. **Production Environment**
   - Consider disabling Swagger in production
   - Use authentication for Swagger access
   - Implement rate limiting on Swagger endpoints

2. **Sensitive Information**
   - Don't expose internal implementation details
   - Sanitize error messages
   - Hide sensitive fields in responses

## Extending Documentation

### Adding Custom Endpoints

1. Create a new YAML file in `src/swagger/`
2. Define paths and schemas
3. The file will be automatically included

### Custom Themes

Modify the Swagger UI appearance:
```typescript
const customCss = `
  .swagger-ui .topbar { display: none; }
  .swagger-ui .info .title { color: #333; }
`;
```

### Adding Examples

Include request/response examples:
```yaml
examples:
  UserExample:
    value:
      id: "550e8400-e29b-41d4-a716-446655440000"
      email: "john@example.com"
      username: "john_doe"
```

## API Client Generation

Generate client libraries from the Swagger spec:

```bash
# Generate TypeScript client
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:3000/api-docs/swagger.json \
  -g typescript-axios \
  -o ./generated/api-client

# Generate Python client
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:3000/api-docs/swagger.json \
  -g python \
  -o ./generated/python-client
```

---

For more information about OpenAPI specification, visit: https://swagger.io/specification/