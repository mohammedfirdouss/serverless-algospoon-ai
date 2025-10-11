import React from 'react';
import './RecipeDisplay.css';
import type { RecipeDetails } from '@shared/types/recipe';

interface RecipeDisplayProps {
  recipe: RecipeDetails;
}

const RecipeDisplay: React.FC<RecipeDisplayProps> = ({ recipe }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'green';
      case 'medium': return 'orange';
      case 'hard': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="recipe-display">
      {/* Recipe Header */}
      <div className="recipe-header">
        <h2 className="recipe-name">{recipe.recipeName}</h2>
        <p className="recipe-description">{recipe.description}</p>
        
        <div className="recipe-meta">
          <div className="meta-item">
            <span className="meta-icon">⏱️</span>
            <div>
              <div className="meta-label">Prep</div>
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
