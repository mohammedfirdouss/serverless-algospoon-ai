# 🥄 AlgoSpoon AI - Personalized Recipe Generator

A production-ready, serverless meal planner and recipe generator powered by **AWS Bedrock** and **Claude 3 Sonnet**.

**AlgoSpoon AI** is a full-stack, event-driven application that leverages Generative AI to solve the real-world problem of specialized meal planning. It intelligently generates custom recipes based on a user's unique dietary restrictions (allergies, keto, vegan), available ingredients, and nutritional goals.

Built on a robust, serverless architecture derived from the **AWS AI Stack**, this project demonstrates:
- 🔒 Secure user profile management with DynamoDB
- ⚡ Real-time AI recipe streaming with AWS Bedrock
- 🔄 Complex asynchronous meal plan processing with EventBridge
- 🎨 Modern React UI with TypeScript
- 🏗️ Infrastructure as Code with AWS CDK

---

## ✨ Features

### 🍳 Real-Time Recipe Generation
- **Intelligent Prompting**: Context-aware system prompts that include user's dietary restrictions and allergies
- **Structured Output**: Recipes returned in consistent JSON format with:
  - Ingredient lists with quantities
  - Step-by-step instructions
  - Complete nutritional information
  - Dietary compliance badges
  - Chef's tips and cooking guidance
- **Personalization**: Automatically adapts to:
  - Dietary restrictions (vegan, keto, gluten-free, etc.)
  - Critical allergies (NEVER included in recipes)
  - Cuisine preferences
  - Skill level and cooking time

### 📅 Asynchronous Meal Planning
- **Multi-Day Plans**: Generate complete 1-30 day meal plans
- **Event-Driven Architecture**: Uses EventBridge for scalable async processing
- **Dietary Goals**: Optimize for weight loss, muscle gain, low-carb, etc.
- **Shopping Lists**: Consolidated ingredient lists across all meals
- **Nutritional Summaries**: Weekly nutrition tracking and analysis

### 👤 User Profile Management
- Store dietary restrictions and preferences
- Manage critical allergies
- Set cuisine preferences and skill level
- Persistent profiles in DynamoDB

### 🎨 Modern Frontend
- Beautiful, responsive React UI
- Profile management interface
- Real-time recipe generation
- Meal plan viewer
- Nutritional information display

---

## 🏗️ Architecture

### Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Infrastructure** | AWS CDK (TypeScript) |
| **AI/ML** | AWS Bedrock (Claude 3 Sonnet) |
| **Backend** | AWS Lambda (Node.js 20), TypeScript |
| **API** | Amazon API Gateway (REST) |
| **Database** | Amazon DynamoDB (3 tables) |
| **Events** | Amazon EventBridge |
| **Frontend** | React 18, TypeScript, Vite |
| **Hosting** | Amazon S3 + CloudFront |

### System Components

```
Frontend (React) → API Gateway → Lambda Functions ↔ DynamoDB
                                         ↓
                                   AWS Bedrock (Claude 3)
                                         ↓
                                  EventBridge ← Business Worker
```

**Key Lambda Functions**:
1. **recipe-generator**: Real-time recipe generation with Bedrock streaming
2. **meal-plans**: Meal plan orchestration and management
3. **meal-plan-worker**: Asynchronous multi-day meal plan generation

**DynamoDB Tables**:
1. **AuthTable**: User profiles with dietary restrictions and allergies
2. **MealPlansTable**: Meal plan metadata and results
3. **RecipesTable**: Individual recipe details from meal plans

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed architecture documentation.

---

## 🚀 Quick Start

### Prerequisites

- AWS Account with Bedrock access (Claude 3 Sonnet enabled)
- Node.js 20+ and npm
- AWS CLI configured
- AWS CDK CLI: `npm install -g aws-cdk`

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd serverless-algospoon-ai
```

2. **Install backend dependencies**
```bash
# Recipe Generator
cd backend/functions/recipe-generator && npm install

# Meal Plans API
cd ../meal-plans && npm install

# Meal Plan Worker
cd ../meal-plan-worker && npm install
```

3. **Install infrastructure dependencies**
```bash
cd infrastructure
npm install
```

4. **Install frontend dependencies**
```bash
cd frontend
npm install
```

### Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive deployment instructions.

**Quick Deploy**:
```bash
# Bootstrap CDK (first time only)
cd infrastructure
cdk bootstrap

# Deploy infrastructure
cdk deploy --all

# Build and deploy frontend
cd ../frontend
npm run build
aws s3 sync dist/ s3://<bucket-name>/ --delete
```

---

## 📋 Project Structure

```
├── backend/functions/         # Lambda functions
│   ├── recipe-generator/     # Real-time recipe generator
│   ├── meal-plans/           # Meal plan API
│   └── meal-plan-worker/     # Async meal plan worker
├── frontend/                 # React application
│   └── src/
│       ├── components/       # UI components
│       └── services/         # API client
├── infrastructure/           # AWS CDK stack
│   ├── lib/                  # Stack definitions
│   └── bin/                  # CDK app entry point
├── ARCHITECTURE.md           # Architecture documentation
├── DEPLOYMENT.md             # Deployment guide
└── README.md                 # This file
```

---

## 🔑 Key Technologies

### Infrastructure
- **AWS CDK**: Infrastructure as Code for all AWS resources
- **TypeScript**: Type-safe infrastructure definitions

### AI/ML
- **AWS Bedrock**: Managed AI service
- **Claude 3 Sonnet**: Advanced language model for recipe generation
- **Prompt Engineering**: Sophisticated system prompts for consistent output

### Backend
- **AWS Lambda**: Serverless compute (Node.js 20.x)
- **Amazon DynamoDB**: NoSQL database with on-demand scaling
- **Amazon EventBridge**: Event-driven architecture
- **Amazon API Gateway**: RESTful API management

### Frontend
- **React 18**: Modern UI library
- **TypeScript**: Type-safe frontend code
- **Vite**: Fast build tool
- **AWS Amplify UI**: Authentication components

---

## 📊 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/recipes/generate` | POST | Generate a single recipe from ingredients |
| `/plans/generate` | POST | Start asynchronous meal plan generation |
| `/plans` | GET | List user's meal plans |
| `/plans/{planId}` | GET | Get specific meal plan details |
| `/profile/{userId}` | GET | Get user dietary profile |
| `/profile/{userId}` | PUT | Update user dietary profile |

---

## 🧪 Example Usage

### Generate a Recipe

**Request**:
```bash
POST /recipes/generate
{
  "ingredients": "chicken breast, broccoli, garlic, olive oil, rice",
  "mealType": "dinner",
  "servings": 4,
  "additionalNotes": "prefer Asian flavors"
}
```

**Response**:
```json
{
  "success": true,
  "recipe": {
    "recipeName": "Garlic Ginger Chicken Stir-Fry with Broccoli",
    "description": "A quick and healthy Asian-inspired stir-fry...",
    "prepTime": "15 minutes",
    "cookTime": "20 minutes",
    "servings": 4,
    "ingredients": [...],
    "instructions": [...],
    "nutritionalInfo": {
      "perServing": {
        "calories": 385,
        "protein": "35g",
        "carbohydrates": "42g",
        "fat": "8g"
      }
    }
  }
}
```

### Generate a Meal Plan

**Request**:
```bash
POST /plans/generate
{
  "planType": "weekly",
  "duration": 7,
  "mealsPerDay": 3,
  "dietaryGoal": "low-carb"
}
```

**Response**:
```json
{
  "success": true,
  "planId": "plan-user-123-1699999999",
  "status": "requested",
  "message": "Meal plan generation initiated..."
}
```

---

## 🔒 Security Features

- **IAM Roles**: Least-privilege access for all Lambda functions
- **Encryption**: DynamoDB encryption at rest (AWS-managed)
- **HTTPS Only**: All API calls and CloudFront traffic
- **CORS**: Configured for frontend domain
- **Input Validation**: Request validation on API Gateway
- **Future**: AWS Cognito for user authentication

---

## 📚 Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)**: Detailed architecture and design decisions
- **[DEPLOYMENT.md](DEPLOYMENT.md)**: Step-by-step deployment guide

---

## 🛠️ Development

### Local Development

**Backend Testing**:
```bash
# Test Lambda functions locally
cd backend/functions/ai-chat-api
npm run build
# Use AWS SAM or Lambda Test Events
```

**Frontend Development**:
```bash
cd frontend
npm run dev
# Opens on http://localhost:3000
```

### TypeScript Compilation

```bash
# Compile backend
cd backend/functions/recipe-generator
npm run build

# Compile infrastructure
cd infrastructure
npm run build
```

---

## 🔍 Monitoring

### CloudWatch Logs

```bash
# View AI Chat API logs
aws logs tail /aws/lambda/AlgoSpoon-AIChatApi --follow

# View Business Worker logs
aws logs tail /aws/lambda/AlgoSpoon-BusinessWorker --follow
```

### DynamoDB Queries

```bash
# Check user profile
aws dynamodb get-item \
  --table-name AlgoSpoonAuthTable \
  --key '{"userId": {"S": "user-123"}}'
```

---

## 📝 License

This project is licensed under the MIT License.

---

**Built with AWS Serverless Technologies**
