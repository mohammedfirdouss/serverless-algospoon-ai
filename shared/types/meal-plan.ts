import { RecipeDetails } from './recipe';

export type MealPlanStatus = 'requested' | 'generating' | 'completed' | 'failed';

export interface MealPlanMeal {
  mealType: string;
  recipe: RecipeDetails;
}

export interface MealPlanDay {
  day: number;
  date?: string;
  meals: MealPlanMeal[];
}

export interface MealPlan {
  planId: string;
  userId: string;
  planType: string;
  dietaryGoal?: string;
  duration?: number;
  mealsPerDay?: number;
  startDate?: string;
  status: MealPlanStatus;
  recipes?: MealPlanDay[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}
