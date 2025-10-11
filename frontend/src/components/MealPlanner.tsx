import React, { useState, useEffect } from 'react';
import { generateMealPlan, fetchMealPlans, fetchMealPlan } from '../services/api';
import './MealPlanner.css';
import type { MealPlan, MealPlanDay, MealPlanMeal } from '@shared/types/meal-plan';
import { getStatusColor, formatDate } from '../utils/formatters';

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
};

export default MealPlanner;
