# User Management Service Documentation

## Overview

The User Management Service (`UserService`) provides comprehensive user management functionality for the RBAC system. It handles CRUD operations, role assignments, bulk operations, and user statistics.

## Features

- User CRUD operations (Create, Read, Update, Delete)
- Advanced filtering and pagination
- Role management for users
- Bulk operations (activate/deactivate, delete)
- Password management
- User statistics and analytics
- Soft delete with restoration capability
- Audit logging for all operations

## API Methods

### `getAllUsers(filter: UserFilter, pagination: PaginationOptions): Promise<{ users: User[]; total: number }>`

Retrieves users with filtering and pagination.

**Parameters:**
- `filter`: Search, status, role filtering options
- `pagination`: Page number and limit

**Features:**
- Full-text search across email, username, first name, last name
- Filter by active status
- Filter by role IDs
- Custom sorting options
- Includes user roles in response

### `getUserById(userId: string): Promise<UserWithRoles>`

Gets a specific user by ID.

**Returns:**
- User object with associated roles

**Throws:**
- `404 Not Found` if user doesn't exist

### `getUserByEmail(email: string): Promise<User | null>`

Finds a user by email address.

**Returns:**
- User object or null if not found

### `createUser(data: CreateUserData): Promise<UserWithRoles>`

Creates a new user.

**Parameters:**
```typescript
{
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  isSuperuser?: boolean;
  roleIds?: number[];
  createdBy?: string;
}
```

**Features:**
- Validates unique email and username
- Hashes password securely
- Assigns roles if provided
- Creates audit log entry

### `updateUser(userId: string, data: UpdateUserData, updatedBy: string): Promise<UserWithRoles>`

Updates user information.

**Parameters:**
- `userId`: User ID to update
- `data`: Fields to update
- `updatedBy`: ID of user performing update

**Features:**
- Validates unique constraints
- Updates roles if provided
- Creates audit log entry
- Returns updated user with roles

### `deleteUser(userId: string, deletedBy: string): Promise<void>`

Soft deletes a user by deactivating them.

**Features:**
- Prevents deletion of superusers
- Revokes all refresh tokens
- Creates audit log entry
- User can be restored later

### `restoreUser(userId: string, restoredBy: string): Promise<UserWithRoles>`

Restores a soft-deleted user.

**Features:**
- Reactivates user account
- Creates audit log entry

### `updateUserRoles(userId: string, roleIds: number[], updatedBy: string): Promise<UserWithRoles>`

Updates user's role assignments.

**Features:**
- Validates all role IDs exist
- Replaces existing roles
- Tracks old and new roles in audit log

### `resetUserPassword(userId: string, newPassword: string, resetBy: string): Promise<void>`

Admin action to reset a user's password.

**Features:**
- Hashes new password
- Forces logout by revoking all tokens
- Creates audit log entry

### `bulkUpdateStatus(userIds: string[], isActive: boolean, updatedBy: string): Promise<BulkOperationResult>`

Bulk activate or deactivate users.

**Returns:**
```typescript
{
  success: string[];  // Successfully updated user IDs
  failed: Array<{     // Failed updates with reasons
    id: string;
    error: string;
  }>;
}
```

**Features:**
- Prevents deactivating superusers
- Revokes tokens when deactivating
- Returns detailed results

### `bulkDeleteUsers(userIds: string[], deletedBy: string): Promise<BulkOperationResult>`

Bulk soft delete users.

**Features:**
- Uses same logic as single delete
- Returns detailed results
- Creates audit log

### `getUserStatistics(): Promise<UserStatistics>`

Gets system-wide user statistics.

**Returns:**
```typescript
{
  total: number;
  active: number;
  inactive: number;
  superusers: number;
  byRole: Record<string, number>;  // User count by role name
}
```

### `userHasRole(userId: string, roleName: string): Promise<boolean>`

Checks if user has a specific role.

### `userHasAnyRole(userId: string, roleNames: string[]): Promise<boolean>`

Checks if user has any of the specified roles.

## Usage Examples

### List Users with Filtering
```typescript
const { users, total } = await UserService.getAllUsers({
  search: 'john',
  isActive: true,
  roleIds: [1, 2],
  sortBy: 'email',
  sortOrder: 'asc'
}, {
  page: 1,
  limit: 20
});
```

### Create User with Roles
```typescript
const user = await UserService.createUser({
  email: 'john.doe@example.com',
  username: 'johndoe',
  password: 'SecurePass123!',
  firstName: 'John',
  lastName: 'Doe',
  roleIds: [2, 3],
  createdBy: adminUserId
});
```

### Update User
```typescript
const updatedUser = await UserService.updateUser(userId, {
  firstName: 'Jane',
  lastName: 'Smith',
  roleIds: [1, 4]
}, adminUserId);
```

### Bulk Operations
```typescript
// Deactivate multiple users
const result = await UserService.bulkUpdateStatus(
  ['user1', 'user2', 'user3'],
  false,
  adminUserId
);

console.log(`Success: ${result.success.length}`);
console.log(`Failed: ${result.failed.length}`);
```

### Get Statistics
```typescript
const stats = await UserService.getUserStatistics();
console.log(`Total users: ${stats.total}`);
console.log(`Active: ${stats.active}`);
console.log(`By role:`, stats.byRole);
```

## Security Features

1. **Password Security**
   - Passwords are hashed using bcrypt
   - Original passwords never stored

2. **Access Control**
   - Superuser protection
   - Role-based operations
   - Audit trail for all changes

3. **Data Validation**
   - Unique constraint validation
   - Role existence validation
   - Input sanitization

## Error Handling

The service uses custom `ApiError` for consistent error responses:

- `400 Bad Request`: Invalid input or operation
- `404 Not Found`: User not found
- `409 Conflict`: Duplicate email/username
- `403 Forbidden`: Operation not allowed (e.g., deleting superuser)

## Performance Considerations

1. **Pagination**: Always use pagination for listing users
2. **Filtering**: Use database-level filtering for better performance
3. **Bulk Operations**: Process in batches for large datasets
4. **Indexing**: Ensure proper indexes on searchable fields

## Audit Logging

All operations are logged with:
- User performing the action
- Action type
- Affected resource
- Detailed changes
- Timestamp

Actions logged:
- USER_CREATED
- USER_UPDATED
- USER_DELETED
- USER_RESTORED
- USER_ROLES_UPDATED
- USER_PASSWORD_RESET
- USERS_ACTIVATED/DEACTIVATED

## Best Practices

1. **Soft Delete**: Users are deactivated rather than deleted
2. **Role Validation**: Always validate role IDs before assignment
3. **Audit Trail**: All modifications are tracked
4. **Token Cleanup**: Tokens are revoked on deactivation
5. **Error Details**: Bulk operations return detailed error information