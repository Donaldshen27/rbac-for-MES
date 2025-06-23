import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

class PermissionEndpointTester {
  private api: AxiosInstance;
  private authToken: string = '';
  private testPermissionId: string = '';
  private testResourceId: string = '';

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });
  }

  async runTests() {
    console.log('🧪 Starting Permission Endpoint Tests...\n');

    try {
      // First login to get auth token
      await this.login();
      
      // Test Permission endpoints
      console.log('📋 Testing Permission Endpoints...');
      await this.testCreatePermission();
      await this.testGetPermissions();
      await this.testGetPermissionById();
      await this.testUpdatePermission();
      await this.testCheckPermission();
      
      // Test Resource endpoints
      console.log('\n📋 Testing Resource Endpoints...');
      await this.testCreateResource();
      await this.testGetResources();
      await this.testGetResourceById();
      await this.testUpdateResource();
      
      // Test Role Permission endpoints
      console.log('\n📋 Testing Role Permission Endpoints...');
      await this.testGetRolePermissions();
      await this.testUpdateRolePermissions();
      
      // Cleanup
      console.log('\n🧹 Cleaning up test data...');
      await this.testDeletePermission();
      await this.testDeleteResource();
      
      console.log('\n✅ All permission endpoint tests passed!');
    } catch (error) {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    }
  }

  private async login() {
    console.log('🔐 Logging in...');
    try {
      const response = await this.api.post('/auth/login', {
        email: 'admin@example.com',
        password: 'Admin@123'
      });
      
      this.authToken = response.data.data.tokens.accessToken;
      this.api.defaults.headers.common['Authorization'] = `Bearer ${this.authToken}`;
      console.log('✅ Login successful\n');
    } catch (error: any) {
      console.error('❌ Login failed:', error.response?.data || error.message);
      throw error;
    }
  }

  private async testCreatePermission() {
    console.log('📝 Testing POST /permissions - Create Permission');
    try {
      const response = await this.api.post('/permissions', {
        resource: 'test_resource',
        action: 'test_action',
        description: 'Test permission for API testing'
      });
      
      this.testPermissionId = response.data.data.permission.id;
      console.log('✅ Permission created:', response.data.data.permission.name);
    } catch (error: any) {
      console.error('❌ Create permission failed:', error.response?.data || error.message);
      throw error;
    }
  }

  private async testGetPermissions() {
    console.log('📝 Testing GET /permissions - List Permissions');
    try {
      const response = await this.api.get('/permissions', {
        params: {
          resource: 'test_resource',
          page: 1,
          limit: 10
        }
      });
      
      console.log(`✅ Retrieved ${response.data.data.permissions.length} permissions`);
      console.log(`   Total: ${response.data.data.pagination.total}`);
    } catch (error: any) {
      console.error('❌ Get permissions failed:', error.response?.data || error.message);
      throw error;
    }
  }

  private async testGetPermissionById() {
    console.log('📝 Testing GET /permissions/:id - Get Permission by ID');
    try {
      const response = await this.api.get(`/permissions/${this.testPermissionId}`);
      console.log('✅ Retrieved permission:', response.data.data.permission.name);
    } catch (error: any) {
      console.error('❌ Get permission by ID failed:', error.response?.data || error.message);
      throw error;
    }
  }

  private async testUpdatePermission() {
    console.log('📝 Testing PUT /permissions/:id - Update Permission');
    try {
      const response = await this.api.put(`/permissions/${this.testPermissionId}`, {
        description: 'Updated test permission description'
      });
      
      console.log('✅ Permission updated');
    } catch (error: any) {
      console.error('❌ Update permission failed:', error.response?.data || error.message);
      throw error;
    }
  }

  private async testCheckPermission() {
    console.log('📝 Testing GET /permissions/check - Check User Permission');
    try {
      const response = await this.api.get('/permissions/check', {
        params: {
          permission: 'permission:read'
        }
      });
      
      console.log('✅ Permission check result:', response.data.data.hasPermission);
      if (response.data.data.source) {
        console.log('   Source:', response.data.data.source);
      }
    } catch (error: any) {
      console.error('❌ Check permission failed:', error.response?.data || error.message);
      throw error;
    }
  }

  private async testCreateResource() {
    console.log('📝 Testing POST /resources - Create Resource');
    try {
      const response = await this.api.post('/resources', {
        name: 'test_api_resource',
        description: 'Test resource for API testing'
      });
      
      this.testResourceId = response.data.data.resource.id;
      console.log('✅ Resource created:', response.data.data.resource.name);
    } catch (error: any) {
      console.error('❌ Create resource failed:', error.response?.data || error.message);
      throw error;
    }
  }

  private async testGetResources() {
    console.log('📝 Testing GET /resources - List Resources');
    try {
      const response = await this.api.get('/resources', {
        params: {
          search: 'test',
          page: 1,
          limit: 10
        }
      });
      
      console.log(`✅ Retrieved ${response.data.data.resources.length} resources`);
    } catch (error: any) {
      console.error('❌ Get resources failed:', error.response?.data || error.message);
      throw error;
    }
  }

  private async testGetResourceById() {
    console.log('📝 Testing GET /resources/:id - Get Resource by ID');
    try {
      const response = await this.api.get(`/resources/${this.testResourceId}`);
      console.log('✅ Retrieved resource:', response.data.data.resource.name);
      console.log('   Permission count:', response.data.data.resource.permissionCount);
    } catch (error: any) {
      console.error('❌ Get resource by ID failed:', error.response?.data || error.message);
      throw error;
    }
  }

  private async testUpdateResource() {
    console.log('📝 Testing PUT /resources/:id - Update Resource');
    try {
      const response = await this.api.put(`/resources/${this.testResourceId}`, {
        description: 'Updated test resource description'
      });
      
      console.log('✅ Resource updated');
    } catch (error: any) {
      console.error('❌ Update resource failed:', error.response?.data || error.message);
      throw error;
    }
  }

  private async testGetRolePermissions() {
    console.log('📝 Testing GET /roles/:roleId/permissions - Get Role Permissions');
    try {
      // First get a role ID
      const rolesResponse = await this.api.get('/roles');
      if (rolesResponse.data.data.roles.length > 0) {
        const roleId = rolesResponse.data.data.roles[0].id;
        const response = await this.api.get(`/roles/${roleId}/permissions`);
        console.log(`✅ Retrieved ${response.data.data.permissions.length} permissions for role`);
      } else {
        console.log('⚠️  No roles found to test with');
      }
    } catch (error: any) {
      console.error('❌ Get role permissions failed:', error.response?.data || error.message);
      throw error;
    }
  }

  private async testUpdateRolePermissions() {
    console.log('📝 Testing PUT /roles/:roleId/permissions - Update Role Permissions');
    try {
      // First get a non-system role
      const rolesResponse = await this.api.get('/roles');
      const nonSystemRole = rolesResponse.data.data.roles.find((role: any) => !role.isSystem);
      
      if (nonSystemRole) {
        // Get some permission IDs
        const permsResponse = await this.api.get('/permissions', { params: { limit: 3 } });
        const permissionIds = permsResponse.data.data.permissions.map((p: any) => p.id);
        
        const response = await this.api.put(`/roles/${nonSystemRole.id}/permissions`, {
          permissionIds: permissionIds
        });
        
        console.log('✅ Role permissions updated');
      } else {
        console.log('⚠️  No non-system role found to test with');
      }
    } catch (error: any) {
      console.error('❌ Update role permissions failed:', error.response?.data || error.message);
      throw error;
    }
  }

  private async testDeletePermission() {
    console.log('📝 Testing DELETE /permissions/:id - Delete Permission');
    try {
      await this.api.delete(`/permissions/${this.testPermissionId}`);
      console.log('✅ Permission deleted');
    } catch (error: any) {
      console.error('❌ Delete permission failed:', error.response?.data || error.message);
      throw error;
    }
  }

  private async testDeleteResource() {
    console.log('📝 Testing DELETE /resources/:id - Delete Resource');
    try {
      await this.api.delete(`/resources/${this.testResourceId}`);
      console.log('✅ Resource deleted');
    } catch (error: any) {
      console.error('❌ Delete resource failed:', error.response?.data || error.message);
      throw error;
    }
  }
}

// Run the tests
const tester = new PermissionEndpointTester();
tester.runTests();