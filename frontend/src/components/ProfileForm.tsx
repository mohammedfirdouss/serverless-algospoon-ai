import React, { useState, useEffect } from 'react';
import { fetchUserProfile, updateUserProfile, registerUser } from '../services/api';
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

  const dietaryOptions = [
    'vegetarian', 'vegan', 'pescatarian', 'gluten-free', 'dairy-free',
    'keto', 'paleo', 'low-carb', 'low-fat', 'halal', 'kosher'
  ];

  const cuisineOptions = [
    'italian', 'mexican', 'chinese', 'japanese', 'indian', 'thai',
    'mediterranean', 'french', 'american', 'korean', 'vietnamese'
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

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
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

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="profile-form-container">
      <h2>Your Dietary Profile</h2>
      <p className="profile-description">
        Customize your dietary preferences to receive personalized recipe recommendations.
      </p>

      <form onSubmit={handleSave} className="profile-form">
        {/* Basic Info */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              value={profile.fullName}
              onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
              placeholder="e.g., Alex Johnson"
              className="text-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
              placeholder="alex@example.com"
              className="text-input"
              required
              disabled={!isNewUser}
            />
          </div>
        </div>

        {/* Calories and Meals */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="calories">Target Daily Calories</label>
            <input
              id="calories"
              type="number"
              min="1200"
              max="4000"
              value={profile.preferences.targetCalories || 2000}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                preferences: { ...prev.preferences, targetCalories: parseInt(e.target.value) }
              }))}
              className="text-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="meals">Meals Per Day</label>
            <select
              id="meals"
              value={profile.preferences.mealsPerDay || 3}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                preferences: { ...prev.preferences, mealsPerDay: parseInt(e.target.value) }
              }))}
              className="select-input"
            >
              <option value={2}>2 meals</option>
              <option value={3}>3 meals</option>
              <option value={4}>4 meals</option>
              <option value={5}>5 meals</option>
            </select>
          </div>
        </div>

        {/* Dietary Restrictions */}
        <section className="form-section">
          <h3>Dietary Restrictions</h3>
          <div className="options-grid">
            {dietaryOptions.map(option => (
              <label key={option} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={profile.preferences.dietaryRestrictions.includes(option)}
                  onChange={() => toggleDietaryRestriction(option)}
                />
                <span>{option.charAt(0).toUpperCase() + option.slice(1)}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Allergies */}
        <section className="form-section">
          <h3>Allergies</h3>
          <p className="section-description">
            ⚠️ Critical: AI will NEVER include these ingredients in your recipes
          </p>
          <div className="allergy-input-group">
            <input
              type="text"
              placeholder="Add an allergy (e.g., peanuts, shellfish)"
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
            {profile.preferences.allergies.map(allergy => (
              <span key={allergy} className="allergy-tag">
                {allergy}
                <button
                  type="button"
                  onClick={() => removeAllergy(allergy)}
                  className="remove-tag"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* Preferred Cuisines */}
        <section className="form-section">
          <h3>Preferred Cuisines</h3>
          <div className="options-grid">
            {cuisineOptions.map(cuisine => (
              <label key={cuisine} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={profile.preferences.cuisinePreferences.includes(cuisine)}
                  onChange={() => toggleCuisine(cuisine)}
                />
                <span>{cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Cooking Skill Level */}
        <section className="form-section">
          <h3>Cooking Skill Level</h3>
          <select
            value={profile.preferences.cookingSkill}
            onChange={(e) => setProfile(prev => ({
              ...prev,
              preferences: { 
                ...prev.preferences, 
                cookingSkill: e.target.value as 'beginner' | 'intermediate' | 'advanced' | 'expert'
              }
            }))}
            className="select-input"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
        </section>

        {message && (
          <div className={`message ${message.includes('Error') || message.includes('Failed') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <button type="submit" disabled={saving} className="save-button">
          {saving ? 'Saving...' : isNewUser ? 'Create Profile' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
};

export default ProfileForm;
