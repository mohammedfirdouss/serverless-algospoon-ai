import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { BedrockRuntimeClient, ConverseStreamCommand } from '@aws-sdk/client-bedrock-runtime';
import type { UserProfile } from '@shared/types/user';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

const AUTH_TABLE_NAME = process.env.AUTH_TABLE_NAME || process.env.USER_TABLE_NAME || 'AlgoSpoonUsers';
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0';

interface RecipeRequest {
  ingredients: string;
  mealType?: string;
  servings?: number;
  additionalNotes?: string;
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
    // Return default profile if user not found
    return {
      userId,
      dietaryRestrictions: [],
      allergies: [],
    };
  }

  return response.Item as UserProfile;
}

/**
 * Generates the system prompt with user's dietary context
 */
function generateSystemPrompt(userProfile: UserProfile): string {
  const { dietaryRestrictions = [], allergies = [], preferences = {} } = userProfile;

  let systemPrompt = `You are a Professional Chef and Registered Dietitian AI assistant for AlgoSpoon, specializing in personalized recipe creation and nutritional planning.

Your core responsibilities:
1. Create delicious, creative recipes based on available ingredients
2. Ensure all recipes comply with the user's dietary restrictions and allergies
3. Provide accurate nutritional information
4. Offer professional cooking guidance and techniques

USER'S DIETARY PROFILE:
`;

  if (allergies.length > 0) {
    systemPrompt += `- CRITICAL ALLERGIES: ${allergies.join(', ')} - NEVER include these ingredients or their derivatives\n`;
  }

  if (dietaryRestrictions.length > 0) {
    systemPrompt += `- Dietary Restrictions: ${dietaryRestrictions.join(', ')}\n`;
  }

  if (preferences.cuisineTypes && preferences.cuisineTypes.length > 0) {
    systemPrompt += `- Preferred Cuisines: ${preferences.cuisineTypes.join(', ')}\n`;
  }

  if (preferences.skillLevel) {
    systemPrompt += `- Cooking Skill Level: ${preferences.skillLevel}\n`;
  }

  if (preferences.cookingTime) {
    systemPrompt += `- Preferred Cooking Time: ${preferences.cookingTime}\n`;
  }

  systemPrompt += `\nOUTPUT FORMAT REQUIREMENTS:
You must respond with a recipe in the following structured JSON format:

{
  "recipeName": "Name of the dish",
  "description": "Brief description of the dish",
  "prepTime": "X minutes",
  "cookTime": "X minutes",
  "totalTime": "X minutes",
  "servings": X,
  "difficulty": "Easy/Medium/Hard",
  "ingredients": [
    {
      "item": "ingredient name",
      "quantity": "amount",
      "notes": "optional preparation notes"
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
      "calories": X,
      "protein": "Xg",
      "carbohydrates": "Xg",
      "fat": "Xg",
      "fiber": "Xg",
      "sodium": "Xmg"
    }
  },
  "dietaryCompliance": {
    "suitable": ["list of diets this recipe fits"],
    "warnings": ["any relevant warnings"]
  },
  "tips": [
    "helpful cooking or storage tips"
  ]
}

IMPORTANT: Return ONLY the JSON object, no additional text before or after.`;

  return systemPrompt;
}

/**
 * Main Lambda handler for recipe generation
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Extract user ID from authorizer context (assumes API Gateway authorizer)
    const userId = event.requestContext.authorizer?.claims?.sub || 
                   event.requestContext.authorizer?.userId ||
                   'default-user';

    // Parse request body
    const body: RecipeRequest = JSON.parse(event.body || '{}');
    const { ingredients, mealType, servings, additionalNotes } = body;

    if (!ingredients || ingredients.trim().length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Ingredients are required' }),
      };
    }

    // Step 1: Retrieve user's dietary profile from DynamoDB
    console.log(`Fetching profile for user: ${userId}`);
    const userProfile = await getUserProfile(userId);

    // Step 2: Generate personalized system prompt
    const systemPrompt = generateSystemPrompt(userProfile);

    // Step 3: Construct user message with recipe request
    let userMessage = `Please create a recipe using these ingredients: ${ingredients}`;
    
    if (mealType) {
      userMessage += `\nMeal Type: ${mealType}`;
    }
    
    if (servings) {
      userMessage += `\nServings: ${servings}`;
    }
    
    if (additionalNotes) {
      userMessage += `\nAdditional Notes: ${additionalNotes}`;
    }

    // Step 4: Check if streaming is requested
    const useStreaming = event.queryStringParameters?.stream === 'true';

    if (useStreaming) {
      // Use streaming response for real-time recipe generation
      return await handleStreamingResponse(systemPrompt, userMessage);
    } else {
      // Use standard response for complete recipe generation
      return await handleStandardResponse(systemPrompt, userMessage);
    }

  } catch (error) {
    console.error('Error generating recipe:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Failed to generate recipe',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

/**
 * Handles streaming response from Bedrock
 */
async function handleStreamingResponse(
  systemPrompt: string,
  userMessage: string
): Promise<APIGatewayProxyResult> {
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
      maxTokens: 4096,
      temperature: 0.7,
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

  // Parse and validate the JSON response
  try {
    const recipe = JSON.parse(fullResponse);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        recipe,
      }),
    };
  } catch (parseError) {
    // If parsing fails, return the raw response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        rawResponse: fullResponse,
        warning: 'Response was not in expected JSON format',
      }),
    };
  }
}

/**
 * Handles standard (non-streaming) response from Bedrock
 */
async function handleStandardResponse(
  systemPrompt: string,
  userMessage: string
): Promise<APIGatewayProxyResult> {
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
      maxTokens: 4096,
      temperature: 0.7,
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

  // Parse and validate the JSON response
  try {
    const recipe = JSON.parse(fullResponse);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        recipe,
        generatedAt: new Date().toISOString(),
      }),
    };
  } catch (parseError) {
    // If parsing fails, return the raw response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        rawResponse: fullResponse,
        warning: 'Response was not in expected JSON format',
      }),
    };
  }
}
