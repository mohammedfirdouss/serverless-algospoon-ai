export interface UserPreferences {
  cuisineTypes: string[];
  skillLevel: string;
  cookingTime: string;
}

export interface UserProfile {
  userId: string;
  email?: string;
  name?: string;
  dietaryRestrictions: string[];
  allergies: string[];
  targetCalories?: number;
  preferences: UserPreferences;
  createdAt?: string;
  updatedAt?: string;
}
