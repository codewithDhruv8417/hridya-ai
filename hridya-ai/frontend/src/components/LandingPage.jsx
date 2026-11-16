import { ArrowRightIcon, ShieldCheckIcon, HeartPulseIcon, SparklesIcon, MicIcon } from './Icons';

export default function LandingPage({ onGetStarted, onOpenScreening, onOpenTherapists, onOpenAuth }) {
  return (
    <section className="landing-clean-section">
      <div className="landing-container">
        {/* Main Emotional Sanctuary Card */}
        <div className="landing-sanctuary-card">
          {/* Subtle Hindi Quote & Branding with Logo */}
          <div className="landing-brand-crest">
            <div className="landing-logo-wrapper">
              <img
                src="/images/hridaya-logo.png"
                alt="Hridaya Logo"
                className="landing-hero-logo"
              />
            </div>
            <h1 className="landing-hindi-title">हृदय</h1>
            <p className="landing-hindi-quote">मानसिक स्वास्थ्य भी स्वास्थ्य है</p>
          </div>

          {/* Concise English Introduction */}
          <div className="landing-intro-box">
            <p className="landing-intro-text">
              Your emotions deserve to be heard.<br />
              A safe space to understand your mental well-being and connect with the support you need.
            </p>
          </div>

          {/* Prominent Get Started Button */}
          <div className="landing-cta-row">
            <button
              type="button"
              className="btn-primary-olive"
              onClick={onGetStarted}
            >
              <span>Begin Your Wellness Journey</span>
              <ArrowRightIcon size={18} />
            </button>
          </div>

          {/* Subtle 3D Nurse Avatar Preview Card */}
          <div className="landing-avatar-preview-card" onClick={onGetStarted} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onGetStarted()}>
            <div className="preview-avatar-portrait">
              {/* Stylized Nurse Avatar Badge */}
              <div className="avatar-preview-visual">
                <div className="nurse-capsule">
                  <span className="nurse-initials">HA</span>
                </div>
                <span className="nurse-pulse-badge" />
              </div>
            </div>

            <div className="preview-avatar-text">
              <div className="preview-name-row">
                <span className="nurse-name">Nurse Ananya</span>
                <span className="nurse-role-pill">AI Wellness Companion</span>
              </div>
              <p className="nurse-speech-snippet">
                "नमस्ते! I am here to listen with compassion. Speak freely in Hindi or English."
              </p>
            </div>

            <div className="preview-action-icon">
              <MicIcon size={18} className="mic-hint-icon" />
            </div>
          </div>

          {/* Secondary Pathways */}
          <div className="landing-secondary-grid">
            <button
              type="button"
              className="secondary-path-card"
              onClick={onOpenScreening}
            >
              <div className="path-icon-olive">
                <SparklesIcon size={18} />
              </div>
              <div className="path-text-col">
                <span className="path-title">Confidential Self-Screening</span>
                <span className="path-desc">2-minute clinical check-in (PHQ-9 / GAD-7)</span>
              </div>
              <ArrowRightIcon size={14} className="path-arrow" />
            </button>

            <button
              type="button"
              className="secondary-path-card"
              onClick={onOpenTherapists}
            >
              <div className="path-icon-peach">
                <HeartPulseIcon size={18} />
              </div>
              <div className="path-text-col">
                <span className="path-title">Licensed Therapists</span>
                <span className="path-desc">Accessible, student-friendly compassionate care</span>
              </div>
              <ArrowRightIcon size={14} className="path-arrow" />
            </button>
          </div>

          {/* Small Privacy Reassurance */}
          <div className="landing-privacy-strip">
            <ShieldCheckIcon size={15} className="privacy-shield-icon" />
            <span className="privacy-reassurance-text">
              100% Private • Anonymous • End-to-End Encrypted • Zero Stigma
            </span>
          </div>

          {/* Quick Sign-In Option for Returning Users */}
          <div className="landing-footer-signin">
            <span>Already have an account? </span>
            <button
              type="button"
              className="link-signin"
              onClick={() => onOpenAuth('choice')}
            >
              Patient or Therapist Sign In
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
