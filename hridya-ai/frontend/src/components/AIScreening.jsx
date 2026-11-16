import { useState } from 'react';
import { 
  BrainSparkIcon, 
  CheckIcon, 
  SparklesIcon,
  ArrowRightIcon
} from './Icons';

export default function AIScreening({ onOpenGetStarted }) {
  const [selectedCase, setSelectedCase] = useState(0);

  const sampleCases = [
    {
      id: 'case-1',
      title: 'Exam Stress & Insomnia',
      category: 'Academic Strain',
      userInput: "I haven't slept properly for 5 days before exams. Every time I open my notes my heart races and I feel like failing everything.",
      distressBand: 'Mild to Moderate Anxiety',
      confidence: '94% Semantic Match',
      phqScore: '4 / 27 (Minimal)',
      gadScore: '9 / 21 (Mild Anxiety)',
      symptomsDetected: ['Somatic tension (palpitations)', 'Catastrophizing cognition', 'Sleep architecture disruption'],
      safetyStatus: 'Crisis Safe (No self-harm indicators)',
      recommendedPath: 'Recommended: 4-4-4-4 Box Breathing + Student Counseling preventative intake.'
    },
    {
      id: 'case-2',
      title: 'Persistent Low Energy & Anhedonia',
      category: 'Mood & Energy',
      userInput: "Nothing feels enjoyable anymore. I skipped lectures all week and stayed in bed. Even talking to friends feels like an impossible chore.",
      distressBand: 'Moderate Depressive Indication',
      confidence: '91% Semantic Match',
      phqScore: '14 / 27 (Moderate)',
      gadScore: '6 / 21 (Mild)',
      symptomsDetected: ['Social withdrawal', 'Anhedonia (loss of interest)', 'Atypical fatigue & avolition'],
      safetyStatus: 'Monitored (Gentle check-in scheduled)',
      recommendedPath: 'Recommended: Behavioral activation micro-tasks + Clinical Psychologist referral.'
    },
    {
      id: 'case-3',
      title: 'Sudden Panic & Overstimulation',
      category: 'Acute Anxiety',
      userInput: "I was in the campus dining hall and suddenly couldn't breathe. My hands started shaking and I had to rush back to my room.",
      distressBand: 'Elevated Panic Response',
      confidence: '96% Semantic Match',
      phqScore: '5 / 27 (Minimal)',
      gadScore: '16 / 21 (Severe Indication)',
      symptomsDetected: ['Sensory overload triggers', 'Acute autonomic arousal', 'Agoraphobic avoidance urge'],
      safetyStatus: 'High Priority (Warm hotline & instant therapist link offered)',
      recommendedPath: 'Recommended: Immediate 5-4-3-2-1 Sensory Grounding + Telehealth intake slot.'
    }
  ];

  const current = sampleCases[selectedCase];

  return (
    <section id="ai-screening" className="ai-screening-section" aria-labelledby="screening-heading">
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header-center">
          <span className="section-eyebrow">CLINICALLY-GROUNDED MACHINE LEARNING</span>
          <h2 id="screening-heading" className="section-title">
            Intelligent AI Distress Screening
          </h2>
          <p className="section-subtitle">
            Hridaya translates natural language conversations into standardized psychometric 
            markers—offering early detection without dehumanizing diagnostic labels.
          </p>
        </div>

        {/* Screening Architecture Pillars */}
        <div className="screening-pillars-grid">
          <div className="pillar-card">
            <div className="pillar-num">01</div>
            <h3 className="pillar-title">Semantic Distress Parsing</h3>
            <p className="pillar-text">
              Natural Language Processing identifies cognitive distortions (all-or-nothing thinking, catastrophizing) and somatic stress markers in user journals.
            </p>
          </div>

          <div className="pillar-card">
            <div className="pillar-num">02</div>
            <h3 className="pillar-title">Standardized Tiers</h3>
            <p className="pillar-text">
              Calibrated strictly against validated gold standards: Patient Health Questionnaire (PHQ-9) and General Anxiety Disorder assessment (GAD-7).
            </p>
          </div>

          <div className="pillar-card">
            <div className="pillar-num">03</div>
            <h3 className="pillar-title">Ethical AI Boundaries</h3>
            <p className="pillar-text">
              Hridaya does not provide psychiatric diagnoses. It functions as an intelligent triage and decision-support layer, empowering licensed human therapists.
            </p>
          </div>
        </div>

        {/* Interactive Screening Demonstration Workspace */}
        <div className="demo-workspace-card">
          <div className="demo-top-bar">
            <div className="demo-title-group">
              <BrainSparkIcon size={20} className="demo-spark-icon" />
              <div>
                <span className="demo-label">INTERACTIVE PRESENTATION SIMULATOR</span>
                <h3 className="demo-heading">Live Distress Triage Pipeline</h3>
              </div>
            </div>
            <span className="demo-tag">Select a Clinical Scenario:</span>
          </div>

          {/* Scenario Selector Pills */}
          <div className="scenario-pills-row" role="tablist" aria-label="Clinical scenarios">
            {sampleCases.map((item, idx) => (
              <button
                key={item.id}
                role="tab"
                aria-selected={selectedCase === idx}
                type="button"
                className={`scenario-pill ${selectedCase === idx ? 'active' : ''}`}
                onClick={() => setSelectedCase(idx)}
              >
                <span className="pill-case-idx">Case {idx + 1}</span>
                <span className="pill-case-title">{item.title}</span>
              </button>
            ))}
          </div>

          {/* Simulator Content Grid */}
          <div className="simulator-grid">
            {/* Left: Input Text Box */}
            <div className="sim-panel sim-input-panel">
              <div className="panel-badge-row">
                <span className="panel-badge-label">STUDENT JOURNAL INPUT</span>
                <span className="panel-category-chip">{current.category}</span>
              </div>
              <div className="user-input-quote-box">
                <p className="user-input-quote">{current.userInput}</p>
              </div>

              <div className="sim-features-detected">
                <span className="features-label">Extracted Semantic Features:</span>
                <div className="feature-tags-flex">
                  {current.symptomsDetected.map((sym, sIdx) => (
                    <span key={sIdx} className="detected-tag">
                      <CheckIcon size={12} /> {sym}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: AI Triage Output */}
            <div className="sim-panel sim-output-panel">
              <div className="panel-badge-row">
                <span className="panel-badge-label">HRIDAYA TRIAGE ENGINE</span>
                <span className="panel-confidence-chip">{current.confidence}</span>
              </div>

              {/* Distress Band Callout */}
              <div className="distress-band-card">
                <div className="band-main">
                  <span className="band-caption">Calculated Distress Tier</span>
                  <h4 className="band-name">{current.distressBand}</h4>
                </div>
                <div className="band-status-badge">
                  <CheckIcon size={14} />
                  <span>Validated</span>
                </div>
              </div>

              {/* Standardized Scores Dual-Column */}
              <div className="scores-dual-grid">
                <div className="score-box">
                  <span className="score-lbl">PHQ-9 Mood Indication</span>
                  <span className="score-val">{current.phqScore}</span>
                </div>
                <div className="score-box">
                  <span className="score-lbl">GAD-7 Anxiety Scale</span>
                  <span className="score-val">{current.gadScore}</span>
                </div>
              </div>

              {/* Safety & Protocol */}
              <div className="safety-protocol-box">
                <div className="protocol-row">
                  <span className="protocol-title">Safety Status:</span>
                  <span className="protocol-desc">{current.safetyStatus}</span>
                </div>
                <div className="protocol-recommendation">
                  <SparklesIcon size={15} className="protocol-icon" />
                  <span>{current.recommendedPath}</span>
                </div>
              </div>

              <div className="sim-action-row">
                <button
                  type="button"
                  onClick={onOpenGetStarted}
                  className="btn-sim-action"
                >
                  <span>Experience Full Screener</span>
                  <ArrowRightIcon size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
