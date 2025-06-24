import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

async function testMenuAccess() {
  try {
    // Login as admin user
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login successful');
    console.log('User info:', loginResponse.data.data.user);
    
    // Test menu endpoints
    console.log('\n📋 Testing menu endpoints...');
    
    // Test 1: Get user menu tree
    try {
      console.log('\n1. Testing GET /menus/user-menu');
      const userMenuResponse = await axios.get(`${API_BASE_URL}/menus/user-menu`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ User menu tree accessible');
    } catch (error: any) {
      console.error('❌ User menu tree failed:', error.response?.status, error.response?.data);
    }
    
    // Test 2: Get complete menu tree
    try {
      console.log('\n2. Testing GET /menus');
      const completeMenuResponse = await axios.get(`${API_BASE_URL}/menus`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Complete menu tree accessible');
    } catch (error: any) {
      console.error('❌ Complete menu tree failed:', error.response?.status, error.response?.data);
    }
    
    // Test 3: Get menu statistics
    try {
      console.log('\n3. Testing GET /menus/statistics');
      const statsResponse = await axios.get(`${API_BASE_URL}/menus/statistics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Menu statistics accessible');
    } catch (error: any) {
      console.error('❌ Menu statistics failed:', error.response?.status, error.response?.data);
    }
    
    // Test 4: Get permission matrix
    try {
      console.log('\n4. Testing GET /menus/permissions/matrix');
      const matrixResponse = await axios.get(`${API_BASE_URL}/menus/permissions/matrix`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Permission matrix accessible');
    } catch (error: any) {
      console.error('❌ Permission matrix failed:', error.response?.status, error.response?.data);
    }
    
    // Check the JWT payload
    console.log('\n🔍 Checking JWT payload...');
    const tokenParts = token.split('.');
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    console.log('JWT Payload:', payload);
    
  } catch (error: any) {
    console.error('❌ Login failed:', error.response?.data || error.message);
  }
}

testMenuAccess().catch(console.error);