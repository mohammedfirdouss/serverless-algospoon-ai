import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import type { MealPlanDay } from '@shared/types/meal-plan';
import type { UserProfile } from '@shared/types/user';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const AUTH_TABLE_NAME = process.env.AUTH_TABLE_NAME || 'AlgoSpoonAuthTable';
const PLANS_TABLE_NAME = process.env.PLANS_TABLE_NAME || 'AlgoSpoonMealPlansTable';
const RECIPES_TABLE_NAME = process.env.RECIPES_TABLE_NAME || 'AlgoSpoonRecipesTable';

/**
 * Retrieves user's dietary profile from DynamoDB
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
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
      preferences: {
        cuisineTypes: [],
        skillLevel: 'beginner',
        cookingTime: '30-45 minutes',
      },
    };
  }

  return response.Item as UserProfile;
}

/**
 * Updates the meal plan status in DynamoDB
 */
export async function updatePlanStatus(
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
 * Saves individual recipes to the recipes table
 */
export async function saveRecipes(planId: string, userId: string, mealPlan: MealPlanDay[]): Promise<void> {
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
export async function updatePlanWithResults(planId: string, mealPlan: MealPlanDay[]): Promise<void> {
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
