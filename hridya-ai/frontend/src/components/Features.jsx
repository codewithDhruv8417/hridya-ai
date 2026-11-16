import { 
  MessageSquareIcon, 
  BrainSparkIcon, 
  UserCheckIcon, 
  AlertCircleIcon, 
  ActivityIcon, 
  ShieldCheckIcon
} from './Icons';

export default function Features() {
  const featureList = [
    {
      icon: MessageSquareIcon,
      tag: 'Continuous Availability',
      title: '24/7 Empathetic AI Companion',
      description: 'A compassionate conversational partner always ready to listen, de-escalate anxiety, and guide through high-stress moments with evidence-based CBT dialogue principles.',
      highlight: 'Zero latency • Available late nights'
    },
    {
      icon: BrainSparkIcon,
      tag: 'Clinical Screening',
      title: 'Multimodal AI Screening Hub',
      description: 'Standardized psychological assessments (PHQ-9 for depression, GAD-7 for generalized anxiety) with explainable risk stratification and longitudinal symptom tracking.',
      highlight: 'Validated psychometric rubrics'
    },
    {
      icon: UserCheckIcon,
      tag: 'Licensed Accessibility',
      title: 'Verified Therapist Marketplace',
      description: 'Eliminates traditional healthcare friction. Connect directly with licensed psychologists offering flexible scheduling, student sliding-scale fees, and multi-language care.',
      highlight: 'Telehealth video & encrypted chat'
    },
    {
      icon: AlertCircleIcon,
      tag: 'Ethical Safety',
      title: 'Instant Crisis SOS Protocol',
      description: 'Built-in ethical boundary engine. Automatic detection of self-harm or severe distress indicators triggers warm handoffs to verified national crisis lifelines like Tele-MANAS.',
      highlight: 'Immediate 24/7 hotline handoff'
    },
    {
      icon: ActivityIcon,
      tag: 'In-The-Moment Relief',
      title: 'Somatic & Cognitive Toolkits',
      description: 'Immediate evidence-based micro-interventions: guided box-breathing visualizers, 5-4-3-2-1 sensory grounding, cognitive distortion unravelling, and focus logs.',
      highlight: 'Interactive sensory tools'
    },
    {
      icon: ShieldCheckIcon,
      tag: 'Data Sovereignty',
      title: 'Client-Side Privacy Architecture',
      description: 'Your private reflections never become training collateral. Built on end-to-end client encryption, zero commercial ad tracking, and DPDP / HIPAA compliance safeguards.',
      highlight: '100% private & anonymized'
    }
  ];

  return (
    <section id="features" className="features-section" aria-labelledby="features-heading">
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header-center">
          <span className="section-eyebrow">ENGINEERED FOR CLINICAL IMPACT</span>
          <h2 id="features-heading" className="section-title">
            Comprehensive Capabilities for Mental Wellbeing
          </h2>
          <p className="section-subtitle">
            Crafted to dismantle barriers to mental health support through intelligent technology, 
            ethical machine learning, and compassionate human healthcare.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="features-grid">
          {featureList.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div key={index} className="feature-card">
                <div className="feature-card-header">
                  <div className="feature-icon-wrapper">
                    <Icon size={22} className="feature-icon" />
                  </div>
                  <span className="feature-tag">{feat.tag}</span>
                </div>

                <h3 className="feature-card-title">{feat.title}</h3>
                <p className="feature-card-desc">{feat.description}</p>

                <div className="feature-card-footer">
                  <span className="feature-highlight-pill">
                    <span className="pill-circle" />
                    {feat.highlight}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
