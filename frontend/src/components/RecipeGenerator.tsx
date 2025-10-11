import React, { useState } from 'react';
import { generateRecipe } from '../services/api';
import RecipeDisplay from './RecipeDisplay';
import './RecipeGenerator.css';
import type { RecipeDetails } from '../../../shared/types/recipe';

interface RecipeGeneratorProps {
  userId: string;
}

const RecipeGenerator: React.FC<RecipeGeneratorProps> = ({ userId: _userId }) => {
  const [ingredients, setIngredients] = useState('');
  const [mealType, setMealType] = useState('');
  const [servings, setServings] = useState(2);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<RecipeDetails | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ingredients.trim()) {
      setError('Please enter at least one ingredient');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setRecipe(null);

      const response = await generateRecipe({
        ingredients,
        mealType: mealType || undefined,
        servings,
        additionalNotes: additionalNotes || undefined,
      });

      setRecipe(response.recipe);
    } catch (err) {
      console.error('Error generating recipe:', err);
      setError('Failed to generate recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIngredients('');
    setMealType('');
    setServings(2);
    setAdditionalNotes('');
    setRecipe(null);
    setError('');
  };

  return (
    <div className="recipe-generator-container">
      <div className="generator-header">
        <h2>🍳 AI Recipe Generator</h2>
        <p className="generator-description">
          Tell me what ingredients you have, and I'll create a personalized recipe just for you!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="generator-form">
        <div className="form-group">
          <label htmlFor="ingredients">
            Available Ingredients *
            <span className="field-hint">Separate with commas</span>
          </label>
          <textarea
            id="ingredients"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="e.g., chicken breast, broccoli, garlic, olive oil, rice"
            rows={4}
            className="textarea-input"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="mealType">Meal Type</label>
            <select
              id="mealType"
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="select-input"
            >
              <option value="">Any</option>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
              <option value="dessert">Dessert</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="servings">Servings</label>
            <input
              id="servings"
              type="number"
              min="1"
              max="12"
              value={servings}
              onChange={(e) => setServings(parseInt(e.target.value))}
              className="number-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="additionalNotes">
            Additional Notes
            <span className="field-hint">Optional</span>
          </label>
          <textarea
            id="additionalNotes"
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="e.g., prefer spicy, make it quick, use the oven"
            rows={2}
            className="textarea-input"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="button-group">
          <button
            type="submit"
            disabled={loading}
            className="generate-button"
          >
            {loading ? '🔄 Generating Recipe...' : '✨ Generate Recipe'}
          </button>
          
          {recipe && (
            <button
              type="button"
              onClick={handleReset}
              className="reset-button"
            >
              New Recipe
            </button>
          )}
        </div>
      </form>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>AI Chef is preparing your personalized recipe...</p>
        </div>
      )}

      {recipe && !loading && (
        <RecipeDisplay recipe={recipe} />
      )}
    </div>
  );
};

export default RecipeGenerator;
