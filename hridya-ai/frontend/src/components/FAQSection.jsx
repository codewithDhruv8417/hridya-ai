import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from './Icons';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'Is Hridaya intended to replace a licensed psychiatrist or psychologist?',
      a: 'No. Hridaya is strictly an assistive wellness, early distress screening, and therapist accessibility system. It provides empathetic de-escalation, psychoeducation, and validated self-assessment rubrics (PHQ-9/GAD-7). It explicitly does not prescribe medication or issue legal psychiatric diagnoses. Whenever symptoms reach moderate or high thresholds, Hridaya acts as a bridge to certified human therapists.'
    },
    {
      q: 'How does Hridaya handle active emergency crisis situations?',
      a: 'Hridaya implements an algorithmic and deterministic safety layer that scans for red-flag crisis indicators (such as suicidal ideation, self-harm, or severe danger). When triggered, the system immediately presents direct emergency hotlines (Tele-MANAS: 14416, KIRAN: 1800-599-0019, and International 988) alongside immediate crisis safety steps, ensuring users are guided directly to emergency human responders.'
    },
    {
      q: 'Can my college administration, employers, or parents see my journal entries?',
      a: 'Never. Confidentiality is absolute. Even in university partner deployments, all student interactions are encrypted with client-side zero-knowledge architecture. Institutional administrators only receive macro-level anonymized wellness trends (e.g. "Campus stress rose by 8% during midterms") with no individual student identifiers.'
    },
    {
      q: 'How are the therapists on Hridaya vetted and credentialed?',
      a: 'Every therapist on the Hridaya platform must hold a recognized postgraduate degree (M.Phil, Psy.D., or Master’s in Clinical/Counseling Psychology) from an accredited university or council (e.g., Rehabilitation Council of India - RCI, or equivalent licensing board), accompanied by verified clinical supervision hours and clean ethics verification.'
    },
    {
      q: 'What makes Hridaya suitable as an academic major engineering project?',
      a: 'Hridaya combines natural language processing (NLP sentiment and cognitive distortion extraction), clinical psychometrics, secure role-based access architectures, and digital accessibility standards. It addresses a major United Nations Sustainable Development Goal (SDG 3: Good Health & Well-being) with practical real-world engineering.'
    }
  ];

  return (
    <section id="faq" className="faq-section" aria-labelledby="faq-heading">
      <div className="section-container">
        <div className="section-header-center">
          <span className="section-eyebrow">CLEAR ANSWERS & ETHICAL TRANSPARENCY</span>
          <h2 id="faq-heading" className="section-title">
            Frequently Asked Questions
          </h2>
          <p className="section-subtitle">
            Understand how Hridaya balances cutting-edge artificial intelligence with rigorous 
            clinical safety and student trust.
          </p>
        </div>

        <div className="faq-accordion-list">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className={`faq-item-card ${isOpen ? 'open' : ''}`}
              >
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span className="faq-question-text">{faq.q}</span>
                  <span className="faq-chevron-box">
                    {isOpen ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
                  </span>
                </button>

                {isOpen && (
                  <div 
                    id={`faq-answer-${index}`} 
                    className="faq-answer-container"
                    role="region"
                  >
                    <p className="faq-answer-text">{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
