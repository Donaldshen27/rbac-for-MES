# Authentication Service Documentation

## Overview

The Authentication Service (`AuthService`) provides comprehensive authentication and authorization functionality for the RBAC system. It handles user registration, login, token management, password operations, and session management.

## Features

- User registration with role assignment
- Email/username-based login
- JWT token generation (access & refresh tokens)
- Token refresh mechanism
- Logout (single session or all sessions)
- Password change functionality
- Session management
- Audit logging for all auth operations

## API Methods

### `register(data: RegisterData): Promise<{ user: User; tokens: TokenPair }>`

Registers a new user in the system.

**Parameters:**
- `data`: Registration data including email, password, username, name, and optional role IDs

**Returns:**
- User object and JWT token pair

**Features:**
- Checks for existing email/username
- Hashes password using bcrypt
- Assigns roles (default 'user' role if none specified)
- Generates access and refresh tokens
- Creates audit log entry

### `login(credentials: LoginCredentials): Promise<{ user: User; tokens: TokenPair }>`

Authenticates a user and returns tokens.

**Parameters:**
- `credentials`: Username/email and password

**Returns:**
- User object with roles and JWT token pair

**Features:**
- Supports login via email or username
- Validates user is active
- Updates last login timestamp
- Generates new token pair
- Creates audit log entry

### `refreshToken(refreshToken: string): Promise<TokenPair>`

Refreshes an expired access token using a valid refresh token.

**Parameters:**
- `refreshToken`: Valid refresh token

**Returns:**
- New JWT token pair

**Features:**
- Validates refresh token
- Checks token expiration
- Revokes old refresh token
- Issues new token pair

### `logout(userId: number, refreshToken?: string): Promise<void>`

Logs out a user by revoking tokens.

**Parameters:**
- `userId`: User ID
- `refreshToken`: Optional - specific token to revoke

**Features:**
- Can revoke single token or all user tokens
- Creates audit log entry

### `changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void>`

Changes a user's password.

**Parameters:**
- `userId`: User ID
- `currentPassword`: Current password for verification
- `newPassword`: New password

**Features:**
- Verifies current password
- Hashes new password
- Revokes all refresh tokens (forces re-login)
- Creates audit log entry

### `getActiveSessions(userId: number): Promise<RefreshToken[]>`

Retrieves all active sessions for a user.

**Parameters:**
- `userId`: User ID

**Returns:**
- Array of active refresh tokens (sessions)

### `revokeSession(userId: number, tokenId: string): Promise<void>`

Revokes a specific user session.

**Parameters:**
- `userId`: User ID
- `tokenId`: Refresh token ID to revoke

## Security Features

1. **Password Security**
   - Bcrypt hashing with configurable salt rounds
   - Password strength validation available

2. **Token Security**
   - Short-lived access tokens (15 minutes default)
   - Long-lived refresh tokens (7 days default)
   - Token rotation on refresh
   - Secure token storage in database

3. **Session Management**
   - Track all active sessions
   - Revoke individual or all sessions
   - Session metadata (user agent, IP)

4. **Audit Logging**
   - All authentication events logged
   - Includes IP address and user agent
   - Actions: registration, login, logout, password changes

## Usage Examples

### User Registration
```typescript
const { user, tokens } = await AuthService.register({
  email: 'user@example.com',
  password: 'SecurePass123!',
  username: 'johndoe',
  firstName: 'John',
  lastName: 'Doe',
  roleIds: [2, 3], // Optional role assignments
  ipAddress: req.ip,
  userAgent: req.get('user-agent')
});
```

### User Login
```typescript
const { user, tokens } = await AuthService.login({
  username: 'user@example.com', // or username
  password: 'SecurePass123!',
  ipAddress: req.ip,
  userAgent: req.get('user-agent')
});
```

### Token Refresh
```typescript
const newTokens = await AuthService.refreshToken(refreshToken);
```

### Logout
```typescript
// Logout single session
await AuthService.logout(userId, refreshToken);

// Logout all sessions
await AuthService.logout(userId);
```

### Change Password
```typescript
await AuthService.changePassword(
  userId,
  'currentPassword',
  'newSecurePassword123!'
);
```

## Error Handling

The service uses custom `ApiError` class for consistent error responses:

- `401 Unauthorized`: Invalid credentials, expired tokens
- `403 Forbidden`: Account inactive/locked
- `404 Not Found`: User not found
- `409 Conflict`: Email/username already exists

## Dependencies

- **Models**: User, Role, RefreshToken, AuditLog
- **Utilities**: AuthUtil, BcryptUtil, JWTUtil
- **External**: bcrypt, jsonwebtoken

## Configuration

Key configuration options (via environment variables):
- `JWT_SECRET`: Secret key for access tokens
- `JWT_REFRESH_SECRET`: Secret key for refresh tokens  
- `JWT_EXPIRES_IN`: Access token expiration (default: 15m)
- `JWT_REFRESH_EXPIRES_IN`: Refresh token expiration (default: 7d)
- `BCRYPT_ROUNDS`: Password hashing rounds (default: 10)

## Future Enhancements

1. **Email Verification**
   - Requires email verification token storage
   - Email sending capability

2. **Password Reset**
   - Requires reset token storage
   - Email sending capability
   - Token expiration handling

3. **Account Locking**
   - Failed login attempt tracking
   - Automatic account locking
   - Unlock mechanisms

4. **Multi-factor Authentication**
   - TOTP/SMS support
   - Backup codes
   - Device trust

5. **OAuth Integration**
   - Social login providers
   - SAML/LDAP support