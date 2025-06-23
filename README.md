# RBAC Permission Management System for MES

A generic Role-Based Access Control (RBAC) system designed for Manufacturing Execution Systems (MES) but suitable for any application requiring sophisticated permission management.

## Features

- 🔐 **JWT Authentication** with access and refresh tokens
- 👥 **User Management** with role assignments
- 🎭 **Role Management** with flexible permission assignments
- 🔑 **Permission System** with resource:action pattern
- 📋 **Hierarchical Menu Permissions** for complex menu structures
- 📝 **Audit Logging** for all security-relevant actions
- 📱 **RESTful APIs** for web and mobile clients
- 📚 **Swagger Documentation** for API testing
- 🚀 **TypeScript** for type safety
- 🗄️ **MySQL** database with optimized schema

## Architecture

The system follows a modular architecture with clear separation of concerns:

- **Authentication Module**: JWT-based authentication with refresh tokens
- **RBAC Module**: Core permission management functionality
- **Menu Module**: Hierarchical menu permission management
- **Audit Module**: Comprehensive activity logging

## Tech Stack

- **Runtime**: Node.js v18+
- **Framework**: Express.js with TypeScript
- **Database**: MySQL 8.0
- **ORM**: Sequelize v6
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi
- **Documentation**: Swagger/OpenAPI 3.0
- **Testing**: Jest + Supertest

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

## API Overview

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user

### User Management
- `GET /api/v1/users` - List users
- `GET /api/v1/users/:id` - Get user details
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### Role Management
- `GET /api/v1/roles` - List roles
- `POST /api/v1/roles` - Create role
- `PUT /api/v1/roles/:id` - Update role
- `DELETE /api/v1/roles/:id` - Delete role

### Permission Management
- `GET /api/v1/permissions` - List permissions
- `GET /api/v1/permissions/check` - Check user permission

### Menu Permissions
- `GET /api/v1/menus/user-menu` - Get user's accessible menu

## Default Roles

The system comes with predefined roles suitable for MES:

1. **Super Admin** - Full system access
2. **Production Manager** - Production module management
3. **Quality Inspector** - Quality control access
4. **Operator** - Basic operational permissions
5. **Viewer** - Read-only access

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format
```

## Production Deployment

### Using PM2

```bash
# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.js
```

### Using Docker

```bash
# Build Docker image
docker build -t rbac-system .

# Run with docker-compose
docker-compose up -d
```

## Security Features

- Password hashing with bcrypt
- JWT token rotation
- Rate limiting on API endpoints
- Input validation and sanitization
- SQL injection prevention via ORM
- Audit logging for all critical operations

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the GitHub repository.

---

Built with ❤️ for Manufacturing Execution Systems