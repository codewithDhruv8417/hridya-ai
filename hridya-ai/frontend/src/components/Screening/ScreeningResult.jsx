import { 
  SparklesIcon, 
  PhoneCallIcon, 
  ShieldCheckIcon, 
  CheckIcon, 
  ArrowRightIcon,
  TherapistIcon 
} from '../Icons';

export default function ScreeningResult({
  totalScore,
  maxScore = 15,
  apiResult = null,
  apiError = null,
  onRestart,
  onNavigateToAssistant,
  onNavigateToTherapists
}) {
  // Normalize wellness percentage (100% is optimal balance)
  const distressRatio = totalScore / maxScore;
  const wellnessScore = Math.max(10, Math.round((1 - distressRatio) * 100));

  // Determine which recommendation state applies:
  // State 1: Self-care and wellness resources suggested
  // State 2: Professional therapist support recommended
  // State 3: Urgent support guidance required
  let resultState = 'self-care';
  let severityLabel = 'Minimal to Mild Strain';
  let severityBadgeClass = 'badge-safe';

  if (totalScore >= 10) {
    resultState = 'urgent';
    severityLabel = 'Elevated Strain (Support Needed)';
    severityBadgeClass = 'badge-urgent';
  } else if (totalScore >= 5) {
    resultState = 'therapist';
    severityLabel = 'Moderate Stress Indication';
    severityBadgeClass = 'badge-warn';
  }

  return (
    <section className="screening-result-section" aria-labelledby="result-title">
      <div className="screening-container">
        <div className="result-main-card">
          {/* Top Banner / Assessment Identity */}
          <div className="result-top-bar">
            <div className="result-header-text">
              <span className="result-eyebrow">HRIDAYA CLINICAL SCREENING SUMMARY</span>
              <h2 id="result-title" className="result-heading">Your Wellness Baseline Profile</h2>
            </div>
            <div className={`result-severity-pill ${severityBadgeClass}`}>
              <span className="severity-dot" />
              <span>{severityLabel}</span>
            </div>
          </div>

          {/* Score & Gauge Presentation */}
          <div className="result-score-overview-grid">
            {/* Score Ring / Block */}
            <div className="score-metric-box">
              <span className="score-label">Wellness Balance Index</span>
              <div className="score-numerical-display">
                <span className="score-big">{wellnessScore}</span>
                <span className="score-max">/ 100</span>
              </div>
              <p className="score-caption">
                Raw Psychometric Distress Score: <strong>{totalScore}</strong> out of {maxScore}
              </p>
            </div>

            {/* Dimensional Breakdown */}
            <div className="score-dimensions-card">
              <h3 className="dimensions-title">Screening Dimension Analysis</h3>
              
              <div className="dimension-row">
                <div className="dim-label-group">
                  <span className="dim-name">Mood & Cognitive Load</span>
                  <span className="dim-val">{totalScore > 4 ? 'Elevated' : 'Balanced'}</span>
                </div>
                <div className="dim-track">
                  <div className="dim-fill" style={{ width: `${Math.min(100, (totalScore / 5) * 35)}%` }} />
                </div>
              </div>

              <div className="dimension-row">
                <div className="dim-label-group">
                  <span className="dim-name">Sleep & Somatic Fatigue</span>
                  <span className="dim-val">{totalScore > 3 ? 'Mild Disruption' : 'Restful'}</span>
                </div>
                <div className="dim-track">
                  <div className="dim-fill" style={{ width: `${Math.min(100, (totalScore / 4) * 30)}%` }} />
                </div>
              </div>

              <div className="dimension-row">
                <div className="dim-label-group">
                  <span className="dim-name">Emotional Coping Capacity</span>
                  <span className="dim-val">{wellnessScore > 60 ? 'Resilient' : 'Requires Support'}</span>
                </div>
                <div className="dim-track">
                  <div className="dim-fill dim-fill-green" style={{ width: `${wellnessScore}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* AI RESULT FROM THE FASTAPI BACKEND (XGBoost + MedGemma)       */}
          {/* ------------------------------------------------------------- */}
          {apiResult && (
            <div className={`ai-summary-card ai-risk-${apiResult.risk_level}`}>
              <div className="ai-summary-head">
                <div>
                  <span className="ai-summary-eyebrow">AI CLINICAL SCREENING SUMMARY</span>
                  <h3 className="ai-summary-title">
                    {apiResult.scores.predicted_category}
                  </h3>
                </div>
                <span className={`ai-risk-pill ai-risk-pill-${apiResult.risk_level}`}>
                  {apiResult.risk_level} risk
                </span>
              </div>

              <div className="ai-summary-metrics">
                <span>
                  Model confidence <strong>{Math.round(apiResult.scores.confidence * 100)}%</strong>
                </span>
                {apiResult.questionnaire && (
                  <span>
                    Screener total{' '}
                    <strong>
                      {apiResult.questionnaire.total}/{apiResult.questionnaire.max_score}
                    </strong>
                  </span>
                )}
                <span>
                  Explanation by <strong>{apiResult.explanation_source === 'medgemma' ? 'MedGemma' : 'local explainer'}</strong>
                </span>
              </div>

              <p className="ai-summary-explanation">{apiResult.explanation}</p>

              {apiResult.drivers?.length > 0 && (
                <div className="ai-driver-list">
                  <span className="ai-driver-label">Signals that moved your score</span>
                  <div className="ai-driver-chips">
                    {apiResult.drivers.slice(0, 4).map((driver) => (
                      <span key={driver.feature} className={`ai-driver-chip driver-${driver.direction}`}>
                        {driver.label}: {String(driver.value)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {apiResult.safety?.crisis_resources?.length > 0 && (
                <div className="ai-crisis-box">
                  <strong>Please reach out today:</strong>
                  <ul>
                    {apiResult.safety.crisis_resources.map((resource) => (
                      <li key={resource}>{resource}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="ai-summary-disclaimer">{apiResult.disclaimer}</p>
            </div>
          )}

          {apiError && (
            <div className="ai-summary-card ai-summary-offline">
              <strong>AI screening summary unavailable.</strong>
              <p>
                {apiError} The wellness score above is calculated in the browser and is still valid
                as a self-check.
              </p>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* RESULT STATE 1: SELF-CARE AND WELLNESS RESOURCES SUGGESTED   */}
          {/* ------------------------------------------------------------- */}
          {resultState === 'self-care' && (
            <div className="recommendation-state-card state-self-care">
              <div className="rec-badge-row">
                <span className="rec-status-tag tag-green">Suggested Care Pathway</span>
                <h3 className="rec-title">Self-Care & Daily Wellness Resources Suggested</h3>
              </div>
              <p className="rec-explanation">
                Your responses suggest your current stress is in a manageable range. Practicing proactive 
                daily mindfulness, regular sleep schedules, and guided conversational reflection with 
                Nurse Ananya can help protect your emotional resilience.
              </p>

              <div className="suggested-actions-list">
                <div className="action-item">
                  <div className="action-check-icon"><CheckIcon size={14} /></div>
                  <div>
                    <strong>4-7-8 Breathing & Grounding:</strong> Activate the parasympathetic nervous system before exams or sleep.
                  </div>
                </div>
                <div className="action-item">
                  <div className="action-check-icon"><CheckIcon size={14} /></div>
                  <div>
                    <strong>Daily Reflection with Nurse Ananya:</strong> 5-minute vocal check-in to clear mental clutter.
                  </div>
                </div>
              </div>

              <div className="rec-action-buttons">
                <button
                  type="button"
                  className="btn-action-olive"
                  onClick={onNavigateToAssistant}
                >
                  <SparklesIcon size={16} />
                  <span>Talk with Nurse Ananya</span>
                </button>
                <button
                  type="button"
                  className="btn-action-peach"
                  onClick={onNavigateToTherapists}
                >
                  <TherapistIcon size={16} />
                  <span>Explore Preventative Therapy</span>
                </button>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* RESULT STATE 2: PROFESSIONAL THERAPIST SUPPORT RECOMMENDED   */}
          {/* ------------------------------------------------------------- */}
          {resultState === 'therapist' && (
            <div className="recommendation-state-card state-therapist">
              <div className="rec-badge-row">
                <span className="rec-status-tag tag-warn">Clinical Recommendation</span>
                <h3 className="rec-title">Professional Therapist Support Recommended</h3>
              </div>
              <p className="rec-explanation">
                Your screening responses reflect persistent cognitive overwhelm, disrupted sleep, or 
                stress that may be taxing your daily well-being. Speaking confidentially with an accredited 
                counselor or psychologist can provide structured tools and clarity.
              </p>

              <div className="suggested-actions-list">
                <div className="action-item">
                  <div className="action-check-icon"><CheckIcon size={14} /></div>
                  <div>
                    <strong>Zero-Wait Telehealth Consultation:</strong> Match with licensed practitioners specializing in student burnout, anxiety, and depression.
                  </div>
                </div>
                <div className="action-item">
                  <div className="action-check-icon"><CheckIcon size={14} /></div>
                  <div>
                    <strong>Consented Intake Summary:</strong> Optionally share this screening summary so you don't have to re-explain your symptoms.
                  </div>
                </div>
              </div>

              <div className="rec-action-buttons">
                <button
                  type="button"
                  className="btn-action-olive"
                  onClick={onNavigateToTherapists}
                >
                  <TherapistIcon size={16} />
                  <span>Connect with Recommended Therapist</span>
                  <ArrowRightIcon size={16} />
                </button>
                <button
                  type="button"
                  className="btn-action-peach"
                  onClick={onNavigateToAssistant}
                >
                  <span>De-escalate with Nurse Ananya</span>
                </button>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* RESULT STATE 3: URGENT SUPPORT GUIDANCE REQUIRED             */}
          {/* ------------------------------------------------------------- */}
          {resultState === 'urgent' && (
            <div className="recommendation-state-card state-urgent">
              <div className="rec-badge-row">
                <span className="rec-status-tag tag-urgent">Immediate Priority Support</span>
                <h3 className="rec-title">Urgent Support Guidance Required</h3>
              </div>
              <p className="rec-explanation">
                You are carrying an extraordinarily heavy burden right now. You do not have to carry this 
                alone. Compassionate, qualified human crisis responders and campus counselors are standing 
                by 24 hours a day to support you immediately.
              </p>

              {/* Emergency Hotline Direct Strip */}
              <div className="urgent-hotline-box">
                <div className="hotline-card-highlight">
                  <PhoneCallIcon size={22} className="hotline-icon" />
                  <div>
                    <span className="hotline-title">Tele-MANAS (Govt. of India 24/7 Toll-Free)</span>
                    <a href="tel:14416" className="hotline-link">Call 14416 / 1800-891-4416</a>
                  </div>
                </div>

                <div className="hotline-card-highlight">
                  <PhoneCallIcon size={22} className="hotline-icon" />
                  <div>
                    <span className="hotline-title">KIRAN Mental Health Helpline</span>
                    <a href="tel:18005990019" className="hotline-link">Call 1800-599-0019</a>
                  </div>
                </div>
              </div>

              <div className="rec-action-buttons">
                <button
                  type="button"
                  className="btn-action-olive"
                  onClick={onNavigateToTherapists}
                >
                  <span>Priority Human Therapist Booking</span>
                </button>
                <button
                  type="button"
                  className="btn-action-peach"
                  onClick={onNavigateToAssistant}
                >
                  <span>Stay in Calm Space with Nurse Ananya</span>
                </button>
              </div>
            </div>
          )}

          {/* Explicit Non-Diagnostic Medical Disclaimer */}
          <div className="result-disclaimer-card">
            <ShieldCheckIcon size={16} className="disclaimer-shield-icon" />
            <p className="disclaimer-text">
              <strong>Clinical Assessment Notice:</strong> Hridaya provides psychometric screening and clinical 
              triage to foster self-awareness and bridge you with accredited human care. 
              This result is an assistive screening summary and <strong>does not constitute a medical or psychiatric diagnosis</strong>. 
              Only a qualified healthcare practitioner can provide formal diagnoses or clinical prescriptions.
            </p>
          </div>

          {/* Retake Button */}
          <div className="result-restart-row">
            <button
              type="button"
              className="btn-retake-screening"
              onClick={onRestart}
            >
              Retake Screening Assessment
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
