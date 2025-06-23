# Authentication API Endpoints

## Base URL
All authentication endpoints are prefixed with `/api/auth`

## Public Endpoints

### 1. Register User
Creates a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "1",
      "email": "user@example.com",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "roles": [],
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900
    }
  }
}
```

### 2. Login
Authenticates a user with email/username and password.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "username": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "1",
      "email": "user@example.com",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "roles": [
        {
          "id": 1,
          "name": "user",
          "description": "Regular user"
        }
      ],
      "isActive": true,
      "lastLogin": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900
    }
  }
}
```

### 3. Refresh Token
Refreshes an expired access token using a valid refresh token.

**Endpoint:** `POST /api/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900
    }
  }
}
```

### 4. Forgot Password
Initiates password reset process.

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "If the email exists, a reset link will be sent",
  "data": null
}
```

### 5. Reset Password
Resets password using a reset token.

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset-token-here",
  "newPassword": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password reset successful. Please login with your new password.",
  "data": null
}
```

## Protected Endpoints
All protected endpoints require a valid JWT access token in the Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 6. Get Profile
Retrieves the current user's profile.

**Endpoint:** `GET /api/auth/me`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "1",
      "email": "user@example.com",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "roles": [
        {
          "id": 1,
          "name": "user",
          "description": "Regular user"
        }
      ],
      "isActive": true,
      "isSuperuser": false,
      "lastLogin": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 7. Update Profile
Updates the current user's profile information.

**Endpoint:** `PUT /api/auth/me`

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "username": "janesmith"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "1",
      "email": "user@example.com",
      "username": "janesmith",
      "firstName": "Jane",
      "lastName": "Smith",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 8. Change Password
Changes the current user's password.

**Endpoint:** `POST /api/auth/change-password`

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!",
  "confirmPassword": "NewPass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password changed successfully. Please login again.",
  "data": null
}
```

### 9. Logout
Logs out the current user from the current device.

**Endpoint:** `POST /api/auth/logout`

**Request Body (optional):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logout successful",
  "data": null
}
```

### 10. Logout All Devices
Logs out the current user from all devices.

**Endpoint:** `POST /api/auth/logout-all`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logged out from all devices",
  "data": null
}
```

### 11. Get Active Sessions
Retrieves all active sessions for the current user.

**Endpoint:** `GET /api/auth/sessions`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Sessions retrieved successfully",
  "data": {
    "sessions": [
      {
        "id": "session-1",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
        "ipAddress": "192.168.1.1",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "expiresAt": "2024-01-08T00:00:00.000Z",
        "isCurrent": true
      }
    ]
  }
}
```

### 12. Revoke Session
Revokes a specific session.

**Endpoint:** `DELETE /api/auth/sessions/:sessionId`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Session revoked successfully",
  "data": null
}
```

### 13. Verify Email
Verifies user's email address.

**Endpoint:** `POST /api/auth/verify-email`

**Request Body:**
```json
{
  "token": "verification-token"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": null
}
```

### 14. Resend Verification Email
Resends email verification link.

**Endpoint:** `POST /api/auth/resend-verification`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Verification email sent",
  "data": null
}
```

### 15. Validate Token
Validates a JWT token (useful for microservices).

**Endpoint:** `POST /api/auth/validate`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "valid": true,
    "user": {
      "id": "1",
      "email": "user@example.com",
      "roles": [
        {
          "id": 1,
          "name": "user",
          "description": "Regular user"
        }
      ],
      "permissions": []
    }
  }
}
```

## Error Responses

All endpoints return consistent error responses:

**400 Bad Request**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "message": "Account is locked"
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Resource not found"
}
```

**409 Conflict**
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "An unexpected error occurred"
}
```

## Rate Limiting

Authentication endpoints have the following rate limits:
- Register: 5 requests per hour per IP
- Login: 10 requests per 15 minutes per IP
- Password reset: 3 requests per hour per IP
- Other endpoints: 100 requests per 15 minutes per user

## Security Notes

1. All passwords must meet complexity requirements:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character

2. Access tokens expire after 15 minutes by default
3. Refresh tokens expire after 7 days by default
4. All endpoints use HTTPS in production
5. CORS is configured based on environment settings