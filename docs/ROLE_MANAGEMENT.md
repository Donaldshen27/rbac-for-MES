# Role Management API Documentation

## Overview

The Role Management module provides comprehensive functionality for managing roles in the RBAC system. It includes endpoints for CRUD operations, permission management, user assignments, and bulk operations.

## Architecture

### Components

1. **RoleController** (`src/controllers/role.controller.ts`)
   - Handles HTTP requests and responses
   - Validates request data
   - Delegates business logic to RoleService

2. **RoleService** (`src/services/role.service.ts`)
   - Contains all business logic for role management
   - Handles database transactions
   - Manages audit logging

3. **Role Routes** (`src/routes/role.routes.ts`)
   - Defines API endpoints
   - Applies authentication and authorization middleware
   - Validates request data using Joi schemas

4. **Role Validators** (`src/validators/role.validator.ts`)
   - Defines validation schemas for all role-related operations
   - Ensures data integrity

## API Endpoints

### Basic CRUD Operations

#### Get All Roles
```
GET /api/v1/roles
```
Query parameters:
- `search`: Search by name or description
- `isSystem`: Filter by system roles (true/false)
- `hasUsers`: Filter by roles with/without users (true/false)
- `sortBy`: Sort field (name, createdAt, updatedAt)
- `sortOrder`: Sort order (asc, desc)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

#### Get Role by ID
```
GET /api/v1/roles/:roleId
```

#### Create Role
```
POST /api/v1/roles
```
Body:
```json
{
  "name": "role-name",
  "description": "Role description",
  "isSystem": false,
  "permissionIds": ["uuid1", "uuid2"]
}
```

#### Update Role
```
PUT /api/v1/roles/:roleId
```
Body:
```json
{
  "name": "new-name",
  "description": "New description",
  "permissionIds": ["uuid1", "uuid2"]
}
```

#### Delete Role
```
DELETE /api/v1/roles/:roleId
```

### Advanced Operations

#### Clone Role
```
POST /api/v1/roles/:roleId/clone
```
Body:
```json
{
  "newRoleName": "cloned-role",
  "description": "Cloned role description",
  "includePermissions": true,
  "includeMenuPermissions": false
}
```

#### Bulk Delete
```
POST /api/v1/roles/bulk-delete
```
Body:
```json
{
  "roleIds": ["uuid1", "uuid2", "uuid3"]
}
```

### Permission Management

#### Update Role Permissions
```
PATCH /api/v1/roles/:roleId/permissions
```
Body:
```json
{
  "add": ["permission-uuid1", "permission-uuid2"],
  "remove": ["permission-uuid3"]
}
```

#### Check Role Permission
```
GET /api/v1/roles/:roleId/has-permission/:permissionName
```

### User Management

#### Get Role Users
```
GET /api/v1/roles/:roleId/users
```
Query parameters:
- `page`: Page number
- `limit`: Items per page

#### Assign Users to Role
```
POST /api/v1/roles/:roleId/users
```
Body:
```json
{
  "userIds": ["user-uuid1", "user-uuid2"]
}
```

#### Remove Users from Role
```
DELETE /api/v1/roles/:roleId/users
```
Body:
```json
{
  "userIds": ["user-uuid1", "user-uuid2"]
}
```

### Analytics & Reports

#### Role Statistics
```
GET /api/v1/roles/statistics
```
Returns:
- Total roles count
- System vs custom roles
- Roles with/without users
- Average permissions per role
- Most used roles

#### Role Hierarchy
```
GET /api/v1/roles/hierarchy
```
Returns hierarchical structure of all roles

### Menu Permissions

#### Get Role Menu Permissions
```
GET /api/v1/roles/:roleId/menu-permissions
```

#### Update Role Menu Permissions
```
PUT /api/v1/roles/:roleId/menu-permissions
```
Body:
```json
{
  "menuPermissions": [
    {
      "menuId": "menu-uuid",
      "canView": true,
      "canEdit": false,
      "canDelete": false,
      "canExport": true
    }
  ]
}
```

## Security

All endpoints require:
1. Authentication via JWT token
2. Appropriate permissions:
   - `role:read` - View roles
   - `role:create` - Create roles
   - `role:update` - Update roles
   - `role:delete` - Delete roles

## Error Handling

Standard error responses:
- 400: Bad Request (validation errors)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (role doesn't exist)
- 409: Conflict (duplicate role name)

## Audit Logging

All role operations are logged in the audit log with:
- User who performed the action
- Action type (ROLE_CREATED, ROLE_UPDATED, etc.)
- Timestamp
- Details of changes made

## Business Rules

1. System roles cannot be deleted
2. Roles with assigned users cannot be deleted (must remove users first)
3. Role names must be unique
4. Role names can only contain letters, numbers, underscores, and hyphens
5. Superusers bypass all permission checks

## Performance Considerations

1. Role queries include pagination by default
2. User counts are calculated efficiently using database queries
3. Bulk operations are wrapped in transactions
4. Permissions are loaded eagerly when needed to avoid N+1 queries