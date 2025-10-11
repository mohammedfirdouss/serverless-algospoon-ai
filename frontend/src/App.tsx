import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import React, { Suspense, lazy } from 'react';
import './App.css';

// Lazy load components for code splitting
const ProfileForm = lazy(() => import('./components/ProfileForm'));
const RecipeGenerator = lazy(() => import('./components/RecipeGenerator'));
const MealPlanner = lazy(() => import('./components/MealPlanner'));

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p>Loading...</p>
  </div>
);

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <Router>
          <div className="app">
            <header className="app-header">
              <div className="header-content">
                <h1 className="logo">🥄 AlgoSpoon AI</h1>
                <nav className="main-nav">
                  <Link to="/" className="nav-link">Recipe Generator</Link>
                  <Link to="/meal-planner" className="nav-link">Meal Planner</Link>
                  <Link to="/profile" className="nav-link">Profile</Link>
                </nav>
                <div className="user-section">
                  <span className="user-name">{user?.username}</span>
                  <button onClick={signOut} className="sign-out-btn">Sign Out</button>
                </div>
              </div>
            </header>

            <main className="app-main">
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<RecipeGenerator userId={user?.username || ''} />} />
                  <Route path="/meal-planner" element={<MealPlanner userId={user?.username || ''} />} />
                  <Route path="/profile" element={<ProfileForm userId={user?.username || ''} />} />
                </Routes>
              </Suspense>
            </main>

            <footer className="app-footer">
              <p>© 2025 AlgoSpoon AI - Personalized Recipe Generation with AWS Bedrock</p>
            </footer>
          </div>
        </Router>
      )}
    </Authenticator>
  );
}

export default App;
