import { useState } from 'react';
import { 
  HeartPulseIcon, 
  CloseIcon, 
  ActivityIcon, 
  MessageSquareIcon, 
  UserCheckIcon, 
  ArrowRightIcon 
} from './Icons';

export default function GetStartedModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [selectedMood, setSelectedMood] = useState('Overwhelmed');
  const [selectedGoal, setSelectedGoal] = useState('Academic Burnout & Exam Anxiety');

  if (!isOpen) return null;

  const moods = [
    { label: 'Calm', emoji: '🌿' },
    { label: 'Anxious', emoji: '⚡' },
    { label: 'Overwhelmed', emoji: '🌊' },
    { label: 'Exhausted', emoji: '🌙' },
    { label: 'Hopeful', emoji: '✨' },
  ];

  const goals = [
    'Academic Burnout & Exam Anxiety',
    'Low Mood & Lack of Motivation',
    'Sleep Difficulties & Restlessness',
    'Looking for a Qualified Therapist',
    'Daily Confidential Reflection'
  ];

  const handleReset = () => {
    setStep(1);
    onClose();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="get-started-title">
      <div className="modal-container-card">
        {/* Modal Header */}
        <div className="modal-top-bar">
          <div className="modal-brand-tag">
            <HeartPulseIcon size={18} className="modal-brand-icon" />
            <span className="modal-tag-text">HRIDAYA INTAKE PATHWAY</span>
          </div>
          <button 
            type="button" 
            className="modal-dismiss-btn"
            onClick={handleReset}
            aria-label="Close intake modal"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {step === 1 && (
          <div className="modal-step-body">
            <span className="step-indicator-pill">Step 1 of 2: Current Emotional State</span>
            <h3 id="get-started-title" className="modal-heading">How does your mind feel right now?</h3>
            <p className="modal-subheading">
              Select what best describes your emotional baseline today. No right or wrong answers.
            </p>

            {/* Mood Chips */}
            <div className="mood-chips-grid">
              {moods.map((m) => (
                <button
                  key={m.label}
                  type="button"
                  className={`mood-select-chip ${selectedMood === m.label ? 'selected' : ''}`}
                  onClick={() => setSelectedMood(m.label)}
                >
                  <span className="mood-emoji">{m.emoji}</span>
                  <span className="mood-name">{m.label}</span>
                </button>
              ))}
            </div>

            <div className="goal-selection-group">
              <label className="goal-label">What is the primary support you are seeking?</label>
              <div className="goal-options-list">
                {goals.map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={`goal-btn ${selectedGoal === g ? 'selected' : ''}`}
                    onClick={() => setSelectedGoal(g)}
                  >
                    <span className="radio-marker">
                      {selectedGoal === g && <span className="radio-dot" />}
                    </span>
                    <span className="goal-text">{g}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-actions-footer">
              <button
                type="button"
                className="btn-modal-primary"
                onClick={() => setStep(2)}
              >
                <span>Continue to Intake Options</span>
                <ArrowRightIcon size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="modal-step-body">
            <span className="step-indicator-pill">Step 2 of 2: Recommended Pathways</span>
            <h3 className="modal-heading">Personalized Support Options for You</h3>
            <p className="modal-subheading">
              Based on feeling <strong className="text-navy">{selectedMood}</strong> regarding <strong className="text-navy">{selectedGoal}</strong>:
            </p>

            <div className="pathways-options-grid">
              <div className="pathway-card" onClick={() => {
                alert(`Starting 2-Minute GAD-7 / PHQ-9 Screener tailored for ${selectedGoal}.`);
                handleReset();
              }}>
                <div className="pathway-icon-box">
                  <ActivityIcon size={20} />
                </div>
                <div className="pathway-info">
                  <h4 className="pathway-title">Self-Guided Screener</h4>
                  <p className="pathway-desc">2 minutes standardized PHQ-9/GAD-7 assessment with immediate risk calculation.</p>
                </div>
                <span className="pathway-badge">Fast & Anonymous</span>
              </div>

              <div className="pathway-card" onClick={() => {
                alert(`Opening Hridaya 24/7 CBT-grounded chat companion.`);
                handleReset();
              }}>
                <div className="pathway-icon-box">
                  <MessageSquareIcon size={20} />
                </div>
                <div className="pathway-info">
                  <h4 className="pathway-title">Empathetic AI Companion</h4>
                  <p className="pathway-desc">Immediate conversational listening, de-escalation, and somatic breathing guidance.</p>
                </div>
                <span className="pathway-badge">Instant 24/7 Access</span>
              </div>

              <div className="pathway-card" onClick={() => {
                handleReset();
                const target = document.querySelector('#therapists');
                if (target) target.scrollIntoView({ behavior: 'smooth' });
              }}>
                <div className="pathway-icon-box">
                  <UserCheckIcon size={20} />
                </div>
                <div className="pathway-info">
                  <h4 className="pathway-title">Connect with a Therapist</h4>
                  <p className="pathway-desc">Match with a licensed clinical psychologist or campus counselor with student rates.</p>
                </div>
                <span className="pathway-badge">Verified Specialists</span>
              </div>
            </div>

            <div className="modal-actions-footer">
              <button
                type="button"
                className="btn-modal-back"
                onClick={() => setStep(1)}
              >
                Back to Feelings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
