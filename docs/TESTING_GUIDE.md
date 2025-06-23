# Comprehensive Testing Guide

This guide covers all testing approaches for the RBAC System API.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Test Types](#test-types)
3. [Running Tests](#running-tests)
4. [Test Data Setup](#test-data-setup)
5. [API Testing](#api-testing)
6. [Integration Tests](#integration-tests)
7. [Test Users and Credentials](#test-users-and-credentials)
8. [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites
- Node.js and npm installed
- MySQL server running
- Database configured in `.env` file
- Server running on `http://localhost:3000`

### Basic Testing Commands

```bash
# Setup test data
npm run test:setup

# Run all tests
npm test

# Run API tests with bash script
npm run test:api

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

## Test Types

### 1. Manual API Testing
- Using curl commands (see `docs/API_TESTING_GUIDE.md`)
- Using Postman collection (`postman-collection.json`)
- Interactive testing with API documentation at `/api-docs`

### 2. Automated API Testing
- Bash script: `./test-api-comprehensive.sh`
- Tests all endpoints with different user roles
- Includes positive and negative test cases
- Automatic setup and teardown

### 3. Integration Tests
- Jest + Supertest tests in `tests/integration/`
- Tests API endpoints with real database
- Covers authentication, authorization, and business logic
- Run in isolation with database cleanup

### 4. Unit Tests
- Jest tests in `tests/unit/`
- Tests individual services and utilities
- Mocked dependencies

## Running Tests

### Setup Test Environment

1. Start the MySQL database:
```bash
# Ensure MySQL is running
mysql.server start  # macOS
sudo systemctl start mysql  # Linux
```

2. Start the development server:
```bash
npm run dev
```

3. Setup test data:
```bash
npm run test:setup
```

### Run Comprehensive API Tests

```bash
# Run the comprehensive test script
./test-api-comprehensive.sh

# Or using npm
npm run test:api
```

This script will:
- Setup test users with different roles
- Test all endpoints with appropriate permissions
- Validate response codes and data
- Clean up test data after completion

### Run Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific test file
npm test tests/integration/auth.test.ts

# Run with watch mode
npm run test:watch
```

### Run Manual Tests with curl

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Use token for authenticated requests
curl http://localhost:3000/api/v1/roles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Test Data Setup

The `setup-test-data.ts` script creates:

### Resources
- User Management
- Role Management
- Permission Management
- Menu Management
- Resource Management

### Permissions
- Full CRUD permissions for each resource
- Special permissions like `roles:manage_permissions`

### Roles
1. **Administrator** - All permissions
2. **Manager** - User and role management
3. **Viewer** - Read-only access

### Test Users

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| admin | admin123 | Administrator | Full system access |
| testadmin | testadmin123 | Administrator | Test admin user |
| testmanager | testmanager123 | Manager | Can manage users and roles |
| testviewer | testviewer123 | Viewer | Read-only access |

### Menu Structure
```
- Dashboard
- Administration
  - Users
  - Roles
  - Permissions
- Reports
```

## API Testing

### Test Scenarios Covered

1. **Authentication Tests**
   - Login with valid/invalid credentials
   - Token refresh
   - Logout
   - Get current user

2. **Authorization Tests**
   - Admin can access all endpoints
   - Manager has limited access
   - Viewer has read-only access
   - Unauthenticated requests are rejected

3. **CRUD Operations**
   - Create, Read, Update, Delete for all resources
   - Validation errors
   - Duplicate prevention
   - Not found errors

4. **Complex Operations**
   - Role permission management
   - Menu hierarchy and reordering
   - Bulk operations
   - Permission checking

5. **Edge Cases**
   - Invalid data formats
   - Missing required fields
   - Unauthorized access attempts
   - Resource conflicts

### Response Format

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": [ ... ],
    "timestamp": "2025-06-23T12:00:00.000Z",
    "path": "/api/v1/endpoint"
  }
}
```

## Integration Tests

### Test Structure

Each integration test file covers:
- Setup and teardown
- Authentication
- CRUD operations
- Permission checks
- Edge cases

### Available Test Suites

1. **auth.test.ts** - Authentication and authorization
2. **roles.test.ts** - Role management
3. **permissions.test.ts** - Permission management
4. **menus.test.ts** - Menu management

### Writing New Tests

```typescript
describe('New Feature API', () => {
  let server: any;
  let adminToken: string;
  
  beforeAll(async () => {
    // Setup
  });
  
  afterAll(async () => {
    // Cleanup
  });
  
  it('should test specific functionality', async () => {
    const response = await request(app)
      .get('/api/v1/endpoint')
      .set('Authorization', `Bearer ${adminToken}`);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## Test Users and Credentials

### Default Admin User
- **Username:** admin
- **Password:** admin123
- **Email:** admin@example.com
- **Role:** Administrator (after running setup)

### Test Users (created by setup script)
1. **Test Admin**
   - Username: testadmin
   - Password: testadmin123
   - Role: Administrator

2. **Test Manager**
   - Username: testmanager
   - Password: testmanager123
   - Role: Manager

3. **Test Viewer**
   - Username: testviewer
   - Password: testviewer123
   - Role: Viewer

## Troubleshooting

### Common Issues

1. **Server not running**
   ```bash
   Error: Server is not running at http://localhost:3000
   Solution: npm run dev
   ```

2. **Database connection failed**
   ```bash
   Error: Connection refused
   Solution: Check MySQL is running and credentials in .env
   ```

3. **Admin user has no permissions**
   ```bash
   Error: 403 Forbidden
   Solution: Run npm run test:setup to assign roles
   ```

4. **Tests failing with timeout**
   ```bash
   Solution: Increase Jest timeout in jest.config.js
   ```

### Debug Commands

```bash
# Check if server is running
curl http://localhost:3000/api/v1/health

# Check database connection
npm run db:test

# Reset database and start fresh
npm run db:reset

# Check logs
tail -f logs/app.log
```

### Clean Test Data

To remove all test data:

```bash
# Connect to MySQL
mysql -u root -p

# Delete test data
USE rbac_system;
DELETE FROM users WHERE username LIKE 'test%';
DELETE FROM roles WHERE name IN ('TestRole', 'ManagerTestRole');
DELETE FROM menus WHERE name LIKE 'Test%';
```

## Best Practices

1. **Always run tests in order:**
   - Setup test data first
   - Run tests
   - Clean up if needed

2. **Use appropriate test users:**
   - Admin for full access tests
   - Manager for limited access tests
   - Viewer for read-only tests

3. **Check response format:**
   - Verify success/error structure
   - Check HTTP status codes
   - Validate response data

4. **Test both positive and negative cases:**
   - Valid operations should succeed
   - Invalid operations should fail gracefully
   - Error messages should be helpful

5. **Keep tests isolated:**
   - Each test should be independent
   - Clean up created data
   - Don't rely on test order