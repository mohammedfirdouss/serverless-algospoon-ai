import axios from 'axios';

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
export const fetchUserProfile = async (userId: string) => {
  const response = await apiClient.get(`/profile/${userId}`);
  return response.data;
};

export const updateUserProfile = async (userId: string, profile: any) => {
  const response = await apiClient.put(`/profile/${userId}`, profile);
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

export const fetchMealPlans = async () => {
  const response = await apiClient.get('/plans');
  return response.data;
};

export const fetchMealPlan = async (planId: string) => {
  const response = await apiClient.get(`/plans/${planId}`);
  return response.data;
};

export default apiClient;
