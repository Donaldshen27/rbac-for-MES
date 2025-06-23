# RBAC System Testing Strategy

## Overview
This document outlines the comprehensive testing strategy for the RBAC Permission Management System, including unit tests, integration tests, E2E tests, and manual testing approaches.

## Testing Timeline

### Phase 1: Unit Testing (During Development)
**When**: As each component is developed
**What to test**:
- Model validations and database constraints
- Service layer business logic
- Utility functions (JWT, bcrypt, validators)
- Middleware logic

### Phase 2: Integration Testing (After Service Implementation)
**When**: After completing service and controller layers
**What to test**:
- API endpoint functionality
- Authentication flows
- Permission checking
- Database transactions
- Error handling

### Phase 3: E2E Testing (After Full Implementation)
**When**: After all APIs are implemented
**What to test**:
- Complete user workflows
- Cross-module interactions
- Performance under load
- Security scenarios

### Phase 4: User Acceptance Testing (Before Deployment)
**When**: After all automated tests pass
**What to test**:
- Real-world scenarios
- UI/UX through Swagger or frontend
- Edge cases
- Production-like environment

## Testing Tools and Setup

### 1. Testing Framework
```json
{
  "jest": "^29.0.0",
  "supertest": "^6.3.0",
  "@types/jest": "^29.0.0",
  "@types/supertest": "^2.0.0"
}
```

### 2. Test Environment Configuration
```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};
```

### 3. Test Database Setup
```typescript
// tests/setup/database.ts
import { Sequelize } from 'sequelize';

export const setupTestDatabase = async () => {
  const sequelize = new Sequelize('sqlite::memory:', {
    logging: false
  });
  
  // Run migrations
  await sequelize.sync({ force: true });
  
  return sequelize;
};
```

## Unit Testing Examples

### 1. Model Testing
```typescript
// tests/unit/models/user.model.test.ts
describe('User Model', () => {
  let sequelize: Sequelize;
  
  beforeAll(async () => {
    sequelize = await setupTestDatabase();
  });
  
  afterAll(async () => {
    await sequelize.close();
  });
  
  describe('Validations', () => {
    it('should require username', async () => {
      const user = User.build({
        email: 'test@example.com',
        password: 'password123'
      });
      
      await expect(user.validate()).rejects.toThrow();
    });
    
    it('should enforce unique username', async () => {
      await User.create({
        username: 'testuser',
        email: 'test1@example.com',
        password: 'password123'
      });
      
      const duplicate = User.build({
        username: 'testuser',
        email: 'test2@example.com',
        password: 'password123'
      });
      
      await expect(duplicate.save()).rejects.toThrow();
    });
  });
  
  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const plainPassword = 'password123';
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: plainPassword
      });
      
      expect(user.password).not.toBe(plainPassword);
      expect(user.password).toMatch(/^\$2[aby]\$/);
    });
  });
});
```

### 2. Service Testing
```typescript
// tests/unit/services/auth.service.test.ts
describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  
  beforeEach(() => {
    userRepository = createMockRepository<UserRepository>();
    authService = new AuthService(userRepository);
  });
  
  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        password: await bcrypt.hash('password123', 10),
        isActive: true
      };
      
      userRepository.findByUsername.mockResolvedValue(mockUser);
      
      const result = await authService.login('testuser', 'password123');
      
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.id).toBe('user-id');
    });
    
    it('should throw error for invalid credentials', async () => {
      userRepository.findByUsername.mockResolvedValue(null);
      
      await expect(
        authService.login('testuser', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
```

### 3. Middleware Testing
```typescript
// tests/unit/middlewares/auth.middleware.test.ts
describe('Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;
  
  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });
  
  it('should call next for valid token', async () => {
    const token = generateTestToken({ userId: 'user-id' });
    req.headers = { authorization: `Bearer ${token}` };
    
    await authMiddleware(req as Request, res as Response, next);
    
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
  });
  
  it('should return 401 for missing token', async () => {
    await authMiddleware(req as Request, res as Response, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
```

## Integration Testing Examples

### 1. API Endpoint Testing
```typescript
// tests/integration/auth.routes.test.ts
describe('Auth Routes', () => {
  let app: Application;
  let sequelize: Sequelize;
  
  beforeAll(async () => {
    sequelize = await setupTestDatabase();
    app = createApp();
  });
  
  afterAll(async () => {
    await sequelize.close();
  });
  
  describe('POST /api/v1/auth/register', () => {
    it('should register new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: 'SecurePass123!',
          firstName: 'New',
          lastName: 'User'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.username).toBe('newuser');
    });
    
    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: 'weak'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VAL_005');
    });
  });
  
  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: await bcrypt.hash('TestPass123!', 10)
      });
    });
    
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'TestPass123!'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });
  });
});
```

### 2. Permission Testing
```typescript
// tests/integration/permissions.test.ts
describe('Permission System', () => {
  let app: Application;
  let adminToken: string;
  let userToken: string;
  
  beforeAll(async () => {
    // Setup test users with different roles
    const admin = await createTestUser('admin', ['super_admin']);
    const user = await createTestUser('user', ['viewer']);
    
    adminToken = await getAuthToken(admin);
    userToken = await getAuthToken(user);
  });
  
  describe('Role-based Access', () => {
    it('should allow admin to create users', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: 'TempPass123!'
        });
      
      expect(response.status).toBe(201);
    });
    
    it('should deny viewer from creating users', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: 'TempPass123!'
        });
      
      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('AUTH_004');
    });
  });
});
```

## E2E Testing Examples

### 1. Complete User Journey
```typescript
// tests/e2e/user-journey.test.ts
describe('User Journey', () => {
  it('should complete full user lifecycle', async () => {
    // 1. Register new user
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'journeyuser',
        email: 'journey@example.com',
        password: 'JourneyPass123!',
        firstName: 'Journey',
        lastName: 'User'
      });
    
    expect(registerRes.status).toBe(201);
    
    // 2. Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'journeyuser',
        password: 'JourneyPass123!'
      });
    
    const { accessToken } = loginRes.body.data.tokens;
    
    // 3. Get user profile
    const profileRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    
    expect(profileRes.body.data.user.username).toBe('journeyuser');
    
    // 4. Change password
    const changePassRes = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: 'JourneyPass123!',
        newPassword: 'NewJourneyPass123!',
        confirmPassword: 'NewJourneyPass123!'
      });
    
    expect(changePassRes.status).toBe(200);
    
    // 5. Verify new password works
    const newLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'journeyuser',
        password: 'NewJourneyPass123!'
      });
    
    expect(newLoginRes.status).toBe(200);
  });
});
```

### 2. Menu Permission Flow
```typescript
// tests/e2e/menu-permissions.test.ts
describe('Menu Permission Management', () => {
  it('should manage menu permissions correctly', async () => {
    // Setup: Create role and user
    const role = await createTestRole('test_operator');
    const user = await createTestUser('menuuser', [role.name]);
    const token = await getAuthToken(user);
    
    // 1. Get initial menu (should be empty or limited)
    const initialMenu = await request(app)
      .get('/api/v1/menus/user-menu')
      .set('Authorization', `Bearer ${token}`);
    
    expect(initialMenu.body.data.menus).toHaveLength(0);
    
    // 2. Admin assigns menu permissions to role
    const adminToken = await getAdminToken();
    await request(app)
      .put(`/api/v1/roles/${role.id}/menu-permissions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        menuPermissions: [
          {
            menuId: '11',
            canView: true,
            canEdit: true,
            canDelete: false,
            canExport: true
          }
        ]
      });
    
    // 3. User gets updated menu
    const updatedMenu = await request(app)
      .get('/api/v1/menus/user-menu')
      .set('Authorization', `Bearer ${token}`);
    
    const productMenu = updatedMenu.body.data.menus
      .find(m => m.id === '1')?.children
      .find(c => c.id === '11');
    
    expect(productMenu).toBeDefined();
    expect(productMenu.permissions.canView).toBe(true);
    expect(productMenu.permissions.canEdit).toBe(true);
    expect(productMenu.permissions.canDelete).toBe(false);
  });
});
```

## Performance Testing

### 1. Load Testing with Artillery
```yaml
# tests/performance/load-test.yml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100
  processor: "./load-test-processor.js"

scenarios:
  - name: "User Login Flow"
    flow:
      - post:
          url: "/api/v1/auth/login"
          json:
            username: "loadtest{{ $randomNumber(1, 100) }}"
            password: "LoadTest123!"
          capture:
            - json: "$.data.tokens.accessToken"
              as: "token"
      - get:
          url: "/api/v1/users"
          headers:
            Authorization: "Bearer {{ token }}"
```

### 2. Database Query Performance
```typescript
// tests/performance/database.test.ts
describe('Database Performance', () => {
  it('should handle concurrent user queries efficiently', async () => {
    // Create 1000 test users
    await createBulkTestUsers(1000);
    
    const startTime = Date.now();
    
    // Simulate 100 concurrent requests
    const promises = Array(100).fill(null).map(() =>
      User.findAll({
        include: [{ model: Role }],
        limit: 20
      })
    );
    
    await Promise.all(promises);
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
  });
});
```

## Security Testing

### 1. SQL Injection Tests
```typescript
// tests/security/sql-injection.test.ts
describe('SQL Injection Protection', () => {
  it('should prevent SQL injection in search queries', async () => {
    const maliciousInput = "admin' OR '1'='1";
    
    const response = await request(app)
      .get('/api/v1/users')
      .query({ search: maliciousInput })
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.data.users).toHaveLength(0);
  });
});
```

### 2. Authentication Security
```typescript
// tests/security/auth-security.test.ts
describe('Authentication Security', () => {
  it('should enforce rate limiting on login attempts', async () => {
    const attempts = Array(10).fill(null).map(() =>
      request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        })
    );
    
    const responses = await Promise.all(attempts);
    const rateLimited = responses.filter(r => r.status === 429);
    
    expect(rateLimited.length).toBeGreaterThan(0);
  });
  
  it('should not expose sensitive information in errors', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'nonexistentuser',
        password: 'anypassword'
      });
    
    expect(response.body.error.message).not.toContain('user not found');
    expect(response.body.error.message).toBe('Invalid credentials');
  });
});
```

## Testing UI Options

### 1. Swagger UI (Recommended for API Testing)
The project includes Swagger documentation which provides:
- Interactive API testing interface
- Automatic request/response documentation
- Authentication token management
- Try-it-out functionality

Access at: `http://localhost:3000/api-docs`

### 2. Postman Collection
Export Swagger spec and import into Postman for:
- Automated test suites
- Environment variable management
- Team collaboration
- CI/CD integration

### 3. Simple Admin Frontend (Optional)
If a visual interface is needed beyond API testing:

```typescript
// Frontend Testing Interface Requirements
interface TestingUI {
  features: [
    'User login/logout',
    'User management CRUD',
    'Role assignment interface',
    'Permission matrix view',
    'Menu permission editor',
    'Audit log viewer'
  ];
  
  technology: {
    framework: 'React or Vue.js',
    ui: 'Material-UI or Ant Design',
    state: 'Redux or Vuex',
    api: 'Axios with interceptors'
  };
  
  benefits: [
    'Visual permission testing',
    'User experience validation',
    'Non-technical stakeholder demos',
    'Production-ready admin panel'
  ];
}
```

## Test Data Management

### 1. Seed Data for Testing
```typescript
// tests/fixtures/seed-data.ts
export const testRoles = [
  {
    name: 'test_admin',
    description: 'Test Administrator',
    permissions: ['user:*', 'role:*', 'permission:*']
  },
  {
    name: 'test_operator',
    description: 'Test Operator',
    permissions: ['production:view', 'production:report_work']
  }
];

export const testUsers = [
  {
    username: 'admin_test',
    email: 'admin@test.com',
    password: 'AdminTest123!',
    roles: ['test_admin']
  },
  {
    username: 'operator_test',
    email: 'operator@test.com',
    password: 'OperatorTest123!',
    roles: ['test_operator']
  }
];
```

### 2. Test Database Reset
```typescript
// tests/helpers/database.ts
export async function resetTestDatabase() {
  await sequelize.transaction(async (t) => {
    // Clear all tables in correct order
    await MenuPermission.destroy({ where: {}, transaction: t });
    await RolePermission.destroy({ where: {}, transaction: t });
    await UserRole.destroy({ where: {}, transaction: t });
    await RefreshToken.destroy({ where: {}, transaction: t });
    await AuditLog.destroy({ where: {}, transaction: t });
    await Menu.destroy({ where: {}, transaction: t });
    await Permission.destroy({ where: {}, transaction: t });
    await Role.destroy({ where: {}, transaction: t });
    await User.destroy({ where: {}, transaction: t });
    await Resource.destroy({ where: {}, transaction: t });
    
    // Seed base data
    await seedTestData(t);
  });
}
```

## Continuous Integration

### GitHub Actions Configuration
```yaml
# .github/workflows/test.yml
name: Run Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: rbac_test
        ports:
          - 3306:3306
        options: --health-cmd="mysqladmin ping" --health-interval=10s
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DB_HOST: localhost
          DB_PORT: 3306
          DB_NAME: rbac_test
          DB_USER: root
          DB_PASSWORD: root
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## Test Commands

Add to package.json:
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "jest --testPathPattern=e2e",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:performance": "artillery run tests/performance/load-test.yml",
    "test:security": "jest --testPathPattern=security"
  }
}
```

## Testing Best Practices

### 1. Test Isolation
- Each test should be independent
- Use database transactions for rollback
- Mock external dependencies
- Clear cache between tests

### 2. Test Data
- Use factories for consistent test data
- Avoid hardcoded IDs
- Clean up after tests
- Use realistic data volumes

### 3. Assertions
- Test both success and failure cases
- Verify response structure
- Check side effects
- Validate error messages

### 4. Performance
- Set reasonable timeouts
- Use parallel test execution where possible
- Optimize database queries in tests
- Monitor test execution time

### 5. Maintenance
- Keep tests simple and readable
- Update tests when requirements change
- Remove obsolete tests
- Document complex test scenarios

## Conclusion

This testing strategy ensures comprehensive coverage of the RBAC system through:
1. **Progressive testing** - From unit to E2E
2. **Automated testing** - CI/CD integration
3. **Performance validation** - Load and stress testing
4. **Security verification** - Vulnerability testing
5. **User experience** - Through Swagger UI or optional frontend

Start testing early and test often to maintain high code quality throughout development.

---

Document Version: 1.0
Last Updated: 2024-01-01
Author: RBAC System Team