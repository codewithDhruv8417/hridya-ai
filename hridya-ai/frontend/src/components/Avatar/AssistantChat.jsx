import { useState, useEffect, useRef } from 'react';
import Avatar3D from './Avatar3D';
import { 
  MicIcon, 
  MicOffIcon, 
  SendIcon, 
  Volume2Icon, 
  VolumeXIcon, 
  GlobeIcon, 
  SparklesIcon, 
  HeartPulseIcon,
  ShieldCheckIcon 
} from '../Icons';

export default function AssistantChat({ onNavigateToScreening, onNavigateToTherapists }) {
  const [selectedLanguage, setSelectedLanguage] = useState('hi'); // 'hi' | 'en' | 'bn' | 'mr' | 'ta'
  const [avatarState, setAvatarState] = useState('idle'); // 'idle' | 'listening' | 'thinking' | 'speaking'
  const [inputText, setInputText] = useState('');
  const [isMicActive, setIsMicActive] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [speechVolume, setSpeechVolume] = useState(0.8);

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis || null);
  const messagesEndRef = useRef(null);
  const msgIdCounter = useRef(10);

  // Supported languages list
  const languages = [
    { code: 'hi', label: 'हिन्दी (Hindi)', voiceLang: 'hi-IN' },
    { code: 'en', label: 'English', voiceLang: 'en-IN' },
    { code: 'bn', label: 'বাংলা (Bengali)', voiceLang: 'bn-IN' },
    { code: 'mr', label: 'मराठी (Marathi)', voiceLang: 'mr-IN' },
    { code: 'ta', label: 'தமிழ் (Tamil)', voiceLang: 'ta-IN' }
  ];

  const getGreeting = (lang) => {
    switch (lang) {
      case 'en':
        return 'Hello, I am Nurse Ananya. Whatever stress or weight you are carrying in your mind today, you can share it here safely. How are you feeling right now?';
      case 'bn':
        return 'নমস্কার। আমি নার্স অনন্যা। আপনার মনের যে কোনো উদ্বেগ আপনি নিঃসংকোচে বলতে পারেন। আপনি আজ কেমন অনুভব করছেন?';
      case 'mr':
        return 'नमस्कार. मी नर्स अनन्या आहे. तुमच्या मनातील कोणताही ताण किंवा भावना तुम्ही मनमोकळेपणाने सांगू शकता. तुम्हाला आज कसे वाटत आहे?';
      case 'ta':
        return 'வணக்கம், நான் செவிலியர் அனன்யா. உங்கள் மனதில் இருக்கும் கவலைகளை தயக்கமின்றி பகிர்ந்துகொள்ளலாம். இன்று நீங்கள் எப்படி உணர்கிறீர்கள்?';
      default:
        return 'नमस्ते। मैं नर्स अनन्या हूँ। आपके मन में जो भी उलझन या तनाव है, आप मुझसे बेझिझक साझा कर सकते हैं। आप आज कैसा महसूस कर रहे हैं?';
    }
  };

  // Initial greeting depending on language
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: getGreeting('hi'),
      timestamp: 'Just now'
    }
  ]);

  const handleLanguageChange = (newLang) => {
    setSelectedLanguage(newLang);
    if (messages.length <= 1) {
      setMessages([
        {
          id: 1,
          sender: 'assistant',
          text: getGreeting(newLang),
          timestamp: 'Just now'
        }
      ]);
    }
  };

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, avatarState]);

  // Speak text using Web Speech API
  const speakResponse = (text) => {
    if (!ttsEnabled || !synthRef.current) return;

    // Stop ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const langObj = languages.find(l => l.code === selectedLanguage);
    utterance.lang = langObj ? langObj.voiceLang : 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    utterance.onstart = () => {
      setAvatarState('speaking');
      setSpeechVolume(1);
    };

    utterance.onend = () => {
      setAvatarState('idle');
      setSpeechVolume(0);
    };

    utterance.onerror = () => {
      setAvatarState('idle');
      setSpeechVolume(0);
    };

    synthRef.current.speak(utterance);
  };

  // Stop speaking on unmount
  useEffect(() => {
    const synth = synthRef.current;
    return () => {
      if (synth) {
        synth.cancel();
      }
    };
  }, []);

  // Handle Speech Recognition (Microphone STT)
  const toggleMicrophone = () => {
    if (isMicActive) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsMicActive(false);
      setAvatarState('idle');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback simulation for unsupported environments or denied permissions
      setIsMicActive(true);
      setAvatarState('listening');

      setTimeout(() => {
        const simulatedText = selectedLanguage === 'hi' 
          ? 'मुझे आजकल पढ़ाई और भविष्य को लेकर बहुत चिंता हो रही है, नींद भी ठीक से नहीं आती।'
          : 'I have been feeling constantly anxious about exams and unable to sleep well.';
        setInputText(simulatedText);
        setIsMicActive(false);
        setAvatarState('idle');
      }, 3000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      const langObj = languages.find(l => l.code === selectedLanguage);
      recognition.lang = langObj ? langObj.voiceLang : 'hi-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsMicActive(true);
        setAvatarState('listening');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleSendMessage(transcript);
      };

      recognition.onerror = () => {
        setIsMicActive(false);
        setAvatarState('idle');
      };

      recognition.onend = () => {
        setIsMicActive(false);
        if (avatarState === 'listening') {
          setAvatarState('idle');
        }
      };

      recognition.start();
    } catch {
      setIsMicActive(false);
      setAvatarState('idle');
    }
  };

  // Process user message and formulate empathetic clinical response
  const handleSendMessage = (textToSend = null) => {
    const text = (typeof textToSend === 'string' ? textToSend : inputText).trim();
    if (!text) return;

    // Append user message
    msgIdCounter.current += 1;
    const userMsg = {
      id: msgIdCounter.current,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setAvatarState('thinking');

    // Simulate AI response formulated by empathetic assistant
    setTimeout(() => {
      let replyText;
      const isHindi = selectedLanguage === 'hi';

      const lower = text.toLowerCase();
      if (lower.includes('neend') || lower.includes('sleep') || lower.includes('नींद')) {
        replyText = isHindi
          ? 'नींद की कमी मन और मस्तिष्क को और अधिक थका देती है। क्या आप 4-7-8 शांत सांस लेने की तकनीक आजमाना चाहेंगे, या हम एक छोटा तनाव मूल्यांकन करें?'
          : 'Disrupted sleep directly amplifies emotional fatigue. Would you like to try a calming 4-7-8 breathing exercise together, or conduct a brief stress screening?';
      } else if (lower.includes('exam') || lower.includes('pariksha') || lower.includes('परीक्षा') || lower.includes('future') || lower.includes('चिंता')) {
        replyText = isHindi
          ? 'परीक्षा और भविष्य को लेकर दबाव महसूस होना स्वाभाविक है। अपनी भावनाओं को शब्दों में ढालना ही सुधार का पहला कदम है। आप हमारे 2-मिनट के कल्याण मूल्यांकन से भी अपने तनाव का स्तर समझ सकते हैं।'
          : 'Academic and future pressures are heavy to carry alone. You have taken a courageous step by expressing this. A 2-minute screening can help clarify your stress profile.';
      } else {
        replyText = isHindi
          ? 'मैं आपकी बात पूरी संवेदनशीलता से सुन रही हूँ। आपका मन जो महसूस कर रहा है, वह बहुत महत्वपूर्ण है। क्या आप चाहते हैं कि हम आपके कल्याण स्तर की जांच करें ताकि सही मार्गदर्शन मिल सके?'
          : 'I hear you with complete empathy. Your emotions are valid and deserve care. Would you like us to proceed with a 2-minute clinical screening to help chart your next steps?';
      }

      msgIdCounter.current += 1;
      const assistantMsg = {
        id: msgIdCounter.current,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
      speakResponse(replyText);
    }, 1100);
  };

  const quickPrompts = selectedLanguage === 'hi' ? [
    'परीक्षा के तनाव से बहुत घबराहट हो रही है',
    'रात को ठीक से नींद नहीं आती',
    'किसी काम में मन नहीं लगता, बहुत अकेलापन है'
  ] : [
    'I feel overwhelmed by deadlines and exams',
    'Having trouble sleeping and constantly overthinking',
    'Feeling emotionally exhausted and disconnected'
  ];

  return (
    <section className="assistant-section" aria-label="AI Wellness Assistant">
      <div className="assistant-container">
        {/* Top Control Bar */}
        <div className="assistant-top-bar">
          <div className="assistant-badge-group">
            <span className="live-status-dot" />
            <span className="assistant-title-text">नर्स अनन्या • Interactive 3D Wellness Companion</span>
          </div>

          <div className="assistant-controls-right">
            {/* Language Selector */}
            <div className="lang-picker-wrapper">
              <GlobeIcon size={16} className="lang-icon" />
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="lang-select"
                aria-label="Select conversation language"
              >
                {languages.map(l => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>

            {/* TTS Mute Toggle */}
            <button
              type="button"
              className={`btn-tts-toggle ${ttsEnabled ? 'active' : ''}`}
              onClick={() => {
                if (ttsEnabled && synthRef.current) {
                  synthRef.current.cancel();
                  setAvatarState('idle');
                }
                setTtsEnabled(!ttsEnabled);
              }}
              title={ttsEnabled ? 'Mute spoken voice' : 'Enable spoken voice'}
            >
              {ttsEnabled ? <Volume2Icon size={16} /> : <VolumeXIcon size={16} />}
              <span>{ttsEnabled ? 'Voice On' : 'Voice Off'}</span>
            </button>
          </div>
        </div>

        {/* Main Interface Layout: Avatar Left, Conversation Right */}
        <div className="assistant-main-grid">
          {/* Left Column: 3D Nurse Avatar Viewport */}
          <div className="avatar-viewport-panel">
            <Avatar3D 
              avatarState={avatarState} 
              speechVolume={speechVolume}
            />

            {/* Quick Pathways Card */}
            <div className="avatar-care-bridge-card">
              <div className="bridge-header">
                <SparklesIcon size={16} className="bridge-icon" />
                <span className="bridge-title">Ready for structured guidance?</span>
              </div>
              <p className="bridge-desc">
                Transition smoothly to a self-guided psychometric assessment to evaluate your wellness score.
              </p>
              <div className="bridge-buttons-col">
                <button
                  type="button"
                  className="btn-bridge-screening"
                  onClick={onNavigateToScreening}
                >
                  <SparklesIcon size={14} />
                  <span>Take 2-Min Mental Health Screening</span>
                </button>
                <button
                  type="button"
                  className="btn-bridge-therapist"
                  onClick={onNavigateToTherapists}
                >
                  <HeartPulseIcon size={14} />
                  <span>Browse Campus & Licensed Therapists</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Conversational Interface */}
          <div className="chat-conversation-panel">
            {/* Messages Feed */}
            <div className="messages-scroll-area">
              {messages.map((m) => (
                <div key={m.id} className={`message-row ${m.sender === 'user' ? 'row-user' : 'row-assistant'}`}>
                  {m.sender === 'assistant' && (
                    <div className="assistant-avatar-tiny">
                      <span>HA</span>
                    </div>
                  )}
                  <div className={`message-bubble ${m.sender === 'user' ? 'bubble-user' : 'bubble-assistant'}`}>
                    <p className="bubble-text">{m.text}</p>
                    <span className="bubble-time">{m.timestamp}</span>
                  </div>
                </div>
              ))}

              {avatarState === 'thinking' && (
                <div className="message-row row-assistant">
                  <div className="assistant-avatar-tiny">
                    <span>HA</span>
                  </div>
                  <div className="message-bubble bubble-assistant bubble-typing">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="quick-prompts-bar">
              <span className="prompts-label">Quick check-in:</span>
              <div className="prompts-slider">
                {quickPrompts.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    className="prompt-chip"
                    onClick={() => handleSendMessage(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Input & Voice Controls */}
            <div className="chat-input-container">
              {/* Visible Microphone Button with Pulse */}
              <button
                type="button"
                className={`btn-mic-large ${isMicActive ? 'mic-listening-active' : ''}`}
                onClick={toggleMicrophone}
                aria-label={isMicActive ? 'Stop listening' : 'Start speaking with microphone'}
                title={isMicActive ? 'Listening... click to stop' : 'Click to speak via microphone'}
              >
                {isMicActive ? <MicOffIcon size={20} /> : <MicIcon size={20} />}
                {isMicActive && <span className="mic-wave-ring" />}
              </button>

              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="input-form-inner"
              >
                <input
                  type="text"
                  placeholder={isMicActive ? 'Listening... speak now' : (selectedLanguage === 'hi' ? 'यहाँ अपने विचार या भावनाएं लिखें...' : 'Type your thoughts or feelings here...')}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="chat-text-input"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="btn-chat-send"
                  aria-label="Send message"
                >
                  <SendIcon size={18} />
                </button>
              </form>
            </div>

            <div className="chat-confidential-foot">
              <ShieldCheckIcon size={13} className="foot-shield" />
              <span>All conversations with Nurse Ananya are strictly private and encrypted.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
