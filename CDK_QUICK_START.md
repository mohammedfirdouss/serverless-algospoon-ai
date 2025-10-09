# AlgoSpoon AI - CDK Quick Start Guide

## 🚀 Quick Deployment

### Prerequisites
```bash
# Install AWS CDK globally
npm install -g aws-cdk

# Install project dependencies
npm install

# Bootstrap CDK (first time only)
cdk bootstrap
```

### Deploy to Development
```bash
# Deploy backend only (frontend runs locally)
./scripts/deploy-and-configure.sh dev

# Start frontend locally
cd frontend
npm run dev
```

### Deploy to Staging/Production
```bash
# Deploy everything (including frontend to CloudFront)
./scripts/deploy-and-configure.sh staging
# or
./scripts/deploy-and-configure.sh prod
```

---

## 📁 New CDK Structure

```
lib/
├── algospoon-stack.ts       # Main stack (orchestrates everything)
├── auth-service.ts           # User authentication & profiles
├── recipe-data-store.ts      # Recipe storage
├── bedrock-service.ts        # ⭐ NEW: AI recipe generation
├── monitoring.ts             # ⭐ NEW: CloudWatch alarms & dashboard
├── frontend-deployment.ts    # ⭐ NEW: S3 + CloudFront
├── waf.ts                    # ⭐ NEW: API protection
└── config.ts                 # ⭐ NEW: Environment configs
```

---

## 🎯 What's New?

### 1. All Lambda Functions in CDK ✅
- ✅ Recipe Generator (Bedrock AI)
- ✅ Meal Plans Orchestrator
- ✅ Meal Plan Worker
- ✅ Auth Functions (register, update, get)
- ✅ Recipe CRUD Functions

### 2. EventBridge Integration ✅
- Event bus for async processing
- Rules to trigger workers
- Decoupled architecture

### 3. Complete Monitoring ✅
- CloudWatch Dashboard
- Email alarms via SNS
- API, Lambda, DynamoDB metrics

### 4. Frontend Deployment ✅
- S3 bucket (encrypted, versioned)
- CloudFront distribution
- Automatic deployments (staging/prod)

### 5. Security (WAF) ✅
- Rate limiting
- AWS Managed Rules (OWASP, SQLi, XSS)
- IP reputation blocking

### 6. Multi-Environment ✅
- Dev (local frontend, no WAF, cheap)
- Staging (full stack, monitoring)
- Prod (optimized, alarms, WAF)

---

## 🔧 Configuration

### Environment Settings
Edit `lib/config.ts` to customize:

- DynamoDB settings (PITR, removal policy)
- Lambda settings (memory, timeout, log retention)
- API Gateway throttling
- WAF rules and rate limits
- Bedrock model selection
- Frontend deployment options

### Custom Domain (Optional)
In `lib/config.ts`, add your domain:
```typescript
frontend: {
  customDomain: {
    domainName: 'app.yourcompany.com',
    certificateArn: 'arn:aws:acm:...',
  },
}
```

---

## 📊 Outputs After Deployment

```bash
# Core Services
✅ API Endpoint
✅ Event Bus Name

# Authentication  
✅ User Pool ID
✅ User Pool Client ID
✅ Region

# Data
✅ Users Table
✅ Recipes Table
✅ Meal Plans Table

# Monitoring (if enabled)
✅ CloudWatch Dashboard URL

# Frontend (if deployed)
✅ Website URL (CloudFront)
✅ S3 Bucket Name

# Security (if enabled)
✅ WAF ARN
```

---

## 🔍 Useful CDK Commands

```bash
# List all stacks
cdk list

# Show changes before deploy
cdk diff AlgoSpoonStack-dev -c environment=dev

# Deploy specific environment
cdk deploy AlgoSpoonStack-prod -c environment=prod

# Destroy a stack
cdk destroy AlgoSpoonStack-dev -c environment=dev

# Synthesize CloudFormation
cdk synth AlgoSpoonStack-staging -c environment=staging
```

---

## 📈 Monitoring

### CloudWatch Dashboard
After deploying with monitoring enabled (staging/prod):
```
https://console.aws.amazon.com/cloudwatch/home#dashboards:name=AlgoSpoon-Metrics
```

### Alarms
Configure email in `lib/config.ts`:
```typescript
monitoring: {
  alarmEmail: 'your-email@example.com',
}
```

You'll receive alerts for:
- High API error rates
- Lambda failures
- DynamoDB throttling
- High latency

---

## 💰 Cost Estimates

### Dev Environment
- ~$20-30/month
- No WAF
- No CloudFront
- Shorter logs
- Haiku model (cheaper)

### Staging Environment
- ~$50-75/month
- Basic WAF
- CloudFront enabled
- Full monitoring

### Production Environment
- ~$150-200/month (1000 users)
- Full WAF protection
- Custom domain ready
- Reserved capacity
- Extended logs

---

## 🛠️ Troubleshooting

### Deployment Fails
```bash
# Check CDK version
cdk --version

# Clear CDK cache
rm -rf cdk.out

# Re-bootstrap
cdk bootstrap

# Try deploy again
./scripts/deploy-and-configure.sh dev
```

### Frontend Not Deploying
- Ensure `npm run build` works locally
- Check `frontend/dist` exists
- Verify S3 bucket deployment in CloudFormation

### Lambda Errors
- Check CloudWatch Logs
- Verify IAM permissions
- Check environment variables

### Bedrock Access Denied
- Verify Bedrock is enabled in your AWS account
- Check region supports Bedrock
- Request model access in AWS Console

---

## 📚 Documentation

- **Full Details:** See `CDK_IMPROVEMENTS_COMPLETE.md`
- **Cognito Setup:** See `COGNITO_SETUP.md`
- **Architecture:** See `ARCHITECTURE.md`
- **Project Summary:** See `PROJECT_SUMMARY.md`

---

## 🎉 You're Ready!

Deploy to dev and start building:
```bash
./scripts/deploy-and-configure.sh dev
cd frontend && npm run dev
```

Visit http://localhost:3000 and sign up! 🚀
