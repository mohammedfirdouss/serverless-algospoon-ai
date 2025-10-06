import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const eventBridgeClient = new EventBridgeClient({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || 'AlgoSpoonEventBus';
const PLANS_TABLE_NAME = process.env.PLANS_TABLE_NAME || 'AlgoSpoonMealPlansTable';
const RECIPES_TABLE_NAME = process.env.RECIPES_TABLE_NAME || 'AlgoSpoonRecipesTable';

interface MealPlanRequest {
  planType: string; // e.g., "weekly", "daily"
  dietaryGoal?: string; // e.g., "low-carb", "high-protein", "balanced"
  startDate?: string;
  duration?: number; // days
  mealsPerDay?: number; // default 3
  additionalRequirements?: string;
}

interface MealPlan {
  planId: string;
  userId: string;
  planType: string;
  status: 'requested' | 'generating' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  duration?: number;
  dietaryGoal?: string;
  recipes?: any[];
  error?: string;
}

/**
 * Main Lambda handler for Business API
 * Handles meal plan requests and queries
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const path = event.path;
    const method = event.httpMethod;

    // Extract user ID from authorizer context
    const userId = event.requestContext.authorizer?.claims?.sub || 
                   event.requestContext.authorizer?.userId ||
                   'default-user';

    console.log(`Business API: ${method} ${path} for user ${userId}`);

    // Route requests
    if (path === '/plans/generate' && method === 'POST') {
      return await handleGeneratePlan(event, userId);
    } else if (path === '/plans' && method === 'GET') {
      return await handleListPlans(event, userId);
    } else if (path.startsWith('/plans/') && method === 'GET') {
      const planId = path.split('/')[2];
      return await handleGetPlan(userId, planId);
    } else {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Not found' }),
      };
    }

  } catch (error) {
    console.error('Error in Business API:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

/**
 * Handles POST /plans/generate
 * Creates a meal plan request and publishes event to EventBridge
 */
async function handleGeneratePlan(
  event: APIGatewayProxyEvent,
  userId: string
): Promise<APIGatewayProxyResult> {
  const body: MealPlanRequest = JSON.parse(event.body || '{}');
  
  const {
    planType = 'weekly',
    dietaryGoal,
    startDate = new Date().toISOString().split('T')[0],
    duration = 7,
    mealsPerDay = 3,
    additionalRequirements,
  } = body;

  // Generate unique plan ID
  const planId = `plan-${userId}-${Date.now()}`;
  const timestamp = new Date().toISOString();

  // Create initial plan record in DynamoDB
  const plan: MealPlan = {
    planId,
    userId,
    planType,
    status: 'requested',
    createdAt: timestamp,
    updatedAt: timestamp,
    startDate,
    duration,
    dietaryGoal,
  };

  await docClient.send(new PutCommand({
    TableName: PLANS_TABLE_NAME,
    Item: plan,
  }));

  // Publish event to EventBridge for async processing
  const eventDetail = {
    planId,
    userId,
    planType,
    dietaryGoal,
    startDate,
    duration,
    mealsPerDay,
    additionalRequirements,
  };

  await eventBridgeClient.send(new PutEventsCommand({
    Entries: [
      {
        Source: 'algospoon.business-api',
        DetailType: 'plan.generate.requested',
        Detail: JSON.stringify(eventDetail),
        EventBusName: EVENT_BUS_NAME,
      },
    ],
  }));

  console.log(`Published plan.generate.requested event for plan ${planId}`);

  return {
    statusCode: 202,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      success: true,
      planId,
      status: 'requested',
      message: 'Meal plan generation has been initiated. Check back shortly for results.',
    }),
  };
}

/**
 * Handles GET /plans
 * Lists all meal plans for a user
 */
async function handleListPlans(
  event: APIGatewayProxyEvent,
  userId: string
): Promise<APIGatewayProxyResult> {
  const response = await docClient.send(new QueryCommand({
    TableName: PLANS_TABLE_NAME,
    IndexName: 'UserIdIndex', // Assumes GSI on userId
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
    ScanIndexForward: false, // Most recent first
    Limit: 20,
  }));

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      success: true,
      plans: response.Items || [],
    }),
  };
}

/**
 * Handles GET /plans/{planId}
 * Retrieves a specific meal plan
 */
async function handleGetPlan(
  userId: string,
  planId: string
): Promise<APIGatewayProxyResult> {
  const response = await docClient.send(new GetCommand({
    TableName: PLANS_TABLE_NAME,
    Key: { planId },
  }));

  if (!response.Item) {
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Plan not found' }),
    };
  }

  // Verify the plan belongs to the user
  if (response.Item.userId !== userId) {
    return {
      statusCode: 403,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Access denied' }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      success: true,
      plan: response.Item,
    }),
  };
}
