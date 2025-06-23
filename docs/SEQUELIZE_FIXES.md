# Sequelize Operator and Association Fixes

This document outlines the fixes applied to resolve Sequelize operator and association issues in the RBAC system.

## Issues Fixed

### 1. Op Operator Import Issues
**Problem**: The code was attempting to use `sequelize.Op` which doesn't exist on Sequelize instances.

**Solution**: Import `Op` directly from 'sequelize' package:
```typescript
import { Op } from 'sequelize';
```

### 2. WhereOptions Type Issues with Op Operators
**Problem**: TypeScript's WhereOptions type doesn't recognize dynamic Op operator properties.

**Solution**: Use type assertion when setting Op properties:
```typescript
// Before
where[Op.or] = [...];

// After
(where as any)[Op.or] = [...];
```

Fixed in files:
- `src/services/user.service.ts`
- `src/services/role.service.ts`
- `src/services/permission.service.ts`
- `src/services/menu-permission.service.ts`
- `src/services/audit.service.ts`

### 3. Missing Model Association Methods
**Problem**: Sequelize association methods (e.g., `setRoles`, `getRoles`) were not declared in TypeScript models.

**Solution**: Added TypeScript declarations for all Sequelize association methods:

#### User Model
```typescript
// Association methods for roles (belongsToMany)
declare getRoles: () => Promise<Role[]>;
declare setRoles: (roles: Role[] | string[]) => Promise<void>;
declare addRole: (role: Role | string) => Promise<void>;
declare addRoles: (roles: Role[] | string[]) => Promise<void>;
declare removeRole: (role: Role | string) => Promise<void>;
declare removeRoles: (roles: Role[] | string[]) => Promise<void>;
declare hasRole: (role: Role | string) => Promise<boolean>;
declare hasRoles: (roles: Role[] | string[]) => Promise<boolean>;
declare countRoles: () => Promise<number>;
declare createRole: (role: any) => Promise<Role>;
```

Similar declarations added to:
- Role model (for users and permissions associations)
- Permission model (for roles association)
- Menu model (for parent/children associations)

### 4. RefreshToken Model Missing Fields
**Problem**: RefreshToken model was missing `ipAddress` and `userAgent` fields required for security tracking.

**Solution**: 
1. Added fields to the model definition:
```typescript
declare ipAddress: CreationOptional<string | null>;
declare userAgent: CreationOptional<string | null>;
```

2. Added fields to model initialization:
```typescript
ipAddress: {
  type: DataTypes.STRING(45), // Supports IPv6
  allowNull: true,
},
userAgent: {
  type: DataTypes.TEXT,
  allowNull: true,
}
```

3. Updated migration file to include these fields
4. Updated AuthUtil.generateUserTokens to accept and store these values

### 5. Import Path Issues
**Problem**: Some services were using incorrect import paths (e.g., `@models`, `@utils/ApiError`).

**Solution**: Fixed import paths to use relative imports:
```typescript
// Before
import { Permission } from '@models';
import { ApiError } from '@utils/ApiError';

// After
import { Permission } from '../models';
import { ApiError } from '../utils/api-error';
```

### 6. Auth Utility Updates
**Problem**: generateUserTokens method needed to store IP address and user agent for security tracking.

**Solution**: 
1. Updated method signature:
```typescript
static async generateUserTokens(user: User, ipAddress?: string | null, userAgent?: string | null): Promise<AuthTokens>
```

2. Updated RefreshToken creation to include these fields
3. Updated all calls to generateUserTokens to pass these parameters

### 7. Type Exports
**Problem**: Missing type exports caused compilation errors.

**Solution**: Added missing exports to `src/types/auth.types.ts`:
- `AuthTokens` type alias
- `AuthRequest` interface

## Migration Requirements

After applying these fixes, you need to run migrations to update the database schema:

```bash
npm run migrate:up
```

This will add the `ip_address` and `user_agent` columns to the `refresh_tokens` table.

## Testing

To verify all fixes are working:

1. Run TypeScript compilation:
```bash
npm run build
```

2. Run the test suite:
```bash
npm test
```

3. Test authentication endpoints with IP and user agent tracking:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Forwarded-For: 192.168.1.1" \
  -H "User-Agent: Mozilla/5.0" \
  -d '{"username": "test@example.com", "password": "password123"}'
```

## Benefits

These fixes provide:
1. **Type Safety**: Proper TypeScript declarations for all Sequelize methods
2. **Security Enhancement**: IP address and user agent tracking for authentication sessions
3. **Code Maintainability**: Consistent import paths and proper type usage
4. **Future Compatibility**: Following Sequelize best practices for operator usage