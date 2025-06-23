# RBAC Permission Management System Design Document

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Design](#architecture-design)
3. [Database Design](#database-design)
4. [API Design](#api-design)
5. [Security Design](#security-design)
6. [Implementation Plan](#implementation-plan)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Guide](#deployment-guide)

## 1. System Overview

### 1.1 Purpose
This document outlines the design for a Role-Based Access Control (RBAC) permission management system tailored for Manufacturing Execution Systems (MES). The system provides a flexible, secure, and scalable solution for managing user permissions across web and mobile platforms.

### 1.2 Scope
- Generic RBAC module supporting hierarchical menu structures
- RESTful APIs for web and mobile clients
- MySQL database backend
- JWT-based authentication
- Swagger API documentation
- Support for MES-specific requirements

### 1.3 Key Features
- User management with role assignments
- Hierarchical role and permission management
- Menu-based permission control
- Resource and action-based permissions
- Audit logging
- Token-based authentication with refresh tokens
- Real-time permission validation
- Multi-tenant support (future consideration)

## 2. Architecture Design

### 2.1 Technology Stack
```
Runtime:        Node.js v18+ (LTS)
Framework:      Express.js 4.x
Language:       TypeScript 5.x
Database:       MySQL 8.0
ORM:            Sequelize 6.x
Validation:     Joi
Auth:           JWT (jsonwebtoken)
Documentation:  Swagger/OpenAPI 3.0
Cache:          Redis (optional)
Testing:        Jest, Supertest
Logging:        Winston
Process:        PM2
```

### 2.2 System Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Web Client    │     │  Mobile Client  │     │   Admin Panel   │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                         │
         └───────────────────────┴─────────────────────────┘
                                 │
                        ┌────────┴────────┐
                        │   API Gateway   │
                        │   (Express)     │
                        └────────┬────────┘
                                 │
                ┌────────────────┴────────────────┐
                │                                 │
         ┌──────┴──────┐                ┌────────┴────────┐
         │ Auth Module │                │  RBAC Module    │
         │    (JWT)    │                │  (Permissions)  │
         └──────┬──────┘                └────────┬────────┘
                │                                 │
                └──────────────┬──────────────────┘
                               │
                      ┌────────┴────────┐
                      │   Data Layer    │
                      │  (Sequelize)    │
                      └────────┬────────┘
                               │
                      ┌────────┴────────┐
                      │     MySQL       │
                      └─────────────────┘
```

### 2.3 Folder Structure
```
rbac-system/
├── src/
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── app.config.ts
│   │   ├── swagger.config.ts
│   │   └── redis.config.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── role.controller.ts
│   │   ├── permission.controller.ts
│   │   ├── menu.controller.ts
│   │   └── audit.controller.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── permission.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── logger.middleware.ts
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── role.model.ts
│   │   ├── permission.model.ts
│   │   ├── menu.model.ts
│   │   ├── resource.model.ts
│   │   └── audit.model.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── role.routes.ts
│   │   ├── permission.routes.ts
│   │   ├── menu.routes.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── role.service.ts
│   │   ├── permission.service.ts
│   │   ├── menu.service.ts
│   │   └── cache.service.ts
│   ├── utils/
│   │   ├── jwt.util.ts
│   │   ├── bcrypt.util.ts
│   │   ├── logger.util.ts
│   │   └── response.util.ts
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   ├── user.validator.ts
│   │   ├── role.validator.ts
│   │   └── permission.validator.ts
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── user.types.ts
│   │   ├── permission.types.ts
│   │   └── index.ts
│   └── app.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/
│   ├── init-db.sql
│   ├── seed-data.sql
│   └── migration/
├── docs/
│   ├── SYSTEM_DESIGN.md
│   ├── API_DOCUMENTATION.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── USER_GUIDE.md
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
└── swagger/
    └── openapi.yaml
```

## 3. Database Design

### 3.1 Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    users    │     │ user_roles  │     │    roles    │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id (PK)     │────<│ user_id(FK) │>────│ id (PK)     │
│ username    │     │ role_id(FK) │     │ name        │
│ email       │     │ assigned_at │     │ description │
│ password    │     │ assigned_by │     │ is_system   │
│ first_name  │     └─────────────┘     │ created_at  │
│ last_name   │                         │ updated_at  │
│ is_active   │                         └──────┬──────┘
│ is_superuser│                                │
│ created_at  │                                │
│ updated_at  │                                │
│ last_login  │                                │
└─────────────┘                                │
                                               │
┌─────────────┐     ┌────────────────┐        │
│   menus     │     │menu_permissions│        │
├─────────────┤     ├────────────────┤        │
│ id (PK)     │────<│ menu_id (FK)   │        │
│ parent_id   │     │ role_id (FK)   │>───────┘
│ title       │     │ can_view       │
│ href        │     │ can_edit       │
│ icon        │     │ can_delete     │
│ target      │     │ can_export     │
│ order_index │     └────────────────┘
│ is_active   │
└─────────────┘

┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│ permissions │     │ role_permissions │     │    roles    │
├─────────────┤     ├──────────────────┤     └─────────────┘
│ id (PK)     │────<│ permission_id(FK)│>──────────┘
│ name        │     │ role_id (FK)     │
│ resource    │     │ granted_at       │
│ action      │     │ granted_by       │
│ description │     └──────────────────┘
│ created_at  │
│ updated_at  │
└─────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  resources  │     │ audit_logs  │     │refresh_tokens│
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id (PK)     │     │ id (PK)     │     │ id (PK)     │
│ name        │     │ user_id(FK) │     │ user_id(FK) │
│ description │     │ action      │     │ token       │
│ created_at  │     │ resource    │     │ expires_at  │
│ updated_at  │     │ resource_id │     │ created_at  │
└─────────────┘     │ ip_address  │     └─────────────┘
                    │ user_agent  │
                    │ created_at  │
                    └─────────────┘
```

### 3.2 Table Definitions

#### 3.2.1 users
```sql
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_is_active (is_active)
);
```

#### 3.2.2 roles
```sql
CREATE TABLE roles (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_is_system (is_system)
);
```

#### 3.2.3 permissions
```sql
CREATE TABLE permissions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_resource_action (resource, action)
);
```

#### 3.2.4 menus
```sql
CREATE TABLE menus (
    id VARCHAR(10) PRIMARY KEY,
    parent_id VARCHAR(10) NULL,
    title VARCHAR(100) NOT NULL,
    href VARCHAR(255),
    icon VARCHAR(50),
    target VARCHAR(20) DEFAULT '_self',
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES menus(id) ON DELETE CASCADE,
    INDEX idx_parent_id (parent_id),
    INDEX idx_is_active (is_active),
    INDEX idx_order_index (order_index)
);
```

#### 3.2.5 Junction Tables
```sql
-- User-Role relationship
CREATE TABLE user_roles (
    user_id CHAR(36),
    role_id CHAR(36),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by CHAR(36),
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_role_id (role_id)
);

-- Role-Permission relationship
CREATE TABLE role_permissions (
    role_id CHAR(36),
    permission_id CHAR(36),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by CHAR(36),
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id),
    INDEX idx_role_id (role_id),
    INDEX idx_permission_id (permission_id)
);

-- Menu-Permission relationship
CREATE TABLE menu_permissions (
    menu_id VARCHAR(10),
    role_id CHAR(36),
    can_view BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_export BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (menu_id, role_id),
    FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    INDEX idx_menu_id (menu_id),
    INDEX idx_role_id (role_id)
);
```

### 3.3 MES-Specific Permissions

Based on the MES menu structure, permissions will follow this pattern:

```
Pattern: <module>:<action>
Examples:
- system:manage_users
- production:create_work_order
- production:view_reports
- quality:manage_defects
- menu:<menu_id>:view
- menu:<menu_id>:edit
```

## 4. API Design

### 4.1 API Versioning
All APIs will follow the pattern: `/api/v1/{resource}`

### 4.2 Authentication Endpoints

#### 4.2.1 Register
```
POST /api/v1/auth/register
Content-Type: application/json

Request:
{
    "username": "string",
    "email": "string",
    "password": "string",
    "firstName": "string",
    "lastName": "string"
}

Response:
{
    "success": true,
    "data": {
        "user": {
            "id": "uuid",
            "username": "string",
            "email": "string",
            "firstName": "string",
            "lastName": "string"
        }
    },
    "message": "User registered successfully"
}
```

#### 4.2.2 Login
```
POST /api/v1/auth/login
Content-Type: application/json

Request:
{
    "username": "string", // or email
    "password": "string"
}

Response:
{
    "success": true,
    "data": {
        "user": {
            "id": "uuid",
            "username": "string",
            "email": "string",
            "roles": ["role1", "role2"]
        },
        "accessToken": "jwt_token",
        "refreshToken": "refresh_token",
        "expiresIn": 900
    }
}
```

#### 4.2.3 Refresh Token
```
POST /api/v1/auth/refresh
Content-Type: application/json

Request:
{
    "refreshToken": "string"
}

Response:
{
    "success": true,
    "data": {
        "accessToken": "new_jwt_token",
        "expiresIn": 900
    }
}
```

### 4.3 User Management Endpoints

#### 4.3.1 List Users
```
GET /api/v1/users?page=1&limit=20&search=keyword&role=admin
Authorization: Bearer {token}

Response:
{
    "success": true,
    "data": {
        "users": [
            {
                "id": "uuid",
                "username": "string",
                "email": "string",
                "firstName": "string",
                "lastName": "string",
                "isActive": true,
                "roles": ["role1", "role2"],
                "createdAt": "2024-01-01T00:00:00Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 100,
            "totalPages": 5
        }
    }
}
```

#### 4.3.2 Get User Details
```
GET /api/v1/users/{userId}
Authorization: Bearer {token}

Response:
{
    "success": true,
    "data": {
        "user": {
            "id": "uuid",
            "username": "string",
            "email": "string",
            "firstName": "string",
            "lastName": "string",
            "isActive": true,
            "isSuperuser": false,
            "roles": [
                {
                    "id": "uuid",
                    "name": "role_name",
                    "description": "string"
                }
            ],
            "permissions": ["permission1", "permission2"],
            "createdAt": "2024-01-01T00:00:00Z",
            "lastLogin": "2024-01-01T00:00:00Z"
        }
    }
}
```

#### 4.3.3 Assign Role to User
```
POST /api/v1/users/{userId}/roles
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
    "roleId": "uuid"
}

Response:
{
    "success": true,
    "message": "Role assigned successfully"
}
```

### 4.4 Role Management Endpoints

#### 4.4.1 List Roles
```
GET /api/v1/roles?page=1&limit=20
Authorization: Bearer {token}

Response:
{
    "success": true,
    "data": {
        "roles": [
            {
                "id": "uuid",
                "name": "string",
                "description": "string",
                "isSystem": false,
                "userCount": 10,
                "permissionCount": 25,
                "createdAt": "2024-01-01T00:00:00Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 10,
            "totalPages": 1
        }
    }
}
```

#### 4.4.2 Create Role
```
POST /api/v1/roles
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
    "name": "string",
    "description": "string",
    "permissions": ["permission_id1", "permission_id2"]
}

Response:
{
    "success": true,
    "data": {
        "role": {
            "id": "uuid",
            "name": "string",
            "description": "string"
        }
    },
    "message": "Role created successfully"
}
```

### 4.5 Permission Endpoints

#### 4.5.1 List Permissions
```
GET /api/v1/permissions?resource=user&action=create
Authorization: Bearer {token}

Response:
{
    "success": true,
    "data": {
        "permissions": [
            {
                "id": "uuid",
                "name": "user:create",
                "resource": "user",
                "action": "create",
                "description": "Create new users"
            }
        ]
    }
}
```

#### 4.5.2 Check Permission
```
GET /api/v1/permissions/check?permission=user:create
Authorization: Bearer {token}

Response:
{
    "success": true,
    "data": {
        "hasPermission": true
    }
}
```

### 4.6 Menu Permission Endpoints

#### 4.6.1 Get User Menu
```
GET /api/v1/menus/user-menu
Authorization: Bearer {token}

Response:
{
    "success": true,
    "data": {
        "menus": [
            {
                "id": "1",
                "title": "基础数据",
                "href": "",
                "icon": "fa-solid fa-box-open",
                "target": "_self",
                "children": [
                    {
                        "id": "11",
                        "title": "产品定义",
                        "href": "page/base_info/product/product_info.html",
                        "icon": "fa-solid fa-circle-info",
                        "target": "_self",
                        "permissions": {
                            "canView": true,
                            "canEdit": true,
                            "canDelete": false,
                            "canExport": true
                        }
                    }
                ]
            }
        ]
    }
}
```

#### 4.6.2 Update Menu Permissions
```
PUT /api/v1/roles/{roleId}/menu-permissions
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
    "menuPermissions": [
        {
            "menuId": "11",
            "canView": true,
            "canEdit": true,
            "canDelete": false,
            "canExport": true
        }
    ]
}

Response:
{
    "success": true,
    "message": "Menu permissions updated successfully"
}
```

### 4.7 Error Response Format
```json
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "Human-readable error message",
        "details": [
            {
                "field": "email",
                "message": "Invalid email format"
            }
        ],
        "timestamp": "2024-01-01T00:00:00Z",
        "path": "/api/v1/users"
    }
}
```

### 4.8 Common HTTP Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 422: Unprocessable Entity
- 500: Internal Server Error

## 5. Security Design

### 5.1 Authentication Flow
```
┌────────┐      ┌────────┐      ┌────────┐      ┌────────┐
│ Client │      │  API   │      │  Auth  │      │   DB   │
└───┬────┘      └───┬────┘      └───┬────┘      └───┬────┘
    │               │               │               │
    │ 1. Login      │               │               │
    ├──────────────>│               │               │
    │               │ 2. Validate   │               │
    │               ├──────────────>│               │
    │               │               │ 3. Check User │
    │               │               ├──────────────>│
    │               │               │<──────────────┤
    │               │ 4. Generate   │               │
    │               │    Tokens     │               │
    │               │<──────────────┤               │
    │ 5. Return     │               │               │
    │    Tokens     │               │               │
    │<──────────────┤               │               │
    │               │               │               │
    │ 6. API Call   │               │               │
    │    with Token │               │               │
    ├──────────────>│               │               │
    │               │ 7. Verify     │               │
    │               │    Token      │               │
    │               ├──────────────>│               │
    │               │<──────────────┤               │
    │               │ 8. Check      │               │
    │               │    Permissions│               │
    │               ├───────────────────────────────>│
    │               │<───────────────────────────────┤
    │ 9. Response   │               │               │
    │<──────────────┤               │               │
```

### 5.2 JWT Token Structure

#### Access Token Payload:
```json
{
    "sub": "user_id",
    "username": "john_doe",
    "email": "john@example.com",
    "roles": ["admin", "user"],
    "permissions": ["user:create", "user:read"],
    "iat": 1234567890,
    "exp": 1234568790
}
```

### 5.3 Security Measures

1. **Password Security**
   - Bcrypt hashing with salt rounds = 10
   - Minimum password requirements:
     - Length: 8 characters
     - Must contain: uppercase, lowercase, number, special character
   - Password history to prevent reuse

2. **Token Security**
   - Access token expiry: 15 minutes
   - Refresh token expiry: 7 days
   - Token rotation on refresh
   - Blacklist for revoked tokens

3. **API Security**
   - Rate limiting: 100 requests per minute per IP
   - CORS configuration for allowed origins
   - Input validation and sanitization
   - SQL injection prevention via Sequelize ORM
   - XSS protection headers

4. **Audit Logging**
   - Log all authentication attempts
   - Log permission changes
   - Log sensitive operations
   - Store IP address and user agent

### 5.4 Permission Checking Middleware

```typescript
// Example permission checking flow
async function checkPermission(req, res, next) {
    const requiredPermission = req.route.permission;
    const userPermissions = req.user.permissions;
    
    // Check direct permission
    if (userPermissions.includes(requiredPermission)) {
        return next();
    }
    
    // Check wildcard permissions
    const resource = requiredPermission.split(':')[0];
    if (userPermissions.includes(`${resource}:*`)) {
        return next();
    }
    
    // Check superuser
    if (req.user.isSuperuser) {
        return next();
    }
    
    return res.status(403).json({
        success: false,
        error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'You do not have permission to perform this action'
        }
    });
}
```

## 6. Implementation Plan

### 6.1 Phase 1: Core Infrastructure (Week 1-2)
- [ ] Project setup with TypeScript and Express
- [ ] Database schema implementation
- [ ] Basic models and migrations
- [ ] Configuration management
- [ ] Logging setup

### 6.2 Phase 2: Authentication System (Week 2-3)
- [ ] User registration and login
- [ ] JWT token generation and validation
- [ ] Refresh token implementation
- [ ] Password reset functionality
- [ ] Session management

### 6.3 Phase 3: RBAC Core (Week 3-4)
- [ ] User management APIs
- [ ] Role management APIs
- [ ] Permission management APIs
- [ ] Role-permission assignment
- [ ] User-role assignment

### 6.4 Phase 4: Menu Permissions (Week 4-5)
- [ ] Menu data model and seeding
- [ ] Menu permission APIs
- [ ] Dynamic menu generation
- [ ] Menu-based access control

### 6.5 Phase 5: Advanced Features (Week 5-6)
- [ ] Audit logging
- [ ] Permission caching with Redis
- [ ] Batch operations
- [ ] Advanced search and filtering

### 6.6 Phase 6: Testing & Documentation (Week 6-7)
- [ ] Unit tests
- [ ] Integration tests
- [ ] API documentation with Swagger
- [ ] Performance testing
- [ ] Security testing

### 6.7 Phase 7: Deployment (Week 7-8)
- [ ] Docker configuration
- [ ] CI/CD pipeline
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Documentation finalization

## 7. Testing Strategy

### 7.1 Unit Tests
- Model validations
- Service layer logic
- Utility functions
- Permission checking logic

### 7.2 Integration Tests
- API endpoint testing
- Database operations
- Authentication flows
- Permission workflows

### 7.3 E2E Tests
- Complete user journeys
- Menu navigation with permissions
- Role assignment workflows
- Cross-client compatibility

### 7.4 Performance Tests
- Load testing with 1000+ concurrent users
- Database query optimization
- Caching effectiveness
- API response times

### 7.5 Security Tests
- Penetration testing
- SQL injection attempts
- XSS vulnerability checks
- Authentication bypass attempts

## 8. Deployment Guide

### 8.1 Prerequisites
- Node.js 18+ installed
- MySQL 8.0 database
- Redis (optional)
- PM2 for process management

### 8.2 Environment Variables
```env
# Application
NODE_ENV=production
PORT=3000
APP_NAME=RBAC-System
APP_VERSION=1.0.0

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=rbac_system
DB_USER=rbac_user
DB_PASSWORD=secure_password

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### 8.3 Deployment Steps
1. Clone repository
2. Install dependencies: `npm install`
3. Build TypeScript: `npm run build`
4. Run migrations: `npm run migrate`
5. Seed initial data: `npm run seed`
6. Start with PM2: `pm2 start ecosystem.config.js`

### 8.4 Docker Deployment
```bash
# Build image
docker build -t rbac-system .

# Run with docker-compose
docker-compose up -d
```

### 8.5 Monitoring
- Health check endpoint: `/api/v1/health`
- Metrics endpoint: `/api/v1/metrics`
- Log aggregation with ELK stack
- Application monitoring with PM2

## Appendices

### A. Default Roles and Permissions

#### System Admin
- All permissions (*)

#### Production Manager
- production:*
- report:view
- menu:2:*

#### Quality Inspector
- quality:*
- production:view
- report:view
- menu:A1:view

#### Operator
- production:view
- production:report_work
- menu:25:view

### B. Error Codes Reference
- AUTH_001: Invalid credentials
- AUTH_002: Token expired
- AUTH_003: Invalid token
- AUTH_004: Insufficient permissions
- USER_001: User not found
- USER_002: User already exists
- ROLE_001: Role not found
- PERM_001: Permission denied
- VAL_001: Validation error
- SYS_001: Internal server error

### C. API Rate Limits
- Authentication: 5 requests/minute
- User operations: 100 requests/minute
- Bulk operations: 10 requests/minute
- Public endpoints: 1000 requests/hour

---

Document Version: 1.0
Last Updated: 2024-01-01
Author: RBAC System Team