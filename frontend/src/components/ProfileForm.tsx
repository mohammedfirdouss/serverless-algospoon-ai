import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchUserProfile, updateUserProfile, registerUser } from '../services/api';
import { Button } from './ui/Button';
import type { UserProfile } from '../services/api';
import './ProfileForm.css';

interface ProfileFormProps {
  userId: string;
  onRegister?: (params: any) => Promise<any>;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ userId, onRegister }) => {
  const [profile, setProfile] = useState<UserProfile>({
    userId,
    email: '',
    fullName: '',
    preferences: {
      dietaryRestrictions: [],
      allergies: [],
      cuisinePreferences: [],
      cookingSkill: 'intermediate',
      targetCalories: 2000,
      mealsPerDay: 3,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isNewUser, setIsNewUser] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const dietaryOptions = [
    { id: 'vegetarian', label: 'Vegetarian', emoji: '🥬', description: 'No meat, fish, or poultry' },
    { id: 'vegan', label: 'Vegan', emoji: '🌱', description: 'No animal products' },
    { id: 'pescatarian', label: 'Pescatarian', emoji: '🐟', description: 'Fish but no meat' },
    { id: 'gluten-free', label: 'Gluten-Free', emoji: '🌾', description: 'No wheat, barley, or rye' },
    { id: 'dairy-free', label: 'Dairy-Free', emoji: '🥛', description: 'No milk products' },
    { id: 'keto', label: 'Ketogenic', emoji: '🥑', description: 'High fat, very low carb' },
    { id: 'paleo', label: 'Paleo', emoji: '🦣', description: 'Stone age diet' },
    { id: 'low-carb', label: 'Low Carb', emoji: '🥩', description: 'Reduced carbohydrates' },
  ];

  const cuisineOptions = [
    { id: 'italian', label: 'Italian', emoji: '🍝', flag: '🇮🇹' },
    { id: 'mexican', label: 'Mexican', emoji: '🌮', flag: '🇲🇽' },
    { id: 'chinese', label: 'Chinese', emoji: '🥢', flag: '🇨🇳' },
    { id: 'japanese', label: 'Japanese', emoji: '🍣', flag: '🇯🇵' },
    { id: 'indian', label: 'Indian', emoji: '🍛', flag: '🇮🇳' },
    { id: 'thai', label: 'Thai', emoji: '🍜', flag: '🇹🇭' },
    { id: 'mediterranean', label: 'Mediterranean', emoji: '🫒', flag: '🇬🇷' },
    { id: 'french', label: 'French', emoji: '🥖', flag: '🇫🇷' },
    { id: 'american', label: 'American', emoji: '🍔', flag: '🇺🇸' },
    { id: 'korean', label: 'Korean', emoji: '🥢', flag: '🇰🇷' },
  ];

  const skillLevels = [
    { id: 'beginner', label: 'Beginner', emoji: '👶', description: 'Just starting my culinary journey' },
    { id: 'intermediate', label: 'Intermediate', emoji: '👨‍🍳', description: 'Comfortable with basic techniques' },
    { id: 'advanced', label: 'Advanced', emoji: '🧑‍🍳', description: 'Skilled home cook' },
    { id: 'expert', label: 'Expert', emoji: '👨‍💼', description: 'Professional-level skills' },
  ];

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await fetchUserProfile(userId);
      if (data) {
        setProfile(data);
        setIsNewUser(false);
      } else {
        setIsNewUser(true);
        setProfile(prev => ({ ...prev, userId }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage('Error loading profile. Using defaults.');
      setIsNewUser(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      if (isNewUser) {
        if (!profile.email || !profile.fullName) {
          throw new Error('Email and full name are required');
        }
        
        await registerUser({
          userId: profile.userId,
          email: profile.email,
          fullName: profile.fullName,
          preferences: profile.preferences,
        });
        setMessage('Profile registered successfully!');
        setIsNewUser(false);
      } else {
        await updateUserProfile(profile);
        setMessage('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleDietaryRestriction = (restriction: string) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        dietaryRestrictions: prev.preferences.dietaryRestrictions.includes(restriction)
          ? prev.preferences.dietaryRestrictions.filter(r => r !== restriction)
          : [...prev.preferences.dietaryRestrictions, restriction]
      }
    }));
  };

  const toggleCuisine = (cuisine: string) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        cuisinePreferences: prev.preferences.cuisinePreferences.includes(cuisine)
          ? prev.preferences.cuisinePreferences.filter(c => c !== cuisine)
          : [...prev.preferences.cuisinePreferences, cuisine]
      }
    }));
  };

  const addAllergy = (allergy: string) => {
    if (allergy.trim() && !profile.preferences.allergies.includes(allergy.trim().toLowerCase())) {
      setProfile(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          allergies: [...prev.preferences.allergies, allergy.trim().toLowerCase()]
        }
      }));
    }
  };

  const removeAllergy = (allergy: string) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        allergies: prev.preferences.allergies.filter(a => a !== allergy)
      }
    }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  if (loading) {
    return (
      <div className="profile-loading">
        <motion.div
          className="loading-chef"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          👨‍🍳
        </motion.div>
        <p>Preparing your culinary profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-form-container">
      <div className="profile-header">
        <motion.h1
          className="profile-title"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          Your Culinary Journey
        </motion.h1>
        <p className="profile-subtitle">
          Tell us about your taste preferences and cooking style so we can create perfect recipes just for you.
        </p>
        
        {/* Progress indicator */}
        <div className="progress-bar">
          {Array.from({ length: totalSteps }, (_, i) => (
            <motion.div
              key={i}
              className={`progress-step ${i + 1 <= currentStep ? 'active' : ''}`}
              initial={false}
              animate={{
                scale: i + 1 === currentStep ? 1.2 : 1,
                backgroundColor: i + 1 <= currentStep ? 'var(--color-saffron-500)' : 'var(--color-charcoal-300)'
              }}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="form-step"
        >
          {currentStep === 1 && (
            <div className="step-content">
              <h2 className="step-title">👋 Let's get acquainted</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    id="fullName"
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Chef Julia Child"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="julia@example.com"
                    className="form-input"
                    disabled={!isNewUser}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="calories">Daily Calorie Goal</label>
                  <div className="calorie-input-group">
                    <input
                      id="calories"
                      type="range"
                      min="1200"
                      max="4000"
                      step="50"
                      value={profile.preferences.targetCalories || 2000}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, targetCalories: parseInt(e.target.value) }
                      }))}
                      className="calorie-slider"
                    />
                    <span className="calorie-value">{profile.preferences.targetCalories || 2000} cal</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="meals">Meals Per Day</label>
                  <div className="meal-selector">
                    {[2, 3, 4, 5].map(num => (
                      <button
                        key={num}
                        type="button"
                        className={`meal-option ${(profile.preferences.mealsPerDay || 3) === num ? 'active' : ''}`}
                        onClick={() => setProfile(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, mealsPerDay: num }
                        }))}
                      >
                        {num} meals
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="step-content">
              <h2 className="step-title">🥗 Dietary Preferences</h2>
              <p className="step-description">Select any dietary restrictions or lifestyle choices that apply to you.</p>
              <div className="options-grid">
                {dietaryOptions.map(option => (
                  <motion.button
                    key={option.id}
                    type="button"
                    className={`dietary-option ${profile.preferences.dietaryRestrictions.includes(option.id) ? 'active' : ''}`}
                    onClick={() => toggleDietaryRestriction(option.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="option-emoji">{option.emoji}</span>
                    <span className="option-label">{option.label}</span>
                    <span className="option-description">{option.description}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="step-content">
              <h2 className="step-title">⚠️ Allergies & Restrictions</h2>
              <p className="step-description">
                Critical safety information - we'll never include these ingredients in your recipes.
              </p>
              
              <div className="allergy-input-group">
                <input
                  type="text"
                  placeholder="Type an allergy and press Enter (e.g., peanuts, shellfish)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAllergy((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                  className="allergy-input"
                />
              </div>

              <div className="allergy-tags">
                <AnimatePresence>
                  {profile.preferences.allergies.map(allergy => (
                    <motion.span
                      key={allergy}
                      className="allergy-tag"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      layout
                    >
                      🚫 {allergy}
                      <button
                        type="button"
                        onClick={() => removeAllergy(allergy)}
                        className="remove-tag"
                      >
                        ×
                      </button>
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>

              <h3 className="subsection-title">🌍 Favorite Cuisines</h3>
              <div className="cuisine-grid">
                {cuisineOptions.map(cuisine => (
                  <motion.button
                    key={cuisine.id}
                    type="button"
                    className={`cuisine-option ${profile.preferences.cuisinePreferences.includes(cuisine.id) ? 'active' : ''}`}
                    onClick={() => toggleCuisine(cuisine.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="cuisine-flag">{cuisine.flag}</span>
                    <span className="cuisine-emoji">{cuisine.emoji}</span>
                    <span className="cuisine-label">{cuisine.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="step-content">
              <h2 className="step-title">👨‍🍳 Cooking Experience</h2>
              <p className="step-description">This helps us suggest recipes that match your skill level.</p>
              
              <div className="skill-selector">
                {skillLevels.map(skill => (
                  <motion.button
                    key={skill.id}
                    type="button"
                    className={`skill-option ${profile.preferences.cookingSkill === skill.id ? 'active' : ''}`}
                    onClick={() => setProfile(prev => ({
                      ...prev,
                      preferences: { 
                        ...prev.preferences, 
                        cookingSkill: skill.id as 'beginner' | 'intermediate' | 'advanced' | 'expert'
                      }
                    }))}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="skill-emoji">{skill.emoji}</span>
                    <span className="skill-label">{skill.label}</span>
                    <span className="skill-description">{skill.description}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="form-actions">
        {currentStep > 1 && (
          <Button
            variant="ghost"
            onClick={prevStep}
            leftIcon="←"
          >
            Previous
          </Button>
        )}

        <div className="action-buttons">
          {currentStep < totalSteps ? (
            <Button
              variant="primary"
              onClick={nextStep}
              rightIcon="→"
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={saving}
              leftIcon="💾"
            >
              {isNewUser ? 'Create Profile' : 'Update Profile'}
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            className={`message ${message.includes('Error') || message.includes('Failed') ? 'error' : 'success'}`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileForm;
