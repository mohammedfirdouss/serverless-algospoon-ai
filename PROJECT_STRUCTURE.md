# AlgoSpoon AI - Project Structure

This document describes the organization and structure of the AlgoSpoon AI project.

## Directory Structure

```
algospoon-ai/
├── bin/
│   └── algospoon.ts                    # CDK app entry point
├── lib/
│   ├── algospoon-stack.ts              # Main CDK stack
│   ├── auth-service.ts                 # Auth service construct
│   └── recipe-data-store.ts            # Recipe data store construct
├── services/
│   ├── auth/
│   │   ├── register/
│   │   │   ├── index.ts                # User registration handler
│   │   │   └── package.json
│   │   ├── update-profile/
│   │   │   ├── index.ts                # Profile update handler
│   │   │   └── package.json
│   │   └── get-user/
│   │       ├── index.ts                # Get user handler
│   │       └── package.json
│   ├── recipes/
│   │   ├── save-recipe/
│   │   │   ├── index.ts                # Save recipe handler
│   │   │   └── package.json
│   │   ├── get-recipes/
│   │   │   ├── index.ts                # Get recipes handler
│   │   │   └── package.json
│   │   └── delete-recipe/
│   │       ├── index.ts                # Delete recipe handler
│   │       └── package.json
│   └── tsconfig.json                   # TypeScript config for services
├── scripts/
│   └── install-all.sh                  # Install all dependencies script
├── cdk.json                            # CDK configuration
├── tsconfig.json                       # Root TypeScript configuration
├── package.json                        # Root package.json
├── .gitignore                          # Git ignore rules
├── README.md                           # Project overview
├── DEPLOYMENT.md                       # Deployment guide
└── PROJECT_STRUCTURE.md                # This file
```

## Infrastructure Components

### CDK Stack (`lib/algospoon-stack.ts`)

The main CDK stack that orchestrates all components:
- Creates API Gateway
- Instantiates Auth Service
- Instantiates Recipe Data Store
- Outputs important resource identifiers

### Auth Service (`lib/auth-service.ts`)

Manages user authentication and profiles:
- **DynamoDB Table**: `AlgoSpoonUsers`
  - Primary Key: `userId`
  - GSI: `EmailIndex` (on `email`)
  - Attributes: `dietaryRestrictions`, `allergies`, `targetCalories`
- **Lambda Functions**: Register, UpdateProfile, GetUser
- **API Endpoints**: `/auth/register`, `/auth/profile`, `/auth/profile/{userId}`

### Recipe Data Store (`lib/recipe-data-store.ts`)

Manages recipe storage and retrieval:
- **DynamoDB Table**: `AlgoSpoonRecipes`
  - Primary Key: `userId` (partition), `recipeId` (sort)
  - GSI: `RecipeTypeIndex` (on `recipeType` and `createdAt`)
- **Lambda Functions**: SaveRecipe, GetRecipes, DeleteRecipe
- **API Endpoints**: `/recipes`, `/recipes/{userId}`, `/recipes/{userId}/{recipeId}`

## Lambda Functions

All Lambda functions are written in TypeScript and use:
- **Runtime**: Node.js 20.x
- **AWS SDK v3**: For DynamoDB operations
- **Memory**: 512 MB
- **Timeout**: 30 seconds
- **Log Retention**: 7 days

### Auth Service Functions

1. **Register** (`services/auth/register/`)
   - Creates new user with profile data
   - Validates email uniqueness
   - Stores dietary preferences

2. **Update Profile** (`services/auth/update-profile/`)
   - Updates user dietary restrictions
   - Updates allergies and target calories
   - Validates user existence

3. **Get User** (`services/auth/get-user/`)
   - Retrieves user profile by ID
   - Excludes password hash from response

### Recipe Service Functions

1. **Save Recipe** (`services/recipes/save-recipe/`)
   - Saves generated recipes with ingredients
   - Stores nutritional information
   - Validates user existence

2. **Get Recipes** (`services/recipes/get-recipes/`)
   - Retrieves all recipes for a user
   - Returns sorted by creation date

3. **Delete Recipe** (`services/recipes/delete-recipe/`)
   - Deletes a specific recipe
   - Validates recipe ownership

## Data Models

### User Profile

```typescript
{
  userId: string;              // UUID
  email: string;               // Unique email
  name: string;                // User's name
  passwordHash: string;        // Hashed password
  dietaryRestrictions: string[]; // e.g., ["vegan", "keto"]
  allergies: string[];         // e.g., ["peanuts", "dairy"]
  targetCalories: number;      // Daily caloric target
  createdAt: string;           // ISO timestamp
  updatedAt: string;           // ISO timestamp
}
```

### Recipe

```typescript
{
  userId: string;              // User who saved the recipe
  recipeId: string;            // UUID
  recipeName: string;          // Recipe title
  recipeType: string;          // e.g., "breakfast", "lunch", "dinner"
  ingredients: Ingredient[];   // List of ingredients
  instructions: string[];      // Step-by-step instructions
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber?: number;
    sugar?: number;
  };
  servings: number;            // Number of servings
  prepTime?: number;           // Prep time in minutes
  cookTime?: number;           // Cook time in minutes
  tags: string[];              // Recipe tags
  createdAt: string;           // ISO timestamp
  updatedAt: string;           // ISO timestamp
}
```

### Ingredient

```typescript
{
  name: string;                // Ingredient name
  quantity: string;            // Amount (e.g., "2", "1.5")
  unit: string;                // Unit (e.g., "cups", "tbsp")
}
```

## API Gateway

### Authentication Endpoints

- **POST /auth/register**
  - Register new user with dietary profile
  - Body: `{ email, name, password, dietaryRestrictions?, allergies?, targetCalories? }`
  - Response: User object (without password)

- **PUT /auth/profile**
  - Update user profile
  - Body: `{ userId, name?, dietaryRestrictions?, allergies?, targetCalories? }`
  - Response: Updated user object

- **GET /auth/profile/{userId}**
  - Get user profile
  - Response: User object (without password)

### Recipe Endpoints

- **POST /recipes**
  - Save a recipe
  - Body: `{ userId, recipeName, recipeType?, ingredients, instructions, ... }`
  - Response: Saved recipe object

- **GET /recipes/{userId}**
  - Get all recipes for a user
  - Response: `{ recipes: Recipe[], count: number }`

- **DELETE /recipes/{userId}/{recipeId}**
  - Delete a recipe
  - Response: `{ message, recipeId }`

## Development Workflow

1. **Install dependencies**: `./scripts/install-all.sh`
2. **Build TypeScript**: `npm run build`
3. **Synthesize CDK**: `npm run synth`
4. **Deploy to AWS**: `npm run deploy`
5. **Test endpoints**: Use curl or Postman with examples from DEPLOYMENT.md

## Next Phases

- **Phase 2**: AWS Bedrock integration for recipe generation
- **Phase 3**: WebSocket API for real-time streaming
- **Phase 4**: EventBridge for meal planning workflows
- **Phase 5**: React frontend application

## Technologies Used

- **Infrastructure as Code**: AWS CDK (TypeScript)
- **Compute**: AWS Lambda (Node.js 20.x)
- **Database**: Amazon DynamoDB
- **API**: Amazon API Gateway (REST)
- **Language**: TypeScript
- **AWS SDK**: AWS SDK v3
- **Package Manager**: npm

## Security Considerations

Current implementation includes:
- CORS configuration
- Input validation
- Error handling
- CloudWatch logging

Production recommendations:
- Implement AWS Cognito for authentication
- Use bcrypt for password hashing
- Add API Gateway authorizers
- Enable AWS WAF
- Implement rate limiting
- Use AWS Secrets Manager
- Enable encryption at rest and in transit
- Add input sanitization
- Implement comprehensive error handling
