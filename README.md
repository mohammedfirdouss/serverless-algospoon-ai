# 🥄 AlgoSpoon AI - Personalized Recipe Generator

A serverless meal planner and recipe generator powered by **AWS Bedrock** and **Claude 3 Sonnet**.

AlgoSpoon AI generates custom recipes and meal plans based on user dietary restrictions, allergies, available ingredients, and nutritional goals using AWS serverless technologies.

## ✨ Features

- **AI Recipe Generation**: Generate personalized recipes using AWS Bedrock (Claude 3 Sonnet)
- **Meal Planning**: Create multi-day meal plans with async processing via EventBridge
- **User Profiles**: Store dietary restrictions, allergies, and preferences in DynamoDB
- **Modern UI**: React frontend with Cognito authentication (AWS Amplify UI)

## 🏗️ Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Infrastructure** | AWS CDK (TypeScript) |
| **AI/ML** | AWS Bedrock (Claude 3 Sonnet) |
| **Backend** | AWS Lambda (Node.js 20), TypeScript |
| **API** | Amazon API Gateway (REST) |
| **Database** | Amazon DynamoDB |
| **Events** | Amazon EventBridge |
| **Frontend** | React 18, TypeScript, Vite, Amplify UI |
| **Hosting** | Amazon S3 + CloudFront |

## 🚀 Quick Start

### Prerequisites

- AWS Account with Bedrock access (Claude 3 Sonnet enabled)
- Node.js 20+ and npm
- AWS CLI configured
- AWS CDK CLI: `npm install -g aws-cdk`

### Installation & Deployment

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd serverless-algospoon-ai
npm install
cd frontend && npm install && cd ..
./scripts/install-all.sh  # Install all Lambda dependencies
```

2. **Deploy to AWS**
```bash
# Bootstrap CDK (first time only)
npm run cdk -- bootstrap

# Deploy stack and configure frontend
./scripts/deploy-and-configure.sh dev
```

3. **Run frontend locally**
```bash
cd frontend
npm run dev
# Opens on http://localhost:3000
```

## 📋 Project Structure

```
├── bin/algospoon.ts          # CDK app entry
├── lib/                      # CDK constructs (Auth, Bedrock, Data, etc.)
├── backend/functions/        # Bedrock + meal plan Lambdas
├── services/                 # Auth/Recipes REST Lambdas
├── frontend/                 # React app (Vite + Amplify UI)
└── scripts/                  # Install/deploy helper scripts
```

## 📊 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/recipes/generate` | POST | Generate a single recipe from ingredients |
| `/plans/generate` | POST | Start asynchronous meal plan generation |
| `/plans` | GET | List user's meal plans |
| `/plans/{planId}` | GET | Get specific meal plan details |
| `/auth/register` | POST | Register a new user |
| `/auth/profile/{userId}` | GET | Get user dietary profile |
| `/auth/profile` | PUT | Update user dietary profile |

## 📚 Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)**: Detailed architecture and design decisions
- **scripts/deploy-and-configure.sh**: Automated deployment script

## 🔒 Security

- Cognito Authentication with Amplify UI
- IAM least-privilege roles
- DynamoDB encryption at rest
- HTTPS-only traffic

## 📝 License

MIT License

---

**Built with AWS Serverless Technologies**
