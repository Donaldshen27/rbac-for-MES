import axios, { AxiosInstance } from 'axios';

// Test configuration
const API_BASE_URL = 'http://localhost:3000/api';
let apiClient: AxiosInstance;
let authToken: string;

// Test data
const testUser = {
  email: 'admin@example.com',
  password: 'Admin123!'
};

const testRole = {
  name: 'Menu Test Role',
  description: 'Role for testing menu permissions'
};

const testMenuPermissions = [
  {
    menuId: 'M1',
    canView: true,
    canEdit: true,
    canDelete: false,
    canExport: false
  },
  {
    menuId: 'M2',
    canView: true,
    canEdit: false,
    canDelete: false,
    canExport: true
  }
];

// Initialize axios instance
function initializeApiClient() {
  apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Add auth token to all requests
  apiClient.interceptors.request.use((config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  });

  // Log errors
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  );
}

// Test functions
async function login() {
  console.log('🔐 Logging in...');
  const response = await apiClient.post('/auth/login', testUser);
  authToken = response.data.data.tokens.accessToken;
  console.log('✅ Login successful');
  return response.data;
}

async function testGetUserMenuTree() {
  console.log('\n📋 Testing GET /menus/user-menu');
  try {
    const response = await apiClient.get('/menus/user-menu');
    console.log('✅ User menu tree retrieved:', {
      totalMenus: response.data.data.totalCount,
      activeMenus: response.data.data.activeCount,
      topLevelMenus: response.data.data.menus.length
    });
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to get user menu tree:', error.response?.data);
    throw error;
  }
}

async function testGetCompleteMenuTree() {
  console.log('\n📋 Testing GET /menus (admin)');
  try {
    const response = await apiClient.get('/menus');
    console.log('✅ Complete menu tree retrieved:', {
      menuCount: response.data.data.menus.length
    });
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to get complete menu tree:', error.response?.data);
    throw error;
  }
}

async function testGetMenuPermissions(menuId: string) {
  console.log(`\n📋 Testing GET /menus/${menuId}/permissions`);
  try {
    const response = await apiClient.get(`/menus/${menuId}/permissions`);
    console.log('✅ Menu permissions retrieved:', {
      permissionCount: response.data.data.permissions.length
    });
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to get menu permissions:', error.response?.data);
    throw error;
  }
}

async function createTestRole() {
  console.log('\n👤 Creating test role...');
  try {
    const response = await apiClient.post('/roles', testRole);
    console.log('✅ Test role created:', response.data.data.role.id);
    return response.data.data.role;
  } catch (error: any) {
    console.error('❌ Failed to create test role:', error.response?.data);
    throw error;
  }
}

async function testUpdateRoleMenuPermissions(roleId: string) {
  console.log(`\n🔧 Testing PUT /roles/${roleId}/menu-permissions`);
  try {
    const response = await apiClient.put(`/roles/${roleId}/menu-permissions`, {
      permissions: testMenuPermissions
    });
    console.log('✅ Menu permissions updated:', response.data.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to update menu permissions:', error.response?.data);
    throw error;
  }
}

async function testBatchUpdateMenuPermissions(roleId: string) {
  console.log('\n🔧 Testing POST /menus/permissions/batch');
  try {
    const response = await apiClient.post('/menus/permissions/batch', {
      roleId,
      permissions: [
        {
          menuId: 'M3',
          canView: true,
          canEdit: true
        }
      ],
      applyToChildren: true
    });
    console.log('✅ Batch update completed:', response.data.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to batch update permissions:', error.response?.data);
    throw error;
  }
}

async function testCheckMenuAccess(menuId: string) {
  console.log(`\n🔍 Testing POST /menus/check-access for menu ${menuId}`);
  try {
    const response = await apiClient.post('/menus/check-access', {
      menuId,
      permission: 'view'
    });
    console.log('✅ Access check result:', response.data.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to check menu access:', error.response?.data);
    throw error;
  }
}

async function testGetMenuPermissionMatrix() {
  console.log('\n📊 Testing GET /menus/permissions/matrix');
  try {
    const response = await apiClient.get('/menus/permissions/matrix');
    console.log('✅ Permission matrix retrieved:', {
      roleCount: response.data.data.matrix.length
    });
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to get permission matrix:', error.response?.data);
    throw error;
  }
}

async function testGetMenuStatistics() {
  console.log('\n📈 Testing GET /menus/statistics');
  try {
    const response = await apiClient.get('/menus/statistics');
    console.log('✅ Menu statistics:', response.data.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to get menu statistics:', error.response?.data);
    throw error;
  }
}

async function testRemoveAllRoleMenuPermissions(roleId: string) {
  console.log(`\n🗑️ Testing DELETE /roles/${roleId}/menu-permissions`);
  try {
    const response = await apiClient.delete(`/roles/${roleId}/menu-permissions`);
    console.log('✅ All menu permissions removed');
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to remove menu permissions:', error.response?.data);
    throw error;
  }
}

async function deleteTestRole(roleId: string) {
  console.log('\n🗑️ Cleaning up test role...');
  try {
    await apiClient.delete(`/roles/${roleId}`);
    console.log('✅ Test role deleted');
  } catch (error: any) {
    console.error('❌ Failed to delete test role:', error.response?.data);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Menu Permission API Tests\n');
  console.log('================================\n');

  initializeApiClient();

  let testRoleId: string | null = null;

  try {
    // Login
    await login();

    // Test user menu tree
    await testGetUserMenuTree();

    // Test complete menu tree
    await testGetCompleteMenuTree();

    // Test menu permissions for a specific menu
    await testGetMenuPermissions('M1');

    // Create test role
    const role = await createTestRole();
    testRoleId = role.id;

    // Test updating role menu permissions
    await testUpdateRoleMenuPermissions(testRoleId);

    // Test batch update
    await testBatchUpdateMenuPermissions(testRoleId);

    // Test menu access check
    await testCheckMenuAccess('M1');
    await testCheckMenuAccess('M2');

    // Test permission matrix
    await testGetMenuPermissionMatrix();

    // Test menu statistics
    await testGetMenuStatistics();

    // Test removing all permissions
    await testRemoveAllRoleMenuPermissions(testRoleId);

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test suite failed');
    process.exit(1);
  } finally {
    // Cleanup
    if (testRoleId) {
      await deleteTestRole(testRoleId);
    }
  }
}

// Run tests
runTests().catch(console.error);