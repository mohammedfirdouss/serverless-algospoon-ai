import React, { useState, useEffect } from 'react';
import { generateMealPlan, fetchMealPlans, fetchMealPlan } from '../services/api';
import './MealPlanner.css';
import type { MealPlan, MealPlanDay } from '../../../shared/types/meal-plan';

interface MealPlannerProps {
  userId: string;
}

const MealPlanner: React.FC<MealPlannerProps> = ({ userId }) => {
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
    loadPlans();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'generating': return 'blue';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="meal-planner-container">
      <div className="planner-header">
        <h2>📅 AI Meal Planner</h2>
        <p className="planner-description">
          Generate a complete multi-day meal plan tailored to your dietary goals and preferences.
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
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom</option>
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
          <label htmlFor="dietaryGoal">Dietary Goal</label>
          <select
            id="dietaryGoal"
            value={dietaryGoal}
            onChange={(e) => setDietaryGoal(e.target.value)}
            className="select-input"
          >
            <option value="">None (Balanced)</option>
            <option value="weight-loss">Weight Loss</option>
            <option value="muscle-gain">Muscle Gain</option>
            <option value="low-carb">Low Carb</option>
            <option value="high-protein">High Protein</option>
            <option value="low-fat">Low Fat</option>
            <option value="heart-healthy">Heart Healthy</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="additionalRequirements">
            Additional Requirements
            <span className="field-hint">Optional</span>
          </label>
          <textarea
            id="additionalRequirements"
            value={additionalRequirements}
            onChange={(e) => setAdditionalRequirements(e.target.value)}
            placeholder="e.g., include meal prep instructions, budget-friendly, quick recipes"
            rows={3}
            className="textarea-input"
          />
        </div>

        {message && (
          <div className={`message ${message.includes('Failed') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <button type="submit" disabled={loading} className="generate-button">
          {loading ? '🔄 Starting Generation...' : '✨ Generate Meal Plan'}
        </button>
      </form>

      {/* Existing Plans */}
      <div className="plans-list-section">
        <h3>Your Meal Plans</h3>
        {plans.length === 0 ? (
          <p className="no-plans">No meal plans yet. Generate your first one above!</p>
        ) : (
          <div className="plans-grid">
            {plans.map((plan) => (
              <div key={plan.planId} className="plan-card">
                <div className="plan-card-header">
                  <h4>{plan.planType} Plan</h4>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(plan.status) }}
                  >
                    {plan.status}
                  </span>
                </div>
                <div className="plan-card-body">
                  <p><strong>Duration:</strong> {plan.duration} days</p>
                  {plan.dietaryGoal && <p><strong>Goal:</strong> {plan.dietaryGoal}</p>}
                  <p><strong>Created:</strong> {new Date(plan.createdAt).toLocaleDateString()}</p>
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
        )}
      </div>

      {/* Selected Plan Details */}
      {selectedPlan && selectedPlan.recipes && (
        <div className="plan-details-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Meal Plan Details</h3>
              <button onClick={() => setSelectedPlan(null)} className="close-button">×</button>
            </div>
            <div className="modal-body">
              {selectedPlan.recipes.map((day: any, index: number) => (
                <div key={index} className="day-section">
                  <h4>Day {day.day} - {day.date}</h4>
                  <div className="meals-grid">
                    {day.meals.map((meal: any, mealIndex: number) => (
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
};

export default MealPlanner;
