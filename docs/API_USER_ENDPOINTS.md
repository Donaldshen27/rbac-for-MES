# User Management API Endpoints

This document provides comprehensive documentation for all user management endpoints in the RBAC system.

## Table of Contents
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Error Responses](#error-responses)
- [Endpoints](#endpoints)
  - [List Users](#list-users)
  - [Get User by ID](#get-user-by-id)
  - [Create User](#create-user)
  - [Update User](#update-user)
  - [Delete User](#delete-user)
  - [Restore User](#restore-user)
  - [Update User Roles](#update-user-roles)
  - [Reset User Password](#reset-user-password)
  - [Bulk Update Status](#bulk-update-status)
  - [Bulk Delete Users](#bulk-delete-users)
  - [User Statistics](#user-statistics)
  - [Get Profile](#get-profile)
  - [Update Profile](#update-profile)
  - [Export Users](#export-users)

## Authentication

All user management endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Base URL

```
/api/users
```

## Error Responses

All endpoints return standard error responses:

```json
{
  "success": false,
  "message": "Error message",
  "errors": ["Detailed error information"],
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

## Endpoints

### List Users

Get a paginated list of users with optional filtering.

**Endpoint:** `GET /api/users`  
**Permission:** `users:read`

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 10, max: 100) |
| search | string | No | Search in email, username, firstName, lastName |
| isActive | boolean | No | Filter by active status |
| roleIds | string | No | Comma-separated role IDs to filter by |
| sortBy | string | No | Sort field: email, username, firstName, lastName, createdAt, lastLogin |
| sortOrder | string | No | Sort order: asc, desc (default: asc) |

#### Response

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "user@example.com",
        "username": "johndoe",
        "firstName": "John",
        "lastName": "Doe",
        "isActive": true,
        "isSuperuser": false,
        "lastLogin": "2024-01-20T08:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-20T08:00:00.000Z",
        "roles": [
          {
            "id": 1,
            "name": "user",
            "description": "Standard user role"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Users retrieved successfully",
  "timestamp": "2024-01-20T10:00:00.000Z"
}
```

### Get User by ID

Get detailed information about a specific user.

**Endpoint:** `GET /api/users/:userId`  
**Permission:** `users:read`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | User UUID |

#### Response

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "isActive": true,
    "isSuperuser": false,
    "lastLogin": "2024-01-20T08:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-20T08:00:00.000Z",
    "roles": [
      {
        "id": 1,
        "name": "user",
        "description": "Standard user role"
      }
    ]
  },
  "message": "User retrieved successfully",
  "timestamp": "2024-01-20T10:00:00.000Z"
}
```

### Create User

Create a new user account.

**Endpoint:** `POST /api/users`  
**Permission:** `users:create`

#### Request Body

```json
{
  "email": "newuser@example.com",
  "username": "newuser",
  "password": "SecurePassword@123",
  "firstName": "Jane",
  "lastName": "Smith",
  "roleIds": [1, 2],
  "isActive": true
}
```

#### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address |
| username | string | Yes | Alphanumeric, 3-30 characters |
| password | string | Yes | Strong password (8+ chars, uppercase, lowercase, number, special) |
| firstName | string | No | First name (1-50 chars) |
| lastName | string | No | Last name (1-50 chars) |
| roleIds | array | No | Array of role IDs to assign |
| isActive | boolean | No | Active status (default: true) |

#### Response

```json
{
  "success": true,
  "data": {
    "id": "650e8400-e29b-41d4-a716-446655440001",
    "email": "newuser@example.com",
    "username": "newuser",
    "firstName": "Jane",
    "lastName": "Smith",
    "isActive": true,
    "isSuperuser": false,
    "createdAt": "2024-01-20T10:00:00.000Z",
    "updatedAt": "2024-01-20T10:00:00.000Z",
    "roles": [
      {
        "id": 1,
        "name": "user",
        "description": "Standard user role"
      }
    ]
  },
  "message": "User created successfully",
  "timestamp": "2024-01-20T10:00:00.000Z"
}
```

### Update User

Update user information.

**Endpoint:** `PUT /api/users/:userId`  
**Permission:** `users:update`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | User UUID |

#### Request Body

```json
{
  "email": "updated@example.com",
  "firstName": "Updated",
  "lastName": "Name",
  "isActive": false
}
```

#### Request Fields

All fields are optional. Only provided fields will be updated.

| Field | Type | Description |
|-------|------|-------------|
| email | string | Valid email address |
| username | string | Alphanumeric, 3-30 characters |
| firstName | string | First name (1-50 chars) |
| lastName | string | Last name (1-50 chars) |
| isActive | boolean | Active status |
| isSuperuser | boolean | Superuser status (admin only) |
| roleIds | array | Array of role IDs to assign |

### Delete User

Soft delete a user (deactivate).

**Endpoint:** `DELETE /api/users/:userId`  
**Permission:** `users:delete`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | User UUID |

#### Response

```json
{
  "success": true,
  "data": null,
  "message": "User deleted successfully",
  "timestamp": "2024-01-20T10:00:00.000Z"
}
```

### Restore User

Restore a deleted (deactivated) user.

**Endpoint:** `POST /api/users/:userId/restore`  
**Role Required:** `admin` or `superadmin`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | User UUID |

### Update User Roles

Update the roles assigned to a user.

**Endpoint:** `PUT /api/users/:userId/roles`  
**Permission:** `users:manage-roles`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | User UUID |

#### Request Body

```json
{
  "roleIds": [1, 2, 3]
}
```

### Reset User Password

Admin action to reset a user's password.

**Endpoint:** `POST /api/users/:userId/reset-password`  
**Role Required:** `admin` or `superadmin`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | User UUID |

#### Request Body

```json
{
  "newPassword": "NewSecurePassword@123",
  "sendNotification": true
}
```

### Bulk Update Status

Activate or deactivate multiple users at once.

**Endpoint:** `POST /api/users/bulk/status`  
**Role Required:** `admin` or `superadmin`

#### Request Body

```json
{
  "userIds": ["id1", "id2", "id3"],
  "isActive": true
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "success": ["id1", "id2"],
    "failed": [
      {
        "id": "id3",
        "error": "Cannot deactivate superuser"
      }
    ]
  },
  "message": "Users activated successfully",
  "timestamp": "2024-01-20T10:00:00.000Z"
}
```

### Bulk Delete Users

Delete multiple users at once.

**Endpoint:** `POST /api/users/bulk/delete`  
**Role Required:** `admin` or `superadmin`

#### Request Body

```json
{
  "userIds": ["id1", "id2", "id3"]
}
```

### User Statistics

Get system-wide user statistics.

**Endpoint:** `GET /api/users/statistics`  
**Role Required:** `admin` or `superadmin`

#### Response

```json
{
  "success": true,
  "data": {
    "total": 1000,
    "active": 850,
    "inactive": 150,
    "superusers": 5,
    "byRole": {
      "admin": 25,
      "user": 950,
      "moderator": 20
    }
  },
  "message": "User statistics retrieved successfully",
  "timestamp": "2024-01-20T10:00:00.000Z"
}
```

### Get Profile

Get the current authenticated user's profile.

**Endpoint:** `GET /api/users/profile`  
**Authentication:** Required (any authenticated user)

#### Response

Same as [Get User by ID](#get-user-by-id) response.

### Update Profile

Update the current authenticated user's profile.

**Endpoint:** `PUT /api/users/profile`  
**Authentication:** Required (any authenticated user)

#### Request Body

```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "email": "newemail@example.com"
}
```

Note: Users can only update their own firstName, lastName, and email through this endpoint.

### Export Users

Export users in JSON or CSV format.

**Endpoint:** `GET /api/users/export`  
**Permission:** `users:export`

#### Query Parameters

All parameters from [List Users](#list-users) plus:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| format | string | No | Export format: json, csv (default: json) |

#### Response (JSON)

Standard success response with array of user data.

#### Response (CSV)

CSV file download with headers:
```
id,email,username,firstName,lastName,roles,isActive,isSuperuser,lastLogin,createdAt,updatedAt
```

## Example Usage

### cURL Examples

#### List active users with admin role
```bash
curl -X GET "http://localhost:3000/api/users?isActive=true&roleIds=2" \
  -H "Authorization: Bearer <token>"
```

#### Create a new user
```bash
curl -X POST "http://localhost:3000/api/users" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "username": "newuser",
    "password": "SecurePass@123",
    "firstName": "New",
    "lastName": "User",
    "roleIds": [1]
  }'
```

#### Export users as CSV
```bash
curl -X GET "http://localhost:3000/api/users/export?format=csv" \
  -H "Authorization: Bearer <token>" \
  -o users.csv
```

### JavaScript/TypeScript Example

```typescript
// List users with pagination
const response = await fetch('/api/users?page=1&limit=20', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data.data); // Array of users
console.log(data.pagination); // Pagination info

// Create a new user
const newUser = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'newuser@example.com',
    username: 'newuser',
    password: 'SecurePass@123',
    firstName: 'New',
    lastName: 'User',
    roleIds: [1]
  })
});

const created = await newUser.json();
console.log(created.data); // Created user object
```

## Notes

1. **Soft Delete**: The delete operation doesn't permanently remove users from the database. It sets `isActive` to `false` and revokes all refresh tokens.

2. **Password Requirements**: Passwords must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.

3. **Role Management**: When updating user roles, all existing roles are replaced with the new set of roles provided.

4. **Audit Trail**: All user operations are logged in the audit_logs table for compliance and security purposes.

5. **Permissions**: Most endpoints require specific permissions. The authenticated user must have the required permission either directly or through their assigned roles.

6. **Bulk Operations**: Bulk operations are processed individually, returning both successful and failed operations in the response.