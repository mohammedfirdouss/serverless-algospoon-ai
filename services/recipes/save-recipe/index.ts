import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

interface SaveRecipeRequest {
  userId: string;
  recipeName: string;
  recipeType?: string;
  ingredients: Ingredient[];
  instructions: string[];
  nutritionalInfo?: NutritionalInfo;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  tags?: string[];
}

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

interface NutritionalInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  sugar?: number;
}

interface Recipe {
  userId: string;
  recipeId: string;
  recipeName: string;
  recipeType: string;
  ingredients: Ingredient[];
  instructions: string[];
  nutritionalInfo?: NutritionalInfo;
  servings: number;
  prepTime?: number;
  cookTime?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Save recipe event:', JSON.stringify(event, null, 2));

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'Request body is required' }),
      };
    }

    const requestData: SaveRecipeRequest = JSON.parse(event.body);

    // Validate required fields
    if (!requestData.userId || !requestData.recipeName || !requestData.ingredients || requestData.ingredients.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'userId, recipeName, and ingredients are required',
        }),
      };
    }

    // Verify user exists
    const user = await dynamodb.send(
      new GetCommand({
        TableName: process.env.USER_TABLE_NAME!,
        Key: { userId: requestData.userId },
      })
    );

    if (!user.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'User not found' }),
      };
    }

    // Create recipe object
    const recipeId = uuidv4();
    const timestamp = new Date().toISOString();

    const recipe: Recipe = {
      userId: requestData.userId,
      recipeId,
      recipeName: requestData.recipeName,
      recipeType: requestData.recipeType || 'general',
      ingredients: requestData.ingredients,
      instructions: requestData.instructions || [],
      nutritionalInfo: requestData.nutritionalInfo,
      servings: requestData.servings || 1,
      prepTime: requestData.prepTime,
      cookTime: requestData.cookTime,
      tags: requestData.tags || [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Save recipe to DynamoDB
    await dynamodb.send(
      new PutCommand({
        TableName: process.env.RECIPE_TABLE_NAME!,
        Item: recipe,
      })
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Recipe saved successfully',
        recipe,
      }),
    };
  } catch (error) {
    console.error('Error saving recipe:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
