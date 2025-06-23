# Permission Middleware Documentation

## Overview

The permission middleware provides comprehensive authorization controls for the RBAC system. It includes various middleware functions for checking permissions, roles, ownership, and more.

## Features

- **Permission-based authorization** with wildcard support
- **Role-based authorization**
- **Ownership verification** with fallback permissions
- **Dynamic permission resolution**
- **Resource-based permission mapping**
- **Combine multiple authorization checks**
- **Audit logging for permission checks**
- **Real-time database permission verification**

## Available Middleware Functions

### 1. requirePermission

Checks if the user has specific permission(s).

```typescript
// Single permission
router.get('/users', requirePermission('user:read'), controller.getUsers);

// Multiple permissions (OR logic - any permission passes)
router.post('/users', requirePermission(['user:create', 'admin:manage']), controller.createUser);

// Multiple permissions (AND logic - all permissions required)
router.delete('/users/:id', 
  requirePermission(['user:delete', 'user:manage'], { requireAll: true }), 
  controller.deleteUser
);

// Real-time database check
router.put('/sensitive-operation', 
  requirePermission('admin:execute', { checkDatabase: true }), 
  controller.sensitiveOperation
);
```

**Options:**
- `requireAll`: Boolean - Require all permissions (AND) vs any permission (OR)
- `checkDatabase`: Boolean - Check database for real-time permissions instead of JWT

### 2. requireRole

Checks if the user has specific role(s).

```typescript
// Single role
router.get('/admin', requireRole('admin'), controller.adminDashboard);

// Multiple roles (OR logic)
router.get('/reports', requireRole(['admin', 'manager']), controller.getReports);
```

### 3. requireOwnershipOrPermission

Checks if the user owns the resource OR has a fallback permission.

```typescript
// Check URL parameter
router.put('/users/:userId/profile', 
  requireOwnershipOrPermission({
    ownerIdParam: 'userId',
    fallbackPermission: 'user:update'
  }), 
  controller.updateProfile
);

// Check request body field
router.post('/posts/:postId/edit', 
  requireOwnershipOrPermission({
    ownerIdField: 'authorId',
    fallbackPermission: 'post:moderate'
  }), 
  controller.editPost
);

// Custom ownership check
router.delete('/orders/:orderId', 
  requireOwnershipOrPermission({
    getUserId: async (req) => {
      const order = await Order.findByPk(req.params.orderId);
      return order?.userId;
    },
    fallbackPermission: 'order:delete'
  }), 
  controller.deleteOrder
);
```

### 4. requireSuperuser

Requires superuser privileges.

```typescript
router.post('/system/reset', requireSuperuser, controller.systemReset);
```

### 5. requireDynamicPermission

Determines required permission dynamically based on request data.

```typescript
// Dynamic permission based on request
router.post('/api/:resource/:action', 
  requireDynamicPermission((req) => {
    return `${req.params.resource}:${req.params.action}`;
  }), 
  controller.dynamicHandler
);

// Async permission resolution
router.put('/documents/:id', 
  requireDynamicPermission(async (req) => {
    const doc = await Document.findByPk(req.params.id);
    return doc.isPublic ? 'document:read' : 'document:write';
  }), 
  controller.updateDocument
);
```

### 6. requireResourcePermission

Maps HTTP methods to CRUD permissions automatically.

```typescript
// Automatically maps:
// GET -> user:read
// POST -> user:create
// PUT/PATCH -> user:update
// DELETE -> user:delete
router.use('/users', requireResourcePermission('user'));
```

### 7. requireAny

Combines multiple middleware with OR logic.

```typescript
// Allow if user is owner OR has admin role OR has specific permission
router.delete('/posts/:postId', 
  requireAny(
    requireOwnershipOrPermission({
      ownerIdParam: 'authorId',
      fallbackPermission: 'post:delete'
    }),
    requireRole('admin'),
    requirePermission('post:moderate')
  ), 
  controller.deletePost
);
```

### 8. auditPermissionCheck

Logs permission checks for audit purposes.

```typescript
router.post('/sensitive-data', 
  auditPermissionCheck('access', 'sensitive-data'),
  requirePermission('data:sensitive'),
  controller.accessSensitiveData
);
```

## Permission Wildcards

The middleware supports various wildcard patterns:

- `resource:*` - All actions on a specific resource
- `*:action` - Specific action on all resources
- `*:*` - All permissions (superuser equivalent)

Examples:
- `user:*` matches `user:create`, `user:read`, `user:update`, `user:delete`
- `*:read` matches `user:read`, `post:read`, `admin:read`

## Integration Examples

### Protected Route with Multiple Checks

```typescript
import { 
  requirePermission, 
  requireRole, 
  requireAny,
  auditPermissionCheck 
} from '@middlewares/permission.middleware';

// Admin-only route
router.get('/admin/users',
  authenticate,
  requireRole('admin'),
  controller.getAdminUsers
);

// Owner or moderator can edit
router.put('/posts/:postId',
  authenticate,
  requireAny(
    requireOwnershipOrPermission({
      getUserId: async (req) => {
        const post = await Post.findByPk(req.params.postId);
        return post?.authorId;
      },
      fallbackPermission: 'post:moderate'
    }),
    requireRole('moderator')
  ),
  controller.updatePost
);

// Audit sensitive operations
router.post('/users/:userId/reset-password',
  authenticate,
  auditPermissionCheck('reset-password', 'user'),
  requirePermission('user:reset-password'),
  controller.resetUserPassword
);
```

### Resource-Based Permissions

```typescript
// Apply resource permissions to all routes
const userRouter = Router();
userRouter.use(authenticate);
userRouter.use(requireResourcePermission('user'));

userRouter.get('/', controller.getUsers);        // Requires user:read
userRouter.post('/', controller.createUser);      // Requires user:create
userRouter.put('/:id', controller.updateUser);    // Requires user:update
userRouter.delete('/:id', controller.deleteUser); // Requires user:delete
```

### Dynamic API Protection

```typescript
// Generic API endpoint with dynamic permissions
router.all('/api/:module/:resource/:action',
  authenticate,
  requireDynamicPermission((req) => {
    const { module, resource, action } = req.params;
    return `${module}:${resource}:${action}`;
  }),
  controller.genericApiHandler
);
```

## Error Responses

The middleware returns appropriate HTTP status codes:

- `401 Unauthorized` - No authentication token or invalid token
- `403 Forbidden` - Authenticated but lacks required permissions/roles
- `405 Method Not Allowed` - HTTP method not supported (requireResourcePermission)

Example error response:
```json
{
  "success": false,
  "message": "Insufficient permissions",
  "error": {
    "code": "AUTH_004",
    "details": "Access denied"
  }
}
```

## Best Practices

1. **Use specific permissions** rather than broad ones when possible
2. **Combine middleware** for complex authorization logic
3. **Log sensitive operations** using auditPermissionCheck
4. **Cache permission checks** when using checkDatabase option frequently
5. **Use ownership checks** for user-specific resources
6. **Apply resource permissions** for RESTful endpoints
7. **Document required permissions** in API documentation

## Testing

When testing endpoints with permission middleware:

```typescript
// Mock authenticated user with permissions
const mockUser = {
  id: 'user-123',
  username: 'testuser',
  email: 'test@example.com',
  roles: ['user'],
  permissions: ['user:read', 'user:update'],
  isSuperuser: false
};

// In tests
req.user = mockUser;
```

## Performance Considerations

- JWT-based permission checks are fast (no database queries)
- Use `checkDatabase: true` sparingly for performance
- Consider caching for frequently checked permissions
- Wildcard checks add minimal overhead

---

For more information, see:
- [Authentication Documentation](./AUTH_SERVICE.md)
- [Role Management](./ROLE_SERVICE.md)
- [Permission Service](./PERMISSION_SERVICE.md)