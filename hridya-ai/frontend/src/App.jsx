import { useState } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import AssistantChat from './components/Avatar/AssistantChat';
import ScreeningFlow from './components/Screening/ScreeningFlow';
import TherapistDirectory from './components/Therapists/TherapistDirectory';
import AuthModal from './components/Auth/AuthModal';
import Footer from './components/Footer';
import './App.css';

export default function App() {
  // Navigation active view: 'home' | 'assistant' | 'screening' | 'therapists'
  const [activeView, setActiveView] = useState('home');

  // Authentication state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialView, setAuthInitialView] = useState('choice');
  const [currentUser, setCurrentUser] = useState(null);

  const handleOpenAuth = (view = 'choice') => {
    setAuthInitialView(view);
    setIsAuthOpen(true);
  };

  const handleCloseAuth = () => {
    setIsAuthOpen(false);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const navigateToView = (viewName) => {
    setActiveView(viewName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="hridaya-root-app">
      {/* Accessibility Skip Link */}
      <a href="#primary-view-container" className="skip-link">
        Skip to main content
      </a>

      {/* Top Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={navigateToView}
        onOpenAuth={handleOpenAuth}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Primary View Container */}
      <main id="primary-view-container" className="view-content-wrapper">
        {activeView === 'home' && (
          <LandingPage
            onGetStarted={() => navigateToView('assistant')}
            onOpenScreening={() => navigateToView('screening')}
            onOpenTherapists={() => navigateToView('therapists')}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {activeView === 'assistant' && (
          <AssistantChat
            onNavigateToScreening={() => navigateToView('screening')}
            onNavigateToTherapists={() => navigateToView('therapists')}
          />
        )}

        {activeView === 'screening' && (
          <ScreeningFlow
            onNavigateToAssistant={() => navigateToView('assistant')}
            onNavigateToTherapists={() => navigateToView('therapists')}
          />
        )}

        {activeView === 'therapists' && (
          <TherapistDirectory
            onOpenAuth={handleOpenAuth}
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={navigateToView} />

      {/* Authentication Modal (Patient & Therapist) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={handleCloseAuth}
        initialView={authInitialView}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
