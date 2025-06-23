# Audit Service Documentation

## Overview

The Audit Service provides comprehensive audit logging functionality for tracking all system activities, user actions, and data access events. It ensures compliance, security monitoring, and detailed activity tracking across the RBAC system.

## Features

- **Complete Action Logging**: Track authentication, user management, role operations, permissions, data access, and system events
- **Advanced Filtering**: Search and filter audit logs by user, action, resource, date range, and IP address
- **Pagination Support**: Efficient retrieval of large audit log datasets
- **Activity Analytics**: Generate statistics and insights from audit data
- **Automatic Cleanup**: Configurable retention policies for old audit logs
- **Transaction Support**: Ensure audit logs are created within database transactions
- **Search Capabilities**: Full-text search across all audit fields

## Service Methods

### Core Logging Methods

#### `log(data, transaction?)`
Generic audit logging method for custom events.

```typescript
await AuditService.log({
  userId: 'user123',
  action: 'custom:action',
  resource: 'custom_resource',
  resourceId: 'resource123',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0',
  details: { customField: 'value' }
});
```

#### `logAuth(data, transaction?)`
Log authentication-related events.

```typescript
await AuditService.logAuth({
  userId: 'user123',
  action: 'login',
  success: true,
  email: 'user@example.com',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0'
});
```

Actions: `login`, `logout`, `register`, `password_reset`, `token_refresh`, `failed_login`

#### `logUserManagement(data, transaction?)`
Log user management operations.

```typescript
await AuditService.logUserManagement({
  userId: 'admin123',
  action: 'update',
  targetUserId: 'user456',
  changes: { email: 'newemail@example.com' },
  ipAddress: '192.168.1.1'
});
```

Actions: `create`, `update`, `delete`, `restore`, `activate`, `deactivate`, `password_reset`

#### `logRoleManagement(data, transaction?)`
Log role-related operations.

```typescript
await AuditService.logRoleManagement({
  userId: 'admin123',
  action: 'assign',
  roleId: 'role123',
  roleName: 'Administrator',
  targetUserId: 'user456',
  ipAddress: '192.168.1.1'
});
```

Actions: `create`, `update`, `delete`, `assign`, `revoke`

#### `logPermissionManagement(data, transaction?)`
Log permission-related operations.

```typescript
await AuditService.logPermissionManagement({
  userId: 'admin123',
  action: 'grant',
  permissionId: 'perm123',
  permissionName: 'user.create',
  targetId: 'role456',
  targetType: 'role',
  ipAddress: '192.168.1.1'
});
```

Actions: `create`, `update`, `delete`, `grant`, `revoke`

#### `logDataAccess(data, transaction?)`
Log data access and export events.

```typescript
await AuditService.logDataAccess({
  userId: 'user123',
  action: 'export',
  resource: 'users',
  dataType: 'csv',
  recordCount: 100,
  ipAddress: '192.168.1.1'
});
```

Actions: `view`, `export`, `download`

#### `logSystem(data, transaction?)`
Log system-level events.

```typescript
await AuditService.logSystem({
  action: 'startup',
  details: {
    version: '1.0.0',
    environment: 'production'
  }
});
```

Actions: `startup`, `shutdown`, `config_change`, `error`, `maintenance`

### Query Methods

#### `getAuditLogs(filter?, pagination?)`
Retrieve audit logs with filtering and pagination.

```typescript
const { logs, total } = await AuditService.getAuditLogs(
  {
    userId: 'user123',
    action: 'login',
    resource: 'auth',
    startDate: new Date('2023-01-01'),
    endDate: new Date('2023-12-31')
  },
  { page: 1, limit: 50 }
);
```

#### `getAuditLogById(id)`
Get a specific audit log entry.

```typescript
const auditLog = await AuditService.getAuditLogById('audit123');
```

#### `getUserActivity(userId, limit?)`
Get recent activity for a specific user.

```typescript
const activities = await AuditService.getUserActivity('user123', 50);
```

#### `getResourceHistory(resource, resourceId, limit?)`
Get modification history for a specific resource.

```typescript
const history = await AuditService.getResourceHistory('user', 'user123', 50);
```

#### `searchLogs(searchTerm, pagination?)`
Search audit logs across all fields.

```typescript
const { logs, total } = await AuditService.searchLogs('login', {
  page: 1,
  limit: 50
});
```

### Analytics Methods

#### `getAuditStatistics(startDate?, endDate?)`
Generate audit statistics and insights.

```typescript
const stats = await AuditService.getAuditStatistics(
  new Date('2023-01-01'),
  new Date('2023-12-31')
);

// Returns:
{
  totalLogs: 10000,
  byAction: {
    'user:login': 5000,
    'user:logout': 3000,
    // ...
  },
  byResource: {
    'user': 6000,
    'role': 2000,
    // ...
  },
  byUser: [
    {
      userId: 'user123',
      email: 'user@example.com',
      username: 'username',
      count: 500
    },
    // ... top 10 users
  ],
  recentActivity: [
    { date: '2023-12-01', count: 150 },
    // ... last 7 days
  ]
}
```

### Maintenance Methods

#### `cleanupOldLogs(daysToKeep?)`
Remove audit logs older than specified days.

```typescript
const deletedCount = await AuditService.cleanupOldLogs(90); // Keep last 90 days
```

## Data Types

### AuditFilter
```typescript
interface AuditFilter {
  userId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
}
```

### AuditLogEntry
```typescript
interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  resource: string | null;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  details: AuditDetails | null;
  createdAt: Date;
  user?: {
    id: string;
    email: string;
    username: string;
  };
}
```

### AuditDetails
Flexible JSON object for storing additional context:
```typescript
interface AuditDetails {
  [key: string]: any;
  // Common fields:
  success?: boolean;
  email?: string;
  targetUserId?: string;
  changes?: Record<string, any>;
  roleId?: string;
  roleName?: string;
  permissionId?: string;
  permissionName?: string;
  reason?: string;
  // ... any additional fields
}
```

## Usage Examples

### Authentication Tracking
```typescript
// Successful login
await AuditService.logAuth({
  userId: user.id,
  action: 'login',
  success: true,
  email: user.email,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent']
});

// Failed login attempt
await AuditService.logAuth({
  action: 'failed_login',
  success: false,
  email: attemptedEmail,
  ipAddress: req.ip,
  details: { reason: 'Invalid password' }
});
```

### User Management Tracking
```typescript
// Track user creation
await AuditService.logUserManagement({
  userId: currentUser.id,
  action: 'create',
  targetUserId: newUser.id,
  changes: {
    email: newUser.email,
    roles: newUser.roles.map(r => r.name)
  },
  ipAddress: req.ip
}, transaction);
```

### Data Export Tracking
```typescript
// Track data export
await AuditService.logDataAccess({
  userId: currentUser.id,
  action: 'export',
  resource: 'users',
  dataType: 'csv',
  recordCount: users.length,
  ipAddress: req.ip
});
```

### Compliance Reporting
```typescript
// Generate monthly compliance report
const startOfMonth = new Date();
startOfMonth.setDate(1);
const endOfMonth = new Date();

const stats = await AuditService.getAuditStatistics(startOfMonth, endOfMonth);
const adminActions = await AuditService.getAuditLogs(
  { 
    action: 'user:delete',
    startDate: startOfMonth,
    endDate: endOfMonth
  },
  { page: 1, limit: 1000 }
);
```

## Best Practices

1. **Always Log Critical Actions**: Ensure all security-sensitive operations are logged
2. **Include Context**: Provide meaningful details in the `details` field
3. **Use Transactions**: Log within the same transaction as the action being performed
4. **Regular Cleanup**: Configure appropriate retention policies for compliance
5. **Monitor Anomalies**: Regularly review audit statistics for unusual patterns
6. **IP Tracking**: Always capture IP addresses for security monitoring
7. **Error Handling**: Log both successful and failed attempts with appropriate details

## Security Considerations

- Audit logs should be treated as sensitive data
- Implement appropriate access controls for viewing audit logs
- Consider encrypting sensitive details in the `details` field
- Ensure audit log retention meets compliance requirements
- Monitor for suspicious patterns in audit logs
- Protect against audit log tampering
- Consider replicating critical audit logs to external systems

## Performance Considerations

- Use pagination for large result sets
- Create appropriate database indexes on frequently queried fields
- Schedule cleanup operations during off-peak hours
- Consider archiving old audit logs instead of deleting
- Use the search functionality judiciously on large datasets
- Monitor database growth and plan capacity accordingly