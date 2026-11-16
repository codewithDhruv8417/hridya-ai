import { UserIcon } from './Icons';

export default function Navbar({ activeView, setActiveView, onOpenAuth, currentUser, onLogout }) {
  return (
    <header className="site-navbar">
      <div className="navbar-inner">
        {/* Brand Group */}
        <button
          type="button"
          onClick={() => setActiveView('home')}
          className="brand-link"
          aria-label="हृदय मुख्य पृष्ठ"
        >
          <img
            src="/images/hridaya-logo.png"
            alt="Hridaya Logo"
            className="brand-logo-img"
          />
          <div className="brand-headings">
            <div className="brand-hindi-row">
              <span className="brand-hindi-title">हृदय</span>
              <span className="brand-sub-badge">AI Wellness</span>
            </div>
            <p className="brand-quote-sub">मानसिक स्वास्थ्य भी स्वास्थ्य है</p>
          </div>
        </button>

        {/* Navigation Items */}
        <nav className="nav-items" aria-label="मुख्य नेविगेशन">
          <button
            type="button"
            className={`nav-tab-btn ${activeView === 'home' ? 'active' : ''}`}
            onClick={() => setActiveView('home')}
          >
            Home
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeView === 'assistant' ? 'active' : ''}`}
            onClick={() => setActiveView('assistant')}
          >
            AI Assistant
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeView === 'screening' ? 'active' : ''}`}
            onClick={() => setActiveView('screening')}
          >
            Screening
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeView === 'therapists' ? 'active' : ''}`}
            onClick={() => setActiveView('therapists')}
          >
            Therapists
          </button>
        </nav>

        {/* Right Actions */}
        <div className="nav-right-actions">
          {currentUser ? (
            <div className="user-profile-badge">
              <div className="user-avatar-circle">
                <UserIcon size={16} />
              </div>
              <div className="user-info-text">
                <span className="user-name">{currentUser.name}</span>
                <span className="user-role">{currentUser.role === 'therapist' ? 'Therapist' : 'Patient'}</span>
              </div>
              <button
                type="button"
                className="btn-logout"
                onClick={onLogout}
                title="Log out"
              >
                Log Out
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-nav-login"
              onClick={() => onOpenAuth('choice')}
            >
              <UserIcon size={16} />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
