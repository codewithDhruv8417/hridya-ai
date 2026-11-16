import { useState } from 'react';
import { 
  VideoIcon, 
  CalendarCheckIcon, 
  StarIcon, 
  ShieldCheckIcon,
  CheckIcon,
  PhoneCallIcon
} from './Icons';

export default function TherapistAccessibility({ onOpenGetStarted }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [bookedTherapist, setBookedTherapist] = useState(null);

  const therapists = [
    {
      id: 1,
      name: 'Dr. Ananya Sharma',
      title: 'Consultant Clinical Psychologist',
      degree: 'Ph.D., M.Phil (NIMHANS)',
      experience: '9+ Years Experience',
      rating: '4.9',
      reviews: '128 sessions',
      category: 'anxiety',
      languages: ['English', 'Hindi'],
      specialties: ['Student Exam Anxiety', 'Academic Burnout', 'Cognitive Behavioral Therapy (CBT)'],
      formats: ['Video Telehealth', 'Audio Call'],
      fee: '₹800 / session',
      studentDiscount: 'Student Sliding-Scale Available',
      avatarInitials: 'AS',
      availability: 'Available Today, 4:00 PM'
    },
    {
      id: 2,
      name: 'Dr. Vikramaditya Rao',
      title: 'Licensed Psychotherapist & Neuropsychologist',
      degree: 'Psy.D., Clinical Psychology',
      experience: '12+ Years Experience',
      rating: '5.0',
      reviews: '210 sessions',
      category: 'depression',
      languages: ['English', 'Kannada', 'Hindi'],
      specialties: ['Depressive Episodes', 'Mindfulness-Based Stress Reduction (MBSR)', 'Sleep Health'],
      formats: ['Video Telehealth', 'Secure Chat'],
      fee: '₹950 / session',
      studentDiscount: 'Campus Health Plan Accepted',
      avatarInitials: 'VR',
      availability: 'Available Tomorrow, 11:30 AM'
    },
    {
      id: 3,
      name: 'Meera Deshmukh, LMFT',
      title: 'Counseling Psychologist & Family Therapist',
      degree: 'M.Sc. Counseling Psychology',
      experience: '7+ Years Experience',
      rating: '4.9',
      reviews: '95 sessions',
      category: 'trauma',
      languages: ['English', 'Marathi', 'Hindi'],
      specialties: ['Young Adult Identity', 'Interpersonal Conflict', 'Acceptance & Commitment Therapy (ACT)'],
      formats: ['Video Telehealth', 'Audio Call', 'In-Person'],
      fee: '₹750 / session',
      studentDiscount: 'First Session 40% Off for Students',
      avatarInitials: 'MD',
      availability: 'Available Thursday, 2:00 PM'
    }
  ];

  const filteredTherapists = activeFilter === 'all' 
    ? therapists 
    : therapists.filter(t => t.category === activeFilter);

  return (
    <section id="therapists" className="therapists-section" aria-labelledby="therapists-heading">
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header-center">
          <span className="section-eyebrow">DESTIGMATIZING HUMAN CLINICAL CARE</span>
          <h2 id="therapists-heading" className="section-title">
            Accessible, Verified Therapists for Every Student
          </h2>
          <p className="section-subtitle">
            Hridaya dissolves the high costs, stigma, and endless waiting periods of conventional 
            therapy by pairing you with accredited practitioners who understand young adult stress.
          </p>
        </div>

        {/* Accessibility Pillars Bar */}
        <div className="access-pillars-grid">
          <div className="access-pillar-item">
            <div className="access-icon-box">
              <CalendarCheckIcon size={20} className="access-icon" />
            </div>
            <div>
              <h4 className="access-pillar-title">Zero Waiting Period</h4>
              <p className="access-pillar-desc">Book vetted same-week or same-day telehealth sessions directly.</p>
            </div>
          </div>

          <div className="access-pillar-item">
            <div className="access-icon-box">
              <ShieldCheckIcon size={20} className="access-icon" />
            </div>
            <div>
              <h4 className="access-pillar-title">Student Sliding-Scale</h4>
              <p className="access-pillar-desc">Subsidized rates and institutional partner plans to remove financial barriers.</p>
            </div>
          </div>

          <div className="access-pillar-item">
            <div className="access-icon-box">
              <VideoIcon size={20} className="access-icon" />
            </div>
            <div>
              <h4 className="access-pillar-title">Multi-Format Consults</h4>
              <p className="access-pillar-desc">Secure video, low-data audio call, or asynchronous counselor messaging.</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="therapist-filter-bar" role="tablist" aria-label="Therapist categories">
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === 'all'}
            className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Specialists ({therapists.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === 'anxiety'}
            className={`filter-btn ${activeFilter === 'anxiety' ? 'active' : ''}`}
            onClick={() => setActiveFilter('anxiety')}
          >
            Anxiety & Student Burnout
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === 'depression'}
            className={`filter-btn ${activeFilter === 'depression' ? 'active' : ''}`}
            onClick={() => setActiveFilter('depression')}
          >
            Mood & Motivation
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === 'trauma'}
            className={`filter-btn ${activeFilter === 'trauma' ? 'active' : ''}`}
            onClick={() => setActiveFilter('trauma')}
          >
            Relationships & Identity
          </button>
        </div>

        {/* Therapist Cards Grid */}
        <div className="therapist-cards-grid">
          {filteredTherapists.map((therapist) => (
            <div key={therapist.id} className="therapist-card">
              {/* Card Top / Avatar + Credentials */}
              <div className="therapist-card-top">
                <div className="avatar-badge-wrap">
                  <div className="avatar-circle">
                    <span>{therapist.avatarInitials}</span>
                  </div>
                  <div className="verified-badge-pill" title="Verified License & Degree">
                    <CheckIcon size={11} />
                  </div>
                </div>

                <div className="therapist-meta">
                  <div className="therapist-availability">
                    <span className="avail-pulse" />
                    <span>{therapist.availability}</span>
                  </div>
                  <h3 className="therapist-name">{therapist.name}</h3>
                  <p className="therapist-title">{therapist.title}</p>
                  <p className="therapist-degree">{therapist.degree} • {therapist.experience}</p>
                </div>
              </div>

              {/* Rating and Languages */}
              <div className="therapist-ratings-row">
                <div className="rating-pill">
                  <StarIcon size={14} className="star-icon" />
                  <span className="rating-num">{therapist.rating}</span>
                  <span className="rating-count">({therapist.reviews})</span>
                </div>
                <div className="lang-pill">
                  <span>Languages: {therapist.languages.join(', ')}</span>
                </div>
              </div>

              {/* Specialties Chips */}
              <div className="specialties-section">
                <span className="spec-label">Focus Areas:</span>
                <div className="specialties-chips-wrap">
                  {therapist.specialties.map((spec, i) => (
                    <span key={i} className="spec-chip">{spec}</span>
                  ))}
                </div>
              </div>

              {/* Formats and Pricing */}
              <div className="therapist-pricing-box">
                <div className="pricing-left">
                  <span className="fee-text">{therapist.fee}</span>
                  <span className="discount-tag">{therapist.studentDiscount}</span>
                </div>
                <div className="format-icons">
                  <span className="format-chip">
                    <VideoIcon size={13} /> Video
                  </span>
                  <span className="format-chip">
                    <PhoneCallIcon size={13} /> Audio
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="therapist-card-actions">
                <button
                  type="button"
                  className="btn-book-therapist"
                  onClick={() => setBookedTherapist(therapist)}
                >
                  Book Confidential Session
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Consented Intake Feature Callout */}
        <div className="intake-callout-card">
          <div className="intake-callout-left">
            <div className="intake-icon-wrap">
              <ShieldCheckIcon size={24} className="intake-icon" />
            </div>
            <div>
              <h4 className="intake-callout-title">
                Zero Repetition: Consented AI Intake Summaries
              </h4>
              <p className="intake-callout-desc">
                Never relive explaining your full history from scratch. With your explicit permission, 
                Hridaya prepares a structured, anonymized clinical summary of your mood trends and symptom 
                journal for your therapist ahead of time.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenGetStarted}
            className="btn-intake-preview"
          >
            Learn How It Works
          </button>
        </div>

        {/* Booking Confirmation Dialog (Mock Presentation Feedback) */}
        {bookedTherapist && (
          <div className="booking-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-booking-title">
            <div className="booking-modal-card">
              <div className="modal-header">
                <h3 id="modal-booking-title" className="modal-title">Consultation Intake Request</h3>
                <button 
                  type="button" 
                  className="modal-close-btn"
                  onClick={() => setBookedTherapist(null)}
                  aria-label="Close booking modal"
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div className="modal-therapist-info">
                  <div className="avatar-circle-sm">
                    {bookedTherapist.avatarInitials}
                  </div>
                  <div>
                    <h4 className="modal-th-name">{bookedTherapist.name}</h4>
                    <p className="modal-th-title">{bookedTherapist.title} • {bookedTherapist.fee}</p>
                  </div>
                </div>

                <div className="booking-slot-selection">
                  <span className="slot-label">Select Sample Available Slot:</span>
                  <div className="slots-grid">
                    <button type="button" className="slot-btn active">Today, 4:00 PM</button>
                    <button type="button" className="slot-btn">Tomorrow, 10:00 AM</button>
                    <button type="button" className="slot-btn">Friday, 3:30 PM</button>
                  </div>
                </div>

                <div className="intake-consent-check">
                  <input type="checkbox" id="consent-summary" defaultChecked />
                  <label htmlFor="consent-summary">
                    Allow Hridaya to share my anonymized 14-day mood and screening summary with {bookedTherapist.name}.
                  </label>
                </div>

                <div className="modal-action-row">
                  <button 
                    type="button" 
                    className="btn-confirm-booking"
                    onClick={() => {
                      alert(`Mock Booking Confirmed for ${bookedTherapist.name}! In the live application, this initiates an encrypted calendar hold and sends an SMS/Email link.`);
                      setBookedTherapist(null);
                    }}
                  >
                    Confirm Confidential Slot
                  </button>
                  <button 
                    type="button" 
                    className="btn-cancel-modal"
                    onClick={() => setBookedTherapist(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
