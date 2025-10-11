import axios from 'axios';
import type { UserProfile } from '../../../shared/types/user';
import type { MealPlan } from '../../../shared/types/meal-plan';

// Configure API base URL - should be loaded from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.algospoon.example.com';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// User Profile APIs
export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const response = await apiClient.get<UserProfile | null>(`/auth/profile/${userId}`);
  return response.data;
};

export const updateUserProfile = async (profile: UserProfile) => {
  const response = await apiClient.put('/auth/profile', profile);
  return response.data;
};

export const registerUser = async (params: {
  email: string;
  name: string;
  password: string;
  dietaryRestrictions?: string[];
  allergies?: string[];
  targetCalories?: number;
}) => {
  const response = await apiClient.post('/auth/register', params);
  return response.data;
};

// Recipe Generation API
export const generateRecipe = async (params: {
  ingredients: string;
  mealType?: string;
  servings?: number;
  additionalNotes?: string;
}) => {
  const response = await apiClient.post('/recipes/generate', params);
  return response.data;
};

// Meal Plan APIs
export const generateMealPlan = async (params: {
  planType: string;
  dietaryGoal?: string;
  duration: number;
  mealsPerDay: number;
  additionalRequirements?: string;
}) => {
  const response = await apiClient.post('/plans/generate', params);
  return response.data;
};

export const fetchMealPlans = async (): Promise<{ plans: MealPlan[] }> => {
  const response = await apiClient.get<{ plans: MealPlan[] }>('/plans');
  return response.data;
};

export const fetchMealPlan = async (planId: string): Promise<{ plan: MealPlan }> => {
  const response = await apiClient.get<{ plan: MealPlan }>(`/plans/${planId}`);
  return response.data;
};

export default apiClient;
