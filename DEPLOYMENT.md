# AlgoSpoon AI - Deployment Guide

This guide covers the deployment process for the AlgoSpoon AI serverless application.

## Prerequisites

Before deploying, ensure you have:

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
   ```bash
   aws configure
   ```
3. **Node.js** (v18 or later) and npm installed
4. **AWS CDK** installed globally
   ```bash
   npm install -g aws-cdk
   ```

## Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd serverless-algospoon-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

3. **Bootstrap CDK** (if not already done)
   ```bash
   cdk bootstrap
   ```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# AWS Configuration
AWS_ACCOUNT_ID=your-account-id
AWS_REGION=us-east-1

# Application Configuration
ENVIRONMENT=dev
```

### Frontend Configuration

Update `frontend/.env`:

```bash
VITE_COGNITO_USER_POOL_ID=your-user-pool-id
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_COGNITO_REGION=us-east-1
VITE_API_BASE_URL=your-api-gateway-url
```

## Deployment Steps

### 1. Build the Application

```bash
# Build CDK infrastructure
npm run build

# Build frontend
cd frontend && npm run build && cd ..
```

### 2. Synthesize CloudFormation Template

```bash
cdk synth
```

### 3. Deploy Infrastructure

```bash
# Deploy all stacks
cdk deploy --all

# Or deploy specific stack
cdk deploy AlgoSpoonStack
```

### 4. Post-Deployment Configuration

After deployment, CDK will output important values:

- **API Gateway URL**: Base URL for your API
- **Cognito User Pool ID**: For frontend authentication
- **Cognito Client ID**: For frontend authentication
- **CloudFront Distribution URL**: Your frontend URL

Update the `frontend/.env` file with these values and redeploy the frontend if needed.

## Lambda Function Deployment

Lambda functions are automatically deployed via CDK. However, if you need to update individual functions:

```bash
# The CDK will automatically bundle and deploy Lambda functions
# from the services/ and backend/ directories
```

## Frontend Deployment

The frontend is deployed via CDK to an S3 bucket with CloudFront distribution:

```bash
# Frontend files are automatically deployed from frontend/dist
# The CDK FrontendDeployment construct handles this
```

## Verification

### Test API Endpoints

```bash
# Get user profile
curl -H "Authorization: Bearer <token>" \
  https://your-api-url/profile/<user-id>

# Generate recipe
curl -X POST https://your-api-url/recipes/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "ingredients": "chicken, rice, vegetables",
    "mealType": "dinner",
    "servings": 4
  }'
```

### Test Frontend

1. Navigate to the CloudFront URL
2. Sign up for a new account
3. Verify email (check for verification code)
4. Log in and test features

## Monitoring

### CloudWatch Logs

View Lambda function logs:
```bash
aws logs tail /aws/lambda/AlgoSpoon-RecipeGenerator --follow
```

### X-Ray Tracing

View distributed traces in AWS X-Ray console for end-to-end request tracking.

### Metrics

Monitor key metrics in CloudWatch:
- Lambda invocations and errors
- API Gateway requests and latency
- DynamoDB read/write capacity
- Bedrock API calls

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Ensure all dependencies are installed: `npm install`
   - Check TypeScript compilation: `npm run build`

2. **Deployment Failures**
   - Verify AWS credentials: `aws sts get-caller-identity`
   - Check CDK bootstrap: `cdk bootstrap`

3. **API Errors**
   - Check Lambda logs in CloudWatch
   - Verify IAM permissions
   - Check API Gateway configuration

4. **Frontend Issues**
   - Verify environment variables
   - Check CloudFront distribution status
   - Clear browser cache

## Rollback

To rollback a deployment:

```bash
# List stacks
aws cloudformation list-stacks

# Rollback to previous version
aws cloudformation rollback-stack --stack-name AlgoSpoonStack
```

## Cleanup

To remove all deployed resources:

```bash
# Destroy all stacks
cdk destroy --all

# Confirm destruction
```

**Warning**: This will delete all data including DynamoDB tables and S3 buckets.

## CI/CD Pipeline

For automated deployments, consider setting up:

1. **GitHub Actions** or **AWS CodePipeline**
2. **Automated testing** before deployment
3. **Environment-specific deployments** (dev, staging, prod)
4. **Blue/green deployments** for zero-downtime updates

Example GitHub Actions workflow:

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: cdk deploy --all --require-approval never
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## Security Best Practices

1. **Use AWS Secrets Manager** for sensitive data
2. **Enable WAF** for API Gateway protection
3. **Configure CORS** properly
4. **Use HTTPS** for all communications
5. **Enable CloudTrail** for audit logging
6. **Regular security updates** for dependencies

## Cost Optimization

1. **Use DynamoDB on-demand** for variable workloads
2. **Configure Lambda reserved concurrency** to control costs
3. **Enable S3 lifecycle policies** for old data
4. **Use CloudFront caching** effectively
5. **Monitor Bedrock API usage** and set budgets

## Support

For issues and questions:
- Check CloudWatch Logs
- Review AWS documentation
- Contact AWS Support
- Consult the project README.md
