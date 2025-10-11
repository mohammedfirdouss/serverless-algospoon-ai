import type { UserProfile } from '@shared/types/user';

/**
 * Generates the system prompt for meal plan generation
 */
export function generateMealPlanSystemPrompt(userProfile: UserProfile, dietaryGoal?: string): string {
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
