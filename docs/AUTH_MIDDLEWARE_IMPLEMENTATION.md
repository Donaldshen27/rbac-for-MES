# Authentication Middleware Implementation

## Overview
This document describes the authentication middleware implementation for the RBAC system, including JWT token management, password hashing, and authorization checks.

## Components Implemented

### 1. JWT Utilities (`src/utils/jwt.util.ts`)
Handles JWT token generation and verification.

**Features:**
- Access token generation with user data payload
- Refresh token generation for session management
- Token verification with proper error handling
- Token pair generation for login flows
- Configurable expiration times

**Key Methods:**
- `generateAccessToken()` - Creates short-lived access tokens
- `generateRefreshToken()` - Creates long-lived refresh tokens
- `verifyAccessToken()` - Validates and decodes access tokens
- `verifyRefreshToken()` - Validates and decodes refresh tokens
- `generateTokenPair()` - Creates both tokens at once

### 2. Password Utilities (`src/utils/bcrypt.util.ts`)
Handles secure password hashing and validation.

**Features:**
- Bcrypt hashing with configurable salt rounds
- Password strength validation
- Password comparison for login
- Detailed error messages for weak passwords

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### 3. Authentication Middleware (`src/middlewares/auth.middleware.ts`)
Express middleware for protecting routes.

**Middleware Functions:**
- `authenticate` - Requires valid JWT token
- `optionalAuthenticate` - Allows but doesn't require authentication
- `requireRole(roles)` - Checks if user has specific role(s)
- `requirePermission(permissions)` - Checks if user has specific permission(s)
- `requireSuperuser` - Restricts to superuser only
- `refreshTokenMiddleware` - Validates refresh tokens

**Request Enhancement:**
Adds `req.user` object with:
```typescript
interface AuthUser {
  id: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  isSuperuser: boolean;
}
```

### 4. Authentication Helpers (`src/utils/auth.util.ts`)
Additional authentication utilities.

**Features:**
- Token generation with user permissions
- Login validation
- Refresh token management
- Token cleanup for expired tokens
- User permission aggregation

## Usage Examples

### Protecting Routes
```typescript
import { authenticate, requireRole, requirePermission } from '@middlewares/auth.middleware';

// Require authentication
router.get('/profile', authenticate, userController.getProfile);

// Require specific role
router.post('/admin/users', authenticate, requireRole('admin'), userController.createUser);

// Require specific permission
router.delete('/users/:id', authenticate, requirePermission('user:delete'), userController.deleteUser);

// Multiple roles (OR logic)
router.get('/reports', authenticate, requireRole(['manager', 'admin']), reportController.list);

// Superuser only
router.post('/system/config', authenticate, requireSuperuser, systemController.updateConfig);
```

### Login Flow
```typescript
// In auth service
const user = await AuthUtil.validateLogin(username, password);
const tokens = await AuthUtil.generateUserTokens(user);

// Response includes:
{
  accessToken: "eyJ...",
  refreshToken: "eyJ...",
  expiresIn: 900, // seconds
  tokenType: "Bearer"
}
```

### Token Refresh
```typescript
// Refresh endpoint
router.post('/refresh', refreshTokenMiddleware, async (req, res) => {
  const user = await User.findByPk(req.user.id);
  const tokens = await AuthUtil.generateUserTokens(user);
  res.json({ success: true, data: tokens });
});
```

## Security Features

### 1. Token Security
- Short-lived access tokens (15 minutes default)
- Long-lived refresh tokens (7 days default)
- Refresh tokens stored in database
- Token rotation on refresh
- Automatic cleanup of expired tokens

### 2. Password Security
- Bcrypt hashing with 10 salt rounds
- Strong password enforcement
- No password storage in plain text
- Password strength validation on registration

### 3. Error Handling
- Consistent error codes for auth failures
- No information leakage in error messages
- Proper HTTP status codes
- Token expiration handling

### 4. Rate Limiting Integration
Works with rate limiting middleware:
- Authentication attempts: 5 per minute
- Password reset: 3 per 15 minutes
- Registration: 3 per hour

## Testing

### Test Coverage
- JWT utility functions: 100%
- Bcrypt utility functions: 100%
- Auth middleware functions: 100%

### Test Files
- `tests/unit/utils/jwt.util.test.ts`
- `tests/unit/utils/bcrypt.util.test.ts`
- `tests/unit/middlewares/auth.middleware.test.ts`

### Running Tests
```bash
npm test -- tests/unit/utils/jwt.util.test.ts
npm test -- tests/unit/utils/bcrypt.util.test.ts
npm test -- tests/unit/middlewares/auth.middleware.test.ts
```

## Configuration

### Environment Variables
```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRY=15m
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key
REFRESH_TOKEN_EXPIRY=7d

# Security
BCRYPT_ROUNDS=10
```

### Config Structure
```typescript
config.jwt = {
  secret: string,
  expiresIn: string | number,
  refreshSecret: string,
  refreshExpiresIn: string | number
}

config.security = {
  saltRounds: number
}
```

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| AUTH_001 | Invalid credentials / No auth header | 401 |
| AUTH_002 | Token expired | 401 |
| AUTH_003 | Invalid token | 401 |
| AUTH_004 | Insufficient permissions | 403 |
| AUTH_005 | Account disabled | 403 |
| AUTH_006 | Too many attempts | 429 |

## Best Practices

### 1. Token Management
- Always use HTTPS in production
- Store tokens securely on client
- Implement token refresh before expiry
- Clear tokens on logout

### 2. Permission Checking
- Use middleware for consistent checks
- Implement wildcard permissions (e.g., `user:*`)
- Always check permissions server-side
- Cache permissions for performance

### 3. Error Handling
- Don't expose sensitive information
- Log security events
- Monitor failed authentication attempts
- Implement account lockout for repeated failures

### 4. Testing
- Test all authentication flows
- Include negative test cases
- Test token expiration scenarios
- Verify permission inheritance

## Future Enhancements

1. **Two-Factor Authentication (2FA)**
   - TOTP support
   - SMS verification
   - Email verification

2. **Session Management**
   - Device tracking
   - Session invalidation
   - Concurrent session limits

3. **OAuth Integration**
   - Google OAuth
   - GitHub OAuth
   - SAML support

4. **Advanced Security**
   - IP whitelisting
   - Geolocation checks
   - Anomaly detection
   - Audit logging enhancements

---

Document Version: 1.0
Last Updated: 2024-01-01
Author: RBAC System Team