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
┌─────────────────────────────────────────────────────────────────────┐
│                      API Gateway (REST API)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐        │
│  │ /recipes     │  │ /plans       │  │ /profile           │        │
│  │  /generate   │  │  /generate   │  │  /{userId}         │        │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────┘        │
└─────────┼──────────────────┼──────────────────┼────────────────────┘
          │                  │                  │
          │                  │                  │
          ↓                  ↓                  ↓
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Lambda:        │  │  Lambda:        │  │  Lambda:        │
│  AI Chat API    │  │  Business API   │  │  Profile Mgmt   │
│                 │  │                 │  │                 │
│  • Get user     │  │  • Create plan  │  │  • Get profile  │
│    profile      │  │    record       │  │  • Update       │
│  • Generate     │  │  • Publish      │  │    profile      │
│    prompt       │  │    event        │  │                 │
│  • Call Bedrock │  │  • Query plans  │  │                 │
│  • Return JSON  │  │                 │  │                 │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                     │
         │                    │                     │
         ↓                    ↓                     ↓
    ┌────────────────────────────────────────────────────┐
    │              DynamoDB Tables                        │
    │  ┌─────────────┐  ┌──────────────┐  ┌──────────┐  │
    │  │ AuthTable   │  │ MealPlans    │  │ Recipes  │  │
    │  │             │  │  Table       │  │  Table   │  │
    │  │ • userId    │  │ • planId     │  │ • recipeId│ │
    │  │ • dietary   │  │ • status     │  │ • planId  │ │
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
         │ Event Bus         │────→│ Business Worker    │
         │                   │     │                    │
         │ Event:            │     │ • Get user profile │
         │ plan.generate     │     │ • Generate 7-day   │
         │ .requested        │     │   meal plan        │
         └───────────────────┘     │ • Call Bedrock     │
                                   │   iteratively      │
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

**Technology**: React 18 + TypeScript + Vite

**Components**:
1. **ProfileForm**: Manages user dietary preferences
   - Dietary restrictions (vegan, keto, gluten-free, etc.)
   - Allergies (critical - never included in recipes)
   - Cuisine preferences
   - Skill level and cooking time preferences

2. **RecipeGenerator**: Real-time recipe creation
   - Input: Available ingredients
   - Optional: Meal type, servings, additional notes
   - Output: Structured recipe with instructions and nutrition

3. **RecipeDisplay**: Renders structured recipe output
   - Ingredients checklist
   - Step-by-step instructions
   - Nutritional information
   - Dietary compliance badges

4. **MealPlanner**: Multi-day meal plan generation
   - Configure plan duration (1-30 days)
   - Set dietary goals (weight loss, muscle gain, etc.)
   - Asynchronous processing
   - View completed plans

**Hosting**: S3 + CloudFront for global distribution

### API Layer

**Technology**: AWS API Gateway (REST API)

**Endpoints**:

| Endpoint | Method | Lambda | Purpose |
|----------|--------|--------|---------|
| `/recipes/generate` | POST | recipe-generator | Generate single recipe |
| `/plans/generate` | POST | meal-plans | Initiate meal plan generation |
| `/plans` | GET | meal-plans | List user's meal plans |
| `/plans/{planId}` | GET | meal-plans | Get specific meal plan |
| `/profile/{userId}` | GET | profile-get | Get user profile |
| `/profile/{userId}` | PUT | profile-update | Update user profile |

**Features**:
- CORS enabled for frontend
- Request/response logging
- CloudWatch metrics
- (Future) Cognito authentication
- (Future) Rate limiting and throttling

### Compute Layer

**Technology**: AWS Lambda (Node.js 20.x)

#### 1. AI Chat API Lambda

**Purpose**: Real-time recipe generation

**Process Flow**:
```
1. Receive request with ingredients
2. Extract userId from auth context
3. Query DynamoDB AuthTable for user profile
4. Construct system prompt with:
   - Professional Chef/Dietitian persona
   - User's dietary restrictions
   - User's allergies (CRITICAL)
   - Cuisine preferences
   - Skill level
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
- Read from AuthTable
- Invoke Bedrock models

#### 2. Business API Lambda

**Purpose**: Meal plan orchestration

**Process Flow**:
```
1. Receive meal plan request
2. Create plan record in DynamoDB with status "requested"
3. Publish "plan.generate.requested" event to EventBridge
4. Return 202 Accepted with planId
5. (For GET requests) Query and return plans from DynamoDB
```

**Configuration**:
- Memory: 512 MB
- Timeout: 30 seconds

**Permissions**:
- Read/Write MealPlansTable
- Read RecipesTable
- Put Events to EventBridge

#### 3. Business Worker Lambda

**Purpose**: Asynchronous multi-day meal plan generation

**Process Flow**:
```
1. Triggered by EventBridge event
2. Update plan status to "generating"
3. Fetch user profile from AuthTable
4. Construct comprehensive meal planning prompt
5. Call Bedrock to generate full meal plan structure
6. Parse multi-day meal plan JSON
7. Save individual recipes to RecipesTable
8. Update plan record with results
9. Set status to "completed"
```

**Configuration**:
- Memory: 2048 MB
- Timeout: 15 minutes (for complex multi-day plans)

**Permissions**:
- Read from AuthTable
- Read/Write MealPlansTable
- Write to RecipesTable
- Invoke Bedrock models

### Data Layer

**Technology**: Amazon DynamoDB (serverless NoSQL)

#### 1. AuthTable

**Purpose**: Store user dietary profiles

**Schema**:
```typescript
{
  userId: string;              // Partition key
  dietaryRestrictions: string[];
  allergies: string[];         // CRITICAL - never include in recipes
  preferences: {
    cuisineTypes: string[];
    skillLevel: 'beginner' | 'intermediate' | 'advanced';
    cookingTime: string;
  };
  updatedAt: string;
}
```

**Access Patterns**:
- Get user profile by userId (recipe-generator, meal-plan-worker)
- Update user profile (profile-update)

#### 2. MealPlansTable

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
  recipes: Array<DayMealPlan>;
  completedAt?: string;
  error?: string;
}
```

**Indexes**:
- Primary: planId
- GSI: UserIdIndex (userId + createdAt)

**Access Patterns**:
- Get plan by planId
- List user's plans (sorted by date)
- Update plan status (worker)

#### 3. RecipesTable

**Purpose**: Store individual recipe details

**Schema**:
```typescript
{
  recipeId: string;            // Partition key
  planId: string;              // GSI partition key
  userId: string;
  day: number;                 // GSI sort key
  date: string;
  mealType: string;
  recipe: {
    recipeName: string;
    ingredients: Array<Ingredient>;
    instructions: Array<Step>;
    nutritionalInfo: NutritionData;
    // ... full recipe details
  };
  createdAt: string;
}
```

**Indexes**:
- Primary: recipeId
- GSI: PlanIdIndex (planId + day)

**Access Patterns**:
- Get recipes for a plan
- Query recipes by day

### Event Layer

**Technology**: Amazon EventBridge

**Event Bus**: AlgoSpoonEventBus

**Event Patterns**:

```json
{
  "source": "algospoon.meal-plans",
  "detail-type": "plan.generate.requested",
  "detail": {
    "planId": "string",
    "userId": "string",
    "planType": "weekly",
    "dietaryGoal": "low-carb",
    "duration": 7,
    "mealsPerDay": 3
  }
}
```

**Rules**:
- **PlanGenerateRule**: Routes plan generation events to Business Worker Lambda

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
- Preferred Cuisines: [list]
- Skill Level: [level]

OUTPUT FORMAT REQUIREMENTS:
[Detailed JSON schema for structured output]
```

**Temperature Settings**:
- Recipe generation: 0.7 (balanced creativity)
- Meal planning: 0.8 (higher variety across days)

**Token Limits**:
- Single recipe: 4096 tokens
- Multi-day plan: 8192 tokens

## Data Flow

### Real-Time Recipe Generation (Phase 2)

```
User Input (ingredients) 
  → API Gateway
  → AI Chat API Lambda
  → Fetch User Profile (DynamoDB)
  → Generate Personalized Prompt
  → Bedrock Claude 3 Sonnet
  → Parse JSON Response
  → Return Structured Recipe
  → Display in React Frontend
```

**Latency**: ~5-15 seconds

### Asynchronous Meal Planning (Phase 3)

```
User Request (7-day plan)
  → API Gateway
  → Business API Lambda
  → Create Plan Record (status: requested)
  → Publish EventBridge Event
  → Return 202 Accepted
  
[Async Processing]
EventBridge Event
  → Trigger Business Worker Lambda
  → Update Status (generating)
  → Fetch User Profile
  → Generate Full Meal Plan (Bedrock)
  → Save Individual Recipes (DynamoDB)
  → Update Plan Record (completed)

[User Polls]
Frontend Polls GET /plans/{planId}
  → When status = completed
  → Display Full Meal Plan
```

**Latency**: 2-5 minutes for 7-day plan

## Security Architecture

### IAM Roles

**recipe-generator-role**:
- `dynamodb:GetItem` on AuthTable
- `bedrock:InvokeModel` on Claude models

**meal-plans-role**:
- `dynamodb:GetItem`, `PutItem`, `Query` on MealPlansTable
- `dynamodb:Query` on RecipesTable
- `events:PutEvents` on AlgoSpoonEventBus

**meal-plan-worker-role**:
- `dynamodb:GetItem` on AuthTable
- `dynamodb:GetItem`, `UpdateItem` on MealPlansTable
- `dynamodb:BatchWriteItem` on RecipesTable
- `bedrock:InvokeModel` on Claude models

### Data Protection

- **DynamoDB**: AWS-managed encryption at rest
- **DynamoDB Tables**: Point-in-time recovery enabled
- **S3**: Block all public access
- **CloudFront**: HTTPS only
- **API Gateway**: HTTPS only

### Future Security Enhancements

1. **AWS Cognito** for user authentication
2. **API Gateway Authorizers** for endpoint protection
3. **AWS WAF** for API protection
4. **VPC Integration** for Lambda functions
5. **Secrets Manager** for sensitive configuration

## Scalability

### Horizontal Scaling

- **Lambda**: Auto-scales with concurrent executions
- **DynamoDB**: On-demand capacity (auto-scaling)
- **API Gateway**: Handles millions of requests
- **CloudFront**: Global edge network

### Performance Optimization

1. **DynamoDB**:
   - GSIs for efficient querying
   - BatchWriteItem for bulk operations
   - DynamoDB Streams for real-time processing

2. **Lambda**:
   - Appropriate memory allocation
   - Connection pooling for DynamoDB
   - Async event processing

3. **Frontend**:
   - CloudFront caching
   - Asset optimization
   - Code splitting

## Monitoring and Observability

### CloudWatch Integration

**Metrics**:
- Lambda invocations, duration, errors
- API Gateway requests, latency, 4XX/5XX
- DynamoDB read/write capacity, throttles
- Bedrock token usage, latency

**Logs**:
- Lambda function logs (7-day retention)
- API Gateway access logs
- EventBridge event logs

**Alarms** (Future):
- Lambda error rate > 5%
- API Gateway latency > 3s
- DynamoDB throttling events

### Distributed Tracing

- **AWS X-Ray** integration for end-to-end tracing (Future)

## Cost Analysis

### Estimated Monthly Costs (1000 users, moderate usage)

| Service | Usage | Cost |
|---------|-------|------|
| Lambda | 100K invocations, 5s avg | $2 |
| DynamoDB | 1M reads, 100K writes | $3 |
| Bedrock | 50M tokens | $25 |
| API Gateway | 100K requests | $0.35 |
| CloudFront | 10GB transfer | $0.85 |
| S3 | 1GB storage | $0.02 |
| **Total** | | **~$31/month** |

### Cost Optimization Strategies

1. **Bedrock**: Cache common recipes
2. **Lambda**: Right-size memory allocation
3. **DynamoDB**: Use on-demand for unpredictable traffic
4. **CloudFront**: Optimize cache TTL

## Disaster Recovery

### Backup Strategy

- **DynamoDB**: Point-in-time recovery (35 days)
- **DynamoDB**: On-demand backups for critical tables
- **S3**: Versioning enabled for website assets

### Recovery Objectives

- **RTO** (Recovery Time Objective): < 1 hour
- **RPO** (Recovery Point Objective): < 5 minutes

### Multi-Region (Future)

- Deploy stack in secondary region
- Route53 health checks and failover
- DynamoDB global tables

## Compliance and Data Privacy

### Data Residency

- All data stored in specified AWS region
- No cross-region data transfer (except CloudFront)

### User Data Handling

- Dietary restrictions and allergies are PII
- User consent required for data collection
- Data retention policies (user-controlled deletion)

### GDPR Compliance (Future)

- Right to access (GET /profile)
- Right to rectification (PUT /profile)
- Right to erasure (DELETE /profile)
- Data portability (export functionality)

## Future Enhancements

### Phase 6: Advanced Features

1. **Image Generation**: Use Stable Diffusion for recipe photos
2. **Voice Interface**: Alexa skill for hands-free cooking
3. **Shopping List**: Auto-generate from meal plans
4. **Recipe Ratings**: User feedback and ML-based recommendations
5. **Social Sharing**: Share recipes and meal plans
6. **Nutrition Tracking**: Daily/weekly nutrition summaries
7. **Grocery Delivery**: Integration with Instacart/Amazon Fresh

### Phase 7: ML Enhancements

1. **Personalization**: Learn from user preferences
2. **Recipe Recommendations**: Collaborative filtering
3. **Seasonal Ingredients**: Time-based suggestions
4. **Budget Optimization**: Cost-effective meal planning
