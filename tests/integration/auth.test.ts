import request from 'supertest';
import app from '../../src/app';
import { sequelize } from '../../src/config/database';
import { User } from '../../src/models/User';
import { Role } from '../../src/models/Role';
import { Permission } from '../../src/models/Permission';

describe('Authentication API', () => {
  let server: any;
  const baseUrl = '/api/v1';

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    server = app.listen(0); // Random port for testing
  });

  afterAll(async () => {
    await server.close();
    await sequelize.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post(`${baseUrl}/auth/register`)
        .send({
          username: 'testuser',
          email: 'testuser@example.com',
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.user.email).toBe('testuser@example.com');
    });

    it('should fail with duplicate email', async () => {
      const response = await request(app)
        .post(`${baseUrl}/auth/register`)
        .send({
          username: 'testuser2',
          email: 'testuser@example.com',
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_EMAIL_EXISTS');
    });

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post(`${baseUrl}/auth/register`)
        .send({
          username: 'testuser3',
          email: 'testuser3@example.com',
          password: '123',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    beforeAll(async () => {
      // Create a test user
      await User.create({
        username: 'logintest',
        email: 'logintest@example.com',
        password: 'Test123!@#',
        isActive: true
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post(`${baseUrl}/auth/login`)
        .send({
          username: 'logintest',
          password: 'Test123!@#'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should login with email', async () => {
      const response = await request(app)
        .post(`${baseUrl}/auth/login`)
        .send({
          email: 'logintest@example.com',
          password: 'Test123!@#'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post(`${baseUrl}/auth/login`)
        .send({
          username: 'logintest',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_001');
    });

    it('should fail with non-existent user', async () => {
      const response = await request(app)
        .post(`${baseUrl}/auth/login`)
        .send({
          username: 'nonexistent',
          password: 'Test123!@#'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with inactive user', async () => {
      await User.create({
        username: 'inactiveuser',
        email: 'inactive@example.com',
        password: 'Test123!@#',
        isActive: false
      });

      const response = await request(app)
        .post(`${baseUrl}/auth/login`)
        .send({
          username: 'inactiveuser',
          password: 'Test123!@#'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_002');
    });
  });

  describe('POST /auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post(`${baseUrl}/auth/login`)
        .send({
          username: 'logintest',
          password: 'Test123!@#'
        });
      
      refreshToken = loginResponse.body.data.tokens.refreshToken;
    });

    it('should refresh token with valid refresh token', async () => {
      const response = await request(app)
        .post(`${baseUrl}/auth/refresh`)
        .send({
          refreshToken
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tokens');
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post(`${baseUrl}/auth/refresh`)
        .send({
          refreshToken: 'invalid-token'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/logout', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post(`${baseUrl}/auth/login`)
        .send({
          username: 'logintest',
          password: 'Test123!@#'
        });
      
      accessToken = loginResponse.body.data.tokens.accessToken;
      refreshToken = loginResponse.body.data.tokens.refreshToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post(`${baseUrl}/auth/logout`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          refreshToken
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post(`${baseUrl}/auth/logout`)
        .send({
          refreshToken
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /auth/me', () => {
    let accessToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post(`${baseUrl}/auth/login`)
        .send({
          username: 'logintest',
          password: 'Test123!@#'
        });
      
      accessToken = loginResponse.body.data.tokens.accessToken;
    });

    it('should get current user info', async () => {
      const response = await request(app)
        .get(`${baseUrl}/auth/me`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('logintest');
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`${baseUrl}/auth/me`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});