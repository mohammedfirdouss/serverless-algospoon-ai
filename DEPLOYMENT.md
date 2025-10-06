# AlgoSpoon AI - Deployment Guide

This guide will help you deploy the AlgoSpoon AI serverless application to AWS.

## Prerequisites

1. **AWS Account**: You need an active AWS account
2. **AWS CLI**: Install and configure the AWS CLI with your credentials
   ```bash
   aws configure
   ```
3. **Node.js**: Install Node.js (v18 or later recommended)
4. **AWS CDK**: Install the AWS CDK CLI
   ```bash
   npm install -g aws-cdk
   ```

## Phase 1: Core Data and Authentication Setup

Phase 1 has been completed with the following components:

### Infrastructure Components

1. **DynamoDB Tables**:
   - `AlgoSpoonUsers` - User profiles with personalized attributes
     - Partition Key: `userId`
     - GSI: `EmailIndex` on `email`
     - Attributes: `dietaryRestrictions`, `allergies`, `targetCalories`, etc.
   
   - `AlgoSpoonRecipes` - User-saved recipes and meal plans
     - Partition Key: `userId`
     - Sort Key: `recipeId`
     - GSI: `RecipeTypeIndex` on `recipeType` and `createdAt`

2. **Lambda Functions**:
   - **Auth Service**:
     - `RegisterFunction` - User registration with profile data
     - `UpdateProfileFunction` - Update user dietary preferences
     - `GetUserFunction` - Retrieve user profile
   
   - **Recipe Service**:
     - `SaveRecipeFunction` - Save generated recipes
     - `GetRecipesFunction` - Get user's saved recipes
     - `DeleteRecipeFunction` - Delete a recipe

3. **API Gateway**:
   - REST API with CORS enabled
   - Endpoints:
     - `POST /auth/register` - Register new user
     - `PUT /auth/profile` - Update user profile
     - `GET /auth/profile/{userId}` - Get user profile
     - `POST /recipes` - Save a recipe
     - `GET /recipes/{userId}` - Get all recipes for user
     - `DELETE /recipes/{userId}/{recipeId}` - Delete a recipe

## Installation

1. **Install root dependencies**:
   ```bash
   npm install
   ```

2. **Install Lambda function dependencies**:
   ```bash
   # Auth service functions
   cd services/auth/register && npm install && cd ../../..
   cd services/auth/update-profile && npm install && cd ../../..
   cd services/auth/get-user && npm install && cd ../../..
   
   # Recipe service functions
   cd services/recipes/save-recipe && npm install && cd ../../..
   cd services/recipes/get-recipes && npm install && cd ../../..
   cd services/recipes/delete-recipe && npm install && cd ../../..
   ```

## Deployment

1. **Bootstrap CDK (first time only)**:
   ```bash
   cdk bootstrap
   ```

2. **Build the TypeScript code**:
   ```bash
   npm run build
   ```

3. **Synthesize CloudFormation template**:
   ```bash
   npm run synth
   ```

4. **Deploy to AWS**:
   ```bash
   npm run deploy
   ```

   Or use CDK directly:
   ```bash
   cdk deploy
   ```

5. **Note the outputs**: After deployment, CDK will output:
   - API Gateway endpoint URL
   - DynamoDB table names

## Testing the API

### Register a User

```bash
curl -X POST https://YOUR_API_ENDPOINT/prod/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "securepassword123",
    "dietaryRestrictions": ["vegetarian"],
    "allergies": ["peanuts", "shellfish"],
    "targetCalories": 2000
  }'
```

### Update User Profile

```bash
curl -X PUT https://YOUR_API_ENDPOINT/prod/auth/profile \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid-here",
    "dietaryRestrictions": ["vegan"],
    "targetCalories": 1800
  }'
```

### Get User Profile

```bash
curl https://YOUR_API_ENDPOINT/prod/auth/profile/USER_ID
```

### Save a Recipe

```bash
curl -X POST https://YOUR_API_ENDPOINT/prod/recipes \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid-here",
    "recipeName": "Vegan Buddha Bowl",
    "recipeType": "lunch",
    "ingredients": [
      {"name": "quinoa", "quantity": "1", "unit": "cup"},
      {"name": "chickpeas", "quantity": "1", "unit": "can"}
    ],
    "instructions": ["Cook quinoa", "Roast chickpeas", "Combine ingredients"],
    "nutritionalInfo": {
      "calories": 450,
      "protein": 15,
      "carbohydrates": 60,
      "fat": 12
    },
    "servings": 2,
    "prepTime": 15,
    "cookTime": 25,
    "tags": ["vegan", "healthy", "meal-prep"]
  }'
```

### Get All Recipes for a User

```bash
curl https://YOUR_API_ENDPOINT/prod/recipes/USER_ID
```

### Delete a Recipe

```bash
curl -X DELETE https://YOUR_API_ENDPOINT/prod/recipes/USER_ID/RECIPE_ID
```

## Clean Up

To delete all resources:

```bash
npm run destroy
```

Or:

```bash
cdk destroy
```

## Next Steps

Phase 1 is complete! The next phases will include:

- **Phase 2**: AWS Bedrock integration for recipe generation
- **Phase 3**: Real-time AI streaming with WebSockets
- **Phase 4**: EventBridge for asynchronous meal planning
- **Phase 5**: Frontend React application

## Security Notes

⚠️ **Important**: The current implementation uses basic password encoding for demonstration purposes. For production:

1. Implement proper authentication (AWS Cognito, Auth0, etc.)
2. Use bcrypt or similar for password hashing
3. Add API authentication/authorization
4. Implement rate limiting
5. Add input validation and sanitization
6. Enable AWS WAF on API Gateway
7. Use AWS Secrets Manager for sensitive data

## Monitoring

Monitor your application using:

- **CloudWatch Logs**: Lambda function logs
- **CloudWatch Metrics**: API Gateway and Lambda metrics
- **X-Ray**: Distributed tracing (enable in CDK if needed)

## Support

For issues or questions, refer to:
- AWS CDK Documentation: https://docs.aws.amazon.com/cdk/
- AWS Lambda Documentation: https://docs.aws.amazon.com/lambda/
- AWS DynamoDB Documentation: https://docs.aws.amazon.com/dynamodb/
