import React, { useState } from 'react';
import { saveRecipe } from '../services/api';
import './RecipeDisplay.css';
import type { Recipe } from '../services/api';

interface RecipeDisplayProps {
  recipe: Recipe;
}

const RecipeDisplay: React.FC<RecipeDisplayProps> = ({ recipe }) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'green';
      case 'medium': 
      case 'intermediate': return 'orange';
      case 'hard':
      case 'advanced': return 'red';
      default: return 'gray';
    }
  };

  const handleSaveRecipe = async () => {
    try {
      setSaving(true);
      await saveRecipe(recipe);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save recipe:', error);
      alert('Failed to save recipe. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="recipe-display">
      {/* Recipe Header */}
      <div className="recipe-header">
        <h2 className="recipe-name">{recipe.title}</h2>
        <p className="recipe-description">{recipe.description}</p>
        
        <div className="recipe-meta">
          <div className="meta-item">
            <span className="meta-icon">⏱️</span>
            <div>
              <div className="meta-label">Prep Time</div>
              <div className="meta-value">{recipe.prepTime} min</div>
            </div>
          </div>
          
          <div className="meta-item">
            <span className="meta-icon">🍳</span>
            <div>
              <div className="meta-label">Cook Time</div>
              <div className="meta-value">{recipe.cookTime} min</div>
            </div>
          </div>
          
          <div className="meta-item">
            <span className="meta-icon">👥</span>
            <div>
              <div className="meta-label">Servings</div>
              <div className="meta-value">{recipe.servings}</div>
            </div>
          </div>
          
          <div className="meta-item">
            <span className="meta-icon">📊</span>
            <div>
              <div className="meta-label">Difficulty</div>
              <div 
                className="meta-value difficulty" 
                style={{ color: getDifficultyColor(recipe.difficulty) }}
              >
                {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
              </div>
            </div>
          </div>
          
          <div className="meta-item">
            <span className="meta-icon">🔥</span>
            <div>
              <div className="meta-label">Calories</div>
              <div className="meta-value">{recipe.nutrition.calories}</div>
            </div>
          </div>
        </div>

        {/* Recipe Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="recipe-tags">
            {recipe.tags.map((tag, index) => (
              <span key={index} className="recipe-tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* AI Generated Badge */}
        {recipe.aiGenerated && (
          <div className="ai-badge">
            🤖 AI Generated
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="recipe-content">
        {/* Ingredients */}
        <div className="recipe-section">
          <h3 className="section-title">🥕 Ingredients</h3>
          <ul className="ingredients-list">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index} className="ingredient-item">
                <span className="ingredient-quantity">{ingredient.quantity}</span>
                <span className="ingredient-name">{ingredient.name}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div className="recipe-section">
          <h3 className="section-title">👨‍🍳 Instructions</h3>
          <ol className="instructions-list">
            {recipe.instructions.map((step, index) => (
              <li key={index} className="instruction-step">
                <span className="step-number">{index + 1}</span>
                <span className="step-text">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Nutrition Information */}
        {recipe.nutrition && (
          <div className="recipe-section">
            <h3 className="section-title">📊 Nutrition (Per Serving)</h3>
            <div className="nutrition-grid">
              <div className="nutrition-item">
                <span className="nutrition-label">Calories</span>
                <span className="nutrition-value">{Math.round(recipe.nutrition.calories / recipe.servings)}</span>
              </div>
              
              {recipe.nutrition.protein && (
                <div className="nutrition-item">
                  <span className="nutrition-label">Protein</span>
                  <span className="nutrition-value">{Math.round(recipe.nutrition.protein / recipe.servings)}g</span>
                </div>
              )}
              
              {recipe.nutrition.carbs && (
                <div className="nutrition-item">
                  <span className="nutrition-label">Carbs</span>
                  <span className="nutrition-value">{Math.round(recipe.nutrition.carbs / recipe.servings)}g</span>
                </div>
              )}
              
              {recipe.nutrition.fat && (
                <div className="nutrition-item">
                  <span className="nutrition-label">Fat</span>
                  <span className="nutrition-value">{Math.round(recipe.nutrition.fat / recipe.servings)}g</span>
                </div>
              )}
              
              {recipe.nutrition.fiber && (
                <div className="nutrition-item">
                  <span className="nutrition-label">Fiber</span>
                  <span className="nutrition-value">{Math.round(recipe.nutrition.fiber / recipe.servings)}g</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="recipe-actions">
        <button 
          onClick={handleSaveRecipe}
          disabled={saving || saved}
          className={`save-btn ${saved ? 'saved' : ''}`}
        >
          {saving ? '⏳ Saving...' : saved ? '✅ Saved!' : '💾 Save Recipe'}
        </button>
        
        <button 
          onClick={() => window.print()} 
          className="print-btn"
        >
          🖨️ Print Recipe
        </button>
        
        <button 
          onClick={() => navigator.share?.({ 
            title: recipe.title, 
            text: recipe.description,
            url: window.location.href 
          })} 
          className="share-btn"
          style={{ display: navigator.share ? 'block' : 'none' }}
        >
          📤 Share
        </button>
      </div>
    </div>
  );
};

export default RecipeDisplay;
              <div className="meta-value">{recipe.prepTime}</div>
            </div>
          </div>
          
          <div className="meta-item">
            <span className="meta-icon">🔥</span>
            <div>
              <div className="meta-label">Cook</div>
              <div className="meta-value">{recipe.cookTime}</div>
            </div>
          </div>
          
          <div className="meta-item">
            <span className="meta-icon">⏰</span>
            <div>
              <div className="meta-label">Total</div>
              <div className="meta-value">{recipe.totalTime}</div>
            </div>
          </div>
          
          <div className="meta-item">
            <span className="meta-icon">🍽️</span>
            <div>
              <div className="meta-label">Servings</div>
              <div className="meta-value">{recipe.servings}</div>
            </div>
          </div>
          
          <div className="meta-item">
            <span className="meta-icon">📊</span>
            <div>
              <div className="meta-label">Difficulty</div>
              <div className="meta-value" style={{ color: getDifficultyColor(recipe.difficulty) }}>
                {recipe.difficulty}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dietary Compliance */}
      {recipe.dietaryCompliance && (
        <div className="dietary-compliance">
          {recipe.dietaryCompliance.suitable && recipe.dietaryCompliance.suitable.length > 0 && (
            <div className="suitable-tags">
              {recipe.dietaryCompliance.suitable.map((diet, index) => (
                <span key={index} className="diet-tag suitable">✓ {diet}</span>
              ))}
            </div>
          )}
          {recipe.dietaryCompliance.warnings && recipe.dietaryCompliance.warnings.length > 0 && (
            <div className="warning-tags">
              {recipe.dietaryCompliance.warnings.map((warning, index) => (
                <span key={index} className="diet-tag warning">⚠️ {warning}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="recipe-content">
        {/* Ingredients Section */}
        <div className="recipe-section ingredients-section">
          <h3 className="section-title">
            <span className="section-icon">🛒</span>
            Ingredients
          </h3>
          <ul className="ingredients-list">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index} className="ingredient-item">
                <input type="checkbox" id={`ingredient-${index}`} className="ingredient-checkbox" />
                <label htmlFor={`ingredient-${index}`}>
                  <span className="ingredient-quantity">{ingredient.quantity}</span>
                  <span className="ingredient-name">{ingredient.item}</span>
                  {ingredient.notes && (
                    <span className="ingredient-notes">({ingredient.notes})</span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions Section */}
        <div className="recipe-section instructions-section">
          <h3 className="section-title">
            <span className="section-icon">👨‍🍳</span>
            Instructions
          </h3>
          <ol className="instructions-list">
            {recipe.instructions.map((instruction) => (
              <li key={instruction.step} className="instruction-item">
                <div className="step-number">{instruction.step}</div>
                <div className="step-content">{instruction.instruction}</div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Nutritional Info */}
      <div className="recipe-section nutrition-section">
        <h3 className="section-title">
          <span className="section-icon">📊</span>
          Nutritional Information (per serving)
        </h3>
        <div className="nutrition-grid">
          <div className="nutrition-item">
            <div className="nutrition-value">{recipe.nutritionalInfo.perServing.calories}</div>
            <div className="nutrition-label">Calories</div>
          </div>
          <div className="nutrition-item">
            <div className="nutrition-value">{recipe.nutritionalInfo.perServing.protein}</div>
            <div className="nutrition-label">Protein</div>
          </div>
          <div className="nutrition-item">
            <div className="nutrition-value">{recipe.nutritionalInfo.perServing.carbohydrates}</div>
            <div className="nutrition-label">Carbs</div>
          </div>
          <div className="nutrition-item">
            <div className="nutrition-value">{recipe.nutritionalInfo.perServing.fat}</div>
            <div className="nutrition-label">Fat</div>
          </div>
          <div className="nutrition-item">
            <div className="nutrition-value">{recipe.nutritionalInfo.perServing.fiber}</div>
            <div className="nutrition-label">Fiber</div>
          </div>
          <div className="nutrition-item">
            <div className="nutrition-value">{recipe.nutritionalInfo.perServing.sodium}</div>
            <div className="nutrition-label">Sodium</div>
          </div>
        </div>
      </div>

      {/* Tips */}
      {recipe.tips && recipe.tips.length > 0 && (
        <div className="recipe-section tips-section">
          <h3 className="section-title">
            <span className="section-icon">💡</span>
            Chef's Tips
          </h3>
          <ul className="tips-list">
            {recipe.tips.map((tip, index) => (
              <li key={index} className="tip-item">{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RecipeDisplay;
