# RBAC Permission Management System for MES

A comprehensive Role-Based Access Control (RBAC) system designed for Manufacturing Execution Systems (MES) but suitable for any application requiring sophisticated permission management. Built with TypeScript, Express.js, and MySQL.

## 🌟 Features

### Core Features
- 🔐 **JWT Authentication** with access and refresh tokens
- 👥 **User Management** with role assignments and profile management
- 🎭 **Role Management** with flexible permission assignments
- 🔑 **Permission System** with resource:action pattern
- 📋 **Hierarchical Menu Permissions** for complex menu structures
- 📝 **Audit Logging** for all security-relevant actions
- 🔄 **Session Management** with multi-device support

### Technical Features
- 📱 **RESTful APIs** with consistent response format
- 📚 **Swagger/OpenAPI Documentation** for API testing
- 🚀 **TypeScript** for complete type safety
- 🗄️ **MySQL 8.0** with optimized schema and indexes
- 🔒 **Security** with rate limiting, CORS, and input validation
- 🧪 **Testing** infrastructure with Jest
- 📊 **Monitoring** ready with structured logging

## Architecture

The system follows a modular architecture with clear separation of concerns:

- **Authentication Module**: JWT-based authentication with refresh tokens
- **RBAC Module**: Core permission management functionality
- **Menu Module**: Hierarchical menu permission management
- **Audit Module**: Comprehensive activity logging

## Tech Stack

- **Runtime**: Node.js v18+
- **Language**: TypeScript 5.x with strict mode
- **Framework**: Express.js 4.x
- **Database**: MySQL 8.0 with Sequelize v6 ORM
- **Authentication**: JWT (jsonwebtoken) with refresh tokens
- **Validation**: Joi for request validation
- **Documentation**: Swagger/OpenAPI 3.0
- **Testing**: Jest + Supertest
- **Security**: bcrypt, helmet, cors, express-rate-limit
- **Logging**: Winston with structured logging
- **Process Manager**: PM2 for production

## 📁 Project Structure

```
rbac-system/
├── docs/                      # Documentation files
│   ├── API_SPECIFICATION.md   # Complete API documentation
│   ├── DATABASE_SCHEMA.md     # Database design and ERD
│   ├── SYSTEM_DESIGN.md       # Architecture and design patterns
│   ├── SEED_DATA.md          # Test data documentation
│   └── SEQUELIZE_FIXES.md    # ORM configuration guide
├── scripts/                   # Database scripts
│   ├── migrations/           # Sequelize migrations
│   └── seeders/             # Data seeders
├── src/                      # Source code
│   ├── config/              # Configuration files
│   │   ├── app.config.ts    # Application settings
│   │   ├── database.ts      # Database connection
│   │   └── swagger.config.ts # API documentation config
│   ├── controllers/         # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── role.controller.ts
│   │   ├── permission.controller.ts
│   │   └── menu.controller.ts
│   ├── middlewares/         # Express middlewares
│   │   ├── auth.middleware.ts      # Authentication & authorization
│   │   ├── error.middleware.ts     # Global error handler
│   │   ├── validation.middleware.ts # Request validation
│   │   └── rate-limit.middleware.ts # API rate limiting
│   ├── models/              # Sequelize models
│   │   ├── User.ts
│   │   ├── Role.ts
│   │   ├── Permission.ts
│   │   ├── Menu.ts
│   │   └── AuditLog.ts
│   ├── routes/              # API routes
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   └── index.ts
│   ├── services/            # Business logic
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── permission.service.ts
│   │   └── audit.service.ts
│   ├── types/               # TypeScript type definitions
│   │   ├── auth.types.ts
│   │   ├── models.ts
│   │   └── express.d.ts
│   ├── utils/               # Utility functions
│   │   ├── jwt.util.ts
│   │   ├── logger.ts
│   │   ├── response.ts
│   │   └── errors.ts
│   ├── validators/          # Joi validation schemas
│   │   ├── auth.validator.ts
│   │   ├── user.validator.ts
│   │   └── common.validator.ts
│   ├── app.ts              # Express app setup
│   └── server.ts           # Server entry point
├── tests/                   # Test files
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/               # End-to-end tests
├── .env.example            # Environment variables template
├── .gitignore             # Git ignore file
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── jest.config.js         # Jest test configuration
└── README.md             # This file
```

## Quick Start

### Prerequisites

- Node.js 18+ installed
- MySQL 8.0 database
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone git@github.com:Donaldshen27/rbac-for-MES.git
cd rbac-for-MES

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure your database in .env file

# Run database migrations
npm run migrate

# Seed initial data
npm run seed

# Start development server
npm run dev
```

### Environment Configuration

Create a `.env` file with the following variables:

```env
# Application
NODE_ENV=development
PORT=3000
APP_NAME=RBAC-System

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=rbac_system
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Logging
LOG_LEVEL=info
```

## Documentation

Detailed documentation is available in the `docs` folder:

- [System Design](docs/SYSTEM_DESIGN.md) - Complete architecture and implementation details
- [Database Schema](docs/DATABASE_SCHEMA.md) - Database design and optimization
- [API Specification](docs/API_SPECIFICATION.md) - Complete API documentation

## 📊 Database Schema

The system uses a well-optimized MySQL schema with the following key tables:
- **users** - User accounts with authentication details
- **roles** - Role definitions
- **permissions** - Permission definitions (resource:action format)
- **user_roles** - Many-to-many user-role associations
- **role_permissions** - Many-to-many role-permission associations
- **menus** - Hierarchical menu structure
- **menu_permissions** - Menu access control
- **audit_logs** - Security audit trail
- **refresh_tokens** - JWT refresh token management

See [Database Schema Documentation](docs/DATABASE_SCHEMA.md) for complete ERD and details.

## 🚀 API Overview

All APIs follow RESTful conventions with consistent JSON responses. Base URL: `/api/v1`

### Authentication Endpoints
```
POST   /auth/register         # Register new user
POST   /auth/login           # User login (returns JWT tokens)
POST   /auth/refresh         # Refresh access token
POST   /auth/logout          # Logout current session
POST   /auth/logout-all      # Logout all sessions
POST   /auth/forgot-password # Request password reset
POST   /auth/reset-password  # Reset password with token
POST   /auth/change-password # Change current password
POST   /auth/verify-email    # Verify email address
GET    /auth/profile         # Get current user profile
PUT    /auth/profile         # Update profile
GET    /auth/sessions        # List active sessions
DELETE /auth/sessions/:id    # Revoke specific session
```

### User Management Endpoints
```
GET    /users                # List users (paginated)
GET    /users/:id           # Get user details
POST   /users               # Create new user
PUT    /users/:id           # Update user
DELETE /users/:id           # Soft delete user
PUT    /users/:id/restore   # Restore deleted user
PUT    /users/:id/roles     # Update user roles
PUT    /users/:id/status    # Activate/deactivate user
GET    /users/statistics    # User statistics
POST   /users/bulk/status   # Bulk status update
GET    /users/export        # Export users (CSV/Excel)
```

### Role Management Endpoints
```
GET    /roles               # List all roles
GET    /roles/:id          # Get role details
POST   /roles              # Create new role
PUT    /roles/:id          # Update role
DELETE /roles/:id          # Delete role
GET    /roles/:id/permissions    # Get role permissions
PUT    /roles/:id/permissions    # Update role permissions
GET    /roles/:id/users         # Get users with role
```

### Permission Management Endpoints
```
GET    /permissions         # List all permissions
GET    /permissions/:id     # Get permission details
POST   /permissions         # Create permission
PUT    /permissions/:id     # Update permission
DELETE /permissions/:id     # Delete permission
POST   /permissions/check   # Check user permission
GET    /permissions/resources # List permission resources
```

### Menu Management Endpoints
```
GET    /menus              # List all menus
GET    /menus/:id         # Get menu details
POST   /menus             # Create menu
PUT    /menus/:id         # Update menu
DELETE /menus/:id         # Delete menu
GET    /menus/tree        # Get menu tree structure
GET    /menus/user-menu   # Get current user's menu
PUT    /menus/:id/permissions # Update menu permissions
```

### Resource Management Endpoints
```
GET    /resources          # List resources
GET    /resources/:id      # Get resource details
POST   /resources         # Create resource
PUT    /resources/:id     # Update resource
DELETE /resources/:id     # Delete resource
```

### Audit Log Endpoints
```
GET    /audit-logs        # List audit logs (paginated)
GET    /audit-logs/:id    # Get log details
GET    /audit-logs/export # Export logs
GET    /audit-logs/stats  # Audit statistics
```

API documentation is available at `/api-docs` when running in development mode.

## Default Roles

The system comes with predefined roles suitable for MES:

1. **Super Admin** - Full system access
2. **Production Manager** - Production module management
3. **Quality Inspector** - Quality control access
4. **Operator** - Basic operational permissions
5. **Viewer** - Read-only access

## 📦 Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build           # Build TypeScript to JavaScript
npm run start           # Start production server

# Database
npm run migrate         # Run database migrations
npm run migrate:undo    # Rollback last migration
npm run seed            # Seed database with initial data
npm run seed:undo       # Remove all seeded data

# Testing
npm test               # Run all tests
npm run test:unit      # Run unit tests only
npm run test:integration # Run integration tests
npm run test:e2e       # Run end-to-end tests
npm run test:coverage  # Generate test coverage report

# Code Quality
npm run lint           # Check code with ESLint
npm run lint:fix       # Fix ESLint issues automatically
npm run format         # Format code with Prettier
npm run typecheck      # Check TypeScript types

# Documentation
npm run docs:api       # Generate API documentation
npm run docs:db        # Generate database documentation
```

## 🧪 Testing

The project includes comprehensive testing:

### Unit Tests
- Controllers: Test request handling logic
- Services: Test business logic
- Utilities: Test helper functions
- Middlewares: Test middleware behavior

### Integration Tests
- API endpoints with database
- Authentication flows
- Permission checks

### E2E Tests
- Complete user workflows
- Multi-role scenarios

Run tests:
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.controller.test.ts

# Run in watch mode
npm test -- --watch
```

## 🚢 Production Deployment

### Prerequisites
- Node.js 18+ installed
- MySQL 8.0 database
- SSL certificates for HTTPS
- Domain name configured

### Environment Variables
Create a `.env.production` file with secure values:
```env
NODE_ENV=production
PORT=3000

# Database
DB_HOST=your-db-host
DB_PORT=3306
DB_NAME=rbac_production
DB_USER=rbac_user
DB_PASSWORD=strong-password

# Security
JWT_SECRET=generate-256-bit-secret
REFRESH_TOKEN_SECRET=another-256-bit-secret
BCRYPT_ROUNDS=12

# CORS
CORS_ORIGIN=https://your-domain.com
```

### Deployment Options

#### 1. Using PM2
```bash
# Install PM2 globally
npm install -g pm2

# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

#### 2. Using Docker
```bash
# Build Docker image
docker build -t rbac-system:latest .

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f app
```

#### 3. Using Systemd
```bash
# Create service file
sudo nano /etc/systemd/system/rbac-system.service

# Add configuration
[Unit]
Description=RBAC System
After=network.target

[Service]
Type=simple
User=nodejs
WorkingDirectory=/var/www/rbac-system
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target

# Enable and start
sudo systemctl enable rbac-system
sudo systemctl start rbac-system
```

### Production Checklist
- [ ] Set strong JWT secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Set up monitoring (e.g., PM2 Plus, New Relic)
- [ ] Configure reverse proxy (Nginx/Apache)
- [ ] Enable CORS for your domains only
- [ ] Set up CI/CD pipeline
- [ ] Configure error tracking (e.g., Sentry)

## 🔒 Security Features

### Authentication & Authorization
- **Bcrypt** password hashing with configurable rounds
- **JWT** tokens with short expiry and refresh token rotation
- **Role-based** access control with fine-grained permissions
- **Session management** with device tracking
- **Account lockout** after failed login attempts

### API Security
- **Rate limiting** per IP and per user
- **Input validation** with Joi schemas
- **SQL injection prevention** via parameterized queries
- **XSS protection** with proper output encoding
- **CORS** configuration for trusted origins
- **Helmet.js** for security headers

### Audit & Compliance
- **Comprehensive audit logging** for all security events
- **Data encryption** at rest and in transit
- **PII protection** with field-level encryption
- **GDPR compliance** with data export/deletion
- **Session monitoring** and anomaly detection

## ⚡ Performance Optimization

### Database Optimization
- **Indexed columns** for fast queries (username, email, foreign keys)
- **Query optimization** with eager loading to prevent N+1 queries
- **Connection pooling** for efficient database connections
- **Pagination** on all list endpoints
- **Caching** ready with Redis support

### Application Performance
- **Async/await** for non-blocking operations
- **Stream processing** for large data exports
- **Compression** middleware for response size reduction
- **Static asset caching** with proper headers
- **Load balancing** ready with PM2 cluster mode

### Monitoring
- **Response time tracking** on all endpoints
- **Memory usage monitoring** with alerts
- **Database query performance** logging
- **Error rate tracking** and alerting
- **Custom metrics** for business KPIs

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Follow existing code style
- Add JSDoc comments for public APIs

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

- 📧 **Email**: support@example.com
- 💬 **Discord**: [Join our community](https://discord.gg/example)
- 📚 **Documentation**: [Full docs](https://docs.example.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/Donaldshen27/rbac-for-MES/issues)
- 💡 **Discussions**: [GitHub Discussions](https://github.com/Donaldshen27/rbac-for-MES/discussions)

## 🙏 Acknowledgments

- Built with [Express.js](https://expressjs.com/)
- Database ORM by [Sequelize](https://sequelize.org/)
- Authentication using [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
- Validation with [Joi](https://joi.dev/)
- Documentation via [Swagger](https://swagger.io/)

---

<div align="center">
  <strong>Built with ❤️ for Manufacturing Execution Systems</strong>
  <br>
  <sub>High-performance RBAC system for enterprise applications</sub>
</div>