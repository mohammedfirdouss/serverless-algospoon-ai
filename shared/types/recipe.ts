export interface Ingredient {
  item: string;
  quantity: string;
  notes?: string;
}

export interface RecipeInstruction {
  step: number;
  instruction: string;
}

export interface NutritionalInfoPerServing {
  calories: number;
  protein: string;
  carbohydrates: string;
  fat: string;
  fiber?: string;
  sodium?: string;
}

export interface RecipeNutritionalInfo {
  perServing: NutritionalInfoPerServing;
}

export interface DietaryCompliance {
  suitable: string[];
  warnings: string[];
}

export interface RecipeDetails {
  recipeName: string;
  description: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  servings: number;
  difficulty: string;
  ingredients: Ingredient[];
  instructions: RecipeInstruction[];
  nutritionalInfo: RecipeNutritionalInfo;
  dietaryCompliance?: DietaryCompliance;
  tips?: string[];
}

export interface SavedRecipe extends RecipeDetails {
  userId: string;
  recipeId: string;
  recipeType?: string;
  planId?: string;
  day?: number;
  createdAt: string;
  updatedAt: string;
}
