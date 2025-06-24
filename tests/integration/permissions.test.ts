import request from 'supertest';
import app from '../../src/app';
import { sequelize } from '../../src/config/database';
import { User } from '../../src/models/User';
import { Role } from '../../src/models/Role';
import { Permission } from '../../src/models/Permission';

describe('Permissions API', () => {
  let server: any;
  let adminToken: string;
  let userToken: string;
  let adminRole: Role;
  let userRole: Role;
  const baseUrl = '/api/v1';

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    server = app.listen(0);

    // Create initial permissions
    const permissions = await Promise.all([
      Permission.create({ name: 'permissions:read', description: 'View permissions', category: 'Permissions' }),
      Permission.create({ name: 'permissions:create', description: 'Create permissions', category: 'Permissions' }),
      Permission.create({ name: 'permissions:update', description: 'Update permissions', category: 'Permissions' }),
      Permission.create({ name: 'permissions:delete', description: 'Delete permissions', category: 'Permissions' }),
    ]);

    // Create roles
    adminRole = await Role.create({ name: 'Admin', description: 'Administrator' });
    userRole = await Role.create({ name: 'User', description: 'Regular User' });

    // Assign permissions
    await adminRole.setPermissions(permissions);
    await userRole.setPermissions([permissions[0]]); // read only

    // Create users
    const admin = await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: 'Test123!@#',
      isActive: true
    });
    await admin.setRoles([adminRole]);

    const user = await User.create({
      username: 'user',
      email: 'user@test.com',
      password: 'Test123!@#',
      isActive: true
    });
    await user.setRoles([userRole]);

    // Get tokens
    const adminLogin = await request(app)
      .post(`${baseUrl}/auth/login`)
      .send({ username: 'admin', password: 'Test123!@#' });
    adminToken = adminLogin.body.data.tokens.accessToken;

    const userLogin = await request(app)
      .post(`${baseUrl}/auth/login`)
      .send({ username: 'user', password: 'Test123!@#' });
    userToken = userLogin.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await server.close();
    await sequelize.close();
  });

  describe('GET /permissions', () => {
    it('should list permissions for admin', async () => {
      const response = await request(app)
        .get(`${baseUrl}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(4);
    });

    it('should list permissions for regular user', async () => {
      const response = await request(app)
        .get(`${baseUrl}/permissions`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should filter permissions by category', async () => {
      const response = await request(app)
        .get(`${baseUrl}/permissions?category=Permissions`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((p: any) => p.category === 'Permissions')).toBe(true);
    });

    it('should search permissions', async () => {
      const response = await request(app)
        .get(`${baseUrl}/permissions?search=read`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((p: any) => 
        p.name.includes('read') || p.description.toLowerCase().includes('read')
      )).toBe(true);
    });
  });

  describe('POST /permissions', () => {
    it('should create permission as admin', async () => {
      const response = await request(app)
        .post(`${baseUrl}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'test:create',
          description: 'Create test resources',
          category: 'Test',
          action: 'create',
          resource: 'test'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('test:create');
    });

    it('should fail to create permission as regular user', async () => {
      const response = await request(app)
        .post(`${baseUrl}/permissions`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'test:delete',
          description: 'Delete test resources',
          category: 'Test',
          action: 'delete',
          resource: 'test'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid permission format', async () => {
      const response = await request(app)
        .post(`${baseUrl}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'invalid-format',
          description: 'Invalid permission format',
          category: 'Test'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with duplicate permission name', async () => {
      const response = await request(app)
        .post(`${baseUrl}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'permissions:read',
          description: 'Duplicate permission',
          category: 'Permissions'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /permissions/:id', () => {
    let testPermission: Permission;

    beforeAll(async () => {
      testPermission = await Permission.create({
        name: 'test:read',
        description: 'Read test resources',
        category: 'Test'
      });
    });

    it('should get permission by id', async () => {
      const response = await request(app)
        .get(`${baseUrl}/permissions/${testPermission.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testPermission.id);
      expect(response.body.data.name).toBe('test:read');
    });

    it('should return 404 for non-existent permission', async () => {
      const response = await request(app)
        .get(`${baseUrl}/permissions/non-existent-id`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /permissions/:id', () => {
    let updatePermission: Permission;

    beforeAll(async () => {
      updatePermission = await Permission.create({
        name: 'update:test',
        description: 'To be updated',
        category: 'Test'
      });
    });

    it('should update permission as admin', async () => {
      const response = await request(app)
        .put(`${baseUrl}/permissions/${updatePermission.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Updated description',
          category: 'UpdatedCategory'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('Updated description');
      expect(response.body.data.category).toBe('UpdatedCategory');
    });

    it('should fail to update permission as regular user', async () => {
      const response = await request(app)
        .put(`${baseUrl}/permissions/${updatePermission.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          description: 'Should fail'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should not allow changing permission name', async () => {
      const response = await request(app)
        .put(`${baseUrl}/permissions/${updatePermission.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'changed:name',
          description: 'Try to change name'
        });

      expect(response.status).toBe(200);
      const updated = await Permission.findByPk(updatePermission.id);
      expect(updated?.name).toBe('update:test'); // Name should not change
    });
  });

  describe('DELETE /permissions/:id', () => {
    it('should delete permission as admin', async () => {
      const permToDelete = await Permission.create({
        name: 'delete:me',
        description: 'To be deleted',
        category: 'Test'
      });

      const response = await request(app)
        .delete(`${baseUrl}/permissions/${permToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deleted = await Permission.findByPk(permToDelete.id);
      expect(deleted).toBeNull();
    });

    it('should fail to delete permission as regular user', async () => {
      const permToDelete = await Permission.create({
        name: 'delete:fail',
        description: 'Should not be deleted',
        category: 'Test'
      });

      const response = await request(app)
        .delete(`${baseUrl}/permissions/${permToDelete.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);

      const exists = await Permission.findByPk(permToDelete.id);
      expect(exists).toBeTruthy();
    });

    it('should handle deleting permission in use', async () => {
      const permInUse = await Permission.create({
        name: 'inuse:permission',
        description: 'Permission in use',
        category: 'Test'
      });

      // Assign to a role
      await adminRole.addPermission(permInUse);

      const response = await request(app)
        .delete(`${baseUrl}/permissions/${permInUse.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Should either fail or handle gracefully
      expect([200, 400, 409]).toContain(response.status);
    });
  });

  describe('GET /permissions/check', () => {
    it('should check permission for admin user', async () => {
      const response = await request(app)
        .get(`${baseUrl}/permissions/check?permission=permissions:read`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.hasPermission).toBe(true);
    });

    it('should check permission for regular user', async () => {
      const response = await request(app)
        .get(`${baseUrl}/permissions/check?permission=permissions:create`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.hasPermission).toBe(false);
    });

    it('should fail with invalid permission format', async () => {
      const response = await request(app)
        .get(`${baseUrl}/permissions/check?permission=invalid-format`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail without permission parameter', async () => {
      const response = await request(app)
        .get(`${baseUrl}/permissions/check`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Permission Categories', () => {
    it('should group permissions by category', async () => {
      // Create permissions in different categories
      await Permission.bulkCreate([
        { name: 'cat1:read', description: 'Read cat1', category: 'Category1' },
        { name: 'cat1:write', description: 'Write cat1', category: 'Category1' },
        { name: 'cat2:read', description: 'Read cat2', category: 'Category2' },
      ]);

      const response = await request(app)
        .get(`${baseUrl}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      const categories = [...new Set(response.body.data.map((p: any) => p.category))];
      expect(categories.length).toBeGreaterThanOrEqual(3); // At least Permissions, Category1, Category2
    });
  });
});