# Serverless AlgoSpoon AI

A personalized, serverless meal planner and recipe generator powered by **AWS Bedrock**.

**AlgoSpoon AI** is a full-stack, event-driven application that leverages Generative AI to solve the real-world problem of specialized meal planning. It custom-generates recipes based on a user's unique dietary restrictions (e.g., allergies, keto, vegan) and available ingredients.

Built on a robust, serverless architecture derived from the **AWS AI Stack**, this project demonstrates secure user authentication, real-time AI streaming, and complex asynchronous processing on AWS.

---

## Key Technologies

**Infrastructure:** AWS CDK (for serverless services)  
**AI:** AWS Bedrock (LLMs for generation)  
**Backend:** AWS Lambda, API Gateway, DynamoDB, Amazon EventBridge  
**Frontend:** React

---

## Project Status

### ✅ Phase 1: Core Data and Authentication (COMPLETED)

Phase 1 establishes the foundation for AlgoSpoon with:

#### Components Implemented:

1. **Auth Service with Enhanced User Profiles**
   - DynamoDB `AlgoSpoonUsers` table with:
     - User authentication data
     - `dietaryRestrictions` (array) - e.g., ["vegan", "keto", "gluten-free"]
     - `allergies` (array) - e.g., ["peanuts", "shellfish", "dairy"]
     - `targetCalories` (number) - daily caloric target
   - Lambda functions:
     - Register new users with profile data
     - Update user dietary preferences
     - Retrieve user profiles

2. **Recipe Data Store**
   - DynamoDB `AlgoSpoonRecipes` table for storing:
     - User-saved recipes
     - Ingredient lists with quantities
     - Nutritional information
     - Cooking instructions
     - Tags and metadata
   - Lambda functions:
     - Save generated recipes
     - Query user's recipe collection
     - Delete recipes

3. **API Gateway REST API**
   - `/auth/register` - User registration
   - `/auth/profile` - Profile management
   - `/recipes` - Recipe CRUD operations

#### API Endpoints:

```
POST   /auth/register              - Register new user with dietary profile
PUT    /auth/profile               - Update user profile
GET    /auth/profile/{userId}      - Get user profile
POST   /recipes                    - Save a recipe
GET    /recipes/{userId}           - Get all recipes for user
DELETE /recipes/{userId}/{recipeId} - Delete a recipe
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions and API usage examples.

---

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Deploy to AWS**:
   ```bash
   npm run build
   npm run deploy
   ```

3. **Test the API**: See DEPLOYMENT.md for example curl commands

---

## Architecture

```
┌─────────────────┐
│   API Gateway   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼────┐
│ Auth │  │Recipe │
│Lambda│  │Lambda │
└───┬──┘  └──┬────┘
    │        │
┌───▼────────▼───┐
│   DynamoDB     │
│ - Users Table  │
│ - Recipe Table │
└────────────────┘
```

---

## Next Phases

- **Phase 2**: AWS Bedrock integration for AI-powered recipe generation
- **Phase 3**: Real-time streaming responses via WebSockets
- **Phase 4**: EventBridge for asynchronous meal planning workflows
- **Phase 5**: React frontend with beautiful UI

---

## Development

- **Build**: `npm run build`
- **Deploy**: `npm run deploy`
- **Synthesize**: `npm run synth`
- **Destroy**: `npm run destroy`

For detailed information, see [DEPLOYMENT.md](./DEPLOYMENT.md).
