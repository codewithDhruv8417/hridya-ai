import { PhoneCallIcon, ShieldCheckIcon } from './Icons';

export default function Footer({ onNavigate }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer" aria-label="Site Footer">
      {/* Top Crisis Helpline Ribbon */}
      <div className="footer-emergency-ribbon">
        <div className="ribbon-inner">
          <div className="ribbon-title-group">
            <PhoneCallIcon size={18} className="ribbon-phone" />
            <span className="ribbon-title">24/7 National Emergency Mental Health Lifelines:</span>
          </div>
          <div className="ribbon-hotlines-flex">
            <div className="hotline-item">
              <span className="hl-label">Tele-MANAS:</span>
              <a href="tel:14416" className="hl-link">14416</a>
              <span className="hl-sub">(Toll-Free, 24/7)</span>
            </div>
            <div className="hotline-item">
              <span className="hl-label">KIRAN:</span>
              <a href="tel:18005990019" className="hl-link">1800-599-0019</a>
            </div>
            <div className="hotline-item">
              <span className="hl-label">Intl:</span>
              <a href="tel:988" className="hl-link">988</a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Info */}
      <div className="footer-main-layout">
        {/* Brand Column */}
        <div className="footer-col-brand">
          <div className="footer-brand-title-row">
            <img
              src="/images/hridaya-logo.png"
              alt="Hridaya Logo"
              className="footer-logo-img"
            />
            <div>
              <span className="footer-hindi-name">हृदय</span>
              <p className="footer-quote-text">मानसिक स्वास्थ्य भी स्वास्थ्य है</p>
            </div>
          </div>
          <p className="footer-mission-statement">
            A compassionate mental wellness initiative uniting conversational AI companion support, 
            standardized distress screening, and accessible licensed clinical therapy.
          </p>
          <div className="academic-capstone-pill">
            <span>College Major Project • Computer Science & Engineering</span>
          </div>
        </div>

        {/* Navigation Column */}
        <div className="footer-col-nav">
          <h4 className="footer-col-title">Platform Navigation</h4>
          <ul className="footer-links-list">
            <li><button type="button" onClick={() => onNavigate('home')} className="btn-footer-link">Home Sanctuary</button></li>
            <li><button type="button" onClick={() => onNavigate('assistant')} className="btn-footer-link">AI Wellness Assistant</button></li>
            <li><button type="button" onClick={() => onNavigate('screening')} className="btn-footer-link">Confidential Screening</button></li>
            <li><button type="button" onClick={() => onNavigate('therapists')} className="btn-footer-link">Licensed Therapists</button></li>
          </ul>
        </div>

        {/* Clinical Framework Column */}
        <div className="footer-col-clinical">
          <h4 className="footer-col-title">Clinical Framework</h4>
          <ul className="footer-links-list">
            <li><span>PHQ-9 Depression Screener</span></li>
            <li><span>GAD-7 Anxiety Scale</span></li>
            <li><span>Cognitive Behavioral Therapy (CBT)</span></li>
            <li><span>4-7-8 Somatic Reset</span></li>
            <li><span>RCI Accredited Practitioners</span></li>
          </ul>
        </div>
      </div>

      {/* Important Medical Disclaimer */}
      <div className="footer-disclaimer-wrapper">
        <div className="disclaimer-inner-card">
          <p className="disclaimer-p">
            <strong>Clinical Disclaimer:</strong> Hridaya (हृदय) is an assistive digital wellness, 
            early distress screening, and therapist accessibility web application built for academic research 
            and project presentation. Hridaya does not provide formal medical diagnoses or psychiatric prescriptions. 
            If you or someone you know is facing acute crisis or thoughts of self-harm, please immediately contact 
            Tele-MANAS (14416), KIRAN (1800-599-0019), dial 112 / 988, or visit the nearest emergency medical facility.
          </p>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom-strip">
        <p className="footer-copy">
          © {currentYear} Hridaya (हृदय) Mental Wellness. Built with React, Vite & Modern CSS.
        </p>
        <div className="footer-privacy-tag">
          <ShieldCheckIcon size={14} />
          <span>DPDP Act 2023 & HIPAA Aligned Architecture</span>
        </div>
      </div>
    </footer>
  );
}
