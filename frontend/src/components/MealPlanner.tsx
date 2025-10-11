import React, { useState, useEffect, memo } from 'react';
import { generateMealPlan, fetchMealPlans, fetchMealPlan } from '../services/api';
import './MealPlanner.css';
import type { MealPlan, MealPlanDay, MealPlanMeal } from '@shared/types/meal-plan';
import { getStatusColor, formatDate } from '../utils/formatters';

interface MealPlannerProps {
  userId: string;
}

const MealPlanner: React.FC<MealPlannerProps> = memo(({ userId }) => {
  const [planType, setPlanType] = useState('weekly');
  const [dietaryGoal, setDietaryGoal] = useState('');
  const [duration, setDuration] = useState(7);
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Defer loading plans to avoid blocking initial render
    const timer = setTimeout(() => {
      if (userId) {
        loadPlans();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [userId]);

  const loadPlans = async () => {
    try {
      const response = await fetchMealPlans();
      setPlans(response.plans);
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setMessage('');

      const response = await generateMealPlan({
        planType,
        dietaryGoal: dietaryGoal || undefined,
        duration,
        mealsPerDay,
        additionalRequirements: additionalRequirements || undefined,
      });

      setMessage(`Meal plan generation started! Plan ID: ${response.planId}. This may take a few minutes.`);
      
      // Reload plans after a short delay
      setTimeout(() => {
        loadPlans();
      }, 2000);

    } catch (error) {
      console.error('Error generating meal plan:', error);
      setMessage('Failed to start meal plan generation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPlan = async (planId: string) => {
    try {
      const response = await fetchMealPlan(planId);
      setSelectedPlan(response.plan);
    } catch (error) {
      console.error('Error fetching plan:', error);
    }
  };

  return (
    <div className="meal-planner-container">
      <div className="planner-header">
        <h2>🍽️ AI Meal Planner</h2>
        <p className="planner-description">
          Create personalized meal plans tailored to your dietary preferences and goals.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="planner-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="planType">Plan Type</label>
            <select
              id="planType"
              value={planType}
              onChange={(e) => setPlanType(e.target.value)}
              className="select-input"
            >
              <option value="weekly">Weekly Plan</option>
              <option value="monthly">Monthly Plan</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="duration">Duration (days)</label>
            <input
              id="duration"
              type="number"
              min="1"
              max="30"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="number-input"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="dietaryGoal">Dietary Goal</label>
            <select
              id="dietaryGoal"
              value={dietaryGoal}
              onChange={(e) => setDietaryGoal(e.target.value)}
              className="select-input"
            >
              <option value="">Select Goal</option>
              <option value="weight-loss">Weight Loss</option>
              <option value="muscle-gain">Muscle Gain</option>
              <option value="maintenance">Maintenance</option>
              <option value="general-health">General Health</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="mealsPerDay">Meals per Day</label>
            <input
              id="mealsPerDay"
              type="number"
              min="1"
              max="6"
              value={mealsPerDay}
              onChange={(e) => setMealsPerDay(parseInt(e.target.value))}
              className="number-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="additionalRequirements">Additional Requirements</label>
          <textarea
            id="additionalRequirements"
            value={additionalRequirements}
            onChange={(e) => setAdditionalRequirements(e.target.value)}
            placeholder="e.g., vegetarian, gluten-free, no nuts, low sodium"
            rows={3}
            className="textarea-input"
          />
        </div>

        {message && <div className="message">{message}</div>}

        <button
          type="submit"
          disabled={loading}
          className="generate-plan-button"
        >
          {loading ? '🔄 Generating Plan...' : '✨ Generate Meal Plan'}
        </button>
      </form>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>AI is creating your personalized meal plan...</p>
        </div>
      )}

      {plans.length > 0 && (
        <div className="plans-section">
          <h3>Your Meal Plans</h3>
          <div className="plans-grid">
            {plans.map((plan) => (
              <div key={plan.planId} className="plan-card">
                <div className="plan-header">
                  <h4>{plan.planType} Plan</h4>
                  <span className={`status-badge ${plan.status}`} style={{ color: getStatusColor(plan.status) }}>
                    {plan.status}
                  </span>
                </div>
                <div className="plan-details">
                  <p><strong>Goal:</strong> {plan.dietaryGoal}</p>
                  <p><strong>Duration:</strong> {plan.duration} days</p>
                  <p><strong>Created:</strong> {formatDate(plan.createdAt)}</p>
                </div>
                {plan.status === 'completed' && (
                  <button
                    onClick={() => handleViewPlan(plan.planId)}
                    className="view-plan-button"
                  >
                    View Plan
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Plan Details */}
      {selectedPlan && selectedPlan.recipes && (
        <div className="plan-details-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Meal Plan Details</h3>
              <button onClick={() => setSelectedPlan(null)} className="close-button">×</button>
            </div>
            <div className="modal-body">
              {selectedPlan.recipes.map((day: MealPlanDay, index: number) => (
                <div key={index} className="day-section">
                  <h4>Day {day.day} - {day.date}</h4>
                  <div className="meals-grid">
                    {day.meals.map((meal: MealPlanMeal, mealIndex: number) => (
                      <div key={mealIndex} className="meal-card">
                        <h5>{meal.mealType}</h5>
                        <p className="meal-recipe-name">{meal.recipe.recipeName}</p>
                        <p className="meal-calories">
                          {meal.recipe.nutritionalInfo?.perServing?.calories || 'N/A'} cal
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

MealPlanner.displayName = 'MealPlanner';

export default MealPlanner;
