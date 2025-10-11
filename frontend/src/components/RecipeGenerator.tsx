import React, { useState } from 'react';
import { generateRecipe } from '../services/api';
import RecipeDisplay from './RecipeDisplay';
import './RecipeGenerator.css';
import type { Recipe } from '../services/api';

interface RecipeGeneratorProps {
  userId: string;
}

const RecipeGenerator: React.FC<RecipeGeneratorProps> = ({ userId }) => {
  const [prompt, setPrompt] = useState('');
  const [cuisineStyle, setCuisineStyle] = useState('');
  const [cookingTime, setCookingTime] = useState(30);
  const [servings, setServings] = useState(4);
  const [difficulty, setDifficulty] = useState('intermediate');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState('');

  const cuisineOptions = [
    'italian', 'mexican', 'chinese', 'japanese', 'indian', 'thai',
    'mediterranean', 'french', 'american', 'korean', 'vietnamese'
  ];

  const dietaryOptions = [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError('Please describe what kind of recipe you want');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setRecipe(null);

      const response = await generateRecipe({
        userId,
        prompt,
        cuisineStyle: cuisineStyle || undefined,
        cookingTime,
        servings,
        difficulty,
        dietaryRestrictions: dietaryRestrictions.length > 0 ? dietaryRestrictions : undefined,
      });

      setRecipe(response);
    } catch (err) {
      console.error('Error generating recipe:', err);
      setError('Failed to generate recipe. The AI service may not be fully configured yet. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPrompt('');
    setCuisineStyle('');
    setCookingTime(30);
    setServings(4);
    setDifficulty('intermediate');
    setDietaryRestrictions([]);
    setRecipe(null);
    setError('');
  };

  const toggleDietaryRestriction = (restriction: string) => {
    setDietaryRestrictions(prev => 
      prev.includes(restriction) 
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    );
  };

  return (
    <div className="recipe-generator">
      <div className="generator-container">
        <h2>🤖 AI Recipe Generator</h2>
        <p className="generator-description">
          Describe what you want to cook, and our AI will create a personalized recipe just for you!
        </p>

        <form onSubmit={handleSubmit} className="generator-form">
          {/* Recipe Prompt */}
          <div className="form-group">
            <label htmlFor="prompt">What would you like to cook?</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A healthy dinner with chicken and vegetables, something spicy and quick to make"
              rows={3}
              className="prompt-input"
              required
            />
          </div>

          {/* Options Grid */}
          <div className="options-grid">
            <div className="form-group">
              <label htmlFor="cuisine">Cuisine Style</label>
              <select
                id="cuisine"
                value={cuisineStyle}
                onChange={(e) => setCuisineStyle(e.target.value)}
                className="select-input"
              >
                <option value="">Any cuisine</option>
                {cuisineOptions.map(cuisine => (
                  <option key={cuisine} value={cuisine}>
                    {cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="cooking-time">Max Cooking Time</label>
              <select
                id="cooking-time"
                value={cookingTime}
                onChange={(e) => setCookingTime(parseInt(e.target.value))}
                className="select-input"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2+ hours</option>
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

            <div className="form-group">
              <label htmlFor="difficulty">Difficulty</label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="select-input"
              >
                <option value="easy">Easy</option>
                <option value="intermediate">Intermediate</option>
                <option value="hard">Advanced</option>
              </select>
            </div>
          </div>

          {/* Dietary Restrictions */}
          <div className="form-group">
            <label>Dietary Restrictions (optional)</label>
            <div className="dietary-options">
              {dietaryOptions.map(option => (
                <label key={option} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={dietaryRestrictions.includes(option)}
                    onChange={() => toggleDietaryRestriction(option)}
                  />
                  <span>{option.charAt(0).toUpperCase() + option.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button type="submit" disabled={loading || !prompt.trim()} className="generate-btn">
              {loading ? '🤖 Generating Recipe...' : '✨ Generate Recipe'}
            </button>
            <button type="button" onClick={handleReset} className="reset-btn">
              Clear All
            </button>
          </div>
        </form>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <p>⚠️ {error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Our AI chef is creating your recipe...</p>
            <p className="loading-note">This may take 30-60 seconds</p>
          </div>
        )}

        {/* Recipe Display */}
        {recipe && (
          <div className="recipe-result">
            <RecipeDisplay recipe={recipe} />
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeGenerator;
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
