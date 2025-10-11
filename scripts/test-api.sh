#!/bin/bash

# API Testing Script for AlgoSpoon AI
# Usage: ./test-api.sh [endpoint] [token]

API_BASE="https://p62bbb3j0b.execute-api.us-east-2.amazonaws.com/dev"
ENDPOINT=${1:-"all"}
TOKEN=${2:-""}

echo "🧪 AlgoSpoon AI API Testing"
echo "=========================="
echo "Base URL: $API_BASE"
echo "Environment: dev"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth_header=$4
    local description=$5
    
    echo -e "${BLUE}Testing:${NC} $description"
    echo -e "${YELLOW}$method${NC} $endpoint"
    
    if [ -n "$data" ]; then
        if [ -n "$auth_header" ]; then
            response=$(curl -s -X "$method" "$API_BASE$endpoint" \
                -H "Content-Type: application/json" \
                -H "$auth_header" \
                -d "$data" \
                -w "HTTPSTATUS:%{http_code}")
        else
            response=$(curl -s -X "$method" "$API_BASE$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data" \
                -w "HTTPSTATUS:%{http_code}")
        fi
    else
        if [ -n "$auth_header" ]; then
            response=$(curl -s -X "$method" "$API_BASE$endpoint" \
                -H "$auth_header" \
                -w "HTTPSTATUS:%{http_code}")
        else
            response=$(curl -s -X "$method" "$API_BASE$endpoint" \
                -w "HTTPSTATUS:%{http_code}")
        fi
    fi
    
    http_code=$(echo $response | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    body=$(echo $response | sed 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ Success ($http_code)${NC}"
    elif [ "$http_code" -eq 401 ] || [ "$http_code" -eq 403 ]; then
        echo -e "${YELLOW}🔒 Auth Required ($http_code)${NC}"
    else
        echo -e "${RED}❌ Error ($http_code)${NC}"
    fi
    
    echo "Response: $body"
    echo ""
}

# Test data
REGISTER_DATA='{
    "userId": "test-user-'$(date +%s)'",
    "email": "test'$(date +%s)'@example.com",
    "fullName": "Test User",
    "preferences": {
        "dietaryRestrictions": ["vegetarian"],
        "allergies": ["nuts"],
        "cuisinePreferences": ["italian", "asian"],
        "cookingSkill": "intermediate",
        "targetCalories": 2000
    }
}'

RECIPE_DATA='{
    "userId": "test-user-123",
    "title": "Test Pasta Recipe",
    "description": "Simple pasta dish for testing",
    "ingredients": [
        {"name": "pasta", "quantity": "8 oz", "category": "grains"},
        {"name": "olive oil", "quantity": "2 tbsp", "category": "oils"}
    ],
    "instructions": ["Cook pasta", "Add olive oil"],
    "nutrition": {"calories": 450, "protein": 12},
    "tags": ["vegetarian", "quick"],
    "prepTime": 15,
    "cookTime": 20,
    "servings": 4
}'

AI_RECIPE_DATA='{
    "userId": "test-user-123",
    "prompt": "healthy dinner recipe with chicken and vegetables",
    "dietaryRestrictions": ["gluten-free"],
    "cuisineStyle": "mediterranean",
    "cookingTime": 30,
    "servings": 4
}'

MEAL_PLAN_DATA='{
    "userId": "test-user-123",
    "days": 7,
    "mealsPerDay": 3,
    "targetCalories": 2000,
    "dietaryRestrictions": ["vegetarian"],
    "cuisinePreferences": ["italian", "asian"]
}'

# Set up auth header if token provided
AUTH_HEADER=""
if [ -n "$TOKEN" ]; then
    AUTH_HEADER="Authorization: Bearer $TOKEN"
    echo -e "${GREEN}🔑 Using provided JWT token${NC}"
    echo ""
fi

case $ENDPOINT in
    "all"|"public")
        echo "=== PUBLIC ENDPOINTS ==="
        test_endpoint "GET" "/" "" "" "API Root (should require auth)"
        test_endpoint "POST" "/auth/register" "$REGISTER_DATA" "" "User Registration"
        echo ""
        
        if [ "$ENDPOINT" = "public" ]; then
            exit 0
        fi
        ;;
esac

case $ENDPOINT in
    "all"|"auth")
        echo "=== AUTHENTICATION ENDPOINTS ==="
        if [ -n "$TOKEN" ]; then
            test_endpoint "PUT" "/auth/profile" '{"userId":"test-user-123","fullName":"Updated Name"}' "$AUTH_HEADER" "Update Profile"
            test_endpoint "GET" "/auth/profile/test-user-123" "" "$AUTH_HEADER" "Get User Profile"
        else
            echo -e "${YELLOW}⚠️  Auth endpoints require JWT token. Provide token as second parameter.${NC}"
            echo "Example: ./test-api.sh auth eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        fi
        echo ""
        
        if [ "$ENDPOINT" = "auth" ]; then
            exit 0
        fi
        ;;
esac

case $ENDPOINT in
    "all"|"recipes")
        echo "=== RECIPE ENDPOINTS ==="
        if [ -n "$TOKEN" ]; then
            test_endpoint "POST" "/recipes" "$RECIPE_DATA" "$AUTH_HEADER" "Save Recipe"
            test_endpoint "GET" "/recipes/test-user-123" "" "$AUTH_HEADER" "Get User Recipes"
            test_endpoint "DELETE" "/recipes/test-user-123/recipe-123" "" "$AUTH_HEADER" "Delete Recipe"
        else
            echo -e "${YELLOW}⚠️  Recipe endpoints require JWT token${NC}"
        fi
        echo ""
        
        if [ "$ENDPOINT" = "recipes" ]; then
            exit 0
        fi
        ;;
esac

case $ENDPOINT in
    "all"|"ai")
        echo "=== AI-POWERED ENDPOINTS ==="
        if [ -n "$TOKEN" ]; then
            test_endpoint "POST" "/recipes/generate" "$AI_RECIPE_DATA" "$AUTH_HEADER" "Generate AI Recipe"
            test_endpoint "POST" "/plans/generate" "$MEAL_PLAN_DATA" "$AUTH_HEADER" "Generate Meal Plan"
            test_endpoint "GET" "/plans" "" "$AUTH_HEADER" "List Meal Plans"
            test_endpoint "GET" "/plans/plan-123" "" "$AUTH_HEADER" "Get Specific Meal Plan"
        else
            echo -e "${YELLOW}⚠️  AI endpoints require JWT token${NC}"
        fi
        echo ""
        ;;
esac

echo "=== USAGE ==="
echo "Test specific endpoint group:"
echo "  ./test-api.sh public              # Test public endpoints only"
echo "  ./test-api.sh auth [token]        # Test auth endpoints with JWT token"
echo "  ./test-api.sh recipes [token]     # Test recipe endpoints"
echo "  ./test-api.sh ai [token]          # Test AI endpoints"
echo "  ./test-api.sh all [token]         # Test all endpoints"
echo ""
echo "Get JWT token using AWS CLI:"
echo "  aws cognito-idp admin-initiate-auth \\"
echo "    --user-pool-id us-east-2_XfOcxI8ET \\"
echo "    --client-id 2b6vkdri0hp1nd1fer004k2hbl \\"
echo "    --auth-flow ADMIN_NO_SRP_AUTH \\"
echo "    --auth-parameters USERNAME=testuser,PASSWORD=yourpassword"