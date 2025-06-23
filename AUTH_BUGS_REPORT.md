# Authentication Endpoints Bug Report

## Testing Summary
All authentication endpoints were tested and **ALL ENDPOINTS FAILED** due to various bugs.

## Critical Bugs Found

### 1. Database Column Naming Issue (BLOCKER)
**Endpoint**: POST /auth/register
**Error**: `Unknown column 'ip_address' in 'field list'`
**Root Cause**: 
- The Sequelize configuration has `underscored: true` which converts camelCase to snake_case
- The AuditLog model uses camelCase field names (e.g., `ipAddress`, `userAgent`)
- When Sequelize tries to insert, it converts these to snake_case but the actual database columns might be in camelCase

**Fix Required**: 
- Either remove `underscored: true` from the Sequelize config
- OR ensure all database columns use snake_case naming convention
- OR explicitly set field names in the model definition

### 2. Invalid Error Code Mapping
**Multiple Endpoints Affected**
**Issue**: Error responses use `SYS_001` code for authentication failures instead of appropriate auth error codes
**Example**: Login failure returns `SYS_001` instead of `AUTH_001`

### 3. Username Validation Too Restrictive
**Endpoint**: POST /auth/register
**Issue**: Username validation only allows alphanumeric characters (no underscores, hyphens, etc.)
**Current Pattern**: `Joi.string().alphanum()`
**Recommended**: Allow underscores and hyphens for better UX

### 4. Login Endpoint Design Issue
**Endpoint**: POST /auth/login
**Issue**: The login endpoint expects a `username` field even when logging in with email
**Current Behavior**: Must pass email in the `username` field
**Recommended**: Accept either `{ username, password }` or `{ email, password }`

### 5. Missing Error Handling
**All Endpoints**
**Issue**: When tokens are empty/undefined, endpoints fail with generic "Invalid authorization format" errors
**Recommended**: Better null/undefined checks and more descriptive error messages

### 6. Refresh Token Response Inconsistency
**Endpoint**: POST /auth/refresh
**Issue**: Response format might be inconsistent (tokens wrapped vs unwrapped)
**Expected**: `{ tokens: { accessToken, refreshToken } }`
**Actual**: Might return `{ accessToken, refreshToken }` directly

### 7. Change Password Missing Validation
**Endpoint**: POST /auth/change-password
**Issue**: The endpoint expects `confirmPassword` field according to validator but controller only uses `currentPassword` and `newPassword`

### 8. Sessions Endpoint Issue
**Endpoint**: GET /auth/sessions
**Issue**: The endpoint tries to access `req.body.currentRefreshToken` in a GET request
**Fix**: Should use a different method to identify current session

## Test Results Summary

| Endpoint | Method | Status | Issue |
|----------|---------|---------|--------|
| /auth/register | POST | ❌ FAIL | Database column naming issue |
| /auth/login | POST | ❌ FAIL | User doesn't exist (due to registration failure) |
| /auth/me | GET | ❌ FAIL | No valid token (due to login failure) |
| /auth/me | PUT | ❌ FAIL | No valid token |
| /auth/refresh | POST | ❌ FAIL | No valid refresh token |
| /auth/change-password | POST | ❌ FAIL | No valid token |
| /auth/sessions | GET | ❌ FAIL | No valid token |
| /auth/sessions/{id} | DELETE | ❌ FAIL | No valid token |
| /auth/logout | POST | ❌ FAIL | No valid token |
| /auth/logout-all | POST | ❌ FAIL | No valid token |

## Immediate Actions Required

1. **Fix Database Schema Issue** (CRITICAL)
   - This blocks all user registration
   - Decide on naming convention and apply consistently

2. **Update Error Handling**
   - Use appropriate error codes
   - Add better validation error messages

3. **Improve Login Flexibility**
   - Allow both username and email login properly

4. **Fix Session Management**
   - Correct the GET /auth/sessions implementation

5. **Add Integration Tests**
   - Create proper test suite to prevent regressions

## Code Quality Issues

1. Inconsistent error code usage
2. Missing null checks in several places
3. Validation schemas don't match controller expectations
4. GET requests trying to access request body

## Recommendation

The authentication system needs significant fixes before it can be considered production-ready. The database column naming issue is the most critical as it prevents any user registration.