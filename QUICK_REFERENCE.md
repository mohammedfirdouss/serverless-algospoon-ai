# AlgoSpoon AI - Quick Reference Guide

## 🚀 Quick Start Commands

```bash
# Install all dependencies
./scripts/install-all.sh

# Build the project
npm run build

# Deploy to AWS
npm run deploy

# Destroy the stack
npm run destroy
```

## 📋 API Endpoints

### Base URL
```
https://YOUR_API_ID.execute-api.REGION.amazonaws.com/prod
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| PUT | `/auth/profile` | Update user profile |
| GET | `/auth/profile/{userId}` | Get user profile |

### Recipe Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/recipes` | Save a recipe |
| GET | `/recipes/{userId}` | Get all user recipes |
| DELETE | `/recipes/{userId}/{recipeId}` | Delete a recipe |

## 💻 Example API Calls

### Register User
```bash
curl -X POST https://YOUR_API/prod/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "password123",
    "dietaryRestrictions": ["vegetarian"],
    "allergies": ["peanuts"],
    "targetCalories": 2000
  }'
```

### Update Profile
```bash
curl -X PUT https://YOUR_API/prod/auth/profile \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_UUID",
    "dietaryRestrictions": ["vegan"],
    "targetCalories": 1800
  }'
```

### Save Recipe
```bash
curl -X POST https://YOUR_API/prod/recipes \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_UUID",
    "recipeName": "Pasta Primavera",
    "recipeType": "dinner",
    "ingredients": [
      {"name": "pasta", "quantity": "8", "unit": "oz"},
      {"name": "vegetables", "quantity": "2", "unit": "cups"}
    ],
    "instructions": ["Boil pasta", "Sauté vegetables", "Combine"],
    "servings": 4
  }'
```

## 🗂️ Project Structure

```
algospoon-ai/
├── bin/                    # CDK entry point
├── lib/                    # CDK infrastructure
├── services/               # Lambda functions
│   ├── auth/              # Auth service
│   └── recipes/           # Recipe service
├── scripts/               # Utility scripts
└── docs/                  # Documentation
```

## 🏗️ Infrastructure Components

| Component | Name | Type |
|-----------|------|------|
| API | AlgoSpoonApi | REST API Gateway |
| User Table | AlgoSpoonUsers | DynamoDB |
| Recipe Table | AlgoSpoonRecipes | DynamoDB |
| Auth Lambdas | Register, UpdateProfile, GetUser | Lambda |
| Recipe Lambdas | SaveRecipe, GetRecipes, DeleteRecipe | Lambda |

## 📊 DynamoDB Tables

### AlgoSpoonUsers Table
- **Partition Key**: `userId` (String)
- **GSI**: `EmailIndex` on `email`
- **Attributes**: `dietaryRestrictions`, `allergies`, `targetCalories`

### AlgoSpoonRecipes Table
- **Partition Key**: `userId` (String)
- **Sort Key**: `recipeId` (String)
- **GSI**: `RecipeTypeIndex` on `recipeType` + `createdAt`

## 🔧 Common Tasks

### View CloudFormation Stack
```bash
aws cloudformation describe-stacks --stack-name AlgoSpoonStack
```

### View API Gateway ID
```bash
aws apigateway get-rest-apis --query 'items[?name==`AlgoSpoon API`]'
```

### View DynamoDB Tables
```bash
aws dynamodb list-tables
```

### View Lambda Functions
```bash
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `AlgoSpoon`)]'
```

### Tail Lambda Logs
```bash
# Replace FUNCTION_NAME with actual function name
aws logs tail /aws/lambda/FUNCTION_NAME --follow
```

## 📈 Monitoring

### CloudWatch Log Groups
- `/aws/lambda/AlgoSpoonStack-AuthServiceRegisterFunction*`
- `/aws/lambda/AlgoSpoonStack-AuthServiceUpdateProfileFunction*`
- `/aws/lambda/AlgoSpoonStack-AuthServiceGetUserFunction*`
- `/aws/lambda/AlgoSpoonStack-RecipeDataStoreSaveRecipeFunction*`
- `/aws/lambda/AlgoSpoonStack-RecipeDataStoreGetRecipesFunction*`
- `/aws/lambda/AlgoSpoonStack-RecipeDataStoreDeleteRecipeFunction*`

### Useful CloudWatch Metrics
- API Gateway: `Count`, `Latency`, `4XXError`, `5XXError`
- Lambda: `Invocations`, `Duration`, `Errors`, `Throttles`
- DynamoDB: `ConsumedReadCapacityUnits`, `ConsumedWriteCapacityUnits`

## 🔐 Security Checklist

- [ ] Configure AWS Cognito for authentication
- [ ] Implement proper password hashing
- [ ] Add API Gateway authorizers
- [ ] Enable AWS WAF
- [ ] Configure rate limiting
- [ ] Use AWS Secrets Manager for sensitive data
- [ ] Enable DynamoDB encryption
- [ ] Set up VPC for Lambdas (if needed)

## 🧪 Testing

### Test User Registration
```bash
# Save response to get userId
RESPONSE=$(curl -X POST https://YOUR_API/prod/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test","password":"test123"}')
  
USER_ID=$(echo $RESPONSE | jq -r '.user.userId')
echo "User ID: $USER_ID"
```

### Test Recipe Creation
```bash
curl -X POST https://YOUR_API/prod/recipes \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"recipeName\":\"Test Recipe\",\"ingredients\":[{\"name\":\"test\",\"quantity\":\"1\",\"unit\":\"cup\"}]}"
```

## 📚 Documentation Files

- `README.md` - Project overview
- `DEPLOYMENT.md` - Deployment instructions
- `PROJECT_STRUCTURE.md` - Architecture details
- `PHASE1_SUMMARY.md` - Phase 1 completion summary
- `QUICK_REFERENCE.md` - This file

## 🎯 Phase 1 Status

✅ Auth Service with enhanced user profiles  
✅ DynamoDB tables for users and recipes  
✅ Lambda functions for all operations  
✅ API Gateway with RESTful endpoints  
✅ Complete documentation  

## 📞 Support

### AWS Resources
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Lambda Developer Guide](https://docs.aws.amazon.com/lambda/)
- [DynamoDB Developer Guide](https://docs.aws.amazon.com/dynamodb/)
- [API Gateway Developer Guide](https://docs.aws.amazon.com/apigateway/)

### Troubleshooting

**Deployment fails?**
- Check AWS credentials: `aws sts get-caller-identity`
- Ensure CDK is bootstrapped: `cdk bootstrap`

**Lambda errors?**
- Check CloudWatch logs
- Verify environment variables
- Check IAM permissions

**API returns 403?**
- Check CORS configuration
- Verify API Gateway deployment
- Check request headers

## 🚧 Next Steps: Phase 2

- [ ] Integrate AWS Bedrock for recipe generation
- [ ] Add Claude 3 model for AI responses
- [ ] Implement prompt engineering
- [ ] Create recipe generation endpoint
- [ ] Add nutritional calculation with AI

---

**Last Updated**: 2025-10-06  
**Version**: 1.0.0 (Phase 1)
