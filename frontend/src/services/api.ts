import axios from 'axios';
import { getCurrentUser } from 'aws-amplify/auth';

// Configure API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication token to requests
apiClient.interceptors.request.use(async (config) => {
  try {
    const user = await getCurrentUser();
    const token = user?.signInDetails?.loginId; // For now, we'll use loginId or username
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    // User not authenticated, continue without token
  }
  return config;
});

// Response interceptor for handling API responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Types for API requests/responses
export interface UserProfile {
  userId: string;
  email: string;
  fullName: string;
  preferences: {
    dietaryRestrictions: string[];
    allergies: string[];
    cuisinePreferences: string[];
    cookingSkill: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    targetCalories?: number;
    mealsPerDay?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Recipe {
  recipeId: string;
  userId: string;
  title: string;
  description: string;
  ingredients: Array<{
    name: string;
    quantity: string;
    category: string;
  }>;
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
  tags: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  aiGenerated?: boolean;
}

export interface MealPlan {
  planId: string;
  userId: string;
  status: 'generating' | 'completed' | 'failed';
  days: number;
  meals?: Array<{
    day: number;
    date: string;
    breakfast?: Recipe;
    lunch?: Recipe;
    dinner?: Recipe;
  }>;
  nutrition?: {
    totalCalories: number;
    avgCaloriesPerDay: number;
  };
  createdAt: string;
}

// User Profile APIs
export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const response = await apiClient.get(`/auth/profile/${userId}`);
    return response.data.success ? response.data.user : null;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (profile: Partial<UserProfile> & { userId: string }) => {
  try {
    const response = await apiClient.put('/auth/profile', profile);
    return response.data;
  } catch (error) {
    console.error('Failed to update user profile:', error);
    throw error;
  }
};

export const registerUser = async (params: {
  userId: string;
  email: string;
  fullName: string;
  preferences?: {
    dietaryRestrictions?: string[];
    allergies?: string[];
    cuisinePreferences?: string[];
    cookingSkill?: string;
    targetCalories?: number;
    mealsPerDay?: number;
  };
}) => {
  try {
    const response = await apiClient.post('/auth/register', params);
    return response.data;
  } catch (error) {
    console.error('Failed to register user:', error);
    throw error;
  }
};

// Recipe APIs
export const saveRecipe = async (recipe: Omit<Recipe, 'recipeId' | 'createdAt'>) => {
  try {
    const response = await apiClient.post('/recipes', recipe);
    return response.data;
  } catch (error) {
    console.error('Failed to save recipe:', error);
    throw error;
  }
};

export const fetchUserRecipes = async (userId: string): Promise<Recipe[]> => {
  try {
    const response = await apiClient.get(`/recipes/${userId}`);
    return response.data.recipes || [];
  } catch (error) {
    console.error('Failed to fetch recipes:', error);
    return [];
  }
};

export const deleteRecipe = async (userId: string, recipeId: string) => {
  try {
    const response = await apiClient.delete(`/recipes/${userId}/${recipeId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete recipe:', error);
    throw error;
  }
};

// AI Recipe Generation API
export const generateRecipe = async (params: {
  userId: string;
  prompt: string;
  dietaryRestrictions?: string[];
  cuisineStyle?: string;
  cookingTime?: number;
  servings?: number;
  difficulty?: string;
}): Promise<Recipe> => {
  try {
    const response = await apiClient.post('/recipes/generate', params);
    return response.data;
  } catch (error) {
    console.error('Failed to generate recipe:', error);
    throw error;
  }
};

// Meal Plan APIs
export const generateMealPlan = async (params: {
  userId: string;
  days: number;
  mealsPerDay: number;
  targetCalories?: number;
  dietaryRestrictions?: string[];
  cuisinePreferences?: string[];
  budgetLevel?: string;
}) => {
  try {
    const response = await apiClient.post('/plans/generate', params);
    return response.data;
  } catch (error) {
    console.error('Failed to generate meal plan:', error);
    throw error;
  }
};

export const fetchMealPlans = async (): Promise<MealPlan[]> => {
  try {
    const response = await apiClient.get('/plans');
    return response.data.plans || [];
  } catch (error) {
    console.error('Failed to fetch meal plans:', error);
    return [];
  }
};

export const fetchMealPlan = async (planId: string): Promise<MealPlan | null> => {
  try {
    const response = await apiClient.get(`/plans/${planId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch meal plan:', error);
    return null;
  }
};

export default apiClient;
