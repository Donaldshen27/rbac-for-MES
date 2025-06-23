#!/bin/bash

# Comprehensive API Testing Script for RBAC System
# This script tests all API endpoints with different user roles

BASE_URL="http://localhost:3000/api/v1"
ADMIN_TOKEN=""
MANAGER_TOKEN=""
VIEWER_TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print test results
print_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $1 -eq 0 ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "${GREEN}✓ $2${NC}"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "${RED}✗ $2${NC}"
    fi
}

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    local token=$5
    local expected_status=$6
    
    echo -e "\n${YELLOW}Testing: $description${NC}"
    
    local curl_cmd="curl -s -w \"%{http_code}\" -o /tmp/api_response.json"
    
    if [ ! -z "$token" ]; then
        curl_cmd="$curl_cmd -H \"Authorization: Bearer $token\""
    fi
    
    if [ "$method" != "GET" ] && [ "$method" != "DELETE" ]; then
        curl_cmd="$curl_cmd -H \"Content-Type: application/json\""
    fi
    
    if [ ! -z "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    curl_cmd="$curl_cmd -X $method $BASE_URL$endpoint"
    
    http_code=$(eval $curl_cmd)
    
    if [ "$expected_status" != "" ]; then
        if [ "$http_code" = "$expected_status" ]; then
            print_result 0 "$description (Expected: $expected_status, Got: $http_code)"
            if [ -s /tmp/api_response.json ]; then
                echo "Response: $(cat /tmp/api_response.json)"
            fi
            return 0
        else
            print_result 1 "$description (Expected: $expected_status, Got: $http_code)"
            if [ -s /tmp/api_response.json ]; then
                echo "Response: $(cat /tmp/api_response.json)"
            fi
            return 1
        fi
    else
        if [[ "$http_code" =~ ^2[0-9][0-9]$ ]]; then
            print_result 0 "$description (HTTP $http_code)"
            if [ -s /tmp/api_response.json ]; then
                echo "Response: $(cat /tmp/api_response.json)"
            fi
            return 0
        else
            print_result 1 "$description (HTTP $http_code)"
            if [ -s /tmp/api_response.json ]; then
                echo "Error: $(cat /tmp/api_response.json)"
            fi
            return 1
        fi
    fi
}

# Function to login and get token
login_user() {
    local username=$1
    local password=$2
    local role=$3
    
    echo -e "\n${BLUE}Logging in as $role ($username)...${NC}" >&2
    
    local response=$(curl -s -X POST $BASE_URL/auth/login \
        -H "Content-Type: application/json" \
        -d "{\"username\": \"$username\", \"password\": \"$password\"}")
    
    local token=$(echo $response | grep -o '"accessToken":"[^"]*' | grep -o '[^"]*$')
    
    if [ ! -z "$token" ]; then
        echo -e "${GREEN}Login successful for $role${NC}" >&2
        echo "$token"
    else
        echo -e "${RED}Login failed for $role${NC}" >&2
        echo "Response: $response" >&2
        echo ""
    fi
}

# Function to extract ID from response
extract_id() {
    cat /tmp/api_response.json | grep -o '"id":"[^"]*' | head -1 | grep -o '[^"]*$'
}

# Check if server is running
echo "Checking if server is running..."
if ! curl -s -f "$BASE_URL/health" > /dev/null; then
    echo -e "${RED}Server is not running at http://localhost:3000${NC}"
    echo "Please start the server with: npm run dev"
    exit 1
fi
echo -e "${GREEN}Server is running!${NC}"

# Setup test data
echo -e "\n${BLUE}=== Setting up test data ===${NC}"
echo "Running setup script..."
npx ts-node -r tsconfig-paths/register scripts/setup-test-data-v2.ts

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to setup test data${NC}"
    exit 1
fi

# Login as different users
echo -e "\n${BLUE}=== Getting authentication tokens ===${NC}"
ADMIN_TOKEN=$(login_user "admin" "admin123" "Administrator")
MANAGER_TOKEN=$(login_user "testmanager" "testmanager123" "Manager")
VIEWER_TOKEN=$(login_user "testviewer" "testviewer123" "Viewer")

# Test Health Endpoints (No Auth Required)
echo -e "\n${BLUE}=== Testing Health Endpoints (No Auth) ===${NC}"
test_endpoint "GET" "/health" "Health Check" "" "" "200"
test_endpoint "GET" "/version" "API Version" "" "" "200"

# Test Menu Endpoints
echo -e "\n${BLUE}=== Testing Menu Endpoints ===${NC}"

# Admin tests
echo -e "\n${YELLOW}--- Admin User Tests ---${NC}"
test_endpoint "GET" "/menus" "List All Menus (Admin)" "" "$ADMIN_TOKEN" "200"
test_endpoint "POST" "/menus" "Create Menu (Admin)" '{"name":"Test Menu","path":"/test","icon":"test","order":10,"isActive":true}' "$ADMIN_TOKEN" "201"
MENU_ID=$(extract_id)
test_endpoint "GET" "/menus/$MENU_ID" "Get Menu by ID (Admin)" "" "$ADMIN_TOKEN" "200"
test_endpoint "PUT" "/menus/$MENU_ID" "Update Menu (Admin)" '{"name":"Updated Test Menu","path":"/test-updated","icon":"test-new","order":10,"isActive":true}' "$ADMIN_TOKEN" "200"
test_endpoint "GET" "/menus/tree" "Get Menu Tree (Admin)" "" "$ADMIN_TOKEN" "200"
test_endpoint "GET" "/menus/user" "Get User Menu (Admin)" "" "$ADMIN_TOKEN" "200"

# Manager tests
echo -e "\n${YELLOW}--- Manager User Tests ---${NC}"
test_endpoint "GET" "/menus" "List All Menus (Manager)" "" "$MANAGER_TOKEN" "200"
test_endpoint "POST" "/menus" "Create Menu (Manager - Should Fail)" '{"name":"Manager Menu","path":"/manager","icon":"manager","order":20,"isActive":true}' "$MANAGER_TOKEN" "403"

# Viewer tests
echo -e "\n${YELLOW}--- Viewer User Tests ---${NC}"
test_endpoint "GET" "/menus" "List All Menus (Viewer)" "" "$VIEWER_TOKEN" "200"
test_endpoint "POST" "/menus" "Create Menu (Viewer - Should Fail)" '{"name":"Viewer Menu","path":"/viewer","icon":"viewer","order":30,"isActive":true}' "$VIEWER_TOKEN" "403"

# Test Permission Endpoints
echo -e "\n${BLUE}=== Testing Permission Endpoints ===${NC}"

# Admin tests
echo -e "\n${YELLOW}--- Admin User Tests ---${NC}"
test_endpoint "GET" "/permissions" "List Permissions (Admin)" "" "$ADMIN_TOKEN" "200"
test_endpoint "POST" "/permissions" "Create Permission (Admin)" '{"name":"test:read","description":"Test Read Permission","category":"Test","action":"read","resource":"test"}' "$ADMIN_TOKEN" "201"
PERM_ID=$(extract_id)
test_endpoint "GET" "/permissions/$PERM_ID" "Get Permission by ID (Admin)" "" "$ADMIN_TOKEN" "200"
test_endpoint "PUT" "/permissions/$PERM_ID" "Update Permission (Admin)" '{"name":"test:read","description":"Updated Test Permission","category":"Test"}' "$ADMIN_TOKEN" "200"
test_endpoint "GET" "/permissions/check?permission=users:read" "Check User Permission (Admin)" "" "$ADMIN_TOKEN" "200"

# Manager tests
echo -e "\n${YELLOW}--- Manager User Tests ---${NC}"
test_endpoint "GET" "/permissions" "List Permissions (Manager)" "" "$MANAGER_TOKEN" "200"
test_endpoint "POST" "/permissions" "Create Permission (Manager - Should Fail)" '{"name":"manager:test","description":"Manager Test","category":"Test","action":"test","resource":"manager"}' "$MANAGER_TOKEN" "403"

# Viewer tests
echo -e "\n${YELLOW}--- Viewer User Tests ---${NC}"
test_endpoint "GET" "/permissions" "List Permissions (Viewer)" "" "$VIEWER_TOKEN" "200"
test_endpoint "GET" "/permissions/check?permission=users:read" "Check User Permission (Viewer)" "" "$VIEWER_TOKEN" "200"

# Test Resource Endpoints
echo -e "\n${BLUE}=== Testing Resource Endpoints ===${NC}"

# Admin tests
echo -e "\n${YELLOW}--- Admin User Tests ---${NC}"
test_endpoint "GET" "/resources" "List Resources (Admin)" "" "$ADMIN_TOKEN" "200"
test_endpoint "POST" "/resources" "Create Resource (Admin)" '{"name":"Test Resource","type":"module","identifier":"test-resource","description":"Test Resource Description"}' "$ADMIN_TOKEN" "201"
RES_ID=$(extract_id)
test_endpoint "GET" "/resources/$RES_ID" "Get Resource by ID (Admin)" "" "$ADMIN_TOKEN" "200"
test_endpoint "PUT" "/resources/$RES_ID" "Update Resource (Admin)" '{"name":"Updated Test Resource","description":"Updated Description"}' "$ADMIN_TOKEN" "200"

# Manager tests
echo -e "\n${YELLOW}--- Manager User Tests ---${NC}"
test_endpoint "GET" "/resources" "List Resources (Manager - Should Fail)" "" "$MANAGER_TOKEN" "403"

# Viewer tests
echo -e "\n${YELLOW}--- Viewer User Tests ---${NC}"
test_endpoint "GET" "/resources" "List Resources (Viewer)" "" "$VIEWER_TOKEN" "200"

# Test Role Endpoints
echo -e "\n${BLUE}=== Testing Role Endpoints ===${NC}"

# Admin tests
echo -e "\n${YELLOW}--- Admin User Tests ---${NC}"
test_endpoint "GET" "/roles" "List Roles (Admin)" "" "$ADMIN_TOKEN" "200"
test_endpoint "POST" "/roles" "Create Role (Admin)" '{"name":"Test Role","description":"Test Role Description","isActive":true}' "$ADMIN_TOKEN" "201"
ROLE_ID=$(extract_id)
test_endpoint "GET" "/roles/$ROLE_ID" "Get Role by ID (Admin)" "" "$ADMIN_TOKEN" "200"
test_endpoint "PUT" "/roles/$ROLE_ID" "Update Role (Admin)" '{"name":"Updated Test Role","description":"Updated Description","isActive":true}' "$ADMIN_TOKEN" "200"
test_endpoint "GET" "/roles/$ROLE_ID/permissions" "Get Role Permissions (Admin)" "" "$ADMIN_TOKEN" "200"
test_endpoint "PUT" "/roles/$ROLE_ID/permissions" "Update Role Permissions (Admin)" '{"permissionIds":["'$PERM_ID'"]}' "$ADMIN_TOKEN" "200"
test_endpoint "GET" "/roles/$ROLE_ID/users" "Get Role Users (Admin)" "" "$ADMIN_TOKEN" "200"
test_endpoint "POST" "/roles/$ROLE_ID/clone" "Clone Role (Admin)" '{"name":"Cloned Test Role","description":"Cloned from Test Role"}' "$ADMIN_TOKEN" "201"
CLONED_ROLE_ID=$(extract_id)
test_endpoint "GET" "/roles/hierarchy" "Get Role Hierarchy (Admin)" "" "$ADMIN_TOKEN" "200"
test_endpoint "GET" "/roles/statistics" "Get Role Statistics (Admin)" "" "$ADMIN_TOKEN" "200"

# Manager tests
echo -e "\n${YELLOW}--- Manager User Tests ---${NC}"
test_endpoint "GET" "/roles" "List Roles (Manager)" "" "$MANAGER_TOKEN" "200"
test_endpoint "POST" "/roles" "Create Role (Manager)" '{"name":"Manager Test Role","description":"Created by Manager","isActive":true}' "$MANAGER_TOKEN" "201"
MANAGER_ROLE_ID=$(extract_id)
test_endpoint "GET" "/roles/$MANAGER_ROLE_ID" "Get Role by ID (Manager)" "" "$MANAGER_TOKEN" "200"
test_endpoint "PUT" "/roles/$MANAGER_ROLE_ID" "Update Role (Manager)" '{"name":"Updated Manager Role","description":"Updated by Manager","isActive":true}' "$MANAGER_TOKEN" "200"

# Viewer tests
echo -e "\n${YELLOW}--- Viewer User Tests ---${NC}"
test_endpoint "GET" "/roles" "List Roles (Viewer)" "" "$VIEWER_TOKEN" "200"
test_endpoint "POST" "/roles" "Create Role (Viewer - Should Fail)" '{"name":"Viewer Role","description":"Viewer Test","isActive":true}' "$VIEWER_TOKEN" "403"

# Test User Endpoints (if implemented)
echo -e "\n${BLUE}=== Testing User Endpoints ===${NC}"

# Admin tests
echo -e "\n${YELLOW}--- Admin User Tests ---${NC}"
test_endpoint "GET" "/users" "List Users (Admin)" "" "$ADMIN_TOKEN"
test_endpoint "POST" "/users" "Create User (Admin)" '{"username":"newuser","email":"newuser@example.com","password":"newuser123","firstName":"New","lastName":"User","isActive":true}' "$ADMIN_TOKEN"
if [ -s /tmp/api_response.json ]; then
    USER_ID=$(extract_id)
    if [ ! -z "$USER_ID" ]; then
        test_endpoint "GET" "/users/$USER_ID" "Get User by ID (Admin)" "" "$ADMIN_TOKEN"
        test_endpoint "PUT" "/users/$USER_ID" "Update User (Admin)" '{"firstName":"Updated","lastName":"User"}' "$ADMIN_TOKEN"
        test_endpoint "PUT" "/users/$USER_ID/roles" "Update User Roles (Admin)" '{"roleIds":["'$ROLE_ID'"]}' "$ADMIN_TOKEN"
    fi
fi

# Manager tests
echo -e "\n${YELLOW}--- Manager User Tests ---${NC}"
test_endpoint "GET" "/users" "List Users (Manager)" "" "$MANAGER_TOKEN"
test_endpoint "POST" "/users" "Create User (Manager)" '{"username":"manageruser","email":"manageruser@example.com","password":"manageruser123","firstName":"Manager","lastName":"Created","isActive":true}' "$MANAGER_TOKEN"

# Viewer tests
echo -e "\n${YELLOW}--- Viewer User Tests ---${NC}"
test_endpoint "GET" "/users" "List Users (Viewer)" "" "$VIEWER_TOKEN"
test_endpoint "POST" "/users" "Create User (Viewer - Should Fail)" '{"username":"vieweruser","email":"vieweruser@example.com","password":"vieweruser123","firstName":"Viewer","lastName":"User","isActive":true}' "$VIEWER_TOKEN" "403"

# Test Complex Scenarios
echo -e "\n${BLUE}=== Testing Complex Scenarios ===${NC}"

# Test menu permissions
echo -e "\n${YELLOW}--- Menu Permission Tests ---${NC}"
test_endpoint "GET" "/menus/$MENU_ID/permissions" "Get Menu Permissions (Admin)" "" "$ADMIN_TOKEN" "200"
test_endpoint "PUT" "/menus/$MENU_ID/permissions" "Update Menu Permissions (Admin)" '{"permissionIds":["'$PERM_ID'"]}' "$ADMIN_TOKEN" "200"
test_endpoint "PUT" "/menus/$MENU_ID/move" "Move Menu (Admin)" '{"parentId":null,"order":5}' "$ADMIN_TOKEN" "200"

# Test bulk operations
echo -e "\n${YELLOW}--- Bulk Operation Tests ---${NC}"
test_endpoint "PUT" "/menus/reorder" "Reorder Menus (Admin)" '{"orders":[{"id":"'$MENU_ID'","order":1}]}' "$ADMIN_TOKEN" "200"
test_endpoint "POST" "/roles/bulk-delete" "Bulk Delete Roles (Admin)" '{"roleIds":["'$CLONED_ROLE_ID'"]}' "$ADMIN_TOKEN" "200"

# Test pagination and filtering
echo -e "\n${YELLOW}--- Pagination and Filtering Tests ---${NC}"
test_endpoint "GET" "/roles?page=1&limit=5" "List Roles with Pagination (Admin)" "" "$ADMIN_TOKEN" "200"
test_endpoint "GET" "/permissions?search=users" "Search Permissions (Admin)" "" "$ADMIN_TOKEN" "200"
test_endpoint "GET" "/menus?isActive=true" "Filter Active Menus (Admin)" "" "$ADMIN_TOKEN" "200"

# Test validation errors
echo -e "\n${YELLOW}--- Validation Error Tests ---${NC}"
test_endpoint "POST" "/roles" "Create Role - Missing Name (Should Fail)" '{"description":"No name provided"}' "$ADMIN_TOKEN" "400"
test_endpoint "POST" "/permissions" "Create Permission - Invalid Format (Should Fail)" '{"name":"invalid-format","description":"Wrong format"}' "$ADMIN_TOKEN" "400"
test_endpoint "POST" "/users" "Create User - Invalid Email (Should Fail)" '{"username":"baduser","email":"not-an-email","password":"test123"}' "$ADMIN_TOKEN" "400"

# Test authentication errors
echo -e "\n${YELLOW}--- Authentication Error Tests ---${NC}"
test_endpoint "GET" "/roles" "Access without token (Should Fail)" "" "" "401"
test_endpoint "GET" "/roles" "Access with invalid token (Should Fail)" "" "invalid-token-here" "401"

# Cleanup - Delete test data
echo -e "\n${BLUE}=== Cleanup Test Data ===${NC}"
if [ ! -z "$MENU_ID" ]; then
    test_endpoint "DELETE" "/menus/$MENU_ID" "Delete Test Menu (Admin)" "" "$ADMIN_TOKEN"
fi
if [ ! -z "$PERM_ID" ]; then
    test_endpoint "DELETE" "/permissions/$PERM_ID" "Delete Test Permission (Admin)" "" "$ADMIN_TOKEN"
fi
if [ ! -z "$RES_ID" ]; then
    test_endpoint "DELETE" "/resources/$RES_ID" "Delete Test Resource (Admin)" "" "$ADMIN_TOKEN"
fi
if [ ! -z "$ROLE_ID" ]; then
    test_endpoint "DELETE" "/roles/$ROLE_ID" "Delete Test Role (Admin)" "" "$ADMIN_TOKEN"
fi
if [ ! -z "$MANAGER_ROLE_ID" ]; then
    test_endpoint "DELETE" "/roles/$MANAGER_ROLE_ID" "Delete Manager Test Role (Admin)" "" "$ADMIN_TOKEN"
fi

# Summary
echo -e "\n${BLUE}=== Test Summary ===${NC}"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed! 🎉${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed. Please check the output above.${NC}"
    exit 1
fi