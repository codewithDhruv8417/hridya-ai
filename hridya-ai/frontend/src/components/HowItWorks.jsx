import { useState } from 'react';
import { 
  MessageSquareIcon, 
  BrainSparkIcon, 
  ActivityIcon, 
  UserCheckIcon,
  CheckIcon
} from './Icons';

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 'step-1',
      number: '01',
      title: 'Empathetic Check-in & Self-Reporting',
      shortTitle: '1. Express & Check-in',
      icon: MessageSquareIcon,
      tag: 'Step 1: Intake & Expression',
      description: 'Interact freely in natural language or choose standardized clinical screenings (PHQ-9 for mood, GAD-7 for anxiety). Voice or text check-ins provide a pressure-free space without judgment or social stigma.',
      features: [
        'Voice and text conversational interface',
        'Standardized 2-minute clinical questionnaires',
        'Multi-lingual sentiment understanding',
        'Completely anonymous guest session support'
      ],
      aiDetail: 'Conversational agent uses empathetic natural language understanding to parse cognitive distortions and emotional temperature without imposing rigid labels.'
    },
    {
      id: 'step-2',
      number: '02',
      title: 'Ethical AI Distress Triage',
      shortTitle: '2. Clinical Triage',
      icon: BrainSparkIcon,
      tag: 'Step 2: Analysis & Risk Scoring',
      description: 'Our proprietary screening engine analyzes acoustic and textual cues, scoring distress levels into calibrated risk tiers (Minimal, Mild, Moderate, Elevated). Emergency triggers bypass all queues immediately.',
      features: [
        'Clinically calibrated scoring rubric',
        'Deterministic crisis keyword detection',
        'Zero algorithmic diagnosis (decision-support only)',
        'Local client-side parsing protects PII'
      ],
      aiDetail: 'Transparent scoring matrix cross-references DSM-5 symptom clusters and generates an explainable confidence breakdown for the user.'
    },
    {
      id: 'step-3',
      number: '03',
      title: 'Personalized In-the-Moment Support',
      shortTitle: '3. Guided Micro-Tools',
      icon: ActivityIcon,
      tag: 'Step 3: Instant Intervention',
      description: 'For mild-to-moderate distress, Hridaya provides immediate grounding exercises: guided box-breathing, somatic muscle relaxation, cognitive restructuring worksheets, and calm soundscapes.',
      features: [
        'Interactive physiological breath pacing',
        'CBT thought reframing prompts',
        'Sleep hygiene & academic stress routines',
        'Progress tracking across semester weeks'
      ],
      aiDetail: 'Micro-interventions adapt dynamically based on what previously lowered the student’s self-reported stress level.'
    },
    {
      id: 'step-4',
      number: '04',
      title: 'Seamless Therapist Accessibility',
      shortTitle: '4. Human Therapist Care',
      icon: UserCheckIcon,
      tag: 'Step 4: Clinical Match & Care',
      description: 'When symptoms require professional clinical care, Hridaya seamlessly connects you to verified psychologists and counselors with transparent sliding-scale pricing, telehealth video, or campus booking.',
      features: [
        'Verified licensed therapists & psychologists',
        'Specialists in student burnout & young adult transitions',
        'Consented shareable intake summaries save session time',
        'Low-bandwidth video & secure encrypted chat'
      ],
      aiDetail: 'Eliminates traditional 3-week wait times by matching availability, budget constraints, and clinical specialization within seconds.'
    }
  ];

  const current = steps[activeStep];
  const StepIcon = current.icon;

  return (
    <section id="how-it-works" className="how-section" aria-labelledby="how-heading">
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header-center">
          <span className="section-eyebrow">A CONTINUOUS CONTINUUM OF CARE</span>
          <h2 id="how-heading" className="section-title">
            How Hridaya Restores Balance
          </h2>
          <p className="section-subtitle">
            A cohesive 4-step framework uniting continuous AI companion support with 
            compassionate, qualified human therapy whenever needed.
          </p>
        </div>

        {/* Interactive Step Navigation Bar */}
        <div className="steps-nav-bar" role="tablist" aria-label="How it works steps">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = activeStep === idx;
            return (
              <button
                key={step.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${step.id}`}
                id={`tab-${step.id}`}
                type="button"
                className={`step-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveStep(idx)}
              >
                <div className="step-tab-badge">
                  <Icon size={16} />
                  <span>{step.number}</span>
                </div>
                <span className="step-tab-label">{step.shortTitle}</span>
              </button>
            );
          })}
        </div>

        {/* Step Detailed Card */}
        <div 
          className="step-detail-card" 
          id={`panel-${current.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${current.id}`}
        >
          <div className="step-card-grid">
            {/* Left Content */}
            <div className="step-card-content">
              <div className="step-card-tag">
                <StepIcon size={16} className="step-tag-icon" />
                <span>{current.tag}</span>
              </div>

              <h3 className="step-card-title">{current.title}</h3>
              <p className="step-card-desc">{current.description}</p>

              {/* Feature Checklist */}
              <div className="step-checklist">
                {current.features.map((feat, i) => (
                  <div key={i} className="step-check-item">
                    <div className="check-icon-wrap">
                      <CheckIcon size={14} />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Card: Architectural & AI Highlight */}
            <div className="step-card-aside">
              <div className="aside-box">
                <div className="aside-header">
                  <BrainSparkIcon size={18} className="aside-icon" />
                  <span className="aside-title">Project Engineering Insight</span>
                </div>
                <p className="aside-text">{current.aiDetail}</p>
                <div className="aside-indicator">
                  <span className="aside-dot" />
                  <span className="aside-status">Clinical Safety Protocol Enforced</span>
                </div>
              </div>

              {/* Step Navigation Controls */}
              <div className="step-nav-controls">
                <button
                  type="button"
                  className="step-arrow-btn"
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                  aria-label="Previous step"
                >
                  Previous Step
                </button>
                <button
                  type="button"
                  className="step-arrow-btn step-arrow-next"
                  disabled={activeStep === steps.length - 1}
                  onClick={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
                  aria-label="Next step"
                >
                  Next Step
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
