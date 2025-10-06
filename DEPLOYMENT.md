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
