import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

interface LoginResponse {
  data: {
    data: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

async function testRoleEndpoints() {
  try {
    console.log('🚀 Testing Role Endpoints...\n');

    // 1. Login as superadmin
    console.log('1. Logging in as superadmin...');
    const loginResponse: LoginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'superadmin',
      password: 'Admin@123'
    });

    const { accessToken } = loginResponse.data.data;
    console.log('✅ Login successful\n');

    // Configure axios with auth header
    const authAxios = axios.create({
      baseURL: API_URL,
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    // 2. Get all roles
    console.log('2. Getting all roles...');
    const rolesResponse = await authAxios.get('/roles');
    console.log(`✅ Found ${rolesResponse.data.data.roles.length} roles`);
    console.log('Roles:', rolesResponse.data.data.roles.map((r: any) => r.name).join(', '));
    console.log('');

    // 3. Get role statistics
    console.log('3. Getting role statistics...');
    const statsResponse = await authAxios.get('/roles/statistics');
    console.log('✅ Role statistics:', statsResponse.data.data.statistics);
    console.log('');

    // 4. Create a new role
    console.log('4. Creating a new test role...');
    const newRoleResponse = await authAxios.post('/roles', {
      name: 'test-role',
      description: 'Test role created via API',
      permissionIds: []
    });
    const newRole = newRoleResponse.data.data.role;
    console.log(`✅ Created role: ${newRole.name} (ID: ${newRole.id})`);
    console.log('');

    // 5. Get role by ID
    console.log('5. Getting role by ID...');
    const roleByIdResponse = await authAxios.get(`/roles/${newRole.id}`);
    console.log(`✅ Retrieved role: ${roleByIdResponse.data.data.role.name}`);
    console.log('');

    // 6. Update role
    console.log('6. Updating role...');
    const updateResponse = await authAxios.put(`/roles/${newRole.id}`, {
      description: 'Updated test role description'
    });
    console.log(`✅ Updated role description: ${updateResponse.data.data.role.description}`);
    console.log('');

    // 7. Clone role
    console.log('7. Cloning role...');
    const cloneResponse = await authAxios.post(`/roles/${newRole.id}/clone`, {
      newRoleName: 'test-role-clone',
      description: 'Cloned test role',
      includePermissions: true
    });
    const clonedRole = cloneResponse.data.data.role;
    console.log(`✅ Cloned role: ${clonedRole.name} (ID: ${clonedRole.id})`);
    console.log('');

    // 8. Get role hierarchy
    console.log('8. Getting role hierarchy...');
    const hierarchyResponse = await authAxios.get('/roles/hierarchy');
    console.log(`✅ Role hierarchy contains ${hierarchyResponse.data.data.hierarchy.length} roles`);
    console.log('');

    // 9. Delete roles
    console.log('9. Deleting test roles...');
    const bulkDeleteResponse = await authAxios.post('/roles/bulk-delete', {
      roleIds: [newRole.id, clonedRole.id]
    });
    console.log(`✅ Bulk delete result: ${bulkDeleteResponse.data.message}`);
    console.log('');

    console.log('🎉 All role endpoint tests passed!');

  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the tests
testRoleEndpoints();