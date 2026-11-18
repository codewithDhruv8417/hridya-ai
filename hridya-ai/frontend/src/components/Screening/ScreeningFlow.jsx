import { useState } from 'react';
import ScreeningResult from './ScreeningResult';
import { ArrowLeftIcon, ShieldCheckIcon } from '../Icons';
import { api } from '../../api';

export default function ScreeningFlow({ onNavigateToAssistant, onNavigateToTherapists }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState(null);

  // 5 standardized, sensitive screening questions (PHQ-9 & GAD-7 grounded)
  const questions = [
    {
      id: 1,
      category: 'Mood & Emotional Energy',
      promptEn: 'Over the past two weeks, how often have you felt little interest, pleasure, or motivation in doing everyday activities?',
      promptHi: 'पिछले दो सप्ताह में, आपको कितनी बार ऐसा महसूस हुआ कि किसी काम में मन या खुशी नहीं लग रही है?',
      options: [
        { labelEn: 'Not at all', labelHi: 'बिलकुल नहीं', score: 0 },
        { labelEn: 'Several days', labelHi: 'कई दिन', score: 1 },
        { labelEn: 'More than half the days', labelHi: 'आधे से अधिक दिन', score: 2 },
        { labelEn: 'Nearly every day', labelHi: 'लगभग हर दिन', score: 3 }
      ]
    },
    {
      id: 2,
      category: 'Anxiety & Cognitive Overdrive',
      promptEn: 'How frequently have you experienced persistent nervousness, worry, or feeling unable to stop your thoughts from racing?',
      promptHi: 'कितनी बार आपने लगातार चिंता, घबराहट, या विचारों को शांत न कर पाने का अनुभव किया है?',
      options: [
        { labelEn: 'Not at all', labelHi: 'बिलकुल नहीं', score: 0 },
        { labelEn: 'Several days', labelHi: 'कई दिन', score: 1 },
        { labelEn: 'More than half the days', labelHi: 'आधे से अधिक दिन', score: 2 },
        { labelEn: 'Nearly every day', labelHi: 'लगभग हर दिन', score: 3 }
      ]
    },
    {
      id: 3,
      category: 'Sleep Architecture & Rest',
      promptEn: 'How often have you struggled with falling asleep, restless mid-night awakening, or waking up completely exhausted?',
      promptHi: 'कितनी बार आपको सोने में कठिनाई, रात में बार-बार नींद टूटने या सुबह थकान महसूस होने की समस्या हुई?',
      options: [
        { labelEn: 'Not at all', labelHi: 'बिलकुल नहीं', score: 0 },
        { labelEn: 'Several days', labelHi: 'कई दिन', score: 1 },
        { labelEn: 'More than half the days', labelHi: 'आधे से अधिक दिन', score: 2 },
        { labelEn: 'Nearly every day', labelHi: 'लगभग हर दिन', score: 3 }
      ]
    },
    {
      id: 4,
      category: 'Somatic Tension & Vitality',
      promptEn: 'How often have you felt physical fatigue, heaviness in the body, or carrying tension in your neck, chest, or shoulders?',
      promptHi: 'कितनी बार आपने शारीरिक भारीपन, अत्यधिक थकान या कंधों-सीने में खिंचाव महसूस किया है?',
      options: [
        { labelEn: 'Not at all', labelHi: 'बिलकुल नहीं', score: 0 },
        { labelEn: 'Several days', labelHi: 'कई दिन', score: 1 },
        { labelEn: 'More than half the days', labelHi: 'आधे से अधिक दिन', score: 2 },
        { labelEn: 'Nearly every day', labelHi: 'लगभग हर दिन', score: 3 }
      ]
    },
    {
      id: 5,
      category: 'Coping & Emotional Overwhelm',
      promptEn: 'How often has emotional stress made it difficult to focus on studies, work, or maintaining relationships with close ones?',
      promptHi: 'कितनी बार तनाव के कारण पढ़ाई, काम या अपनों से बातचीत करने में कठिनाई महसूस हुई?',
      options: [
        { labelEn: 'Not at all', labelHi: 'बिलकुल नहीं', score: 0 },
        { labelEn: 'Several days', labelHi: 'कई दिन', score: 1 },
        { labelEn: 'More than half the days', labelHi: 'आधे से अधिक दिन', score: 2 },
        { labelEn: 'Nearly every day', labelHi: 'लगभग हर दिन', score: 3 }
      ]
    }
  ];

  const currentQ = questions[currentQuestionIndex];
  const selectedAnswer = answers[currentQ.id];

  const handleSelectOption = (score) => {
    const updated = { ...answers, [currentQ.id]: score };
    setAnswers(updated);

    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
      }, 250);
    } else {
      // Sending the answers to the backend, it calculates the score
      api('/screening/submit', 'POST', { answers: Object.values(updated) })
        .then((res) => setResult(res))
        .catch(() => {
          const total = Object.values(updated).reduce((a, b) => a + b, 0);
          setResult({ total_score: total, wellness_score: Math.max(10, Math.round((1 - total / 15) * 100)) });
        });
      setTimeout(() => {
        setIsCompleted(true);
      }, 350);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setIsCompleted(false);
    setResult(null);
  };

  // If completed, show Result view
  if (isCompleted && result) {
    return (
      <ScreeningResult
        totalScore={result.total_score}
        maxScore={questions.length * 3}
        onRestart={handleRestart}
        onNavigateToAssistant={onNavigateToAssistant}
        onNavigateToTherapists={onNavigateToTherapists}
      />
    );
  }

  const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <section className="screening-section" aria-labelledby="screening-title">
      <div className="screening-container">
        <div className="screening-card">
          {/* Top Progress & Category */}
          <div className="screening-progress-bar-wrap">
            <div className="screening-progress-info">
              <span className="step-tag">Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span className="cat-tag">{currentQ.category}</span>
            </div>
            <div className="progress-track-olive">
              <div 
                className="progress-fill-olive" 
                style={{ width: `${progressPercent}%` }}
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

          {/* Question Prompt */}
          <div className="question-prompt-box">
            <h2 id="screening-title" className="question-heading">{currentQ.promptEn}</h2>
            <p className="question-hindi-sub">{currentQ.promptHi}</p>
          </div>

          {/* Answer Options */}
          <div className="screening-options-grid" role="radiogroup" aria-label="Question options">
            {currentQ.options.map((opt, i) => {
              const isSelected = selectedAnswer === opt.score;
              return (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`screening-opt-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectOption(opt.score)}
                >
                  <div className="radio-circle">
                    {isSelected && <span className="radio-inner-dot" />}
                  </div>
                  <div className="opt-text-col">
                    <span className="opt-en">{opt.labelEn}</span>
                    <span className="opt-hi">{opt.labelHi}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Controls */}
          <div className="screening-card-footer">
            <button
              type="button"
              className="btn-screen-prev"
              disabled={currentQuestionIndex === 0}
              onClick={handlePrev}
            >
              <ArrowLeftIcon size={16} />
              <span>Previous Question</span>
            </button>

            <span className="confidential-seal-text">
              <ShieldCheckIcon size={14} />
              Responses are completely private
            </span>
          </div>

          {/* Ethical Clinical Notice */}
          <div className="screening-clinical-notice">
            <p className="notice-text">
              <strong>Assessment Transparency:</strong> This tool evaluates emotional and somatic stress patterns 
              aligned with standard psychometric indicators. It provides decision-support and self-awareness, 
              not a medical diagnosis or psychiatric prescription.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
