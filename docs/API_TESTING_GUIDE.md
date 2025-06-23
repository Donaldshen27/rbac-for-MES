# API Testing Guide

This guide provides examples for testing all API endpoints using curl commands and Postman.

## Prerequisites
- Server running on `http://localhost:3000`
- Valid JWT token (obtain from login endpoint)
- curl or Postman installed

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```bash
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Health Endpoints

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. API Version
```bash
curl http://localhost:3000/version
```

## Menu Endpoints

### 1. List All Menus
```bash
curl -X GET http://localhost:3000/menus \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Create Menu
```bash
curl -X POST http://localhost:3000/menus \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dashboard",
    "path": "/dashboard",
    "icon": "dashboard",
    "order": 1,
    "parentId": null,
    "isActive": true
  }'
```

### 3. Get Menu by ID
```bash
curl -X GET http://localhost:3000/menus/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Update Menu
```bash
curl -X PUT http://localhost:3000/menus/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Dashboard",
    "path": "/dashboard",
    "icon": "dashboard-new",
    "order": 1,
    "isActive": true
  }'
```

### 5. Delete Menu
```bash
curl -X DELETE http://localhost:3000/menus/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. Move Menu
```bash
curl -X PUT http://localhost:3000/menus/1/move \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentId": 2,
    "order": 3
  }'
```

### 7. Get Menu Permissions
```bash
curl -X GET http://localhost:3000/menus/1/permissions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 8. Update Menu Permissions
```bash
curl -X PUT http://localhost:3000/menus/1/permissions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissionIds": [1, 2, 3]
  }'
```

### 9. Reorder Menus
```bash
curl -X PUT http://localhost:3000/menus/reorder \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orders": [
      {"id": 1, "order": 2},
      {"id": 2, "order": 1},
      {"id": 3, "order": 3}
    ]
  }'
```

### 10. Get Menu Tree
```bash
curl -X GET http://localhost:3000/menus/tree \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 11. Get User Menu
```bash
curl -X GET http://localhost:3000/menus/user \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Permission Endpoints

### 1. List Permissions
```bash
curl -X GET http://localhost:3000/permissions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Create Permission
```bash
curl -X POST http://localhost:3000/permissions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "users.create",
    "description": "Create new users",
    "category": "Users",
    "action": "create",
    "resource": "users"
  }'
```

### 3. Get Permission by ID
```bash
curl -X GET http://localhost:3000/permissions/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Update Permission
```bash
curl -X PUT http://localhost:3000/permissions/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "users.create",
    "description": "Create new users with enhanced permissions",
    "category": "Users"
  }'
```

### 5. Delete Permission
```bash
curl -X DELETE http://localhost:3000/permissions/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. Check User Permission
```bash
curl -X GET "http://localhost:3000/permissions/check?permission=users.create" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Resource Endpoints

### 1. List Resources
```bash
curl -X GET http://localhost:3000/resources \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Create Resource
```bash
curl -X POST http://localhost:3000/resources \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "User Management",
    "type": "module",
    "identifier": "user-management",
    "description": "Module for managing users"
  }'
```

### 3. Get Resource by ID
```bash
curl -X GET http://localhost:3000/resources/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Update Resource
```bash
curl -X PUT http://localhost:3000/resources/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "User Management System",
    "description": "Enhanced module for managing users"
  }'
```

### 5. Delete Resource
```bash
curl -X DELETE http://localhost:3000/resources/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Role Endpoints

### 1. List Roles
```bash
curl -X GET http://localhost:3000/roles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Create Role
```bash
curl -X POST http://localhost:3000/roles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Manager",
    "description": "Manager role with team permissions",
    "isActive": true
  }'
```

### 3. Get Role by ID
```bash
curl -X GET http://localhost:3000/roles/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Update Role
```bash
curl -X PUT http://localhost:3000/roles/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Senior Manager",
    "description": "Senior manager role with extended permissions",
    "isActive": true
  }'
```

### 5. Delete Role
```bash
curl -X DELETE http://localhost:3000/roles/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. Clone Role
```bash
curl -X POST http://localhost:3000/roles/1/clone \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Junior Manager",
    "description": "Junior manager role based on Manager"
  }'
```

### 7. Get Role Permissions
```bash
curl -X GET http://localhost:3000/roles/1/permissions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 8. Update Role Permissions
```bash
curl -X PUT http://localhost:3000/roles/1/permissions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissionIds": [1, 2, 3, 4, 5]
  }'
```

### 9. Get Role Users
```bash
curl -X GET http://localhost:3000/roles/1/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 10. Bulk Delete Roles
```bash
curl -X POST http://localhost:3000/roles/bulk-delete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleIds": [1, 2, 3]
  }'
```

### 11. Get Role Hierarchy
```bash
curl -X GET http://localhost:3000/roles/hierarchy \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 12. Get Role Statistics
```bash
curl -X GET http://localhost:3000/roles/statistics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Testing Tips

1. **Get JWT Token First**: Before testing protected endpoints, login to get a JWT token:
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "username": "admin",
       "password": "admin123"
     }'
   ```

2. **Save Token**: Save the returned token and use it in subsequent requests.

3. **Check Response Codes**: 
   - 200: Success
   - 201: Created
   - 400: Bad Request
   - 401: Unauthorized
   - 403: Forbidden
   - 404: Not Found
   - 500: Server Error

4. **Verbose Mode**: Add `-v` flag to see request/response headers:
   ```bash
   curl -v http://localhost:3000/health
   ```

5. **Pretty Print JSON**: Use `jq` for formatted output:
   ```bash
   curl http://localhost:3000/menus | jq '.'
   ```

## Postman Collection

Import this collection into Postman for easier testing:

1. Create a new collection named "RBAC System API"
2. Add environment variables:
   - `base_url`: http://localhost:3000
   - `jwt_token`: (set after login)
3. Create folders for each endpoint group (Health, Menus, Permissions, Resources, Roles)
4. Add requests as shown in the curl examples above
5. Use Pre-request Scripts to automatically include the JWT token

## Automated Testing Script

See `test-api.sh` for an automated testing script that runs through all endpoints.