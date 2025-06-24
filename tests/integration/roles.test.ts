import request from 'supertest';
import app from '../../src/app';
import { sequelize } from '../../src/config/database';
import { User } from '../../src/models/User';
import { Role } from '../../src/models/Role';
import { Permission } from '../../src/models/Permission';

describe('Roles API', () => {
  let server: any;
  let adminToken: string;
  let managerToken: string;
  let viewerToken: string;
  let adminRole: Role;
  let managerRole: Role;
  let viewerRole: Role;
  let permissions: Permission[];
  const baseUrl = '/api/v1';

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    server = app.listen(0);

    // Create permissions
    permissions = await Promise.all([
      Permission.create({ name: 'roles:read', description: 'View roles', category: 'Roles' }),
      Permission.create({ name: 'roles:create', description: 'Create roles', category: 'Roles' }),
      Permission.create({ name: 'roles:update', description: 'Update roles', category: 'Roles' }),
      Permission.create({ name: 'roles:delete', description: 'Delete roles', category: 'Roles' }),
      Permission.create({ name: 'users:read', description: 'View users', category: 'Users' }),
    ]);

    // Create roles
    adminRole = await Role.create({ name: 'Admin', description: 'Administrator' });
    managerRole = await Role.create({ name: 'Manager', description: 'Manager' });
    viewerRole = await Role.create({ name: 'Viewer', description: 'Viewer' });

    // Assign permissions
    await adminRole.setPermissions(permissions);
    await managerRole.setPermissions(permissions.slice(0, 3)); // read, create, update
    await viewerRole.setPermissions([permissions[0]]); // read only

    // Create users
    const admin = await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: 'Test123!@#',
      isActive: true
    });
    await admin.setRoles([adminRole]);

    const manager = await User.create({
      username: 'manager',
      email: 'manager@test.com',
      password: 'Test123!@#',
      isActive: true
    });
    await manager.setRoles([managerRole]);

    const viewer = await User.create({
      username: 'viewer',
      email: 'viewer@test.com',
      password: 'Test123!@#',
      isActive: true
    });
    await viewer.setRoles([viewerRole]);

    // Get tokens
    const adminLogin = await request(app)
      .post(`${baseUrl}/auth/login`)
      .send({ username: 'admin', password: 'Test123!@#' });
    adminToken = adminLogin.body.data.tokens.accessToken;

    const managerLogin = await request(app)
      .post(`${baseUrl}/auth/login`)
      .send({ username: 'manager', password: 'Test123!@#' });
    managerToken = managerLogin.body.data.tokens.accessToken;

    const viewerLogin = await request(app)
      .post(`${baseUrl}/auth/login`)
      .send({ username: 'viewer', password: 'Test123!@#' });
    viewerToken = viewerLogin.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await server.close();
    await sequelize.close();
  });

  describe('GET /roles', () => {
    it('should list roles for admin', async () => {
      const response = await request(app)
        .get(`${baseUrl}/roles`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('should list roles for manager', async () => {
      const response = await request(app)
        .get(`${baseUrl}/roles`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should list roles for viewer', async () => {
      const response = await request(app)
        .get(`${baseUrl}/roles`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`${baseUrl}/roles?page=1&limit=2`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.headers).toHaveProperty('x-total-count');
    });
  });

  describe('POST /roles', () => {
    it('should create role as admin', async () => {
      const response = await request(app)
        .post(`${baseUrl}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'TestRole',
          description: 'Test role description',
          isActive: true
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('TestRole');
    });

    it('should create role as manager', async () => {
      const response = await request(app)
        .post(`${baseUrl}/roles`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'ManagerTestRole',
          description: 'Created by manager',
          isActive: true
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should fail to create role as viewer', async () => {
      const response = await request(app)
        .post(`${baseUrl}/roles`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          name: 'ViewerTestRole',
          description: 'Should fail',
          isActive: true
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail with duplicate role name', async () => {
      const response = await request(app)
        .post(`${baseUrl}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin',
          description: 'Duplicate name',
          isActive: true
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /roles/:id', () => {
    it('should get role by id', async () => {
      const response = await request(app)
        .get(`${baseUrl}/roles/${adminRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(adminRole.id);
      expect(response.body.data.name).toBe('Admin');
    });

    it('should return 404 for non-existent role', async () => {
      const response = await request(app)
        .get(`${baseUrl}/roles/non-existent-id`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /roles/:id', () => {
    let testRole: Role;

    beforeAll(async () => {
      testRole = await Role.create({
        name: 'UpdateTestRole',
        description: 'To be updated',
        isActive: true
      });
    });

    it('should update role as admin', async () => {
      const response = await request(app)
        .put(`${baseUrl}/roles/${testRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'UpdatedRole',
          description: 'Updated description',
          isActive: false
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('UpdatedRole');
      expect(response.body.data.isActive).toBe(false);
    });

    it('should update role as manager', async () => {
      const response = await request(app)
        .put(`${baseUrl}/roles/${testRole.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          description: 'Updated by manager'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should fail to update role as viewer', async () => {
      const response = await request(app)
        .put(`${baseUrl}/roles/${testRole.id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          description: 'Should fail'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /roles/:id', () => {
    let roleToDelete: Role;

    beforeEach(async () => {
      roleToDelete = await Role.create({
        name: 'DeleteTestRole',
        description: 'To be deleted',
        isActive: true
      });
    });

    it('should delete role as admin', async () => {
      const response = await request(app)
        .delete(`${baseUrl}/roles/${roleToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deleted = await Role.findByPk(roleToDelete.id);
      expect(deleted).toBeNull();
    });

    it('should fail to delete role as manager', async () => {
      const response = await request(app)
        .delete(`${baseUrl}/roles/${roleToDelete.id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Role Permissions Management', () => {
    let testRole: Role;

    beforeAll(async () => {
      testRole = await Role.create({
        name: 'PermissionTestRole',
        description: 'For permission tests',
        isActive: true
      });
    });

    describe('GET /roles/:id/permissions', () => {
      it('should get role permissions', async () => {
        await testRole.setPermissions([permissions[0], permissions[1]]);

        const response = await request(app)
          .get(`${baseUrl}/roles/${testRole.id}/permissions`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBe(2);
      });
    });

    describe('PUT /roles/:id/permissions', () => {
      it('should update role permissions as admin', async () => {
        const response = await request(app)
          .put(`${baseUrl}/roles/${testRole.id}/permissions`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            permissionIds: [permissions[0].id, permissions[2].id]
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        const updatedPermissions = await testRole.getPermissions();
        expect(updatedPermissions.length).toBe(2);
      });

      it('should fail to update permissions as viewer', async () => {
        const response = await request(app)
          .put(`${baseUrl}/roles/${testRole.id}/permissions`)
          .set('Authorization', `Bearer ${viewerToken}`)
          .send({
            permissionIds: [permissions[0].id]
          });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Additional Role Endpoints', () => {
    describe('POST /roles/:id/clone', () => {
      it('should clone role', async () => {
        const response = await request(app)
          .post(`${baseUrl}/roles/${adminRole.id}/clone`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'ClonedAdmin',
            description: 'Cloned from Admin role'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('ClonedAdmin');

        // Check if permissions were cloned
        const clonedRole = await Role.findByPk(response.body.data.id, {
          include: ['permissions']
        });
        expect(clonedRole?.permissions?.length).toBe(permissions.length);
      });
    });

    describe('GET /roles/:id/users', () => {
      it('should get users with role', async () => {
        const response = await request(app)
          .get(`${baseUrl}/roles/${adminRole.id}/users`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(0);
      });
    });

    describe('GET /roles/hierarchy', () => {
      it('should get role hierarchy', async () => {
        const response = await request(app)
          .get(`${baseUrl}/roles/hierarchy`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      });
    });

    describe('GET /roles/statistics', () => {
      it('should get role statistics', async () => {
        const response = await request(app)
          .get(`${baseUrl}/roles/statistics`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalRoles');
        expect(response.body.data).toHaveProperty('activeRoles');
      });
    });

    describe('POST /roles/bulk-delete', () => {
      it('should bulk delete roles', async () => {
        const rolesToDelete = await Promise.all([
          Role.create({ name: 'BulkDelete1', description: 'Test' }),
          Role.create({ name: 'BulkDelete2', description: 'Test' })
        ]);

        const response = await request(app)
          .post(`${baseUrl}/roles/bulk-delete`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            roleIds: rolesToDelete.map(r => r.id)
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.deletedCount).toBe(2);
      });
    });
  });
});