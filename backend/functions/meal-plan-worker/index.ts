import { EventBridgeEvent } from 'aws-lambda';
import { BedrockRuntimeClient, ConverseStreamCommand } from '@aws-sdk/client-bedrock-runtime';
import { generateMealPlanSystemPrompt } from '../../shared/utils/bedrock-utils';
import type { MealPlanDay } from '@shared/types/meal-plan';
import type { UserProfile } from '@shared/types/user';
import {
  getUserProfile,
  updatePlanStatus,
  saveRecipes,
  updatePlanWithResults,
} from '../../shared/utils/dynamo-utils';

const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

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
 * Generates a multi-day meal plan using Bedrock
 */
async function generateMealPlan(
  userProfile: UserProfile,
  dietaryGoal: string | undefined,
  startDate: string,
  duration: number,
  mealsPerDay: number,
  additionalRequirements?: string
): Promise<MealPlanDay[]> {
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
    const mealPlan: MealPlanDay[] = mealPlanData.days || mealPlanData;
    
    return mealPlan;
  } catch (parseError) {
    console.error('Failed to parse meal plan response:', parseError);
    console.error('Raw response:', fullResponse);
    throw new Error('Failed to parse meal plan from AI response');
  }
}
