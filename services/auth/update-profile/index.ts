import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

interface UpdateProfileRequest {
  userId: string;
  name?: string;
  dietaryRestrictions?: string[];
  allergies?: string[];
  targetCalories?: number;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Update profile event:', JSON.stringify(event, null, 2));

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

    const requestData: UpdateProfileRequest = JSON.parse(event.body);

    if (!requestData.userId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'userId is required' }),
      };
    }

    // Check if user exists
    const existingUser = await dynamodb.send(
      new GetCommand({
        TableName: process.env.USER_TABLE_NAME!,
        Key: { userId: requestData.userId },
      })
    );

    if (!existingUser.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'User not found' }),
      };
    }

    // Build update expression
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (requestData.name !== undefined) {
      updateExpressions.push('#name = :name');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':name'] = requestData.name;
    }

    if (requestData.dietaryRestrictions !== undefined) {
      updateExpressions.push('dietaryRestrictions = :dietaryRestrictions');
      expressionAttributeValues[':dietaryRestrictions'] = requestData.dietaryRestrictions;
    }

    if (requestData.allergies !== undefined) {
      updateExpressions.push('allergies = :allergies');
      expressionAttributeValues[':allergies'] = requestData.allergies;
    }

    if (requestData.targetCalories !== undefined) {
      updateExpressions.push('targetCalories = :targetCalories');
      expressionAttributeValues[':targetCalories'] = requestData.targetCalories;
    }

    // Always update the updatedAt timestamp
    updateExpressions.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    if (updateExpressions.length === 1) {
      // Only updatedAt was added, meaning no actual fields to update
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'At least one field to update must be provided',
        }),
      };
    }

    // Update user profile
    const result = await dynamodb.send(
      new UpdateCommand({
        TableName: process.env.USER_TABLE_NAME!,
        Key: { userId: requestData.userId },
        UpdateExpression: 'SET ' + updateExpressions.join(', '),
        ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 
          ? expressionAttributeNames 
          : undefined,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      })
    );

    // Remove password hash from response
    const { passwordHash, ...userResponse } = result.Attributes || {};

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Profile updated successfully',
        user: userResponse,
      }),
    };
  } catch (error) {
    console.error('Error updating profile:', error);
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
