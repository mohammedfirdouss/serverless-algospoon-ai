# AlgoSpoon AI - Architecture Documentation

## Overview

AlgoSpoon is a serverless, event-driven application that leverages AWS Bedrock's Generative AI capabilities to create personalized recipes and meal plans based on user dietary restrictions, allergies, and available ingredients.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CloudFront CDN                              │
│                     (React Frontend Distribution)                    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ HTTPS
                             ↓
                    ┌─────────────────┐
                    │ Cognito         │
                    │ User Pool       │
                    │ (Auth)          │
                    └────────┬────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      API Gateway (REST API)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐        │
│  │ /recipes     │  │ /plans       │  │ /auth              │        │
│  │  /generate   │  │  /generate   │  │  /register         │        │
│  │              │  │              │  │  /profile          │        │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────┘        │
└─────────┼──────────────────┼──────────────────┼────────────────────┘
          │                  │                  │
          │                  │                  │
          ↓                  ↓                  ↓
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Lambda:        │  │  Lambda:        │  │  Lambda:        │
│  Recipe Gen     │  │  Meal Plans     │  │  Auth Service   │
│                 │  │                 │  │                 │
│  • Get user     │  │  • Create plan  │  │  • Register     │
│    profile      │  │    record       │  │  • Get profile  │
│  • Generate     │  │  • Publish      │  │  • Update       │
│    prompt       │  │    event        │  │    profile      │
│  • Call Bedrock │  │  • Query plans  │  │                 │
│  • Return JSON  │  │                 │  │                 │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                     │
         │                    │                     │
         ↓                    ↓                     ↓
    ┌────────────────────────────────────────────────────┐
    │              DynamoDB Tables                        │
    │  ┌─────────────┐  ┌──────────────┐  ┌──────────┐  │
    │  │ AlgoSpoon   │  │ AlgoSpoon    │  │ AlgoSpoon│  │
    │  │ Users       │  │ MealPlans    │  │ Recipes  │  │
    │  │             │  │              │  │          │  │
    │  │ • userId    │  │ • planId     │  │ • userId │  │
    │  │ • dietary   │  │ • status     │  │ • recipeId│ │
    │  │   restrict. │  │ • recipes    │  │ • recipe  │ │
    │  │ • allergies │  │              │  │   data    │ │
    │  └─────────────┘  └──────────────┘  └──────────┘  │
    └────────────────────────────────────────────────────┘
                             ↑
                             │
            ┌────────────────┴─────────────────┐
            │                                  │
         ┌──┴────────────────┐     ┌──────────┴─────────┐
         │ EventBridge       │     │ Lambda:            │
         │ Event Bus         │────→│ Meal Plan Worker   │
         │                   │     │                    │
         │ Event:            │     │ • Get user profile │
         │ plan.generate     │     │ • Generate meal    │
         │ .requested        │     │   plan             │
         └───────────────────┘     │ • Call Bedrock     │
                                   │ • Save recipes     │
                                   │ • Update status    │
                                   └──────────┬─────────┘
                                              │
                                              ↓
                                   ┌──────────────────────┐
                                   │  AWS Bedrock        │
                                   │  Claude 3 Sonnet    │
                                   │                     │
                                   │  • Recipe gen       │
                                   │  • Meal planning    │
                                   │  • Nutrition calc   │
                                   └─────────────────────┘
```

## Component Details

### Frontend Layer

**Technology**: React 18 + TypeScript + Vite + AWS Amplify UI

**Components**:
1. **Authenticator**: AWS Amplify UI wrapper for Cognito authentication
2. **ProfileForm**: Manages user dietary preferences and allergies
3. **RecipeGenerator**: Real-time recipe creation from ingredients
4. **MealPlanner**: Multi-day meal plan generation with async processing

**Hosting**: S3 + CloudFront for global distribution

**Authentication**: Cognito User Pool via AWS Amplify

### API Layer

**Technology**: AWS API Gateway (REST API)

**Authentication**: Cognito User Pools Authorizer

**Endpoints**:

| Endpoint | Method | Lambda | Purpose |
|----------|--------|--------|---------|
| `/recipes/generate` | POST | recipe-generator | Generate single recipe |
| `/plans/generate` | POST | meal-plans | Initiate meal plan generation |
| `/plans` | GET | meal-plans | List user's meal plans |
| `/plans/{planId}` | GET | meal-plans | Get specific meal plan |
| `/auth/register` | POST | register | Register new user |
| `/auth/profile/{userId}` | GET | get-user | Get user profile |
| `/auth/profile` | PUT | update-profile | Update user profile |
| `/recipes` | POST | save-recipe | Save a recipe |
| `/recipes/{userId}` | GET | get-recipes | Get user's saved recipes |
| `/recipes/{userId}/{recipeId}` | DELETE | delete-recipe | Delete a recipe |

**Features**:
- CORS enabled for frontend
- Request/response logging
- CloudWatch metrics
- Cognito authentication (implemented)
- Throttling and rate limiting (configurable per environment)

### Compute Layer

**Technology**: AWS Lambda (Node.js 20.x)

#### 1. Recipe Generator Lambda

**Location**: `backend/functions/recipe-generator/`

**Purpose**: Real-time recipe generation using Bedrock

**Process Flow**:
```
1. Receive request with ingredients
2. Extract userId from Cognito authorizer context
3. Query DynamoDB AlgoSpoonUsers for user profile
4. Construct system prompt with:
   - Professional Chef/Dietitian persona
   - User's dietary restrictions
   - User's allergies (CRITICAL)
   - Cuisine preferences
5. Build user message with ingredients and preferences
6. Call Bedrock Claude 3 Sonnet with ConverseStream API
7. Parse JSON response
8. Validate and return structured recipe
```

**Configuration**:
- Memory: 1024 MB
- Timeout: 60 seconds
- Runtime: Node.js 20.x

**Permissions**:
- Read from AlgoSpoonUsers table
- Invoke Bedrock models

#### 2. Meal Plans Lambda

**Location**: `backend/functions/meal-plans/`

**Purpose**: Meal plan orchestration and management

**Process Flow**:
```
1. Receive meal plan request (POST) or query (GET)
2. For POST: Create plan record with status "requested"
3. Publish "plan.generate.requested" event to EventBridge
4. Return 202 Accepted with planId
5. For GET: Query and return plans from DynamoDB
```

**Configuration**:
- Memory: 512 MB
- Timeout: 30 seconds

**Permissions**:
- Read/Write AlgoSpoonMealPlans table
- Read AlgoSpoonRecipes table
- Put Events to EventBridge

#### 3. Meal Plan Worker Lambda

**Location**: `backend/functions/meal-plan-worker/`

**Purpose**: Asynchronous multi-day meal plan generation

**Process Flow**:
```
1. Triggered by EventBridge event
2. Update plan status to "generating"
3. Fetch user profile from AlgoSpoonUsers
4. Construct comprehensive meal planning prompt
5. Call Bedrock to generate full meal plan structure
6. Parse multi-day meal plan JSON
7. Save individual recipes to AlgoSpoonRecipes
8. Update plan record with results
9. Set status to "completed"
```

**Configuration**:
- Memory: 2048 MB
- Timeout: 15 minutes (for complex multi-day plans)

**Permissions**:
- Read from AlgoSpoonUsers
- Read/Write AlgoSpoonMealPlans
- Write to AlgoSpoonRecipes
- Invoke Bedrock models

#### 4. Auth Service Lambdas

**Location**: `services/auth/`

**Functions**:
- **register**: Create new user profile
- **get-user**: Retrieve user profile by userId
- **update-profile**: Update user dietary preferences

**Configuration**:
- Memory: 512 MB
- Timeout: 30 seconds

**Permissions**:
- Read/Write AlgoSpoonUsers table

#### 5. Recipe Data Store Lambdas

**Location**: `services/recipes/`

**Functions**:
- **save-recipe**: Save a generated recipe
- **get-recipes**: Retrieve user's saved recipes
- **delete-recipe**: Delete a specific recipe

**Configuration**:
- Memory: 512 MB
- Timeout: 30 seconds

**Permissions**:
- Read/Write AlgoSpoonRecipes table

### Data Layer

**Technology**: Amazon DynamoDB (serverless NoSQL)

#### 1. AlgoSpoonUsers Table

**Purpose**: Store user profiles with dietary information

**Schema**:
```typescript
{
  userId: string;              // Partition key (from Cognito)
  email: string;               // Indexed via EmailIndex GSI
  name: string;
  passwordHash: string;        // For non-Cognito auth flows
  dietaryRestrictions: string[];
  allergies: string[];         // CRITICAL - never include in recipes
  targetCalories: number;
  createdAt: string;
  updatedAt: string;
}
```

**Indexes**:
- Primary: userId
- GSI: EmailIndex (email)

**Access Patterns**:
- Get user profile by userId
- Query by email (registration check)
- Update user profile

#### 2. AlgoSpoonMealPlans Table

**Purpose**: Store meal plan metadata and results

**Schema**:
```typescript
{
  planId: string;              // Partition key
  userId: string;              // GSI partition key
  createdAt: string;           // GSI sort key
  status: 'requested' | 'generating' | 'completed' | 'failed';
  planType: string;
  dietaryGoal?: string;
  startDate: string;
  duration: number;
  mealsPerDay: number;
  recipes?: Array<DayMealPlan>;
  completedAt?: string;
  error?: string;
  updatedAt: string;
}
```

**Indexes**:
- Primary: planId
- GSI: UserIdIndex (userId + createdAt)

**Access Patterns**:
- Get plan by planId
- List user's plans (sorted by date)
- Update plan status (worker)

#### 3. AlgoSpoonRecipes Table

**Purpose**: Store user-saved recipes and meal plan recipes

**Schema**:
```typescript
{
  userId: string;              // Partition key
  recipeId: string;            // Sort key
  recipeType?: string;         // GSI partition key
  createdAt: string;           // GSI sort key
  recipe: {
    recipeName: string;
    ingredients: Array<Ingredient>;
    instructions: Array<Step>;
    nutritionalInfo: NutritionData;
    prepTime: string;
    cookTime: string;
    servings: number;
  };
  planId?: string;             // If from meal plan
  day?: number;                // If from meal plan
}
```

**Indexes**:
- Primary: userId + recipeId
- GSI: RecipeTypeIndex (recipeType + createdAt)

**Access Patterns**:
- Get user's recipes
- Query recipes by type
- Save new recipe
- Delete recipe

### Authentication Layer

**Technology**: AWS Cognito + AWS Amplify

**Cognito User Pool**:
- Email and username sign-in
- Email verification required
- Password policy (8+ chars, uppercase, lowercase, digits)
- Self-service account recovery

**User Pool Client**:
- Web application client
- User password and SRP auth flows
- No OAuth flows (direct authentication)

**API Gateway Authorizer**:
- Cognito User Pools authorizer
- Validates JWT tokens from Cognito
- Passes user claims to Lambda context

### Event Layer

**Technology**: Amazon EventBridge

**Event Bus**: AlgoSpoonEventBus

**Event Patterns**:

```json
{
  "source": "algospoon.business-api",
  "detail-type": "plan.generate.requested",
  "detail": {
    "planId": "string",
    "userId": "string",
    "planType": "weekly",
    "dietaryGoal": "low-carb",
    "duration": 7,
    "mealsPerDay": 3,
    "additionalRequirements": "string"
  }
}
```

**Rules**:
- **PlanGenerateRule**: Routes plan generation events to Meal Plan Worker Lambda with 2 retry attempts

**Benefits**:
- Decouples API from worker
- Enables async processing
- Built-in retry logic
- Easy to add more subscribers

### AI Layer

**Technology**: AWS Bedrock (Claude 3 Sonnet)

**Model**: `anthropic.claude-3-sonnet-20240229-v1:0`

**API**: ConverseStream for streaming responses

**Prompt Engineering**:

**System Prompt Structure**:
```
You are a Professional Chef and Registered Dietitian AI assistant.

USER'S DIETARY PROFILE:
- CRITICAL ALLERGIES: [list] - NEVER include these
- Dietary Restrictions: [list]
- Target Calories: [number]

OUTPUT FORMAT REQUIREMENTS:
[Detailed JSON schema for structured output]
```

**Inference Configuration**:
- Temperature: 0.7 (balanced creativity)
- Max Tokens: 4096 (single recipe), 8192 (meal plans)
- Top P: 0.9

## Data Flow

### Real-Time Recipe Generation

```
User Input (ingredients) 
  → API Gateway (Cognito auth)
  → Recipe Generator Lambda
  → Fetch User Profile (AlgoSpoonUsers)
  → Generate Personalized Prompt
  → Bedrock Claude 3 Sonnet
  → Parse JSON Response
  → Return Structured Recipe
  → Display in React Frontend
```

**Latency**: ~5-15 seconds

### Asynchronous Meal Planning

```
User Request (7-day plan)
  → API Gateway (Cognito auth)
  → Meal Plans Lambda
  → Create Plan Record (status: requested)
  → Publish EventBridge Event
  → Return 202 Accepted with planId
  
[Async Processing]
EventBridge Event
  → Trigger Meal Plan Worker Lambda
  → Update Status (generating)
  → Fetch User Profile
  → Generate Full Meal Plan (Bedrock)
  → Save Individual Recipes (AlgoSpoonRecipes)
  → Update Plan Record (completed)

[User Polls]
Frontend Polls GET /plans/{planId}
  → When status = completed
  → Display Full Meal Plan
```

**Latency**: 2-5 minutes for 7-day plan

## Security Architecture

### Authentication & Authorization

- **Cognito User Pool**: Centralized user authentication
- **JWT Tokens**: Secure, stateless authentication
- **API Gateway Authorizer**: Validates tokens on every request
- **IAM Roles**: Least-privilege access for Lambda functions

### IAM Roles

**recipe-generator-role**:
- `dynamodb:GetItem` on AlgoSpoonUsers
- `bedrock:InvokeModel` on Claude models

**meal-plans-role**:
- `dynamodb:GetItem`, `PutItem`, `Query` on AlgoSpoonMealPlans
- `dynamodb:Query` on AlgoSpoonRecipes
- `events:PutEvents` on AlgoSpoonEventBus

**meal-plan-worker-role**:
- `dynamodb:GetItem` on AlgoSpoonUsers
- `dynamodb:GetItem`, `UpdateItem` on AlgoSpoonMealPlans
- `dynamodb:PutItem` on AlgoSpoonRecipes
- `bedrock:InvokeModel` on Claude models

**auth-service-role**:
- `dynamodb:GetItem`, `PutItem`, `Query`, `UpdateItem` on AlgoSpoonUsers

**recipe-data-store-role**:
- `dynamodb:GetItem`, `PutItem`, `Query`, `DeleteItem` on AlgoSpoonRecipes

### Data Protection

- **DynamoDB**: AWS-managed encryption at rest
- **DynamoDB Tables**: Point-in-time recovery enabled (production)
- **S3**: Block all public access, versioning enabled
- **CloudFront**: HTTPS only
- **API Gateway**: HTTPS only
- **Cognito**: Secure password policies and MFA support

## Infrastructure as Code

### CDK Structure

**Entry Point**: `bin/algospoon.ts`

**Main Stack**: `lib/algospoon-stack.ts`

**Constructs**:
- **AuthService** (`lib/auth-service.ts`): User management
- **BedrockService** (`lib/bedrock-service.ts`): AI recipe/meal plan generation
- **RecipeDataStore** (`lib/recipe-data-store.ts`): Recipe storage
- **FrontendDeployment** (`lib/frontend-deployment.ts`): S3 + CloudFront
- **Monitoring** (`lib/monitoring.ts`): CloudWatch dashboards (optional)
- **Waf** (`lib/waf.ts`): API protection (optional)

**Environment Configuration**: `lib/config.ts`
- Supports dev, staging, prod environments
- Environment-specific settings for DynamoDB, Lambda, monitoring, WAF

**Deployment**: `scripts/deploy-and-configure.sh`
- Deploys CDK stack
- Extracts CloudFormation outputs
- Configures frontend `.env` file automatically

## Scalability

### Horizontal Scaling

- **Lambda**: Auto-scales with concurrent executions
- **DynamoDB**: On-demand capacity (auto-scaling)
- **API Gateway**: Handles millions of requests
- **CloudFront**: Global edge network
- **Cognito**: Scales to millions of users

### Performance Optimization

1. **DynamoDB**:
   - GSIs for efficient querying
   - On-demand billing for unpredictable traffic
   - Point-in-time recovery for production

2. **Lambda**:
   - Right-sized memory allocation (512MB - 2048MB)
   - Connection pooling for DynamoDB
   - Async event processing via EventBridge

3. **Frontend**:
   - CloudFront caching
   - Asset optimization via Vite
   - Code splitting

## Monitoring and Observability

### CloudWatch Integration

**Metrics**:
- Lambda invocations, duration, errors, concurrent executions
- API Gateway requests, latency, 4XX/5XX errors
- DynamoDB read/write capacity, throttles
- Bedrock token usage, latency

**Logs**:
- Lambda function logs (7-day retention default, 30 days in prod)
- API Gateway access logs
- EventBridge event logs

**Dashboards** (optional, enabled via config):
- API Gateway metrics
- Lambda performance
- DynamoDB operations
- Custom alarms for error rates and latency

## Cost Optimization

### Estimated Monthly Costs (1000 users, moderate usage)

| Service | Usage | Cost |
|---------|-------|------|
| Lambda | 100K invocations, 5s avg | $2 |
| DynamoDB | 1M reads, 100K writes | $3 |
| Bedrock | 50M tokens | $25 |
| API Gateway | 100K requests | $0.35 |
| CloudFront | 10GB transfer | $0.85 |
| S3 | 1GB storage | $0.02 |
| Cognito | 1K MAUs | Free (under 50K) |
| **Total** | | **~$31/month** |

### Cost Optimization Strategies

1. **Bedrock**: Use Claude 3 Haiku for dev (cheaper), Sonnet for prod
2. **Lambda**: Right-size memory allocation
3. **DynamoDB**: On-demand billing for unpredictable traffic
4. **CloudFront**: Optimize cache TTL and price class

## Future Enhancements

### Advanced Features

1. **WAF Integration**: Rate limiting and DDoS protection (configurable)
2. **Image Generation**: Recipe photos using Stable Diffusion
3. **Voice Interface**: Alexa skill for hands-free cooking
4. **Shopping List**: Auto-generate from meal plans
5. **Recipe Ratings**: User feedback and ML-based recommendations
6. **Social Sharing**: Share recipes and meal plans
7. **Nutrition Tracking**: Daily/weekly nutrition summaries
8. **Multi-Region**: Deploy to multiple regions for HA

### ML Enhancements

1. **Personalization**: Learn from user preferences over time
2. **Recipe Recommendations**: Collaborative filtering
3. **Seasonal Ingredients**: Time-based suggestions
4. **Budget Optimization**: Cost-effective meal planning
