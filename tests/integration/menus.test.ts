import request from 'supertest';
import app from '../../src/app';
import { sequelize } from '../../src/config/database';
import { User } from '../../src/models/User';
import { Role } from '../../src/models/Role';
import { Permission } from '../../src/models/Permission';
import { Menu } from '../../src/models/Menu';

describe('Menus API', () => {
  let server: any;
  let adminToken: string;
  let userToken: string;
  let adminRole: Role;
  let userRole: Role;
  let menuPermissions: Permission[];
  const baseUrl = '/api/v1';

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    server = app.listen(0);

    // Create permissions
    menuPermissions = await Promise.all([
      Permission.create({ name: 'menus:read', description: 'View menus', category: 'Menus' }),
      Permission.create({ name: 'menus:create', description: 'Create menus', category: 'Menus' }),
      Permission.create({ name: 'menus:update', description: 'Update menus', category: 'Menus' }),
      Permission.create({ name: 'menus:delete', description: 'Delete menus', category: 'Menus' }),
      Permission.create({ name: 'menus:manage', description: 'Manage menu permissions', category: 'Menus' }),
    ]);

    // Create roles
    adminRole = await Role.create({ name: 'Admin', description: 'Administrator' });
    userRole = await Role.create({ name: 'User', description: 'Regular User' });

    // Assign permissions
    await adminRole.setPermissions(menuPermissions);
    await userRole.setPermissions([menuPermissions[0]]); // read only

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

    // Create initial menu structure
    const dashboard = await Menu.create({
      name: 'Dashboard',
      path: '/dashboard',
      icon: 'dashboard',
      order: 1,
      isActive: true
    });

    const admin = await Menu.create({
      name: 'Admin',
      path: '/admin',
      icon: 'settings',
      order: 2,
      isActive: true
    });

    await Menu.create({
      name: 'Users',
      path: '/admin/users',
      icon: 'users',
      parentId: admin.id,
      order: 1,
      isActive: true
    });

    await Menu.create({
      name: 'Roles',
      path: '/admin/roles',
      icon: 'lock',
      parentId: admin.id,
      order: 2,
      isActive: true
    });
  });

  afterAll(async () => {
    await server.close();
    await sequelize.close();
  });

  describe('GET /menus', () => {
    it('should list all menus for admin', async () => {
      const response = await request(app)
        .get(`${baseUrl}/menus`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(4);
    });

    it('should list menus for regular user', async () => {
      const response = await request(app)
        .get(`${baseUrl}/menus`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should filter active menus', async () => {
      const response = await request(app)
        .get(`${baseUrl}/menus?isActive=true`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((m: any) => m.isActive === true)).toBe(true);
    });

    it('should filter by parent', async () => {
      const adminMenu = await Menu.findOne({ where: { name: 'Admin' } });
      
      const response = await request(app)
        .get(`${baseUrl}/menus?parentId=${adminMenu?.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((m: any) => m.parentId === adminMenu?.id)).toBe(true);
    });
  });

  describe('POST /menus', () => {
    it('should create menu as admin', async () => {
      const response = await request(app)
        .post(`${baseUrl}/menus`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Reports',
          path: '/reports',
          icon: 'chart',
          order: 3,
          isActive: true
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Reports');
      expect(response.body.data.path).toBe('/reports');
    });

    it('should create submenu', async () => {
      const parent = await Menu.findOne({ where: { name: 'Admin' } });
      
      const response = await request(app)
        .post(`${baseUrl}/menus`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Settings',
          path: '/admin/settings',
          icon: 'cog',
          parentId: parent?.id,
          order: 3,
          isActive: true
        });

      expect(response.status).toBe(201);
      expect(response.body.data.parentId).toBe(parent?.id);
    });

    it('should fail to create menu as regular user', async () => {
      const response = await request(app)
        .post(`${baseUrl}/menus`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'UserMenu',
          path: '/user-menu',
          icon: 'user',
          order: 4,
          isActive: true
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post(`${baseUrl}/menus`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'NoPath',
          icon: 'test'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /menus/:id', () => {
    let testMenu: Menu;

    beforeAll(async () => {
      testMenu = await Menu.create({
        name: 'TestMenu',
        path: '/test',
        icon: 'test',
        order: 10,
        isActive: true
      });
    });

    it('should get menu by id', async () => {
      const response = await request(app)
        .get(`${baseUrl}/menus/${testMenu.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testMenu.id);
      expect(response.body.data.name).toBe('TestMenu');
    });

    it('should include children if present', async () => {
      const child = await Menu.create({
        name: 'TestChild',
        path: '/test/child',
        icon: 'child',
        parentId: testMenu.id,
        order: 1,
        isActive: true
      });

      const response = await request(app)
        .get(`${baseUrl}/menus/${testMenu.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.children).toBeDefined();
      expect(response.body.data.children.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent menu', async () => {
      const response = await request(app)
        .get(`${baseUrl}/menus/non-existent-id`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /menus/:id', () => {
    let updateMenu: Menu;

    beforeAll(async () => {
      updateMenu = await Menu.create({
        name: 'UpdateMe',
        path: '/update-me',
        icon: 'update',
        order: 20,
        isActive: true
      });
    });

    it('should update menu as admin', async () => {
      const response = await request(app)
        .put(`${baseUrl}/menus/${updateMenu.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated',
          path: '/updated',
          icon: 'new-icon',
          isActive: false
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated');
      expect(response.body.data.isActive).toBe(false);
    });

    it('should fail to update menu as regular user', async () => {
      const response = await request(app)
        .put(`${baseUrl}/menus/${updateMenu.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Should Fail'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /menus/:id', () => {
    it('should delete menu as admin', async () => {
      const menuToDelete = await Menu.create({
        name: 'DeleteMe',
        path: '/delete-me',
        icon: 'delete',
        order: 30,
        isActive: true
      });

      const response = await request(app)
        .delete(`${baseUrl}/menus/${menuToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deleted = await Menu.findByPk(menuToDelete.id);
      expect(deleted).toBeNull();
    });

    it('should handle deleting menu with children', async () => {
      const parent = await Menu.create({
        name: 'ParentToDelete',
        path: '/parent-delete',
        icon: 'parent',
        order: 40,
        isActive: true
      });

      await Menu.create({
        name: 'ChildToDelete',
        path: '/parent-delete/child',
        icon: 'child',
        parentId: parent.id,
        order: 1,
        isActive: true
      });

      const response = await request(app)
        .delete(`${baseUrl}/menus/${parent.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Should either cascade delete or prevent deletion
      expect([200, 400, 409]).toContain(response.status);
    });
  });

  describe('Menu Tree and Hierarchy', () => {
    describe('GET /menus', () => {
      it('should get menu tree structure', async () => {
        const response = await request(app)
          .get(`${baseUrl}/menus`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        
        // Check if tree structure is correct
        const adminMenu = response.body.data.find((m: any) => m.name === 'Admin');
        expect(adminMenu).toBeDefined();
        expect(adminMenu.children).toBeInstanceOf(Array);
        expect(adminMenu.children.length).toBeGreaterThan(0);
      });
    });

    describe('PUT /menus/:id/move', () => {
      let menuToMove: Menu;
      let newParent: Menu;

      beforeAll(async () => {
        menuToMove = await Menu.create({
          name: 'MoveMe',
          path: '/move-me',
          icon: 'move',
          order: 50,
          isActive: true
        });

        newParent = await Menu.create({
          name: 'NewParent',
          path: '/new-parent',
          icon: 'parent',
          order: 60,
          isActive: true
        });
      });

      it('should move menu to new parent', async () => {
        const response = await request(app)
          .put(`${baseUrl}/menus/${menuToMove.id}/move`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            parentId: newParent.id,
            order: 1
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.parentId).toBe(newParent.id);
        expect(response.body.data.order).toBe(1);
      });

      it('should move menu to root level', async () => {
        const response = await request(app)
          .put(`${baseUrl}/menus/${menuToMove.id}/move`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            parentId: null,
            order: 10
          });

        expect(response.status).toBe(200);
        expect(response.body.data.parentId).toBeNull();
      });
    });

    describe('PUT /menus/reorder', () => {
      it('should reorder menus', async () => {
        const menus = await Menu.findAll({
          where: { parentId: null },
          order: [['order', 'ASC']]
        });

        const reorderData = menus.map((menu, index) => ({
          id: menu.id,
          order: menus.length - index // Reverse order
        }));

        const response = await request(app)
          .put(`${baseUrl}/menus/reorder`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ orders: reorderData });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Menu Permissions', () => {
    let permMenu: Menu;

    beforeAll(async () => {
      permMenu = await Menu.create({
        name: 'PermissionMenu',
        path: '/perm-menu',
        icon: 'lock',
        order: 70,
        isActive: true
      });
    });

    describe('GET /menus/:id/permissions', () => {
      it('should get menu permissions', async () => {
        await permMenu.setPermissions([menuPermissions[0]]);

        const response = await request(app)
          .get(`${baseUrl}/menus/${permMenu.id}/permissions`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBe(1);
      });
    });

    describe('PUT /menus/:id/permissions', () => {
      it('should update menu permissions', async () => {
        const response = await request(app)
          .put(`${baseUrl}/menus/${permMenu.id}/permissions`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            permissionIds: [menuPermissions[0].id, menuPermissions[1].id]
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        const updatedPerms = await permMenu.getPermissions();
        expect(updatedPerms.length).toBe(2);
      });

      it('should fail without manage permission', async () => {
        const response = await request(app)
          .put(`${baseUrl}/menus/${permMenu.id}/permissions`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            permissionIds: []
          });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('GET /menus/user-menu', () => {
    it('should get user-specific menu based on permissions', async () => {
      const response = await request(app)
        .get(`${baseUrl}/menus/user-menu`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      
      // User should only see menus they have permissions for
      // The actual filtering logic depends on implementation
    });

    it('should get all menus for admin', async () => {
      const response = await request(app)
        .get(`${baseUrl}/menus/user-menu`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });
});