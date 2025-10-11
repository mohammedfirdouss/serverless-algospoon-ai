import React, { useState, useEffect } from 'react';
import { fetchUserProfile, updateUserProfile } from '../services/api';
import type { UserProfile } from '@shared/types/user';
import './ProfileForm.css';

interface ProfileFormProps {
  userId: string;
  onRegister?: (params: {
    email: string;
    name: string;
    password: string;
    dietaryRestrictions?: string[];
    allergies?: string[];
    targetCalories?: number;
  }) => Promise<any>;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ userId, onRegister }) => {
  const [profile, setProfile] = useState<UserProfile>({
    userId,
    email: '',
    name: '',
    dietaryRestrictions: [],
    allergies: [],
    preferences: {
      cuisineTypes: [],
      skillLevel: 'intermediate',
      cookingTime: '30-60 minutes',
    },
  });
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isNewUser, setIsNewUser] = useState(true);

  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Pescatarian', 'Gluten-Free', 'Dairy-Free',
    'Keto', 'Paleo', 'Low-Carb', 'Low-Fat', 'Halal', 'Kosher'
  ];

  const cuisineOptions = [
    'Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian', 'Thai',
    'Mediterranean', 'French', 'American', 'Korean', 'Vietnamese'
  ];

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await fetchUserProfile(userId);
      if (data) {
        setProfile((prev) => ({
          ...prev,
          ...data,
          preferences: {
            cuisineTypes: data.preferences?.cuisineTypes || [],
            skillLevel: data.preferences?.skillLevel || 'intermediate',
            cookingTime: data.preferences?.cookingTime || '30-60 minutes',
          },
        }));
        setIsNewUser(false);
      } else {
        setIsNewUser(true);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage('Error loading profile. Using defaults.');
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
        if (!onRegister) {
          throw new Error('Registration handler not provided');
        }
        if (!profile.email || !password) {
          throw new Error('Email and password are required to register');
        }
        await onRegister({
          email: profile.email,
          name: profile.name || 'New User',
          password,
          dietaryRestrictions: profile.dietaryRestrictions,
          allergies: profile.allergies,
        });
        setMessage('Account created successfully!');
        setIsNewUser(false);
      }

      await updateUserProfile(profile);
      setMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleDietaryRestriction = (restriction: string) => {
    setProfile(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction]
    }));
  };

  const toggleCuisine = (cuisine: string) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        cuisineTypes: prev.preferences.cuisineTypes.includes(cuisine)
          ? prev.preferences.cuisineTypes.filter(c => c !== cuisine)
          : [...prev.preferences.cuisineTypes, cuisine]
      }
    }));
  };

  const addAllergy = (allergy: string) => {
    if (allergy.trim() && !profile.allergies.includes(allergy.trim())) {
      setProfile(prev => ({
        ...prev,
        allergies: [...prev.allergies, allergy.trim()]
      }));
    }
  };

  const removeAllergy = (allergy: string) => {
    setProfile(prev => ({
      ...prev,
      allergies: prev.allergies.filter(a => a !== allergy)
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
        {/* Name */}
        <div className="form-row">
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            value={profile.name || ''}
            onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Alex Johnson"
            className="text-input"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={profile.email || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
              placeholder="alex@example.com"
              className="text-input"
              disabled={!isNewUser}
            />
          </div>

          {isNewUser && (
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure password"
                className="text-input"
              />
            </div>
          )}
        </div>

        {/* Dietary Restrictions */}
        <section className="form-section">
          <h3>Dietary Restrictions</h3>
          <div className="options-grid">
            {dietaryOptions.map(option => (
              <label key={option} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={profile.dietaryRestrictions.includes(option)}
                  onChange={() => toggleDietaryRestriction(option)}
                />
                <span>{option}</span>
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
            {profile.allergies.map(allergy => (
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
                  checked={profile.preferences.cuisineTypes.includes(cuisine)}
                  onChange={() => toggleCuisine(cuisine)}
                />
                <span>{cuisine}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Skill Level */}
        <section className="form-section">
          <h3>Cooking Skill Level</h3>
          <select
            value={profile.preferences.skillLevel}
            onChange={(e) => setProfile(prev => ({
              ...prev,
              preferences: { ...prev.preferences, skillLevel: e.target.value }
            }))}
            className="select-input"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </section>

        {/* Cooking Time */}
        <section className="form-section">
          <h3>Preferred Cooking Time</h3>
          <select
            value={profile.preferences.cookingTime}
            onChange={(e) => setProfile(prev => ({
              ...prev,
              preferences: { ...prev.preferences, cookingTime: e.target.value }
            }))}
            className="select-input"
          >
            <option value="under-30">Under 30 minutes</option>
            <option value="30-60">30-60 minutes</option>
            <option value="60-90">60-90 minutes</option>
            <option value="90-plus">90+ minutes</option>
          </select>
        </section>

        {message && (
          <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <button type="submit" disabled={saving} className="save-button">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};

export default ProfileForm;
