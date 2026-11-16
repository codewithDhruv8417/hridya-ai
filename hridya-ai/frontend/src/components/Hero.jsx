import { useState } from 'react';
import { 
  SparklesIcon, 
  ArrowRightIcon, 
  ShieldCheckIcon, 
  UserCheckIcon, 
  ActivityIcon,
  HeartPulseIcon,
  CheckIcon
} from './Icons';

export default function Hero({ onOpenGetStarted }) {
  const [activeTab, setActiveTab] = useState('checkin');

  return (
    <section className="hero-section" aria-labelledby="hero-heading">
      <div className="hero-container">
        {/* Left Column: Core Value Proposition */}
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            <span className="badge-text">Clinical AI & Human Therapy Collaboration</span>
          </div>

          <h1 id="hero-heading" className="hero-title">
            Gentle, Intelligent Care for Your <span className="text-highlight">Mind & Heart.</span>
          </h1>

          <p className="hero-description">
            Hridaya bridges the gap between daily emotional self-care, instant clinical-grade 
            AI distress screening, and verified human psychotherapists. Accessible 24/7, 
            completely confidential, and engineered without compromise.
          </p>

          {/* Action Buttons */}
          <div className="hero-cta-group">
            <button
              type="button"
              onClick={onOpenGetStarted}
              className="btn-hero-primary"
            >
              <span>Get Started Free</span>
              <ArrowRightIcon size={18} />
            </button>

            <a
              href="#ai-screening"
              className="btn-hero-secondary"
            >
              <span>Try AI Screening Demo</span>
            </a>
          </div>

          {/* Trust Badges */}
          <div className="hero-trust-grid">
            <div className="trust-item">
              <div className="trust-icon-box">
                <ShieldCheckIcon size={18} className="trust-icon" />
              </div>
              <div className="trust-text-group">
                <span className="trust-heading">100% Confidential</span>
                <span className="trust-caption">Client-side zero retention</span>
              </div>
            </div>

            <div className="trust-item">
              <div className="trust-icon-box">
                <ActivityIcon size={18} className="trust-icon" />
              </div>
              <div className="trust-text-group">
                <span className="trust-heading">PHQ-9 & GAD-7</span>
                <span className="trust-caption">Standardized clinical scale</span>
              </div>
            </div>

            <div className="trust-item">
              <div className="trust-icon-box">
                <UserCheckIcon size={18} className="trust-icon" />
              </div>
              <div className="trust-text-group">
                <span className="trust-heading">Verified Therapists</span>
                <span className="trust-caption">Licensed PsyD & LMFT care</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: High-Fidelity Interactive Preview Card */}
        <div className="hero-visual">
          <div className="preview-card-outer">
            {/* Window Header */}
            <div className="preview-header">
              <div className="preview-dots">
                <span className="dot dot-1" />
                <span className="dot dot-2" />
                <span className="dot dot-3" />
              </div>
              <div className="preview-status-pill">
                <span className="status-indicator-live" />
                <span>Hridaya AI Care Engine • Active</span>
              </div>
              <div className="preview-mode-switch">
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'checkin' ? 'active' : ''}`}
                  onClick={() => setActiveTab('checkin')}
                >
                  Daily Check-in
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'triage' ? 'active' : ''}`}
                  onClick={() => setActiveTab('triage')}
                >
                  Triage Pulse
                </button>
              </div>
            </div>

            {/* Tab 1: Interactive Chat Simulation */}
            {activeTab === 'checkin' ? (
              <div className="preview-chat-body">
                {/* User Message */}
                <div className="chat-bubble chat-user">
                  <div className="bubble-sender">Student / User</div>
                  <p className="bubble-text">
                    "I've felt completely drained and overwhelmed with final projects this week. 
                    I can't seem to sleep or focus without constant dread."
                  </p>
                  <span className="bubble-time">10:42 AM</span>
                </div>

                {/* AI Screening Response */}
                <div className="chat-bubble chat-ai">
                  <div className="bubble-ai-header">
                    <div className="ai-avatar-tiny">
                      <HeartPulseIcon size={14} />
                    </div>
                    <span className="ai-sender-name">Hridaya Companion</span>
                    <span className="ai-tag-clinical">CBT Grounded</span>
                  </div>
                  <p className="bubble-text">
                    I hear how heavy this academic pressure is feeling right now. It is completely 
                    understandable that your nervous system is exhausted. 
                  </p>
                  <p className="bubble-text">
                    Let's gently unpack this together. Would you like a 1-minute physiological reset, 
                    or shall we do a brief 4-question stress triage to see where your cognitive load is?
                  </p>
                  
                  {/* Action Chips */}
                  <div className="chat-chip-actions">
                    <button 
                      type="button" 
                      className="chat-chip"
                      onClick={() => setActiveTab('triage')}
                    >
                      <ActivityIcon size={13} />
                      <span>Assess Stress (GAD-7)</span>
                    </button>
                    <a href="#therapists" className="chat-chip chat-chip-secondary">
                      <UserCheckIcon size={13} />
                      <span>Talk to Campus Therapist</span>
                    </a>
                  </div>
                </div>

                {/* Bottom Live Sentiment Tag */}
                <div className="preview-sentiment-bar">
                  <span className="sentiment-label">Detected Sentiment:</span>
                  <span className="sentiment-chip">Academic Burnout (Mild-Moderate)</span>
                  <span className="sentiment-safe">
                    <CheckIcon size={12} /> Crisis Trigger Safe
                  </span>
                </div>
              </div>
            ) : (
              /* Tab 2: Triage Assessment Breakdown */
              <div className="preview-triage-body">
                <div className="triage-top">
                  <div>
                    <h2 className="triage-title">Preliminary Distress Profile</h2>
                    <p className="triage-desc">Based on multimodal semantic assessment</p>
                  </div>
                  <div className="triage-score-badge">
                    <span className="score-num">8 / 21</span>
                    <span className="score-sub">Mild Anxiety</span>
                  </div>
                </div>

                <div className="triage-metric-rows">
                  <div className="metric-row">
                    <div className="metric-info">
                      <span className="metric-name">Academic Fatigue Index</span>
                      <span className="metric-val">Moderate (64%)</span>
                    </div>
                    <div className="metric-track">
                      <div className="metric-fill" style={{ width: '64%' }} />
                    </div>
                  </div>

                  <div className="metric-row">
                    <div className="metric-info">
                      <span className="metric-name">Sleep & Somatic Tension</span>
                      <span className="metric-val">Mild (38%)</span>
                    </div>
                    <div className="metric-track">
                      <div className="metric-fill fill-mild" style={{ width: '38%' }} />
                    </div>
                  </div>

                  <div className="metric-row">
                    <div className="metric-info">
                      <span className="metric-name">Emotional Self-Regulation</span>
                      <span className="metric-val">Stable (82%)</span>
                    </div>
                    <div className="metric-track">
                      <div className="metric-fill fill-good" style={{ width: '82%' }} />
                    </div>
                  </div>
                </div>

                <div className="triage-recommendation-card">
                  <div className="rec-header">
                    <SparklesIcon size={16} className="rec-icon" />
                    <span className="rec-title">Recommended Next Step</span>
                  </div>
                  <p className="rec-body">
                    Engage in guided box-breathing exercise (4-4-4-4) followed by a 15-minute 
                    preventative consultation with a campus wellness counselor.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
