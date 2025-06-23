# Menu Permission Service Documentation

## Overview

The Menu Permission Service manages menu access control in the RBAC system. It provides functionality for managing menu permissions at the role level, allowing fine-grained control over which menus users can view, edit, delete, or export based on their assigned roles.

## Architecture

### Service Layer
- **MenuPermissionService**: Core service handling all menu permission operations
- **MenuController**: REST API controller for menu endpoints
- **Menu Routes**: Express routes for menu-related endpoints

### Data Models
- **Menu**: Hierarchical menu structure with parent-child relationships
- **MenuPermission**: Junction table linking menus to roles with specific permissions
- **Role**: User roles that can be assigned menu permissions
- **User**: System users who access menus through their assigned roles

## Key Features

### 1. User Menu Tree
- Retrieves filtered menu structure based on user's effective permissions
- Aggregates permissions across multiple roles
- Supports hierarchical menu structures
- Only shows active menus with view permissions

### 2. Menu Permission Management
- Role-based menu permissions (not user-based)
- Four permission types per menu: view, edit, delete, export
- At least one permission must be granted when assigning
- Support for batch operations

### 3. Hierarchical Permission Support
- Apply permissions to parent and all child menus
- Automatic permission cascading
- Maintains menu tree integrity

### 4. Access Control
- Check user access to specific menus
- Identify which roles grant access
- Support for different permission types

## API Endpoints

### Menu Endpoints

#### Get User Menu Tree
```
GET /api/menus/user-menu
Authorization: Bearer {token}

Response:
{
  "menus": [
    {
      "id": "M1",
      "title": "Dashboard",
      "href": "/dashboard",
      "permissions": {
        "canView": true,
        "canEdit": true,
        "canDelete": false,
        "canExport": false
      },
      "children": [...]
    }
  ],
  "totalCount": 10,
  "activeCount": 8
}
```

#### Get Complete Menu Tree (Admin)
```
GET /api/menus
Authorization: Bearer {token}
Required Permission: menu:read

Query Parameters:
- search: string (optional)
- parentId: string (optional)
- isActive: boolean (optional)
- sortBy: 'title' | 'orderIndex' | 'createdAt' (optional)
- sortOrder: 'asc' | 'desc' (optional)
```

#### Get Menu Permissions
```
GET /api/menus/{menuId}/permissions
Authorization: Bearer {token}
Required Permission: menu:read

Response:
{
  "permissions": [
    {
      "menuId": "M1",
      "roleId": "uuid",
      "canView": true,
      "canEdit": true,
      "canDelete": false,
      "canExport": false,
      "role": {
        "id": "uuid",
        "name": "Admin"
      }
    }
  ]
}
```

#### Batch Update Menu Permissions
```
POST /api/menus/permissions/batch
Authorization: Bearer {token}
Required Permission: menu:update

Request Body:
{
  "roleId": "uuid",
  "permissions": [
    {
      "menuId": "M1",
      "canView": true,
      "canEdit": true,
      "canDelete": false,
      "canExport": false
    }
  ],
  "applyToChildren": true
}
```

#### Check Menu Access
```
POST /api/menus/check-access
Authorization: Bearer {token}
Required Permission: menu:read

Request Body:
{
  "menuId": "M1",
  "userId": "uuid", // optional, defaults to current user
  "permission": "view" // view | edit | delete | export
}

Response:
{
  "allowed": true,
  "rolesThatGrantAccess": [
    {
      "roleId": "uuid",
      "roleName": "Admin"
    }
  ]
}
```

#### Get Menu Permission Matrix
```
GET /api/menus/permissions/matrix
Authorization: Bearer {token}
Required Permission: menu:read

Response:
{
  "matrix": [
    {
      "roleId": "uuid",
      "roleName": "Admin",
      "permissions": {
        "M1": {
          "canView": true,
          "canEdit": true,
          "canDelete": false,
          "canExport": false
        }
      }
    }
  ]
}
```

#### Get Menu Statistics
```
GET /api/menus/statistics
Authorization: Bearer {token}
Required Permission: menu:read

Response:
{
  "totalMenus": 25,
  "activeMenus": 20,
  "topLevelMenus": 5,
  "maxDepth": 3,
  "averageChildrenPerMenu": 2.5
}
```

### Role Menu Permission Endpoints

#### Update Role Menu Permissions
```
PUT /api/roles/{roleId}/menu-permissions
Authorization: Bearer {token}
Required Permission: menu:update

Request Body:
{
  "permissions": [
    {
      "menuId": "M1",
      "canView": true,
      "canEdit": true,
      "canDelete": false,
      "canExport": false
    }
  ]
}
```

#### Remove All Role Menu Permissions
```
DELETE /api/roles/{roleId}/menu-permissions
Authorization: Bearer {token}
Required Permission: menu:update
```

## Usage Examples

### 1. Setting Up Menu Permissions for a New Role

```javascript
// 1. Create a new role
const role = await apiClient.post('/api/roles', {
  name: 'Content Editor',
  description: 'Can edit content-related menus'
});

// 2. Assign menu permissions
await apiClient.put(`/api/roles/${role.id}/menu-permissions`, {
  permissions: [
    {
      menuId: 'M1',
      canView: true,
      canEdit: true,
      canDelete: false,
      canExport: true
    },
    {
      menuId: 'M2',
      canView: true,
      canEdit: true,
      canDelete: false,
      canExport: false
    }
  ]
});
```

### 2. Batch Update Permissions with Children

```javascript
// Apply permissions to a menu and all its children
await apiClient.post('/api/menus/permissions/batch', {
  roleId: 'role-uuid',
  permissions: [
    {
      menuId: 'M1',
      canView: true,
      canEdit: false
    }
  ],
  applyToChildren: true
});
```

### 3. Check User Access Before Navigation

```javascript
// Check if current user can edit a specific menu
const accessCheck = await apiClient.post('/api/menus/check-access', {
  menuId: 'M1',
  permission: 'edit'
});

if (accessCheck.allowed) {
  // Navigate to edit page
} else {
  // Show access denied message
}
```

## Best Practices

### 1. Permission Design
- Grant minimal necessary permissions
- Use view permission as the base requirement
- Consider menu hierarchy when assigning permissions
- Group related menus under common parents

### 2. Performance Optimization
- Cache user menu trees for better performance
- Use batch operations for bulk updates
- Minimize permission checks during navigation

### 3. Security Considerations
- Always validate menu IDs against existing menus
- Ensure at least one permission is granted
- Audit all permission changes
- Regularly review role permissions

### 4. Menu Structure
- Keep menu hierarchy shallow (max 3-4 levels)
- Use meaningful menu IDs (alphanumeric only)
- Maintain consistent ordering with orderIndex
- Deactivate rather than delete menus

## Error Handling

Common error scenarios:

1. **404 Not Found**
   - Menu not found
   - Role not found
   - User not found

2. **400 Bad Request**
   - Invalid menu ID format
   - No permissions granted
   - Invalid permission type

3. **403 Forbidden**
   - Insufficient permissions
   - Attempting to modify system menus

## Integration with MES System

The menu permission system is designed to work with MES (Manufacturing Execution System) menu structures:

1. **Menu ID Format**: Alphanumeric IDs (e.g., M1, M2A, PROD01)
2. **Hierarchical Structure**: Supports complex menu trees
3. **Permission Granularity**: Four distinct permission types
4. **Batch Operations**: Efficient for large menu structures

## Audit Trail

All menu permission changes are logged:

1. **Tracked Actions**:
   - UPDATE_MENU_PERMISSION
   - BATCH_UPDATE_MENU_PERMISSIONS
   - REMOVE_ALL_MENU_PERMISSIONS

2. **Audit Details**:
   - User who made the change
   - Timestamp of change
   - Previous and new values
   - Affected menus and roles

## Testing

The service includes comprehensive unit tests covering:

1. User menu tree generation
2. Permission aggregation across roles
3. Batch update operations
4. Access control validation
5. Menu statistics calculation

Run tests with:
```bash
npm test tests/unit/services/menu-permission.service.test.ts
```

Test endpoints with:
```bash
npx ts-node test-menu-endpoints.ts
```