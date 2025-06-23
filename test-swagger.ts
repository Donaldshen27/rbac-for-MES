import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

async function testSwaggerEndpoints() {
  console.log('🧪 Testing Swagger Documentation Setup...\n');

  try {
    // Test 1: Check if Swagger UI is accessible
    console.log('1️⃣ Testing Swagger UI endpoint...');
    const swaggerUIResponse = await axios.get(`${API_BASE_URL}/api-docs`, {
      headers: { 'Accept': 'text/html' }
    });
    console.log('✅ Swagger UI is accessible');
    console.log(`   Status: ${swaggerUIResponse.status}`);
    console.log(`   Content-Type: ${swaggerUIResponse.headers['content-type']}`);

    // Test 2: Check if Swagger JSON is accessible
    console.log('\n2️⃣ Testing Swagger JSON endpoint...');
    const swaggerJSONResponse = await axios.get(`${API_BASE_URL}/api-docs/swagger.json`);
    const swaggerSpec = swaggerJSONResponse.data;
    console.log('✅ Swagger JSON is accessible');
    console.log(`   OpenAPI Version: ${swaggerSpec.openapi}`);
    console.log(`   API Title: ${swaggerSpec.info.title}`);
    console.log(`   API Version: ${swaggerSpec.info.version}`);

    // Test 3: Verify API endpoints are documented
    console.log('\n3️⃣ Checking documented endpoints...');
    const paths = Object.keys(swaggerSpec.paths);
    console.log(`✅ Found ${paths.length} documented endpoints`);
    
    // Group endpoints by tag
    const endpointsByTag: Record<string, string[]> = {};
    
    for (const path of paths) {
      const methods = Object.keys(swaggerSpec.paths[path]);
      for (const method of methods) {
        const operation = swaggerSpec.paths[path][method];
        if (operation.tags) {
          for (const tag of operation.tags) {
            if (!endpointsByTag[tag]) {
              endpointsByTag[tag] = [];
            }
            endpointsByTag[tag].push(`${method.toUpperCase()} ${path}`);
          }
        }
      }
    }

    console.log('\n📋 Endpoints by category:');
    for (const [tag, endpoints] of Object.entries(endpointsByTag)) {
      console.log(`\n   ${tag} (${endpoints.length} endpoints):`);
      endpoints.slice(0, 3).forEach(endpoint => {
        console.log(`   - ${endpoint}`);
      });
      if (endpoints.length > 3) {
        console.log(`   ... and ${endpoints.length - 3} more`);
      }
    }

    // Test 4: Verify security schemes
    console.log('\n4️⃣ Checking security configuration...');
    if (swaggerSpec.components && swaggerSpec.components.securitySchemes) {
      const schemes = Object.keys(swaggerSpec.components.securitySchemes);
      console.log(`✅ Found ${schemes.length} security scheme(s):`);
      schemes.forEach(scheme => {
        const config = swaggerSpec.components.securitySchemes[scheme];
        console.log(`   - ${scheme}: ${config.type} (${config.scheme || 'custom'})`);
      });
    }

    // Test 5: Verify schemas
    console.log('\n5️⃣ Checking data schemas...');
    if (swaggerSpec.components && swaggerSpec.components.schemas) {
      const schemas = Object.keys(swaggerSpec.components.schemas);
      console.log(`✅ Found ${schemas.length} data schemas`);
      console.log('   Core schemas:', schemas.filter(s => 
        ['User', 'Role', 'Permission', 'Menu', 'Resource'].includes(s)
      ).join(', '));
    }

    // Test 6: Check servers configuration
    console.log('\n6️⃣ Checking server configuration...');
    if (swaggerSpec.servers && swaggerSpec.servers.length > 0) {
      console.log(`✅ Found ${swaggerSpec.servers.length} server configuration(s):`);
      swaggerSpec.servers.forEach((server: any) => {
        console.log(`   - ${server.description}: ${server.url}`);
      });
    }

    console.log('\n✅ All Swagger tests passed!');
    console.log(`\n📚 Access the interactive API documentation at: ${API_BASE_URL}/api-docs`);
    console.log('💡 Use the "Authorize" button to add your JWT token for testing authenticated endpoints');

  } catch (error: any) {
    console.error('\n❌ Swagger test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    console.error('\n💡 Make sure the server is running with: npm run dev');
    process.exit(1);
  }
}

// Run the tests
testSwaggerEndpoints();