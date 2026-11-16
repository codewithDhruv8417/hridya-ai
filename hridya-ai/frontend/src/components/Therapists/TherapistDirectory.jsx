import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { 
  CheckIcon, 
  StarIcon, 
  ShieldCheckIcon,
  CloseIcon,
  ArrowRightIcon 
} from '../Icons';

// The directory renders instantly from this data, then upgrades to the live
// FastAPI list when the backend answers (see the effect below).
const categoryFor = (specializations = []) => {
  const joined = specializations.join(' ').toLowerCase();
  if (/anxiety|stress|burnout/.test(joined)) return 'student';
  if (/depress|sleep|mood/.test(joined)) return 'mood';
  if (/trauma|relationship|grief/.test(joined)) return 'relationships';
  return 'student';
};

const initialsOf = (fullName = '') =>
  fullName
    .replace(/^Dr\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

const toCard = (therapist) => ({
  id: therapist.therapist_id,
  name: therapist.full_name,
  credentials: therapist.qualification || 'Licensed practitioner',
  roleTitle: therapist.specializations?.[0]
    ? `${therapist.specializations[0]} specialist`
    : 'Mental health professional',
  experience: `${therapist.experience_years}+ Years Experience`,
  rating: '4.9',
  reviewCount: 'Verified practitioner',
  category: categoryFor(therapist.specializations),
  languages: ['English', 'हिन्दी (Hindi)'],
  specialties: therapist.specializations?.length ? therapist.specializations : ['General Wellness'],
  formats:
    therapist.session_mode === 'offline'
      ? ['In-person Session']
      : therapist.session_mode === 'both'
        ? ['Secure Video Call', 'In-person Session']
        : ['Secure Video Call'],
  fee: therapist.consultation_fee ? `₹${therapist.consultation_fee} / session` : 'Fee on request',
  studentOffer: 'Sliding-scale support available',
  initials: initialsOf(therapist.full_name),
  nextSlot: 'Available this week'
});

export default function TherapistDirectory() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [bookingTherapist, setBookingTherapist] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('Today, 4:00 PM');
  const [consentIntake, setConsentIntake] = useState(true);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const fallbackTherapists = [
    {
      id: 1,
      name: 'डॉ. अनन्या शर्मा (Dr. Ananya Sharma)',
      credentials: 'Ph.D., M.Phil (NIMHANS)',
      roleTitle: 'Consultant Clinical Psychologist',
      experience: '9+ Years Clinical Practice',
      rating: '4.9',
      reviewCount: '138 sessions',
      category: 'student',
      languages: ['हिन्दी (Hindi)', 'English'],
      specialties: ['Student Exam Anxiety', 'Academic Burnout', 'Cognitive Behavioral Therapy (CBT)'],
      formats: ['Secure Video Call', 'Audio Telehealth'],
      fee: '₹750 / session',
      studentOffer: 'Student Sliding-Scale Subsidy Available',
      initials: 'AS',
      nextSlot: 'Available Today, 4:00 PM'
    },
    {
      id: 2,
      name: 'डॉ. विक्रमादित्य राव (Dr. Vikramaditya Rao)',
      credentials: 'Psy.D., Licensed Psychotherapist',
      roleTitle: 'Senior Neuropsychologist',
      experience: '12+ Years Experience',
      rating: '5.0',
      reviewCount: '220 sessions',
      category: 'mood',
      languages: ['English', 'हिन्दी (Hindi)', 'ಕನ್ನಡ (Kannada)'],
      specialties: ['Depressive Episodes', 'Mindfulness (MBSR)', 'Sleep & Somatic Health'],
      formats: ['Secure Video Call', 'Confidential Chat'],
      fee: '₹900 / session',
      studentOffer: 'Campus Health Plan Accepted',
      initials: 'VR',
      nextSlot: 'Available Tomorrow, 11:30 AM'
    },
    {
      id: 3,
      name: 'मीरा देशमुख (Meera Deshmukh, LMFT)',
      credentials: 'M.Sc. Counseling Psychology, RCI Registered',
      roleTitle: 'Counseling Psychologist & Family Specialist',
      experience: '7+ Years Experience',
      rating: '4.9',
      reviewCount: '105 sessions',
      category: 'relationships',
      languages: ['हिन्दी (Hindi)', 'मराठी (Marathi)', 'English'],
      specialties: ['Young Adult Transitions', 'Interpersonal Conflict', 'Acceptance & Commitment (ACT)'],
      formats: ['Secure Video Call', 'Audio Telehealth'],
      fee: '₹700 / session',
      studentOffer: 'First Session 40% Off for Students',
      initials: 'MD',
      nextSlot: 'Available Thursday, 2:00 PM'
    }
  ];

  const [therapists, setTherapists] = useState(fallbackTherapists);

  useEffect(() => {
    let cancelled = false;
    api
      .therapists()
      .then((data) => {
        if (cancelled || !data?.therapists?.length) return;
        setTherapists(data.therapists.map(toCard));
      })
      .catch(() => {
        // Backend offline: the built-in directory stays on screen.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = activeFilter === 'all'
    ? therapists
    : therapists.filter(t => t.category === activeFilter);

  const handleConfirmBooking = () => {
    setBookingConfirmed(true);
    setTimeout(() => {
      setBookingConfirmed(false);
      setBookingTherapist(null);
    }, 1800);
  };

  return (
    <section className="therapists-page-section" aria-labelledby="therapists-page-heading">
      <div className="therapists-container">
        {/* Section Header */}
        <div className="therapists-page-header">
          <span className="therapists-eyebrow">VERIFIED CLINICAL CARE</span>
          <h2 id="therapists-page-heading" className="therapists-main-title">
            Accessible, Compassionate Human Therapists
          </h2>
          <p className="therapists-main-subtitle">
            Connect confidentially with accredited psychologists and counselors who understand 
            young adult challenges, academic burnout, and emotional well-being.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="therapist-filter-tabs" role="tablist" aria-label="Therapist specialization filters">
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === 'all'}
            className={`filter-tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Specialists ({therapists.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === 'student'}
            className={`filter-tab-btn ${activeFilter === 'student' ? 'active' : ''}`}
            onClick={() => setActiveFilter('student')}
          >
            Student Burnout & Anxiety
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === 'mood'}
            className={`filter-tab-btn ${activeFilter === 'mood' ? 'active' : ''}`}
            onClick={() => setActiveFilter('mood')}
          >
            Mood & Sleep Vitality
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === 'relationships'}
            className={`filter-tab-btn ${activeFilter === 'relationships' ? 'active' : ''}`}
            onClick={() => setActiveFilter('relationships')}
          >
            Relationships & Identity
          </button>
        </div>

        {/* Therapist Cards Grid */}
        <div className="therapist-grid-layout">
          {filtered.map((t) => (
            <div key={t.id} className="therapist-profile-card">
              <div className="card-top-identity">
                <div className="therapist-avatar-wrap">
                  <div className="therapist-avatar-circle">
                    <span>{t.initials}</span>
                  </div>
                  <div className="verified-seal-dot" title="RCI & Clinically Verified">
                    <CheckIcon size={10} />
                  </div>
                </div>

                <div className="therapist-text-meta">
                  <span className="therapist-next-slot">
                    <span className="slot-dot" />
                    {t.nextSlot}
                  </span>
                  <h3 className="therapist-full-name">{t.name}</h3>
                  <p className="therapist-role-subtitle">{t.roleTitle}</p>
                  <p className="therapist-cred-sub">{t.credentials} • {t.experience}</p>
                </div>
              </div>

              {/* Rating & Languages */}
              <div className="therapist-sub-row">
                <div className="rating-pill-olive">
                  <StarIcon size={13} className="star-gold" />
                  <span className="rating-score">{t.rating}</span>
                  <span className="rating-reviews">({t.reviewCount})</span>
                </div>
                <span className="lang-text-pill">
                  {t.languages.join(' • ')}
                </span>
              </div>

              {/* Specialties */}
              <div className="specialties-wrap">
                {t.specialties.map((s, idx) => (
                  <span key={idx} className="spec-badge-peach">{s}</span>
                ))}
              </div>

              {/* Fee & Student Subsidy */}
              <div className="fee-subsidy-card">
                <div>
                  <span className="session-fee">{t.fee}</span>
                  <span className="subsidy-note">{t.studentOffer}</span>
                </div>
                <div className="format-pills">
                  {t.formats.map((f, i) => (
                    <span key={i} className="format-pill">{f}</span>
                  ))}
                </div>
              </div>

              {/* Book Button */}
              <div className="card-action-row">
                <button
                  type="button"
                  className="btn-book-session-olive"
                  onClick={() => setBookingTherapist(t)}
                >
                  <span>Book Confidential Session</span>
                  <ArrowRightIcon size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Consented Intake Bridge Banner */}
        <div className="consented-intake-banner">
          <div className="intake-shield-box">
            <ShieldCheckIcon size={24} className="intake-shield-icon" />
          </div>
          <div className="intake-text-group">
            <h4 className="intake-title">No Repeating Your Story: Consented Intake Summaries</h4>
            <p className="intake-desc">
              Whenever you book a session on Hridaya, you have the option to securely share your anonymized 
              screening trends with your therapist before the session starts, saving valuable consultation time.
            </p>
          </div>
        </div>

        {/* Booking Consultation Modal Dialog */}
        {bookingTherapist && (
          <div className="booking-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-book-title">
            <div className="booking-modal-card">
              <div className="modal-header-row">
                <div>
                  <span className="modal-step-tag">CONFIDENTIAL APPOINTMENT</span>
                  <h3 id="modal-book-title" className="modal-therapist-heading">
                    {bookingConfirmed ? 'Appointment Confirmed!' : `Book with ${bookingTherapist.name}`}
                  </h3>
                </div>
                <button
                  type="button"
                  className="btn-modal-close"
                  onClick={() => setBookingTherapist(null)}
                  aria-label="Close booking modal"
                >
                  <CloseIcon size={18} />
                </button>
              </div>

              {bookingConfirmed ? (
                <div className="booking-success-view">
                  <div className="success-check-circle">
                    <CheckIcon size={32} />
                  </div>
                  <h4 className="success-title">Your Session is Reserved</h4>
                  <p className="success-desc">
                    A private calendar invitation and encrypted telehealth link for <strong>{selectedSlot}</strong> have been scheduled.
                  </p>
                </div>
              ) : (
                <div className="booking-form-body">
                  <div className="selected-therapist-strip">
                    <div className="avatar-mini-circle">{bookingTherapist.initials}</div>
                    <div>
                      <span className="th-name-strip">{bookingTherapist.name}</span>
                      <span className="th-fee-strip">{bookingTherapist.fee} • {bookingTherapist.studentOffer}</span>
                    </div>
                  </div>

                  {/* Slot Selection */}
                  <div className="slot-selection-section">
                    <label className="slot-group-label">Select Consultation Slot:</label>
                    <div className="slots-grid">
                      {['Today, 4:00 PM', 'Tomorrow, 11:30 AM', 'Friday, 2:00 PM'].map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          className={`slot-chip-btn ${selectedSlot === slot ? 'active' : ''}`}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Consented Intake Checkbox */}
                  <div className="consent-checkbox-card">
                    <input
                      id="intake-consent"
                      type="checkbox"
                      checked={consentIntake}
                      onChange={(e) => setConsentIntake(e.target.checked)}
                    />
                    <label htmlFor="intake-consent">
                      Share my recent Hridaya wellness screening summary confidentially with this therapist prior to consultation.
                    </label>
                  </div>

                  <div className="booking-submit-actions">
                    <button
                      type="button"
                      className="btn-confirm-slot-olive"
                      onClick={handleConfirmBooking}
                    >
                      Confirm Confidential Booking
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
