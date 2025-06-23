#!/bin/bash

# API Testing Script for RBAC System
# This script tests all API endpoints

BASE_URL="http://localhost:3000/api/v1"
JWT_TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    local auth=$5
    
    echo -e "\n${YELLOW}Testing: $description${NC}"
    
    if [ "$auth" = "true" ] && [ -z "$JWT_TOKEN" ]; then
        echo -e "${RED}No JWT token available. Skipping authenticated endpoints.${NC}"
        return 1
    fi
    
    local curl_cmd="curl -s -w \"%{http_code}\" -o /tmp/api_response.json"
    
    if [ "$auth" = "true" ]; then
        curl_cmd="$curl_cmd -H \"Authorization: Bearer $JWT_TOKEN\""
    fi
    
    if [ "$method" != "GET" ] && [ "$method" != "DELETE" ]; then
        curl_cmd="$curl_cmd -H \"Content-Type: application/json\""
    fi
    
    if [ ! -z "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    curl_cmd="$curl_cmd -X $method $BASE_URL$endpoint"
    
    http_code=$(eval $curl_cmd)
    
    if [[ "$http_code" =~ ^2[0-9][0-9]$ ]]; then
        print_result 0 "$description (HTTP $http_code)"
        if [ -s /tmp/api_response.json ]; then
            echo "Response: $(cat /tmp/api_response.json)"
        fi
    else
        print_result 1 "$description (HTTP $http_code)"
        if [ -s /tmp/api_response.json ]; then
            echo "Error: $(cat /tmp/api_response.json | jq -c '.' 2>/dev/null || cat /tmp/api_response.json)"
        fi
    fi
}

# Check if server is running
echo "Checking if server is running..."
if ! curl -s -f "http://localhost:3000/api/v1/health" > /dev/null; then
    echo -e "${RED}Server is not running at http://localhost:3000${NC}"
    echo "Please start the server with: npm run dev"
    exit 1
fi
echo -e "${GREEN}Server is running!${NC}"

# Test Health Endpoints
echo -e "\n${YELLOW}=== Testing Health Endpoints ===${NC}"
test_endpoint "GET" "/health" "Health Check" "" "false"
test_endpoint "GET" "/version" "API Version" "" "false"

# Login to get JWT token
echo -e "\n${YELLOW}=== Getting JWT Token ===${NC}"
echo "Attempting login with admin credentials..."

login_response=$(curl -s -X POST $BASE_URL/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username": "admin", "password": "admin123"}')

JWT_TOKEN=$(echo $login_response | grep -o '"accessToken":"[^"]*' | grep -o '[^"]*$')

if [ "$JWT_TOKEN" != "null" ] && [ ! -z "$JWT_TOKEN" ]; then
    echo -e "${GREEN}Login successful! Token obtained.${NC}"
else
    echo -e "${RED}Login failed! Cannot proceed with authenticated endpoints.${NC}"
    echo "Response: $login_response"
    exit 1
fi

# Test Menu Endpoints
echo -e "\n${YELLOW}=== Testing Menu Endpoints ===${NC}"
test_endpoint "GET" "/menus" "List All Menus" "" "true"
test_endpoint "POST" "/menus" "Create Menu" '{"name":"Test Menu","path":"/test","icon":"test","order":1,"parentId":null,"isActive":true}' "true"
test_endpoint "GET" "/menus/1" "Get Menu by ID" "" "true"
test_endpoint "PUT" "/menus/1" "Update Menu" '{"name":"Updated Test Menu","path":"/test","icon":"test-new","order":1,"isActive":true}' "true"
test_endpoint "GET" "/menus/1/permissions" "Get Menu Permissions" "" "true"
test_endpoint "PUT" "/menus/1/permissions" "Update Menu Permissions" '{"permissionIds":[1,2]}' "true"
test_endpoint "PUT" "/menus/1/move" "Move Menu" '{"parentId":null,"order":2}' "true"
test_endpoint "PUT" "/menus/reorder" "Reorder Menus" '{"orders":[{"id":1,"order":1}]}' "true"
test_endpoint "GET" "/menus/tree" "Get Menu Tree" "" "true"
test_endpoint "GET" "/menus/user" "Get User Menu" "" "true"

# Test Permission Endpoints
echo -e "\n${YELLOW}=== Testing Permission Endpoints ===${NC}"
test_endpoint "GET" "/permissions" "List Permissions" "" "true"
test_endpoint "POST" "/permissions" "Create Permission" '{"name":"test.permission","description":"Test Permission","category":"Test","action":"read","resource":"test"}' "true"
test_endpoint "GET" "/permissions/1" "Get Permission by ID" "" "true"
test_endpoint "PUT" "/permissions/1" "Update Permission" '{"name":"test.permission","description":"Updated Test Permission","category":"Test"}' "true"
test_endpoint "GET" "/permissions/check?permission=test.permission" "Check User Permission" "" "true"

# Test Resource Endpoints
echo -e "\n${YELLOW}=== Testing Resource Endpoints ===${NC}"
test_endpoint "GET" "/resources" "List Resources" "" "true"
test_endpoint "POST" "/resources" "Create Resource" '{"name":"Test Resource","type":"module","identifier":"test-resource","description":"Test Resource Description"}' "true"
test_endpoint "GET" "/resources/1" "Get Resource by ID" "" "true"
test_endpoint "PUT" "/resources/1" "Update Resource" '{"name":"Updated Test Resource","description":"Updated Description"}' "true"

# Test Role Endpoints
echo -e "\n${YELLOW}=== Testing Role Endpoints ===${NC}"
test_endpoint "GET" "/roles" "List Roles" "" "true"
test_endpoint "POST" "/roles" "Create Role" '{"name":"Test Role","description":"Test Role Description","isActive":true}' "true"
test_endpoint "GET" "/roles/1" "Get Role by ID" "" "true"
test_endpoint "PUT" "/roles/1" "Update Role" '{"name":"Updated Test Role","description":"Updated Description","isActive":true}' "true"
test_endpoint "GET" "/roles/1/permissions" "Get Role Permissions" "" "true"
test_endpoint "PUT" "/roles/1/permissions" "Update Role Permissions" '{"permissionIds":[1,2,3]}' "true"
test_endpoint "GET" "/roles/1/users" "Get Role Users" "" "true"
test_endpoint "POST" "/roles/1/clone" "Clone Role" '{"name":"Cloned Test Role","description":"Cloned from Test Role"}' "true"
test_endpoint "GET" "/roles/hierarchy" "Get Role Hierarchy" "" "true"
test_endpoint "GET" "/roles/statistics" "Get Role Statistics" "" "true"

# Cleanup - Delete test data (optional)
echo -e "\n${YELLOW}=== Cleanup Test Data ===${NC}"
echo "Skipping cleanup to preserve test data. Uncomment lines below to enable cleanup."
# test_endpoint "DELETE" "/menus/1" "Delete Test Menu" "" "true"
# test_endpoint "DELETE" "/permissions/1" "Delete Test Permission" "" "true"
# test_endpoint "DELETE" "/resources/1" "Delete Test Resource" "" "true"
# test_endpoint "DELETE" "/roles/1" "Delete Test Role" "" "true"
# test_endpoint "POST" "/roles/bulk-delete" "Bulk Delete Roles" '{"roleIds":[2,3]}' "true"

echo -e "\n${GREEN}API testing completed!${NC}"
echo -e "Check the responses above for any failures."