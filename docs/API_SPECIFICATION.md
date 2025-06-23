# RBAC System API Specification

## Overview
This document provides the complete API specification for the RBAC Permission Management System. All APIs follow RESTful principles and use JSON for request/response bodies.

## Base Configuration

### Base URL
```
Development: http://localhost:3000/api/v1
Production: https://api.example.com/api/v1
```

### Headers
```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer {jwt_token}
```

### Common Response Format

#### Success Response
```json
{
    "success": true,
    "data": {
        // Response data
    },
    "message": "Operation successful"
}
```

#### Error Response
```json
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "Human-readable error message",
        "details": [
            {
                "field": "fieldName",
                "message": "Field-specific error"
            }
        ],
        "timestamp": "2024-01-01T00:00:00Z",
        "path": "/api/v1/endpoint"
    }
}
```

## Authentication APIs

### 1. User Registration
Create a new user account.

**Endpoint:** `POST /auth/register`  
**Authentication:** Not required  
**Rate Limit:** 5 requests per minute

#### Request Body
```json
{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
}
```

#### Validation Rules
- `username`: 3-50 characters, alphanumeric and underscore only
- `email`: Valid email format
- `password`: Minimum 8 characters, must contain uppercase, lowercase, number, and special character
- `firstName`: 1-50 characters
- `lastName`: 1-50 characters

#### Success Response (201 Created)
```json
{
    "success": true,
    "data": {
        "user": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "username": "john_doe",
            "email": "john@example.com",
            "firstName": "John",
            "lastName": "Doe",
            "isActive": true,
            "createdAt": "2024-01-01T00:00:00Z"
        }
    },
    "message": "User registered successfully"
}
```

#### Error Responses
- `400 Bad Request`: Validation error
- `409 Conflict`: Username or email already exists

### 2. User Login
Authenticate user and receive tokens.

**Endpoint:** `POST /auth/login`  
**Authentication:** Not required  
**Rate Limit:** 10 requests per minute

#### Request Body
```json
{
    "username": "john_doe",
    "password": "SecurePass123!"
}
```

Note: `username` field accepts either username or email.

#### Success Response (200 OK)
```json
{
    "success": true,
    "data": {
        "user": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "username": "john_doe",
            "email": "john@example.com",
            "firstName": "John",
            "lastName": "Doe",
            "roles": [
                {
                    "id": "role-id",
                    "name": "operator",
                    "description": "Basic operator role"
                }
            ]
        },
        "tokens": {
            "accessToken": "eyJhbGciOiJIUzI1NiIs...",
            "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
            "expiresIn": 900,
            "tokenType": "Bearer"
        }
    },
    "message": "Login successful"
}
```

#### Error Responses
- `400 Bad Request`: Missing credentials
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account disabled

### 3. Refresh Token
Get a new access token using refresh token.

**Endpoint:** `POST /auth/refresh`  
**Authentication:** Not required  
**Rate Limit:** 20 requests per minute

#### Request Body
```json
{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Success Response (200 OK)
```json
{
    "success": true,
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIs...",
        "expiresIn": 900,
        "tokenType": "Bearer"
    }
}
```

#### Error Responses
- `401 Unauthorized`: Invalid or expired refresh token

### 4. Logout
Invalidate refresh token and logout user.

**Endpoint:** `POST /auth/logout`  
**Authentication:** Required  

#### Request Body
```json
{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Success Response (200 OK)
```json
{
    "success": true,
    "message": "Logout successful"
}
```

### 5. Get Current User
Retrieve authenticated user's information.

**Endpoint:** `GET /auth/me`  
**Authentication:** Required  

#### Success Response (200 OK)
```json
{
    "success": true,
    "data": {
        "user": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "username": "john_doe",
            "email": "john@example.com",
            "firstName": "John",
            "lastName": "Doe",
            "isActive": true,
            "isSuperuser": false,
            "roles": [
                {
                    "id": "role-id",
                    "name": "operator",
                    "description": "Basic operator role"
                }
            ],
            "permissions": [
                "production:view",
                "production:report_work"
            ],
            "lastLogin": "2024-01-01T00:00:00Z",
            "createdAt": "2024-01-01T00:00:00Z"
        }
    }
}
```

### 6. Change Password
Change the authenticated user's password.

**Endpoint:** `POST /auth/change-password`  
**Authentication:** Required  

#### Request Body
```json
{
    "currentPassword": "OldPass123!",
    "newPassword": "NewPass123!",
    "confirmPassword": "NewPass123!"
}
```

#### Success Response (200 OK)
```json
{
    "success": true,
    "message": "Password changed successfully"
}
```

#### Error Responses
- `400 Bad Request`: Validation error or passwords don't match
- `401 Unauthorized`: Current password incorrect

## User Management APIs

### 1. List Users
Get paginated list of users with optional filters.

**Endpoint:** `GET /users`  
**Authentication:** Required  
**Permission:** `user:read`

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| page | integer | Page number | 1 |
| limit | integer | Items per page (max: 100) | 20 |
| search | string | Search in username, email, name | - |
| role | string | Filter by role name | - |
| isActive | boolean | Filter by active status | - |
| sort | string | Sort field (prefix with - for desc) | -createdAt |

#### Example Request
```
GET /users?page=1&limit=20&search=john&role=operator&sort=-createdAt
```

#### Success Response (200 OK)
```json
{
    "success": true,
    "data": {
        "users": [
            {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "username": "john_doe",
                "email": "john@example.com",
                "firstName": "John",
                "lastName": "Doe",
                "isActive": true,
                "roles": ["operator", "viewer"],
                "createdAt": "2024-01-01T00:00:00Z",
                "lastLogin": "2024-01-01T00:00:00Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 100,
            "totalPages": 5,
            "hasNext": true,
            "hasPrev": false
        }
    }
}
```

### 2. Get User Details
Get detailed information about a specific user.

**Endpoint:** `GET /users/{userId}`  
**Authentication:** Required  
**Permission:** `user:read`

#### Success Response (200 OK)
```json
{
    "success": true,
    "data": {
        "user": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "username": "john_doe",
            "email": "john@example.com",
            "firstName": "John",
            "lastName": "Doe",
            "isActive": true,
            "isSuperuser": false,
            "roles": [
                {
                    "id": "role-id",
                    "name": "operator",
                    "description": "Basic operator role",
                    "assignedAt": "2024-01-01T00:00:00Z"
                }
            ],
            "permissions": [
                "production:view",
                "production:report_work",
                "menu:25:view"
            ],
            "createdAt": "2024-01-01T00:00:00Z",
            "updatedAt": "2024-01-01T00:00:00Z",
            "lastLogin": "2024-01-01T00:00:00Z"
        }
    }
}
```

#### Error Responses
- `404 Not Found`: User not found

### 3. Create User
Create a new user account (admin only).

**Endpoint:** `POST /users`  
**Authentication:** Required  
**Permission:** `user:create`

#### Request Body
```json
{
    "username": "jane_doe",
    "email": "jane@example.com",
    "password": "TempPass123!",
    "firstName": "Jane",
    "lastName": "Doe",
    "roleIds": ["role-id-1", "role-id-2"],
    "isActive": true
}
```

#### Success Response (201 Created)
```json
{
    "success": true,
    "data": {
        "user": {
            "id": "new-user-id",
            "username": "jane_doe",
            "email": "jane@example.com",
            "firstName": "Jane",
            "lastName": "Doe",
            "isActive": true,
            "roles": ["operator"],
            "createdAt": "2024-01-01T00:00:00Z"
        }
    },
    "message": "User created successfully"
}
```

### 4. Update User
Update user information.

**Endpoint:** `PUT /users/{userId}`  
**Authentication:** Required  
**Permission:** `user:update`

#### Request Body
```json
{
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@example.com",
    "isActive": true
}
```

Note: Username cannot be changed. Password update requires separate endpoint.

#### Success Response (200 OK)
```json
{
    "success": true,
    "data": {
        "user": {
            "id": "user-id",
            "username": "jane_doe",
            "email": "jane.smith@example.com",
            "firstName": "Jane",
            "lastName": "Smith",
            "isActive": true,
            "updatedAt": "2024-01-01T00:00:00Z"
        }
    },
    "message": "User updated successfully"
}
```

### 5. Delete User
Soft delete a user account.

**Endpoint:** `DELETE /users/{userId}`  
**Authentication:** Required  
**Permission:** `user:delete`

#### Success Response (200 OK)
```json
{
    "success": true,
    "message": "User deleted successfully"
}
```

#### Error Responses
- `400 Bad Request`: Cannot delete superuser or self
- `404 Not Found`: User not found

### 6. Get User Roles
Get all roles assigned to a user.

**Endpoint:** `GET /users/{userId}/roles`  
**Authentication:** Required  
**Permission:** `user:read`

#### Success Response (200 OK)
```json
{
    "success": true,
    "data": {
        "roles": [
            {
                "id": "role-id",
                "name": "operator",
                "description": "Basic operator role",
                "assignedAt": "2024-01-01T00:00:00Z",
                "assignedBy": {
                    "id": "admin-id",
                    "username": "admin"
                }
            }
        ]
    }
}
```

### 7. Assign Role to User
Assign a role to a user.

**Endpoint:** `POST /users/{userId}/roles`  
**Authentication:** Required  
**Permission:** `user:update`

#### Request Body
```json
{
    "roleId": "role-id"
}
```

#### Success Response (200 OK)
```json
{
    "success": true,
    "message": "Role assigned successfully"
}
```

#### Error Responses
- `400 Bad Request`: Role already assigned
- `404 Not Found`: User or role not found

### 8. Remove Role from User
Remove a role from a user.

**Endpoint:** `DELETE /users/{userId}/roles/{roleId}`  
**Authentication:** Required  
**Permission:** `user:update`

#### Success Response (200 OK)
```json
{
    "success": true,
    "message": "Role removed successfully"
}
```

#### Error Responses
- `400 Bad Request`: User must have at least one role
- `404 Not Found`: User or role not found

### 9. Get User Permissions
Get effective permissions for a user (including role permissions).

**Endpoint:** `GET /users/{userId}/permissions`  
**Authentication:** Required  
**Permission:** `user:read`

#### Success Response (200 OK)
```json
{
    "success": true,
    "data": {
        "permissions": [
            {
                "id": "perm-id",
                "name": "production:view",
                "resource": "production",
                "action": "view",
                "description": "View production data",
                "source": "role:operator"
            }
        ],
        "summary": {
            "total": 15,
            "byRole": {
                "operator": 10,
                "viewer": 5
            },
            "byResource": {
                "production": 8,
                "report": 7
            }
        }
    }
}
```

## Role Management APIs

### 1. List Roles
Get all roles with pagination.

**Endpoint:** `GET /roles`  
**Authentication:** Required  
**Permission:** `role:read`

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| page | integer | Page number | 1 |
| limit | integer | Items per page (max: 100) | 20 |
| search | string | Search in name and description | - |
| isSystem | boolean | Filter system roles | - |

#### Success Response (200 OK)
```json
{
    "success": true,
    "data": {
        "roles": [
            {
                "id": "role-id",
                "name": "production_manager",
                "description": "Production Manager Role",
                "isSystem": false,
                "userCount": 5,
                "permissionCount": 25,
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

### 2. Get Role Details
Get detailed information about a role.

**Endpoint:** `GET /roles/{roleId}`  
**Authentication:** Required  
**Permission:** `role:read`

#### Success Response (200 OK)
```json
{
    "success": true,
    "data": {
        "role": {
            "id": "role-id",
            "name": "production_manager",
            "description": "Production Manager Role",
            "isSystem": false,
            "permissions": [
                {
                    "id": "perm-id",
                    "name": "production:view",
                    "resource": "production",
                    "action": "view",
                    "description": "View production data"
                }
            ],
            "menuPermissions": [
                {
                    "menuId": "2",
                    "menuTitle": "生产管理",
                    "canView": true,
                    "canEdit": true,
                    "canDelete": false,
                    "canExport": true
                }
            ],
            "userCount": 5,
            "createdAt": "2024-01-01T00:00:00Z",
            "updatedAt": "2024-01-01T00:00:00Z"
        }
    }
}
```

### 3. Create Role
Create a new role.

**Endpoint:** `POST /roles`  
**Authentication:** Required  
**Permission:** `role:create`

#### Request Body
```json
{
    "name": "quality_manager",
    "description": "Quality Manager Role",
    "permissionIds": ["perm-id-1", "perm-id-2"]
}
```

#### Success Response (201 Created)
```json
{
    "success": true,
    "data": {
        "role": {
            "id": "new-role-id",
            "name": "quality_manager",
            "description": "Quality Manager Role",
            "isSystem": false,
            "createdAt": "2024-01-01T00:00:00Z"
        }
    },
    "message": "Role created successfully"
}
```

### 4. Update Role
Update role information.

**Endpoint:** `PUT /roles/{roleId}`  
**Authentication:** Required  
**Permission:** `role:update`

#### Request Body
```json
{
    "description": "Updated Quality Manager Role",
    "permissionIds": ["perm-id-1", "perm-id-2", "perm-id-3"]
}
```

Note: Role name cannot be changed. System roles cannot be modified.

#### Success Response (200 OK)
```json
{
    "success": true,
    "data": {
        "role": {
            "id": "role-id",
            "name": "quality_manager",
            "description": "Updated Quality Manager Role",
            "updatedAt": "2024-01-01T00:00:00Z"
        }
    },
    "message": "Role updated successfully"
}
```

### 5. Delete Role
Delete a role.

**Endpoint:** `DELETE /roles/{roleId}`  
**Authentication:** Required  
**Permission:** `role:delete`

#### Success Response (200 OK)
```json
{
    "success": true,
    "message": "Role deleted successfully"
}
```

#### Error Responses
- `400 Bad Request`: Cannot delete system role or role with users
- `404 Not Found`: Role not found

### 6. Get Role Permissions
Get all permissions assigned to a role.

**Endpoint:** `GET /roles/{roleId}/permissions`  
**Authentication:** Required  
**Permission:** `role:read`

#### Success Response (200 OK)
```json
{
    "success": true,
    "data": {
        "permissions": [
            {
                "id": "perm-id",
                "name": "production:view",
                "resource": "production",
                "action": "view",
                "description": "View production data",
                "grantedAt": "2024-01-01T00:00:00Z",
                "grantedBy": {
                    "id": "admin-id",
                    "username": "admin"
                }
            }
        ],
        "summary": {
            "total": 25,
            "byResource": {
                "production": 10,
                "quality": 8,
                "report": 7
            }
        }
    }
}
```

### 7. Update Role Permissions
Update permissions for a role (replaces all permissions).

**Endpoint:** `PUT /roles/{roleId}/permissions`  
**Authentication:** Required  
**Permission:** `role:update`

#### Request Body
```json
{
    "permissionIds": ["perm-id-1", "perm-id-2", "perm-id-3"]
}
```

#### Success Response (200 OK)
```json
{
    "success": true,
    "message": "Role permissions updated successfully"
}
```

### 8. Get Role Users
Get all users assigned to a role.

**Endpoint:** `GET /roles/{roleId}/users`  
**Authentication:** Required  
**Permission:** `role:read`

#### Query Parameters
Same as List Users API

#### Success Response (200 OK)
```json
{
    "success": true,
    "data": {
        "users": [
            {
                "id": "user-id",
                "username": "john_doe",
                "email": "john@example.com",
                "firstName": "John",
                "lastName": "Doe",
                "assignedAt": "2024-01-01T00:00:00Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 5,
            "totalPages": 1
        }
    }
}
```

## Permission Management APIs

### 1. List Permissions
Get all permissions with optional filters.

**Endpoint:** `GET /permissions`  
**Authentication:** Required  
**Permission:** `permission:read`

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| page | integer | Page number | 1 |
| limit | integer | Items per page (max: 100) | 20 |
| resource | string | Filter by resource | - |
| action | string | Filter by action | - |
| search | string | Search in name and description | - |

#### Success Response (200 OK)
```json
{
    "success": true,
    "data": {
        "permissions": [
            {
                "id": "perm-id",
                "name": "production:view",
                "resource": "production",
                "action": "view",
                "description": "View production data",
                "createdAt": "2024-01-01T00:00:00Z"
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

### 2. Get Permission Details
Get details of a specific permission.

**Endpoint:** `GET /permissions/{permissionId}`  
**Authentication:** Required  
**Permission:** `permission:read`

#### Success Response (200 OK)
```json
{
    "success": true,
    "data": {
        "permission": {
            "id": "perm-id",
            "name": "production:view",
            "resource": "production",
            "action": "view",
            "description": "View production data",
            "roles": [
                {
                    "id": "role-id",
                    "name": "operator",
                    "userCount": 10
                }
            ],
            "createdAt": "2024-01-01T00:00:00Z",
            "updatedAt": "2024-01-01T00:00:00Z"
        }
    }
}
```

### 3. Create Permission
Create a new permission.

**Endpoint:** `POST /permissions`  
**Authentication:** Required  
**Permission:** `permission:create`

#### Request Body
```json
{
    "name": "quality:approve",
    "resource": "quality",
    "action": "approve",
    "description": "Approve quality reports"
}
```

#### Success Response (201 Created)
```json
{
    "success": true,
    "data": {
        "permission": {
            "id": "new-perm-id",
            "name": "quality:approve",
            "resource": "quality",
            "action": "approve",
            "description": "Approve quality reports",
            "createdAt": "2024-01-01T00:00:00Z"
        }
    },
    "message": "Permission created successfully"
}
```

### 4. Update Permission
Update permission description.

**Endpoint:** `PUT /permissions/{permissionId}`  
**Authentication:** Required  
**Permission:** `permission:update`

#### Request Body
```json
{
    "description": "Approve quality inspection reports"
}
```

Note: Permission name, resource, and action cannot be changed.

#### Success Response (200 OK)
```json
{
    "success": true,
    "data": {
        "permission": {
            "id": "perm-id",
            "name": "quality:approve",
            "description": "Approve quality inspection reports",
            "updatedAt": "2024-01-01T00:00:00Z"
        }
    },
    "message": "Permission updated successfully"
}
```

### 5. Delete Permission
Delete a permission.

**Endpoint:** `DELETE /permissions/{permissionId}`  
**Authentication:** Required  
**Permission:** `permission:delete`

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
GET /permissions/check?permission=production:create_work_order
```

#### Success Response (200 OK)
```json
{
    "success": true,
    "data": {
        "hasPermission": true,
        "source": "role:production_manager"
    }
}
```

## Menu Permission APIs

### 1. Get User Menu
Get menu structure filtered by user permissions.

**Endpoint:** `GET /menus/user-menu`  
**Authentication:** Required  

#### Success Response (200 OK)
```json
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
                "permissions": {
                    "canView": true,
                    "canEdit": true,
                    "canDelete": false,
                    "canExport": true
                },
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

### 2. Get All Menus
Get complete menu structure (admin only).

**Endpoint:** `GET /menus`  
**Authentication:** Required  
**Permission:** `menu:read`

#### Success Response (200 OK)
```json
{
    "success": true,
    "data": {
        "menus": [
            {
                "id": "1",
                "parentId": null,
                "title": "基础数据",
                "href": "",
                "icon": "fa-solid fa-box-open",
                "target": "_self",
                "orderIndex": 1,
                "isActive": true,
                "children": [...]
            }
        ]
    }
}
```

### 3. Get Menu Permissions
Get permissions for a specific menu.

**Endpoint:** `GET /menus/{menuId}/permissions`  
**Authentication:** Required  
**Permission:** `menu:read`

#### Success Response (200 OK)
```json
{
    "success": true,
    "data": {
        "menu": {
            "id": "11",
            "title": "产品定义",
            "path": "基础数据 > 产品定义"
        },
        "permissions": [
            {
                "roleId": "role-id",
                "roleName": "operator",
                "canView": true,
                "canEdit": false,
                "canDelete": false,
                "canExport": true
            }
        ]
    }
}
```

### 4. Update Menu Permissions
Update menu permissions for a role.

**Endpoint:** `PUT /roles/{roleId}/menu-permissions`  
**Authentication:** Required  
**Permission:** `role:update`

#### Request Body
```json
{
    "menuPermissions": [
        {
            "menuId": "11",
            "canView": true,
            "canEdit": true,
            "canDelete": false,
            "canExport": true
        },
        {
            "menuId": "12",
            "canView": true,
            "canEdit": false,
            "canDelete": false,
            "canExport": false
        }
    ]
}
```

#### Success Response (200 OK)
```json
{
    "success": true,
    "message": "Menu permissions updated successfully"
}
```

### 5. Batch Update Menu Permissions
Update multiple menu permissions at once.

**Endpoint:** `POST /menus/permissions/batch`  
**Authentication:** Required  
**Permission:** `menu:update`

#### Request Body
```json
{
    "roleId": "role-id",
    "permissions": [
        {
            "menuId": "1",
            "canView": true,
            "canEdit": false,
            "canDelete": false,
            "canExport": false,
            "applyToChildren": true
        }
    ]
}
```

#### Success Response (200 OK)
```json
{
    "success": true,
    "data": {
        "updated": 15,
        "details": [
            {
                "menuId": "1",
                "updated": true,
                "childrenUpdated": 14
            }
        ]
    },
    "message": "Menu permissions updated successfully"
}
```

## Resource Management APIs

### 1. List Resources
Get all resources.

**Endpoint:** `GET /resources`  
**Authentication:** Required  
**Permission:** `resource:read`

#### Success Response (200 OK)
```json
{
    "success": true,
    "data": {
        "resources": [
            {
                "id": "resource-id",
                "name": "production",
                "description": "Production management resources",
                "permissionCount": 15,
                "createdAt": "2024-01-01T00:00:00Z"
            }
        ]
    }
}
```

### 2. Create Resource
Create a new resource.

**Endpoint:** `POST /resources`  
**Authentication:** Required  
**Permission:** `resource:create`

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
    "data": {
        "resource": {
            "id": "new-resource-id",
            "name": "inventory",
            "description": "Inventory management resources",
            "createdAt": "2024-01-01T00:00:00Z"
        }
    },
    "message": "Resource created successfully"
}
```

## Audit Log APIs

### 1. List Audit Logs
Get audit logs with filters.

**Endpoint:** `GET /audit-logs`  
**Authentication:** Required  
**Permission:** `audit:read`

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| page | integer | Page number | 1 |
| limit | integer | Items per page (max: 100) | 20 |
| userId | string | Filter by user ID | - |
| action | string | Filter by action | - |
| resource | string | Filter by resource | - |
| startDate | string | Start date (ISO 8601) | - |
| endDate | string | End date (ISO 8601) | - |

#### Success Response (200 OK)
```json
{
    "success": true,
    "data": {
        "logs": [
            {
                "id": "log-id",
                "user": {
                    "id": "user-id",
                    "username": "john_doe"
                },
                "action": "user:create",
                "resource": "user",
                "resourceId": "new-user-id",
                "details": {
                    "username": "jane_doe",
                    "email": "jane@example.com"
                },
                "ipAddress": "192.168.1.100",
                "userAgent": "Mozilla/5.0...",
                "createdAt": "2024-01-01T00:00:00Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 1000,
            "totalPages": 50
        }
    }
}
```

### 2. Get Audit Log Statistics
Get audit log statistics.

**Endpoint:** `GET /audit-logs/stats`  
**Authentication:** Required  
**Permission:** `audit:read`

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| period | string | day, week, month, year | day |
| startDate | string | Start date (ISO 8601) | - |
| endDate | string | End date (ISO 8601) | - |

#### Success Response (200 OK)
```json
{
    "success": true,
    "data": {
        "statistics": {
            "totalActions": 1500,
            "byAction": {
                "auth:login": 500,
                "user:update": 200,
                "role:assign": 150
            },
            "byResource": {
                "user": 700,
                "role": 400,
                "permission": 400
            },
            "byUser": [
                {
                    "userId": "user-id",
                    "username": "admin",
                    "actionCount": 300
                }
            ],
            "timeline": [
                {
                    "date": "2024-01-01",
                    "count": 150
                }
            ]
        }
    }
}
```

## System APIs

### 1. Health Check
Check system health status.

**Endpoint:** `GET /health`  
**Authentication:** Not required  

#### Success Response (200 OK)
```json
{
    "success": true,
    "data": {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": "2024-01-01T00:00:00Z",
        "services": {
            "database": "connected",
            "redis": "connected"
        }
    }
}
```

### 2. System Information
Get system information (admin only).

**Endpoint:** `GET /system/info`  
**Authentication:** Required  
**Permission:** `system:read`

#### Success Response (200 OK)
```json
{
    "success": true,
    "data": {
        "version": "1.0.0",
        "environment": "production",
        "uptime": 86400,
        "statistics": {
            "totalUsers": 100,
            "activeUsers": 85,
            "totalRoles": 10,
            "totalPermissions": 50
        },
        "database": {
            "type": "MySQL",
            "version": "8.0.35",
            "status": "healthy"
        }
    }
}
```

## Error Codes

### Authentication Errors (AUTH_xxx)
| Code | Description | HTTP Status |
|------|-------------|-------------|
| AUTH_001 | Invalid credentials | 401 |
| AUTH_002 | Token expired | 401 |
| AUTH_003 | Invalid token | 401 |
| AUTH_004 | Insufficient permissions | 403 |
| AUTH_005 | Account disabled | 403 |
| AUTH_006 | Too many login attempts | 429 |

### User Errors (USER_xxx)
| Code | Description | HTTP Status |
|------|-------------|-------------|
| USER_001 | User not found | 404 |
| USER_002 | Username already exists | 409 |
| USER_003 | Email already exists | 409 |
| USER_004 | Cannot delete self | 400 |
| USER_005 | Cannot delete superuser | 400 |

### Role Errors (ROLE_xxx)
| Code | Description | HTTP Status |
|------|-------------|-------------|
| ROLE_001 | Role not found | 404 |
| ROLE_002 | Role name already exists | 409 |
| ROLE_003 | Cannot delete system role | 400 |
| ROLE_004 | Role has assigned users | 400 |

### Permission Errors (PERM_xxx)
| Code | Description | HTTP Status |
|------|-------------|-------------|
| PERM_001 | Permission not found | 404 |
| PERM_002 | Permission already exists | 409 |
| PERM_003 | Permission is in use | 400 |

### Validation Errors (VAL_xxx)
| Code | Description | HTTP Status |
|------|-------------|-------------|
| VAL_001 | Invalid input format | 400 |
| VAL_002 | Required field missing | 400 |
| VAL_003 | Value out of range | 400 |
| VAL_004 | Invalid email format | 400 |
| VAL_005 | Password too weak | 400 |

### System Errors (SYS_xxx)
| Code | Description | HTTP Status |
|------|-------------|-------------|
| SYS_001 | Internal server error | 500 |
| SYS_002 | Database connection error | 503 |
| SYS_003 | Service unavailable | 503 |
| SYS_004 | Rate limit exceeded | 429 |

## Rate Limiting

### Default Limits
- Authentication endpoints: 10 requests per minute
- User operations: 100 requests per minute
- Admin operations: 50 requests per minute
- Public endpoints: 1000 requests per hour

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1672531200
```

### Rate Limit Exceeded Response
```json
{
    "success": false,
    "error": {
        "code": "SYS_004",
        "message": "Rate limit exceeded. Please try again later.",
        "retryAfter": 60
    }
}
```

---

Document Version: 1.0
Last Updated: 2024-01-01
Author: RBAC System Team