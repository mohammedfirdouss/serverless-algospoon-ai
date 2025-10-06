import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

interface RegisterRequest {
  email: string;
  name: string;
  password: string;
  dietaryRestrictions?: string[];
  allergies?: string[];
  targetCalories?: number;
}

interface UserProfile {
  userId: string;
  email: string;
  name: string;
  passwordHash: string;
  dietaryRestrictions: string[];
  allergies: string[];
  targetCalories: number;
  createdAt: string;
  updatedAt: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Register event:', JSON.stringify(event, null, 2));

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

    const requestData: RegisterRequest = JSON.parse(event.body);

    // Validate required fields
    if (!requestData.email || !requestData.name || !requestData.password) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Email, name, and password are required',
        }),
      };
    }

    // Check if user already exists
    const existingUser = await dynamodb.send(
      new QueryCommand({
        TableName: process.env.USER_TABLE_NAME!,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': requestData.email,
        },
      })
    );

    if (existingUser.Items && existingUser.Items.length > 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'User with this email already exists',
        }),
      };
    }

    // Create user profile
    const userId = uuidv4();
    const timestamp = new Date().toISOString();

    // In production, use a proper password hashing library like bcrypt
    const passwordHash = Buffer.from(requestData.password).toString('base64');

    const userProfile: UserProfile = {
      userId,
      email: requestData.email,
      name: requestData.name,
      passwordHash,
      dietaryRestrictions: requestData.dietaryRestrictions || [],
      allergies: requestData.allergies || [],
      targetCalories: requestData.targetCalories || 2000,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Save user to DynamoDB
    await dynamodb.send(
      new PutCommand({
        TableName: process.env.USER_TABLE_NAME!,
        Item: userProfile,
        ConditionExpression: 'attribute_not_exists(userId)',
      })
    );

    // Return user profile (without password hash)
    const { passwordHash: _, ...userResponse } = userProfile;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'User registered successfully',
        user: userResponse,
      }),
    };
  } catch (error) {
    console.error('Error registering user:', error);
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
