# AlgoSpoon AI - Deployment Guide

This guide walks you through deploying the AlgoSpoon personalized recipe service to AWS.

## Prerequisites

Before you begin, ensure you have:

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with credentials
3. **Node.js** (v20 or later) and npm installed
4. **AWS CDK** installed globally: `npm install -g aws-cdk`
5. **Access to AWS Bedrock** with Claude 3 Sonnet model enabled in your region

## Project Structure

```
/workspace/
├── backend/
│   └── functions/
│       ├── ai-chat-api/          # Recipe generator Lambda
│       ├── business-api/          # Meal plan management API
│       └── business-worker/       # Async meal plan generator
├── frontend/
│   └── src/
│       ├── components/            # React components
│       └── services/              # API client
├── infrastructure/
│   └── lib/
│       └── algospoon-stack.ts    # CDK infrastructure definition
└── README.md
```

## Step 1: Enable AWS Bedrock Access

1. Navigate to AWS Bedrock console in `us-east-1` (or your preferred region)
2. Request access to **Anthropic Claude 3 Sonnet** model
3. Wait for approval (usually instant for most accounts)
4. Verify model access in the Bedrock console

## Step 2: Install Dependencies

### Backend Functions

```bash
# AI Chat API
cd backend/functions/ai-chat-api
npm install

# Business API
cd ../business-api
npm install

# Business Worker
cd ../business-worker
npm install
```

### Frontend

```bash
cd frontend
npm install
```

### Infrastructure

```bash
cd infrastructure
npm install
```

## Step 3: Bootstrap AWS CDK (First Time Only)

If you haven't used CDK in your AWS account/region before:

```bash
cd infrastructure
cdk bootstrap aws://ACCOUNT-NUMBER/REGION
```

Replace `ACCOUNT-NUMBER` and `REGION` with your values.

## Step 4: Build Backend Functions

```bash
# From the workspace root
cd backend/functions/ai-chat-api
npm run build

cd ../business-api
npm run build

cd ../business-worker
npm run build
```

## Step 5: Deploy Infrastructure

```bash
cd infrastructure

# Review what will be deployed
cdk diff

# Deploy the stack
cdk deploy --all

# Or for automatic approval
cdk deploy --all --require-approval never
```

This will create:
- 3 DynamoDB tables (Auth, MealPlans, Recipes)
- 3 Lambda functions
- EventBridge event bus
- API Gateway REST API
- S3 bucket and CloudFront distribution for frontend
- IAM roles and policies

**Important**: Note the outputs from the deployment:
- `ApiEndpoint`: Your API Gateway URL
- `WebsiteURL`: CloudFront distribution URL
- `WebsiteBucketName`: S3 bucket for frontend

## Step 6: Configure Frontend

Create a `.env` file in the `frontend` directory:

```bash
cd frontend
cat > .env << EOF
VITE_API_BASE_URL=<ApiEndpoint from CDK output>
EOF
```

## Step 7: Build and Deploy Frontend

```bash
# Build the React app
npm run build

# Deploy to S3
aws s3 sync dist/ s3://<WebsiteBucketName>/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id <DistributionId> \
  --paths "/*"
```

To find your CloudFront Distribution ID:
```bash
aws cloudfront list-distributions \
  --query "DistributionList.Items[?Origins.Items[?DomainName==\`<WebsiteBucketName>.s3.amazonaws.com\`]].Id" \
  --output text
```

## Step 8: Test the Application

1. Navigate to your `WebsiteURL` from the CDK outputs
2. Create an account / sign in (if using Cognito authentication)
3. Set up your dietary profile:
   - Go to Profile
   - Add dietary restrictions
   - Add allergies
   - Save profile

4. Test recipe generation:
   - Go to Recipe Generator
   - Enter ingredients: "chicken, broccoli, rice, garlic"
   - Click "Generate Recipe"
   - Review the AI-generated recipe

5. Test meal planning:
   - Go to Meal Planner
   - Configure a 7-day plan
   - Click "Generate Meal Plan"
   - Wait for processing (check back after 2-3 minutes)
   - View the completed plan

## Architecture Overview

### Phase 2: Real-Time Recipe Generation
- **Endpoint**: `POST /recipes/generate`
- **Lambda**: `ai-chat-api`
- **Flow**:
  1. User sends ingredients
  2. Lambda retrieves user profile from DynamoDB
  3. Constructs personalized prompt for Bedrock
  4. Streams response from Claude 3 Sonnet
  5. Returns structured recipe JSON

### Phase 3: Asynchronous Meal Planning
- **Endpoint**: `POST /plans/generate`
- **Lambda**: `business-api` → EventBridge → `business-worker`
- **Flow**:
  1. User requests meal plan
  2. Business API creates plan record with status "requested"
  3. Publishes event to EventBridge
  4. Business Worker receives event
  5. Worker generates multi-day plan with Bedrock
  6. Saves recipes to DynamoDB
  7. Updates plan status to "completed"

### DynamoDB Schema

**AuthTable**:
```json
{
  "userId": "user-123",
  "dietaryRestrictions": ["vegan", "gluten-free"],
  "allergies": ["peanuts"],
  "preferences": {
    "cuisineTypes": ["Italian", "Mediterranean"],
    "skillLevel": "intermediate",
    "cookingTime": "30-60 minutes"
  }
}
```

**MealPlansTable**:
```json
{
  "planId": "plan-user-123-1699999999",
  "userId": "user-123",
  "status": "completed",
  "duration": 7,
  "recipes": [ /* array of daily meal plans */ ]
}
```

## Monitoring and Debugging

### CloudWatch Logs

View Lambda logs:
```bash
# AI Chat API logs
aws logs tail /aws/lambda/AlgoSpoon-AIChatApi --follow

# Business Worker logs
aws logs tail /aws/lambda/AlgoSpoon-BusinessWorker --follow
```

### DynamoDB Queries

Check user profile:
```bash
aws dynamodb get-item \
  --table-name AlgoSpoonAuthTable \
  --key '{"userId": {"S": "test-user"}}'
```

Check meal plans:
```bash
aws dynamodb scan \
  --table-name AlgoSpoonMealPlansTable \
  --filter-expression "userId = :uid" \
  --expression-attribute-values '{":uid": {"S": "test-user"}}'
```

## Cost Optimization

- **Lambda**: Pay per request (free tier: 1M requests/month)
- **DynamoDB**: On-demand pricing (pay per read/write)
- **Bedrock**: Pay per token (~$0.003 per 1K input tokens, ~$0.015 per 1K output tokens for Claude 3 Sonnet)
- **API Gateway**: Pay per request (free tier: 1M requests/month)
- **CloudFront**: Pay per data transfer and requests

Estimated costs for low-medium usage: **$10-50/month**

## Security Considerations

1. **Enable API Gateway authentication** (currently set to open for development)
2. **Configure CORS** properly for production
3. **Set up AWS WAF** for API protection
4. **Enable CloudTrail** for audit logging
5. **Use AWS Secrets Manager** for sensitive configuration
6. **Implement rate limiting** on API Gateway

## Cleanup

To remove all resources:

```bash
cd infrastructure
cdk destroy --all
```

**Note**: DynamoDB tables have `RETAIN` removal policy and won't be automatically deleted. Delete manually if needed:

```bash
aws dynamodb delete-table --table-name AlgoSpoonAuthTable
aws dynamodb delete-table --table-name AlgoSpoonMealPlansTable
aws dynamodb delete-table --table-name AlgoSpoonRecipesTable
```

## Troubleshooting

### Bedrock Access Denied
- Verify model access in Bedrock console
- Check Lambda IAM role has `bedrock:InvokeModel` permission
- Ensure correct region (model must be available in deployment region)

### Recipe Generation Timeout
- Increase Lambda timeout (currently 60s for ai-chat-api)
- Check Bedrock service status
- Review CloudWatch logs for errors

### Meal Plan Not Completing
- Check Business Worker CloudWatch logs
- Verify EventBridge rule is active
- Check DynamoDB for plan status
- Worker has 15-minute timeout for complex plans

## Next Steps

1. **Add Authentication**: Integrate AWS Cognito for user management
2. **Implement Caching**: Use ElastiCache for frequently accessed recipes
3. **Add Search**: Implement OpenSearch for recipe search functionality
4. **Enable Analytics**: Set up Pinpoint or CloudWatch RUM for user analytics
5. **Add Testing**: Implement unit and integration tests
6. **CI/CD Pipeline**: Set up CodePipeline for automated deployments

## Support

For issues or questions:
- Check CloudWatch Logs for error details
- Review AWS Bedrock quotas and limits
- Verify all IAM permissions are correctly configured
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
