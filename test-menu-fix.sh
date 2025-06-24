#!/bin/bash

# Test menu endpoints to demonstrate the fix

echo "Testing Menu Endpoints Fix"
echo "=========================="
echo ""

# Start the server if not running
if ! curl -s http://localhost:3000/api/v1/health > /dev/null; then
    echo "Starting server..."
    npm run dev &
    sleep 5
fi

# Try both the old (wrong) and new (correct) endpoints
echo "1. Testing OLD endpoints (should fail with 404):"
echo "   GET /api/menus/tree"
curl -s -X GET http://localhost:3000/api/menus/tree | head -n 1
echo ""
echo "   GET /api/menus/user"
curl -s -X GET http://localhost:3000/api/menus/user | head -n 1
echo ""

echo "2. Testing CORRECT endpoints:"
echo "   GET /api/v1/menus (complete menu tree)"
curl -s -X GET http://localhost:3000/api/v1/menus | head -n 1
echo ""
echo "   GET /api/v1/menus/user-menu (user menu tree)"
curl -s -X GET http://localhost:3000/api/v1/menus/user-menu | head -n 1
echo ""

echo "Summary:"
echo "- Fixed test file: tests/integration/menus.test.ts"
echo "- Changed /menus/tree -> /menus"
echo "- Changed /menus/user -> /menus/user-menu"
echo "- Added missing menu:create and menu:delete permissions to seeders"