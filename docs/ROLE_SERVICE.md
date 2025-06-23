# Role Management Service

## Overview
The Role Service provides comprehensive role management functionality for the RBAC system. It handles all operations related to roles including CRUD operations, permission assignments, user associations, and role statistics.

## Service Methods

### 1. getAllRoles
Retrieves all roles with pagination and filtering capabilities.

```typescript
static async getAllRoles(
  filter: RoleFilter = {},
  pagination: PaginationOptions = { page: 1, limit: 10 }
): Promise<RoleListResponse>
```

**Parameters:**
- `filter`: Optional filtering options
  - `search`: Search in role name and description
  - `isSystem`: Filter by system/custom roles
  - `hasUsers`: Filter roles with/without assigned users
  - `sortBy`: Sort by field (name, createdAt, updatedAt)
  - `sortOrder`: Sort direction (asc, desc)
- `pagination`: Pagination options (page, limit)

**Returns:** RoleListResponse with roles array and pagination metadata

### 2. getRoleById
Retrieves a single role by ID with full details including users and permissions.

```typescript
static async getRoleById(roleId: string): Promise<RoleWithDetails>
```

**Parameters:**
- `roleId`: The UUID of the role

**Returns:** RoleWithDetails object

**Throws:** ApiError(404) if role not found

### 3. getRoleByName
Retrieves a role by its unique name.

```typescript
static async getRoleByName(name: string): Promise<Role | null>
```

**Parameters:**
- `name`: The unique role name

**Returns:** Role object or null if not found

### 4. createRole
Creates a new role with optional permission assignments.

```typescript
static async createRole(
  data: CreateRoleData,
  transaction?: Transaction
): Promise<RoleWithDetails>
```

**Parameters:**
- `data`: Role creation data
  - `name`: Unique role name (required)
  - `description`: Role description (optional)
  - `isSystem`: System role flag (optional, default: false)
  - `permissionIds`: Array of permission IDs to assign (optional)
  - `createdBy`: User ID who creates the role (optional)
- `transaction`: Database transaction (optional)

**Returns:** Created role with details

**Throws:** 
- ApiError(409) if role name already exists
- ApiError(400) if invalid permission IDs

### 5. updateRole
Updates an existing role.

```typescript
static async updateRole(
  roleId: string,
  data: UpdateRoleData,
  updatedBy: string,
  transaction?: Transaction
): Promise<RoleWithDetails>
```

**Parameters:**
- `roleId`: The UUID of the role to update
- `data`: Update data
  - `name`: New role name (optional)
  - `description`: New description (optional)
  - `permissionIds`: New permission IDs (optional, replaces all)
- `updatedBy`: User ID who updates the role
- `transaction`: Database transaction (optional)

**Returns:** Updated role with details

**Throws:**
- ApiError(404) if role not found
- ApiError(409) if new name already exists
- ApiError(400) if invalid permission IDs

### 6. deleteRole
Deletes a role (soft delete for roles with users).

```typescript
static async deleteRole(
  roleId: string,
  deletedBy: string,
  transaction?: Transaction
): Promise<void>
```

**Parameters:**
- `roleId`: The UUID of the role to delete
- `deletedBy`: User ID who deletes the role
- `transaction`: Database transaction (optional)

**Throws:**
- ApiError(404) if role not found
- ApiError(403) if trying to delete system role
- ApiError(400) if role has assigned users

### 7. updateRolePermissions
Add or remove specific permissions from a role.

```typescript
static async updateRolePermissions(
  roleId: string,
  update: RolePermissionUpdate,
  updatedBy: string,
  transaction?: Transaction
): Promise<RoleWithDetails>
```

**Parameters:**
- `roleId`: The UUID of the role
- `update`: Permission update object
  - `add`: Array of permission IDs to add
  - `remove`: Array of permission IDs to remove
- `updatedBy`: User ID who updates permissions
- `transaction`: Database transaction (optional)

**Returns:** Updated role with details

### 8. cloneRole
Creates a copy of an existing role.

```typescript
static async cloneRole(
  data: RoleCloneData,
  clonedBy: string,
  transaction?: Transaction
): Promise<RoleWithDetails>
```

**Parameters:**
- `data`: Clone configuration
  - `sourceRoleId`: ID of role to clone
  - `newRoleName`: Name for the new role
  - `description`: Description for new role (optional)
  - `includePermissions`: Copy permissions (optional, default: false)
  - `includeMenuPermissions`: Copy menu permissions (optional, default: false)
- `clonedBy`: User ID who clones the role
- `transaction`: Database transaction (optional)

**Returns:** Newly created role

### 9. bulkDeleteRoles
Deletes multiple roles in a single operation.

```typescript
static async bulkDeleteRoles(
  roleIds: string[],
  deletedBy: string,
  transaction?: Transaction
): Promise<BulkRoleOperationResult>
```

**Parameters:**
- `roleIds`: Array of role IDs to delete
- `deletedBy`: User ID who performs the deletion
- `transaction`: Database transaction (optional)

**Returns:** Object with success and failed arrays

### 10. getRoleStatistics
Retrieves comprehensive statistics about roles.

```typescript
static async getRoleStatistics(): Promise<RoleStatistics>
```

**Returns:** Statistics object containing:
- `total`: Total number of roles
- `system`: Number of system roles
- `custom`: Number of custom roles
- `withUsers`: Roles with assigned users
- `withoutUsers`: Roles without users
- `avgPermissionsPerRole`: Average permissions per role
- `mostUsedRoles`: Top 5 roles by user count

### 11. getRoleUsers
Gets all users assigned to a specific role.

```typescript
static async getRoleUsers(
  roleId: string,
  pagination: PaginationOptions = { page: 1, limit: 10 }
): Promise<{ users: User[]; total: number }>
```

**Parameters:**
- `roleId`: The UUID of the role
- `pagination`: Pagination options

**Returns:** Object with users array and total count

### 12. assignUsersToRole
Assigns multiple users to a role.

```typescript
static async assignUsersToRole(
  roleId: string,
  userIds: string[],
  assignedBy: string,
  transaction?: Transaction
): Promise<BulkRoleOperationResult>
```

**Parameters:**
- `roleId`: The UUID of the role
- `userIds`: Array of user IDs to assign
- `assignedBy`: User ID who performs the assignment
- `transaction`: Database transaction (optional)

**Returns:** Object with success and failed arrays

### 13. removeUsersFromRole
Removes multiple users from a role.

```typescript
static async removeUsersFromRole(
  roleId: string,
  userIds: string[],
  removedBy: string,
  transaction?: Transaction
): Promise<BulkRoleOperationResult>
```

**Parameters:**
- `roleId`: The UUID of the role
- `userIds`: Array of user IDs to remove
- `removedBy`: User ID who performs the removal
- `transaction`: Database transaction (optional)

**Returns:** Object with success and failed arrays

### 14. getRoleHierarchy
Gets role hierarchy for visualization purposes.

```typescript
static async getRoleHierarchy(): Promise<RoleHierarchy[]>
```

**Returns:** Array of role hierarchy objects

### 15. roleHasPermission
Checks if a role has a specific permission.

```typescript
static async roleHasPermission(roleId: string, permissionName: string): Promise<boolean>
```

**Parameters:**
- `roleId`: The UUID of the role
- `permissionName`: The permission name to check

**Returns:** Boolean indicating if role has the permission

### 16. getRoleMenuPermissions
Gets menu permissions for a role.

```typescript
static async getRoleMenuPermissions(roleId: string): Promise<RoleMenuPermissions>
```

**Parameters:**
- `roleId`: The UUID of the role

**Returns:** Object with roleId and array of menu permissions

### 17. updateRoleMenuPermissions
Updates menu permissions for a role.

```typescript
static async updateRoleMenuPermissions(
  roleId: string,
  menuPermissions: RoleMenuPermissions['menuPermissions'],
  updatedBy: string,
  transaction?: Transaction
): Promise<void>
```

**Parameters:**
- `roleId`: The UUID of the role
- `menuPermissions`: Array of menu permission objects
- `updatedBy`: User ID who updates permissions
- `transaction`: Database transaction (optional)

## Type Definitions

### RoleFilter
```typescript
interface RoleFilter {
  search?: string;
  isSystem?: boolean;
  hasUsers?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}
```

### CreateRoleData
```typescript
interface CreateRoleData {
  name: string;
  description?: string;
  isSystem?: boolean;
  permissionIds?: string[];
  createdBy?: string;
}
```

### UpdateRoleData
```typescript
interface UpdateRoleData {
  name?: string;
  description?: string;
  permissionIds?: string[];
}
```

### RoleWithDetails
```typescript
interface RoleWithDetails extends Role {
  permissions?: Permission[];
  users?: User[];
  userCount?: number;
  permissionCount?: number;
}
```

### RoleStatistics
```typescript
interface RoleStatistics {
  total: number;
  system: number;
  custom: number;
  withUsers: number;
  withoutUsers: number;
  avgPermissionsPerRole: number;
  mostUsedRoles: Array<{
    id: string;
    name: string;
    userCount: number;
  }>;
}
```

## Usage Examples

### Creating a Role with Permissions
```typescript
const newRole = await RoleService.createRole({
  name: 'content_editor',
  description: 'Can manage content and publications',
  permissionIds: ['perm-1', 'perm-2', 'perm-3'],
  createdBy: 'admin-user-id'
});
```

### Updating Role Permissions
```typescript
// Add and remove specific permissions
const updatedRole = await RoleService.updateRolePermissions(
  'role-id',
  {
    add: ['new-perm-1', 'new-perm-2'],
    remove: ['old-perm-1']
  },
  'admin-user-id'
);
```

### Cloning a Role
```typescript
const clonedRole = await RoleService.cloneRole({
  sourceRoleId: 'admin-role-id',
  newRoleName: 'regional_admin',
  description: 'Regional administrator with limited permissions',
  includePermissions: true,
  includeMenuPermissions: true
}, 'admin-user-id');
```

### Getting Role Statistics
```typescript
const stats = await RoleService.getRoleStatistics();
console.log(`Total roles: ${stats.total}`);
console.log(`Most used role: ${stats.mostUsedRoles[0].name} (${stats.mostUsedRoles[0].userCount} users)`);
```

### Bulk User Assignment
```typescript
const result = await RoleService.assignUsersToRole(
  'role-id',
  ['user-1', 'user-2', 'user-3'],
  'admin-user-id'
);
console.log(`Assigned: ${result.success.length}, Failed: ${result.failed.length}`);
```

## Error Handling

All methods use consistent error handling with ApiError:

- **400 Bad Request**: Invalid input data or business rule violations
- **403 Forbidden**: Unauthorized operations (e.g., deleting system roles)
- **404 Not Found**: Role not found
- **409 Conflict**: Duplicate role names

Example error handling:
```typescript
try {
  await RoleService.deleteRole('role-id', 'user-id');
} catch (error) {
  if (error instanceof ApiError) {
    switch (error.statusCode) {
      case 403:
        console.error('Cannot delete system role');
        break;
      case 400:
        console.error('Role has assigned users');
        break;
      case 404:
        console.error('Role not found');
        break;
    }
  }
}
```

## Best Practices

1. **Transaction Management**: Always use transactions for operations that modify multiple entities
2. **Permission Validation**: Validate all permission IDs before assignment
3. **System Roles**: Never allow deletion or critical modifications of system roles
4. **Audit Logging**: All operations are automatically logged for audit trails
5. **Bulk Operations**: Use bulk methods for better performance when working with multiple entities
6. **Error Recovery**: Bulk operations return partial results allowing for error recovery

## Performance Considerations

1. **Pagination**: Always use pagination for list operations
2. **Eager Loading**: The service uses appropriate eager loading to minimize database queries
3. **Bulk Operations**: Prefer bulk methods over iterative single operations
4. **Caching**: Consider implementing caching for frequently accessed roles
5. **Indexes**: Ensure database indexes on name, isSystem fields for optimal query performance

---

Document Version: 1.0
Last Updated: 2025-06-23
Service Version: 1.0.0