import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Delete recipe event:', JSON.stringify(event, null, 2));

  try {
    const userId = event.pathParameters?.userId;
    const recipeId = event.pathParameters?.recipeId;

    if (!userId || !recipeId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'userId and recipeId are required' }),
      };
    }

    // Check if recipe exists
    const existingRecipe = await dynamodb.send(
      new GetCommand({
        TableName: process.env.RECIPE_TABLE_NAME!,
        Key: { userId, recipeId },
      })
    );

    if (!existingRecipe.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'Recipe not found' }),
      };
    }

    // Delete recipe
    await dynamodb.send(
      new DeleteCommand({
        TableName: process.env.RECIPE_TABLE_NAME!,
        Key: { userId, recipeId },
      })
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Recipe deleted successfully',
        recipeId,
      }),
    };
  } catch (error) {
    console.error('Error deleting recipe:', error);
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
