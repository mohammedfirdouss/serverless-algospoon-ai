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
1. **ai-chat-api**: Real-time recipe generation with Bedrock streaming
2. **business-api**: Meal plan orchestration and management
3. **business-worker**: Asynchronous multi-day meal plan generation

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
cd workspace
```

2. **Install backend dependencies**
```bash
# AI Chat API
cd backend/functions/ai-chat-api && npm install

# Business API
cd ../business-api && npm install

# Business Worker
cd ../business-worker && npm install
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
/workspace/
├── backend/
│   └── functions/
│       ├── ai-chat-api/          # Real-time recipe generator
│       │   ├── index.ts          # Lambda handler
│       │   ├── package.json      # Dependencies
│       │   └── tsconfig.json     # TypeScript config
│       ├── business-api/          # Meal plan API
│       │   ├── index.ts
│       │   ├── package.json
│       │   └── tsconfig.json
│       └── business-worker/       # Async meal plan worker
│           ├── index.ts
│           ├── package.json
│           └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProfileForm.tsx   # User profile management
│   │   │   ├── RecipeGenerator.tsx  # Recipe input form
│   │   │   ├── RecipeDisplay.tsx    # Recipe output display
│   │   │   └── MealPlanner.tsx      # Meal plan interface
│   │   ├── services/
│   │   │   └── api.ts            # API client
│   │   ├── App.tsx               # Main app component
│   │   └── main.tsx              # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── infrastructure/
│   ├── lib/
│   │   └── algospoon-stack.ts    # CDK infrastructure
│   ├── bin/
│   │   └── app.ts                # CDK app
│   ├── package.json
│   ├── cdk.json
│   └── tsconfig.json
├── ARCHITECTURE.md                # Architecture documentation
├── DEPLOYMENT.md                  # Deployment guide
└── README.md                      # This file
```

---

## 🎯 Implementation Phases

### ✅ Phase 1: Foundation (Complete)
- Project setup and structure
- Base infrastructure planning

### ✅ Phase 2: Real-Time AI Recipe Chat (Complete)
- ✅ AI Chat API Lambda function
- ✅ DynamoDB user profile retrieval
- ✅ Bedrock integration with Claude 3 Sonnet
- ✅ Professional Chef/Dietitian system prompt
- ✅ Structured JSON recipe output
- ✅ Frontend recipe generator component

### ✅ Phase 3: Asynchronous Meal Planning (Complete)
- ✅ Business API for plan orchestration
- ✅ EventBridge event bus setup
- ✅ Business Worker Lambda for async processing
- ✅ Multi-day meal plan generation
- ✅ Recipe storage in DynamoDB
- ✅ Frontend meal planner interface

### ✅ Phase 4: Frontend Integration (Complete)
- ✅ React application with TypeScript
- ✅ Profile management form
- ✅ Ingredient input form
- ✅ Structured recipe display
- ✅ Meal planner UI
- ✅ Modern CSS styling

### ✅ Phase 5: AWS CDK Infrastructure (Complete)
- ✅ Complete CDK stack definition
- ✅ DynamoDB tables with GSIs
- ✅ Lambda functions with IAM roles
- ✅ API Gateway REST API
- ✅ EventBridge configuration
- ✅ S3 + CloudFront for frontend
- ✅ Comprehensive documentation

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

## 💰 Cost Estimation

For moderate usage (1000 users, ~10K recipe generations/month):

| Service | Estimated Cost |
|---------|---------------|
| Lambda | $2-5/month |
| DynamoDB | $3-8/month |
| AWS Bedrock | $20-40/month |
| API Gateway | $0.35/month |
| CloudFront | $1/month |
| S3 | $0.10/month |
| **Total** | **~$30-55/month** |

Most costs are pay-per-use, scaling with actual usage.

---

## 📚 Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)**: Detailed architecture and design decisions
- **[DEPLOYMENT.md](DEPLOYMENT.md)**: Step-by-step deployment guide
- **Code Comments**: Inline documentation in all source files

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
cd backend/functions/ai-chat-api
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

## 🚧 Future Enhancements

### Planned Features
- [ ] AWS Cognito authentication
- [ ] Recipe image generation with Stable Diffusion
- [ ] Shopping list generation
- [ ] Recipe ratings and favorites
- [ ] Social sharing
- [ ] Nutrition tracking dashboard
- [ ] Voice interface (Alexa skill)
- [ ] Mobile app (React Native)
- [ ] Recipe search with OpenSearch
- [ ] Multi-language support

### Technical Improvements
- [ ] Unit and integration tests
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Performance optimization with ElastiCache
- [ ] Multi-region deployment
- [ ] Enhanced monitoring with X-Ray
- [ ] Cost optimization with Reserved Capacity

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

## 📝 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **AWS AI Stack Template**: Original serverless architecture inspiration
- **AWS Bedrock Team**: For the amazing Claude 3 integration
- **Anthropic**: For Claude 3 Sonnet model
- **AWS CDK Community**: For excellent IaC tooling

---

## 📞 Support

For issues, questions, or feature requests:
- Create an issue in the repository
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for troubleshooting
- Review CloudWatch logs for error details

---

**Built with ❤️ using AWS Serverless Technologies**
