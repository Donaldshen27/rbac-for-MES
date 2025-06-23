# Permission Management API Documentation

## Overview
This document describes the permission management endpoints for the RBAC system. All endpoints require authentication and appropriate permissions.

## Base URL
```
/api/v1/permissions
```

## Permission Endpoints

### 1. Create Permission
Creates a new permission in the system.

**Endpoint:** `POST /permissions`  
**Required Permission:** `permission:create`

#### Request Body
```json
{
  "name": "production:view",         // Optional: auto-generated from resource:action
  "resource": "production",          // Required: resource identifier
  "action": "view",                  // Required: action type
  "description": "View production data"  // Optional: permission description
}
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Permission created successfully",
  "data": {
    "permission": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "production:view",
      "resource": "production",
      "action": "view",
      "description": "View production data",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### Error Responses
- `400 Bad Request`: Validation error
- `409 Conflict`: Permission already exists

### 2. List Permissions
Get a paginated list of permissions with optional filters.

**Endpoint:** `GET /permissions`  
**Required Permission:** `permission:read`

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| resource | string | Filter by resource | - |
| action | string | Filter by action | - |
| search | string | Search in name and description | - |
| page | integer | Page number | 1 |
| limit | integer | Items per page (max: 100) | 20 |

#### Example Request
```
GET /permissions?resource=production&action=view&page=1&limit=20
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Permissions retrieved successfully",
  "data": {
    "permissions": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "production:view",
        "resource": "production",
        "action": "view",
        "description": "View production data",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

### 3. Get Permission by ID
Get detailed information about a specific permission.

**Endpoint:** `GET /permissions/{id}`  
**Required Permission:** `permission:read`

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Permission retrieved successfully",
  "data": {
    "permission": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "production:view",
      "resource": "production",
      "action": "view",
      "description": "View production data",
      "roles": [
        {
          "id": "role-id",
          "name": "operator",
          "userCount": 25
        }
      ],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### Error Responses
- `404 Not Found`: Permission not found

### 4. Update Permission
Update permission description.

**Endpoint:** `PUT /permissions/{id}`  
**Required Permission:** `permission:update`

#### Request Body
```json
{
  "description": "Updated description for viewing production data"
}
```

Note: Permission name, resource, and action cannot be changed.

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Permission updated successfully",
  "data": {
    "permission": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "production:view",
      "resource": "production",
      "action": "view",
      "description": "Updated description for viewing production data",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

### 5. Delete Permission
Delete a permission from the system.

**Endpoint:** `DELETE /permissions/{id}`  
**Required Permission:** `permission:delete`

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Permission deleted successfully"
}
```

#### Error Responses
- `400 Bad Request`: Permission is assigned to roles
- `404 Not Found`: Permission not found

### 6. Check User Permission
Check if the current user has a specific permission.

**Endpoint:** `GET /permissions/check`  
**Authentication:** Required

#### Query Parameters
| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| permission | string | Permission name to check | Yes |

#### Example Request
```
GET /permissions/check?permission=production:view
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Permission check completed",
  "data": {
    "hasPermission": true,
    "source": "role:operator"
  }
}
```

## Resource Endpoints

### 1. Create Resource
Creates a new resource in the system.

**Endpoint:** `POST /resources`  
**Required Permission:** `resource:create`

#### Request Body
```json
{
  "name": "inventory",
  "description": "Inventory management resources"
}
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Resource created successfully",
  "data": {
    "resource": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "inventory",
      "description": "Inventory management resources",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### Error Responses
- `400 Bad Request`: Validation error
- `409 Conflict`: Resource already exists

### 2. List Resources
Get a list of all resources.

**Endpoint:** `GET /resources`  
**Required Permission:** `resource:read`

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| search | string | Search in name and description | - |
| page | integer | Page number | 1 |
| limit | integer | Items per page (max: 100) | 20 |

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Resources retrieved successfully",
  "data": {
    "resources": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "production",
        "description": "Production management resources",
        "permissionCount": 15,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
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

### 3. Get Resource by ID
Get detailed information about a specific resource.

**Endpoint:** `GET /resources/{id}`  
**Required Permission:** `resource:read`

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": {
    "resource": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "production",
      "description": "Production management resources",
      "permissionCount": 15,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

### 4. Update Resource
Update resource information.

**Endpoint:** `PUT /resources/{id}`  
**Required Permission:** `resource:update`

#### Request Body
```json
{
  "name": "production_v2",
  "description": "Updated production management resources"
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Resource updated successfully",
  "data": {
    "resource": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "production_v2",
      "description": "Updated production management resources",
      "permissionCount": 15,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

### 5. Delete Resource
Delete a resource from the system.

**Endpoint:** `DELETE /resources/{id}`  
**Required Permission:** `resource:delete`

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Resource deleted successfully"
}
```

#### Error Responses
- `400 Bad Request`: Resource has associated permissions
- `404 Not Found`: Resource not found

## Role Permission Management

### 1. Get Role Permissions
Get all permissions assigned to a specific role.

**Endpoint:** `GET /roles/{roleId}/permissions`  
**Required Permission:** `role:read`

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Role permissions retrieved successfully",
  "data": {
    "permissions": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "production:view",
        "resource": "production",
        "action": "view",
        "description": "View production data",
        "grantedAt": "2024-01-01T00:00:00Z",
        "grantedBy": "admin-user-id"
      }
    ]
  }
}
```

### 2. Update Role Permissions
Update permissions for a role (replaces all permissions).

**Endpoint:** `PUT /roles/{roleId}/permissions`  
**Required Permission:** `role:update`

#### Request Body
```json
{
  "permissionIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ]
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Role permissions updated successfully"
}
```

#### Error Responses
- `400 Bad Request`: Cannot modify system role permissions
- `404 Not Found`: Role or permission not found

## Permission Naming Convention

Permissions follow the pattern: `resource:action`

### Common Resources
- `user`: User management
- `role`: Role management
- `permission`: Permission management
- `menu`: Menu management
- `resource`: Resource management
- `production`: Production management
- `quality`: Quality management
- `report`: Report management
- `system`: System management
- `audit`: Audit log access

### Common Actions
- `create`: Create new items
- `read`: View/list items
- `update`: Modify existing items
- `delete`: Remove items
- `execute`: Execute operations
- `approve`: Approve items
- `reject`: Reject items
- `export`: Export data
- `import`: Import data
- `view`: View specific data
- `manage`: Full management access
- `assign`: Assign to others
- `revoke`: Remove assignments
- `*`: Wildcard for all actions

### Special Permissions
- `resource:*`: All actions on a resource
- `*:*`: Super admin (all permissions)

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| PERM_001 | Permission not found | 404 |
| PERM_002 | Permission already exists | 409 |
| PERM_003 | Permission is in use | 400 |
| PERM_004 | Invalid permission format | 400 |
| PERM_005 | Cannot modify system permission | 403 |

## Best Practices

1. **Permission Naming**
   - Use lowercase for resources and actions
   - Use underscores for multi-word items
   - Be consistent with naming conventions

2. **Resource Organization**
   - Group related permissions by resource
   - Use hierarchical naming when appropriate
   - Document all custom permissions

3. **Security**
   - Always check permissions before operations
   - Use wildcard permissions sparingly
   - Audit permission changes

4. **Performance**
   - Cache permission checks when possible
   - Use batch operations for multiple changes
   - Index permission lookups properly

---

Document Version: 1.0  
Last Updated: 2024-01-01  
Author: RBAC System Team