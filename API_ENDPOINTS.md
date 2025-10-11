# AlgoSpoon AI API Documentation

## Base URL
```
https://p62bbb3j0b.execute-api.us-east-2.amazonaws.com/dev/
```

## Authentication
Most endpoints require AWS Cognito JWT token in the Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

## Endpoints

### 🔐 Authentication Endpoints

#### 1. Register User
**POST** `/auth/register`
- **Access**: Public (no auth required)
- **Description**: Create a new user account with dietary preferences
- **Request Body**:
```json
{
  "userId": "unique-user-id",
  "email": "user@example.com", 
  "fullName": "John Doe",
  "preferences": {
    "dietaryRestrictions": ["vegetarian", "gluten-free"],
    "allergies": ["nuts", "shellfish"],
    "cuisinePreferences": ["italian", "mexican", "asian"],
    "cookingSkill": "intermediate",
    "targetCalories": 2000,
    "mealsPerDay": 3
  }
}
```
- **Response**: 
```json
{
  "success": true,
  "userId": "unique-user-id",
  "message": "User registered successfully"
}
```

#### 2. Update User Profile  
**PUT** `/auth/profile`
- **Access**: Authenticated
- **Description**: Update user profile and preferences
- **Request Body**:
```json
{
  "userId": "unique-user-id",
  "fullName": "John Updated",
  "preferences": {
    "dietaryRestrictions": ["vegan"],
    "targetCalories": 2200
  }
}
```

#### 3. Get User Profile
**GET** `/auth/profile/{userId}`
- **Access**: Authenticated  
- **Description**: Retrieve user profile and preferences
- **Response**:
```json
{
  "userId": "unique-user-id",
  "email": "user@example.com",
  "fullName": "John Doe",
  "preferences": { ... },
  "createdAt": "2025-10-11T13:30:00Z",
  "updatedAt": "2025-10-11T13:35:00Z"
}
```

### 🍽️ Recipe Endpoints

#### 4. Save Recipe
**POST** `/recipes`
- **Access**: Authenticated
- **Description**: Save a recipe to user's collection
- **Request Body**:
```json
{
  "userId": "unique-user-id",
  "title": "Pasta Primavera",
  "description": "Fresh vegetable pasta dish",
  "ingredients": [
    {
      "name": "pasta",
      "quantity": "8 oz",
      "category": "grains"
    },
    {
      "name": "bell peppers", 
      "quantity": "2 cups",
      "category": "vegetables"
    }
  ],
  "instructions": [
    "Cook pasta according to package directions",
    "Sauté vegetables until tender"
  ],
  "nutrition": {
    "calories": 450,
    "protein": 12,
    "carbs": 65,
    "fat": 8,
    "fiber": 6
  },
  "tags": ["vegetarian", "quick", "healthy"],
  "prepTime": 15,
  "cookTime": 20,
  "servings": 4,
  "difficulty": "easy"
}
```

#### 5. Get User Recipes
**GET** `/recipes/{userId}`
- **Access**: Authenticated
- **Description**: Get all recipes saved by user
- **Query Parameters**: 
  - `limit` (optional): Number of recipes to return
  - `tag` (optional): Filter by tag
- **Response**:
```json
{
  "recipes": [
    {
      "recipeId": "recipe-uuid",
      "userId": "unique-user-id", 
      "title": "Pasta Primavera",
      "description": "Fresh vegetable pasta dish",
      "ingredients": [...],
      "instructions": [...],
      "nutrition": {...},
      "tags": ["vegetarian", "quick"],
      "createdAt": "2025-10-11T13:30:00Z"
    }
  ],
  "count": 1
}
```

#### 6. Delete Recipe
**DELETE** `/recipes/{userId}/{recipeId}`
- **Access**: Authenticated
- **Description**: Delete a specific recipe
- **Response**:
```json
{
  "success": true,
  "message": "Recipe deleted successfully"
}
```

### 🤖 AI-Powered Endpoints (AWS Bedrock)

#### 7. Generate Recipe with AI
**POST** `/recipes/generate`
- **Access**: Authenticated
- **Description**: Generate custom recipe using AWS Bedrock AI
- **Request Body**:
```json
{
  "userId": "unique-user-id",
  "prompt": "healthy dinner recipe with chicken and vegetables",
  "dietaryRestrictions": ["gluten-free"],
  "cuisineStyle": "mediterranean",
  "cookingTime": 30,
  "servings": 4,
  "difficulty": "intermediate"
}
```
- **Response**:
```json
{
  "recipeId": "ai-generated-uuid",
  "title": "Mediterranean Herb-Crusted Chicken",
  "description": "Gluten-free chicken with roasted vegetables",
  "ingredients": [...],
  "instructions": [...],
  "nutrition": {...},
  "aiGenerated": true,
  "generatedAt": "2025-10-11T13:30:00Z"
}
```

#### 8. Generate Meal Plan
**POST** `/plans/generate`
- **Access**: Authenticated
- **Description**: Create AI-powered weekly meal plan
- **Request Body**:
```json
{
  "userId": "unique-user-id",
  "days": 7,
  "mealsPerDay": 3,
  "targetCalories": 2000,
  "dietaryRestrictions": ["vegetarian"],
  "cuisinePreferences": ["italian", "asian"],
  "budgetLevel": "moderate"
}
```
- **Response**:
```json
{
  "planId": "meal-plan-uuid",
  "userId": "unique-user-id",
  "status": "generating",
  "message": "Meal plan generation started. Check status with GET /plans/{planId}"
}
```

#### 9. Get Meal Plans
**GET** `/plans`
- **Access**: Authenticated
- **Description**: List user's meal plans
- **Query Parameters**:
  - `status` (optional): Filter by status (generating, completed, failed)
- **Response**:
```json
{
  "plans": [
    {
      "planId": "meal-plan-uuid",
      "userId": "unique-user-id",
      "status": "completed",
      "days": 7,
      "totalCalories": 14000,
      "createdAt": "2025-10-11T13:00:00Z",
      "completedAt": "2025-10-11T13:05:00Z"
    }
  ]
}
```

#### 10. Get Specific Meal Plan  
**GET** `/plans/{planId}`
- **Access**: Authenticated
- **Description**: Get detailed meal plan with all recipes
- **Response**:
```json
{
  "planId": "meal-plan-uuid",
  "userId": "unique-user-id", 
  "status": "completed",
  "days": 7,
  "meals": [
    {
      "day": 1,
      "date": "2025-10-11",
      "breakfast": {
        "recipeId": "recipe-uuid",
        "title": "Overnight Oats",
        "calories": 350,
        "prepTime": 5
      },
      "lunch": {...},
      "dinner": {...}
    }
  ],
  "nutrition": {
    "totalCalories": 14000,
    "avgCaloriesPerDay": 2000,
    "totalProtein": 700,
    "totalCarbs": 1800,
    "totalFat": 500
  },
  "shoppingList": [
    {
      "category": "vegetables",
      "items": [
        {
          "name": "spinach",
          "quantity": "2 bunches",
          "recipes": ["recipe-1", "recipe-3"]
        }
      ]
    }
  ]
}
```

## Error Responses

All endpoints return consistent error format:
```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

### Common Status Codes
- `200`: Success
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (no access)
- `404`: Not Found
- `500`: Internal Server Error

## Testing with curl

### Test User Registration (Public):
```bash
curl -X POST "https://p62bbb3j0b.execute-api.us-east-2.amazonaws.com/dev/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "email": "testuser@example.com",
    "fullName": "Test User",
    "preferences": {
      "dietaryRestrictions": ["vegetarian"],
      "allergies": ["nuts"],
      "cuisinePreferences": ["italian"],
      "cookingSkill": "intermediate"
    }
  }'
```

### Test with Cognito Token (Authenticated):
```bash
# First get token from Cognito (using AWS CLI or SDK)
TOKEN="your-jwt-token-here"

curl -X GET "https://p62bbb3j0b.execute-api.us-east-2.amazonaws.com/dev/auth/profile/test-user-123" \
  -H "Authorization: Bearer $TOKEN"
```

## AWS Cognito Setup for Testing

To get authentication tokens for testing:

1. **Using AWS CLI**:
```bash
aws cognito-idp admin-create-user \
  --user-pool-id us-east-2_XfOcxI8ET \
  --username testuser \
  --temporary-password TempPass123! \
  --message-action SUPPRESS

aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-2_XfOcxI8ET \
  --username testuser \
  --password NewPass123! \
  --permanent
```

2. **Get JWT Token**:
```bash
aws cognito-idp admin-initiate-auth \
  --user-pool-id us-east-2_XfOcxI8ET \
  --client-id 2b6vkdri0hp1nd1fer004k2hbl \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=testuser,PASSWORD=NewPass123!
```

## Frontend Environment Variables

The frontend `.env` file has been automatically populated:
```env
VITE_API_BASE_URL=https://p62bbb3j0b.execute-api.us-east-2.amazonaws.com/dev/
VITE_COGNITO_USER_POOL_ID=us-east-2_XfOcxI8ET
VITE_COGNITO_CLIENT_ID=2b6vkdri0hp1nd1fer004k2hbl
VITE_COGNITO_REGION=us-east-2
VITE_ENVIRONMENT=dev
```