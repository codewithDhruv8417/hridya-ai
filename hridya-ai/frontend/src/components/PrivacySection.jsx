import { 
  ShieldCheckIcon, 
  LockIcon, 
  CheckIcon, 
  BrainSparkIcon
} from './Icons';

export default function PrivacySection() {

  const privacyPrinciples = [
    {
      icon: LockIcon,
      title: 'Zero-Knowledge Encryption',
      summary: 'Conversations and psychometric screenings are encrypted with AES-256 client keys. Nobody outside your consented session—not even Hridaya engineers—can read your emotional logs.'
    },
    {
      icon: BrainSparkIcon,
      title: 'No AI Training on Private Journals',
      summary: 'Your intimate reflections and vulnerability are never harvested as training corpora for large language models. Your prompts exist solely to support your real-time wellness.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'DPDP & HIPAA Compliance Framework',
      summary: 'Engineered in strict accordance with the Digital Personal Data Protection (DPDP) Act 2023 and global healthcare data confidentiality standards.'
    },
    {
      icon: CheckIcon,
      title: 'Instant Data Shredding Rights',
      summary: 'You own your story. At any second, download your historical assessments or permanently purge all personal data with a single unrecoverable cryptographic wipe.'
    }
  ];

  return (
    <section id="privacy" className="privacy-section" aria-labelledby="privacy-heading">
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header-center">
          <span className="section-eyebrow">UNCOMPROMISING DATA SOVEREIGNTY</span>
          <h2 id="privacy-heading" className="section-title">
            Privacy & Clinical Confidentiality by Design
          </h2>
          <p className="section-subtitle">
            Seeking mental healthcare demands absolute emotional safety. We architected 
            Hridaya so you never have to choose between modern AI assistance and your privacy.
          </p>
        </div>

        {/* 4 Privacy Principles Cards */}
        <div className="privacy-cards-grid">
          {privacyPrinciples.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="privacy-card">
                <div className="privacy-icon-container">
                  <Icon size={22} className="privacy-card-icon" />
                </div>
                <h3 className="privacy-card-title">{item.title}</h3>
                <p className="privacy-card-summary">{item.summary}</p>
                <div className="privacy-card-seal">
                  <CheckIcon size={13} />
                  <span>Guaranteed by Architecture</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Deep Dive Security & Ethics Accordion / Comparison Box */}
        <div className="security-architecture-box">
          <div className="sec-box-header">
            <div>
              <span className="sec-eyebrow">ETHICAL COMPLIANCE MATRIX</span>
              <h3 className="sec-title">How Hridaya Compares to Conventional Chatbots</h3>
            </div>
            <div className="compliance-pills">
              <span className="comp-pill">ISO 27001 Controls</span>
              <span className="comp-pill">DPDP Act 2023</span>
              <span className="comp-pill">NIMHANS Guidelines</span>
            </div>
          </div>

          <div className="comparison-table-wrapper">
            <table className="comparison-table" aria-label="Privacy comparison table">
              <thead>
                <tr>
                  <th scope="col">Safeguard Feature</th>
                  <th scope="col" className="th-hridaya">Hridaya Mental Wellness</th>
                  <th scope="col">Generic AI Chatbots</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row" className="row-feature">Data Used for Public Model Training</th>
                  <td className="cell-hridaya"><span className="badge-shield-green">Strictly Prohibited</span></td>
                  <td className="cell-other">Commonly Enabled by Default</td>
                </tr>
                <tr>
                  <th scope="row" className="row-feature">Standardized Clinical Triage</th>
                  <td className="cell-hridaya"><span className="badge-shield-green">Validated PHQ-9 & GAD-7</span></td>
                  <td className="cell-other">Unregulated Hallucinations</td>
                </tr>
                <tr>
                  <th scope="row" className="row-feature">Emergency Crisis Hotline Triage</th>
                  <td className="cell-hridaya"><span className="badge-shield-green">Instant Routing (Tele-MANAS / 988)</span></td>
                  <td className="cell-other">Inconsistent or Non-Localized</td>
                </tr>
                <tr>
                  <th scope="row" className="row-feature">Licensed Therapist Accessibility</th>
                  <td className="cell-hridaya"><span className="badge-shield-green">Integrated Human Match</span></td>
                  <td className="cell-other">None (Isolated Bot)</td>
                </tr>
                <tr>
                  <th scope="row" className="row-feature">Data Deletion & Cryptographic Shredding</th>
                  <td className="cell-hridaya"><span className="badge-shield-green">1-Click Client-Side Wipe</span></td>
                  <td className="cell-other">Complex Account Request</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
