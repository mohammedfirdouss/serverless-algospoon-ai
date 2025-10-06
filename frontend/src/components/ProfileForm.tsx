import React, { useState, useEffect } from 'react';
import { fetchUserProfile, updateUserProfile } from '../services/api';
import './ProfileForm.css';

interface ProfileFormProps {
  userId: string;
}

interface UserProfile {
  userId: string;
  dietaryRestrictions: string[];
  allergies: string[];
  preferences: {
    cuisineTypes: string[];
    skillLevel: string;
    cookingTime: string;
  };
}

const ProfileForm: React.FC<ProfileFormProps> = ({ userId }) => {
  const [profile, setProfile] = useState<UserProfile>({
    userId,
    dietaryRestrictions: [],
    allergies: [],
    preferences: {
      cuisineTypes: [],
      skillLevel: 'intermediate',
      cookingTime: '30-60 minutes',
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage('Error loading profile. Using defaults.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setMessage('');
      await updateUserProfile(userId, profile);
      setMessage('Profile saved successfully! Your preferences will be used for all recipe generations.');
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('Error saving profile. Please try again.');
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

      <form onSubmit={handleSubmit} className="profile-form">
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
