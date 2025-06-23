# Menu API Endpoints Documentation

## Overview

This document describes all menu-related API endpoints in the RBAC system, including both menu structure management (CRUD operations) and menu permission management.

## Base URL

All endpoints are prefixed with `/api/menus` unless otherwise specified.

## Authentication

All endpoints require JWT authentication via Bearer token in the Authorization header:
```
Authorization: Bearer {token}
```

## Menu CRUD Operations

### 1. Create Menu

Create a new menu item in the system.

```
POST /api/menus
```

**Required Permission:** `menu:create`

**Request Body:**
```json
{
  "id": "M1",
  "title": "Dashboard",
  "parentId": null,
  "href": "/dashboard",
  "icon": "dashboard",
  "target": "_self",
  "orderIndex": 0,
  "isActive": true
}
```

**Field Descriptions:**
- `id` (required): Alphanumeric menu ID (max 10 characters)
- `title` (required): Menu display title (1-100 characters)
- `parentId` (optional): Parent menu ID or null for root menu
- `href` (optional): Menu link URL (max 255 characters)
- `icon` (optional): Icon identifier (max 50 characters)
- `target` (optional): Link target (`_self`, `_blank`, `_parent`, `_top`), defaults to `_self`
- `orderIndex` (optional): Display order (defaults to 0)
- `isActive` (optional): Whether menu is active (defaults to true)

**Success Response:** `201 Created`
```json
{
  "success": true,
  "message": "Menu created successfully",
  "data": {
    "menu": {
      "id": "M1",
      "title": "Dashboard",
      "parentId": null,
      "href": "/dashboard",
      "icon": "dashboard",
      "target": "_self",
      "orderIndex": 0,
      "isActive": true,
      "createdAt": "2024-01-20T10:00:00Z",
      "updatedAt": "2024-01-20T10:00:00Z"
    }
  }
}
```

### 2. Get Menu by ID

Retrieve detailed information about a specific menu item.

```
GET /api/menus/{menuId}
```

**Required Permission:** `menu:read`

**Path Parameters:**
- `menuId`: The menu ID

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Menu retrieved successfully",
  "data": {
    "menu": {
      "id": "M1",
      "title": "Dashboard",
      "parentId": null,
      "href": "/dashboard",
      "icon": "dashboard",
      "target": "_self",
      "orderIndex": 0,
      "isActive": true,
      "parent": null,
      "children": [
        {
          "id": "M2",
          "title": "Analytics",
          "parentId": "M1"
        }
      ]
    }
  }
}
```

### 3. Update Menu

Update an existing menu item's properties.

```
PUT /api/menus/{menuId}
```

**Required Permission:** `menu:update`

**Path Parameters:**
- `menuId`: The menu ID to update

**Request Body:** (at least one field required)
```json
{
  "title": "Updated Dashboard",
  "href": "/new-dashboard",
  "icon": "new-icon",
  "target": "_blank",
  "orderIndex": 1,
  "isActive": false,
  "parentId": "M10"
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Menu updated successfully",
  "data": {
    "menu": {
      "id": "M1",
      "title": "Updated Dashboard",
      "href": "/new-dashboard",
      // ... updated fields
    }
  }
}
```

### 4. Delete Menu

Delete a menu item. Note: Cannot delete menus that have child items.

```
DELETE /api/menus/{menuId}
```

**Required Permission:** `menu:delete`

**Path Parameters:**
- `menuId`: The menu ID to delete

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Menu deleted successfully",
  "data": null
}
```

**Error Response:** `400 Bad Request` (if menu has children)
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Cannot delete menu with child items"
  }
}
```

### 5. Reorder Menus

Update the display order of multiple menu items.

```
PUT /api/menus/reorder
```

**Required Permission:** `menu:update`

**Request Body:**
```json
{
  "items": [
    { "menuId": "M1", "orderIndex": 0 },
    { "menuId": "M2", "orderIndex": 1 },
    { "menuId": "M3", "orderIndex": 2 }
  ]
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Menus reordered successfully",
  "data": null
}
```

### 6. Move Menu

Move a menu item to a different parent (or to root level).

```
PUT /api/menus/{menuId}/move
```

**Required Permission:** `menu:update`

**Path Parameters:**
- `menuId`: The menu ID to move

**Request Body:**
```json
{
  "newParentId": "M10"  // or null for root level
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Menu moved successfully",
  "data": {
    "menu": {
      "id": "M1",
      "parentId": "M10",
      // ... other fields
    }
  }
}
```

**Error Cases:**
- Cannot move a menu to its own descendant (circular reference)
- Cannot set a menu as its own parent

## Menu Permission Operations

### 7. Get User Menu Tree

Get the menu tree filtered by the current user's permissions.

```
GET /api/menus/user-menu
```

**Required Permission:** None (uses current user's permissions)

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "User menu tree retrieved successfully",
  "data": {
    "menus": [
      {
        "id": "M1",
        "title": "Dashboard",
        "href": "/dashboard",
        "icon": "dashboard",
        "permissions": {
          "canView": true,
          "canEdit": true,
          "canDelete": false,
          "canExport": false
        },
        "children": []
      }
    ],
    "totalCount": 5,
    "activeCount": 4
  }
}
```

### 8. Get Complete Menu Tree

Get the complete menu tree (admin only).

```
GET /api/menus
```

**Required Permission:** `menu:read`

**Query Parameters:**
- `search` (optional): Search term for menu title or href
- `parentId` (optional): Filter by parent menu ID
- `isActive` (optional): Filter by active status
- `sortBy` (optional): Sort field (`title`, `orderIndex`, `createdAt`)
- `sortOrder` (optional): Sort direction (`asc`, `desc`)

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Menu tree retrieved successfully",
  "data": {
    "menus": [
      {
        "id": "M1",
        "title": "Dashboard",
        "children": [
          {
            "id": "M2",
            "title": "Analytics"
          }
        ]
      }
    ]
  }
}
```

### 9. Get Menu Permissions

Get all role permissions for a specific menu.

```
GET /api/menus/{menuId}/permissions
```

**Required Permission:** `menu:read`

**Path Parameters:**
- `menuId`: The menu ID

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Menu permissions retrieved successfully",
  "data": {
    "permissions": [
      {
        "menuId": "M1",
        "roleId": "550e8400-e29b-41d4-a716-446655440000",
        "canView": true,
        "canEdit": true,
        "canDelete": false,
        "canExport": false,
        "role": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "Admin"
        }
      }
    ]
  }
}
```

### 10. Update Role Menu Permissions

Update menu permissions for a specific role.

```
PUT /api/roles/{roleId}/menu-permissions
```

**Required Permission:** `menu:update`

**Path Parameters:**
- `roleId`: The role ID

**Request Body:**
```json
{
  "permissions": [
    {
      "menuId": "M1",
      "canView": true,
      "canEdit": true,
      "canDelete": false,
      "canExport": false
    },
    {
      "menuId": "M2",
      "canView": true,
      "canEdit": false,
      "canDelete": false,
      "canExport": true
    }
  ]
}
```

**Validation Rules:**
- At least one permission (canView, canEdit, canDelete, canExport) must be true for each menu

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Menu permissions updated successfully",
  "data": {
    "success": ["M1", "M2"],
    "failed": []
  }
}
```

### 11. Batch Update Menu Permissions

Update menu permissions in bulk with optional cascading to child menus.

```
POST /api/menus/permissions/batch
```

**Required Permission:** `menu:update`

**Request Body:**
```json
{
  "roleId": "550e8400-e29b-41d4-a716-446655440000",
  "permissions": [
    {
      "menuId": "M1",
      "canView": true,
      "canEdit": true
    }
  ],
  "applyToChildren": true
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Menu permissions batch updated successfully",
  "data": {
    "success": ["M1", "M2", "M3"],
    "failed": []
  }
}
```

### 12. Check Menu Access

Check if a user has specific permission for a menu.

```
POST /api/menus/check-access
```

**Required Permission:** `menu:read`

**Request Body:**
```json
{
  "menuId": "M1",
  "userId": "user-123",  // optional, defaults to current user
  "permission": "view"   // view, edit, delete, or export
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Menu access check completed",
  "data": {
    "allowed": true,
    "rolesThatGrantAccess": [
      {
        "roleId": "550e8400-e29b-41d4-a716-446655440000",
        "roleName": "Admin"
      }
    ]
  }
}
```

### 13. Get Menu Permission Matrix

Get a matrix view of all menu permissions across all roles.

```
GET /api/menus/permissions/matrix
```

**Required Permission:** `menu:read`

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Menu permission matrix retrieved successfully",
  "data": {
    "matrix": [
      {
        "roleId": "550e8400-e29b-41d4-a716-446655440000",
        "roleName": "Admin",
        "permissions": {
          "M1": {
            "canView": true,
            "canEdit": true,
            "canDelete": true,
            "canExport": true
          },
          "M2": {
            "canView": true,
            "canEdit": false,
            "canDelete": false,
            "canExport": false
          }
        }
      }
    ]
  }
}
```

### 14. Get Menu Statistics

Get statistical information about the menu tree structure.

```
GET /api/menus/statistics
```

**Required Permission:** `menu:read`

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Menu tree statistics retrieved successfully",
  "data": {
    "totalMenus": 25,
    "activeMenus": 20,
    "topLevelMenus": 5,
    "maxDepth": 3,
    "averageChildrenPerMenu": 2.5
  }
}
```

### 15. Remove All Role Menu Permissions

Remove all menu permissions for a specific role.

```
DELETE /api/roles/{roleId}/menu-permissions
```

**Required Permission:** `menu:update`

**Path Parameters:**
- `roleId`: The role ID

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "All menu permissions removed successfully",
  "data": null
}
```

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Menu not found"
  }
}
```

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation error message"
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## Audit Trail

All menu modifications are logged in the audit trail with the following actions:
- `CREATE_MENU`: When a new menu is created
- `UPDATE_MENU`: When menu properties are updated
- `DELETE_MENU`: When a menu is deleted
- `MOVE_MENU`: When a menu is moved to a different parent
- `REORDER_MENUS`: When menu order is changed
- `UPDATE_MENU_PERMISSION`: When menu permissions are updated
- `BATCH_UPDATE_MENU_PERMISSIONS`: When permissions are updated in bulk
- `REMOVE_ALL_MENU_PERMISSIONS`: When all permissions are removed from a role