import { EventBridgeEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { BedrockRuntimeClient, ConverseStreamCommand } from '@aws-sdk/client-bedrock-runtime';
import type { MealPlanDay } from '@shared/types/meal-plan';
import type { UserProfile } from '@shared/types/user';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

const AUTH_TABLE_NAME = process.env.AUTH_TABLE_NAME || 'AlgoSpoonAuthTable';
const PLANS_TABLE_NAME = process.env.PLANS_TABLE_NAME || 'AlgoSpoonMealPlansTable';
const RECIPES_TABLE_NAME = process.env.RECIPES_TABLE_NAME || 'AlgoSpoonRecipesTable';
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0';

interface PlanGenerateRequestedEvent {
  planId: string;
  userId: string;
  planType: string;
  dietaryGoal?: string;
  startDate: string;
  duration: number;
  mealsPerDay: number;
  additionalRequirements?: string;
}

/**
 * Main Lambda handler for Business Worker
 * Processes EventBridge events for meal plan generation
 */
export const handler = async (event: EventBridgeEvent<string, PlanGenerateRequestedEvent>) => {
  console.log('Business Worker invoked:', JSON.stringify(event, null, 2));

  try {
    const { detail } = event;
    
    if (event['detail-type'] === 'plan.generate.requested') {
      await handlePlanGenerateRequested(detail);
    } else {
      console.log(`Unhandled event type: ${event['detail-type']}`);
    }

  } catch (error) {
    console.error('Error in Business Worker:', error);
    throw error;
  }
};

/**
 * Handles plan.generate.requested event
 * Orchestrates the multi-step meal plan generation
 */
async function handlePlanGenerateRequested(detail: PlanGenerateRequestedEvent): Promise<void> {
  const { planId, userId, dietaryGoal, startDate, duration, mealsPerDay, additionalRequirements } = detail;

  try {
    // Update plan status to generating
    await updatePlanStatus(planId, 'generating');

    // Step 1: Retrieve user profile
    console.log(`Fetching profile for user: ${userId}`);
    const userProfile = await getUserProfile(userId);

    // Step 2: Generate the meal plan using Bedrock
    console.log(`Generating ${duration}-day meal plan for user ${userId}`);
    const mealPlan = await generateMealPlan(
      userProfile,
      dietaryGoal,
      startDate,
      duration,
      mealsPerDay,
      additionalRequirements
    );

    // Step 3: Save recipes to recipes table
    console.log(`Saving ${mealPlan.length} days of recipes`);
    await saveRecipes(planId, userId, mealPlan);

    // Step 4: Update plan with results
    await updatePlanWithResults(planId, mealPlan);

    console.log(`Successfully generated meal plan ${planId}`);

  } catch (error) {
    console.error(`Error generating plan ${planId}:`, error);
    await updatePlanStatus(planId, 'failed', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

/**
 * Retrieves user's dietary profile from DynamoDB
 */
async function getUserProfile(userId: string): Promise<UserProfile> {
  const command = new GetCommand({
    TableName: AUTH_TABLE_NAME,
    Key: { userId },
  });

  const response = await docClient.send(command);
  
  if (!response.Item) {
    return {
      userId,
      dietaryRestrictions: [],
      allergies: [],
    };
  }

  return response.Item as UserProfile;
}

/**
 * Updates the meal plan status in DynamoDB
 */
async function updatePlanStatus(
  planId: string,
  status: 'generating' | 'completed' | 'failed',
  errorMessage?: string
): Promise<void> {
  const updateExpression = errorMessage
    ? 'SET #status = :status, updatedAt = :updatedAt, #error = :error'
    : 'SET #status = :status, updatedAt = :updatedAt';

  const expressionAttributeValues: any = {
    ':status': status,
    ':updatedAt': new Date().toISOString(),
  };

  const expressionAttributeNames: any = {
    '#status': 'status',
  };

  if (errorMessage) {
    expressionAttributeValues[':error'] = errorMessage;
    expressionAttributeNames['#error'] = 'error';
  }

  await docClient.send(new UpdateCommand({
    TableName: PLANS_TABLE_NAME,
    Key: { planId },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames,
  }));
}

/**
 * Generates a multi-day meal plan using Bedrock
 */
async function generateMealPlan(
  userProfile: UserProfile,
  dietaryGoal: string | undefined,
  startDate: string,
  duration: number,
  mealsPerDay: number,
  additionalRequirements?: string
): Promise<DayMealPlan[]> {
  const systemPrompt = generateMealPlanSystemPrompt(userProfile, dietaryGoal);
  
  const userMessage = `Generate a ${duration}-day meal plan with ${mealsPerDay} meals per day.
Start Date: ${startDate}
${additionalRequirements ? `Additional Requirements: ${additionalRequirements}` : ''}

Please ensure variety across days and balance of nutrients throughout the week.`;

  const command = new ConverseStreamCommand({
    modelId: BEDROCK_MODEL_ID,
    messages: [
      {
        role: 'user',
        content: [{ text: userMessage }],
      },
    ],
    system: [{ text: systemPrompt }],
    inferenceConfig: {
      maxTokens: 8192, // Larger for multi-day plans
      temperature: 0.8, // Higher for more variety
      topP: 0.9,
    },
  });

  const response = await bedrockClient.send(command);
  
  let fullResponse = '';
  
  if (response.stream) {
    for await (const chunk of response.stream) {
      if (chunk.contentBlockDelta?.delta?.text) {
        fullResponse += chunk.contentBlockDelta.delta.text;
      }
    }
  }

  // Parse the meal plan JSON
  try {
    const mealPlanData = JSON.parse(fullResponse);
    
    // Transform to DayMealPlan structure
    const mealPlan: DayMealPlan[] = mealPlanData.days || mealPlanData;
    
    return mealPlan;
  } catch (parseError) {
    console.error('Failed to parse meal plan response:', parseError);
    console.error('Raw response:', fullResponse);
    throw new Error('Failed to parse meal plan from AI response');
  }
}

/**
 * Generates the system prompt for meal plan generation
 */
function generateMealPlanSystemPrompt(userProfile: UserProfile, dietaryGoal?: string): string {
  const { dietaryRestrictions = [], allergies = [], preferences = {} } = userProfile;

  let systemPrompt = `You are a Professional Chef and Registered Dietitian AI assistant specializing in multi-day meal planning.

USER'S DIETARY PROFILE:
`;

  if (allergies.length > 0) {
    systemPrompt += `- CRITICAL ALLERGIES: ${allergies.join(', ')} - NEVER include these ingredients\n`;
  }

  if (dietaryRestrictions.length > 0) {
    systemPrompt += `- Dietary Restrictions: ${dietaryRestrictions.join(', ')}\n`;
  }

  if (dietaryGoal) {
    systemPrompt += `- Dietary Goal: ${dietaryGoal}\n`;
  }

  if (preferences.cuisineTypes && preferences.cuisineTypes.length > 0) {
    systemPrompt += `- Preferred Cuisines: ${preferences.cuisineTypes.join(', ')}\n`;
  }

  systemPrompt += `\nMEAL PLAN REQUIREMENTS:
1. Create diverse meals across all days to prevent monotony
2. Balance macronutrients throughout the week
3. Consider ingredient overlap to minimize shopping complexity
4. Scale difficulty appropriately across the week
5. Provide complete nutritional information for each meal

OUTPUT FORMAT:
Return a JSON array of daily meal plans. Each day should follow this structure:

{
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "meals": [
        {
          "mealType": "breakfast",
          "recipe": {
            "recipeName": "Name",
            "description": "Description",
            "prepTime": "X minutes",
            "cookTime": "X minutes",
            "totalTime": "X minutes",
            "servings": 1,
            "difficulty": "Easy/Medium/Hard",
            "ingredients": [
              {
                "item": "ingredient",
                "quantity": "amount",
                "notes": "optional"
              }
            ],
            "instructions": [
              {
                "step": 1,
                "instruction": "detailed instruction"
              }
            ],
            "nutritionalInfo": {
              "perServing": {
                "calories": 0,
                "protein": "0g",
                "carbohydrates": "0g",
                "fat": "0g",
                "fiber": "0g",
                "sodium": "0mg"
              }
            },
            "tags": ["tag1", "tag2"]
          }
        }
      ],
      "dailyTotals": {
        "calories": 0,
        "protein": "0g",
        "carbohydrates": "0g",
        "fat": "0g"
      }
    }
  ],
  "shoppingList": {
    "produce": [],
    "proteins": [],
    "dairy": [],
    "grains": [],
    "pantry": [],
    "other": []
  },
  "weeklyNutritionSummary": {
    "averageDailyCalories": 0,
    "proteinRange": "X-Y g",
    "carbRange": "X-Y g",
    "fatRange": "X-Y g"
  }
}

IMPORTANT: Return ONLY the JSON object, no additional text.`;

  return systemPrompt;
}

/**
 * Saves individual recipes to the recipes table
 */
async function saveRecipes(planId: string, userId: string, mealPlan: DayMealPlan[]): Promise<void> {
  const recipes: any[] = [];

  mealPlan.forEach((day) => {
    day.meals.forEach((meal) => {
      const recipeId = `recipe-${planId}-day${day.day}-${meal.mealType}`;
      recipes.push({
        recipeId,
        planId,
        userId,
        day: day.day,
        date: day.date,
        mealType: meal.mealType,
        recipe: meal.recipe,
        createdAt: new Date().toISOString(),
      });
    });
  });

  // Batch write recipes (DynamoDB supports up to 25 items per batch)
  const batches = [];
  for (let i = 0; i < recipes.length; i += 25) {
    batches.push(recipes.slice(i, i + 25));
  }

  for (const batch of batches) {
    await docClient.send(new BatchWriteCommand({
      RequestItems: {
        [RECIPES_TABLE_NAME]: batch.map((recipe) => ({
          PutRequest: {
            Item: recipe,
          },
        })),
      },
    }));
  }
}

/**
 * Updates the plan with generated results
 */
async function updatePlanWithResults(planId: string, mealPlan: DayMealPlan[]): Promise<void> {
  await docClient.send(new UpdateCommand({
    TableName: PLANS_TABLE_NAME,
    Key: { planId },
    UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt, recipes = :recipes, completedAt = :completedAt',
    ExpressionAttributeNames: {
      '#status': 'status',
    },
    ExpressionAttributeValues: {
      ':status': 'completed',
      ':updatedAt': new Date().toISOString(),
      ':completedAt': new Date().toISOString(),
      ':recipes': mealPlan,
    },
  }));
}
