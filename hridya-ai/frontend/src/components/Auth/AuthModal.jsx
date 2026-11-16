import { useState } from 'react';
import { 
  CloseIcon, 
  UserIcon, 
  TherapistIcon, 
  EyeIcon, 
  EyeOffIcon, 
  ArrowLeftIcon,
  ShieldCheckIcon 
} from '../Icons';

export default function AuthModal({ isOpen, onClose, initialView = 'choice', onLoginSuccess }) {
  // Views: 'choice', 'login-patient', 'login-therapist', 'register', 'forgot'
  const [currentView, setCurrentView] = useState(initialView);
  const [role, setRole] = useState('patient'); // 'patient' | 'therapist'
  
  // Form states
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Forgot password flow states
  const [forgotStep, setForgotStep] = useState(1); // 1: mobile, 2: otp, 3: new password
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Status message
  const [feedback, setFeedback] = useState(null);

  if (!isOpen) return null;

  const handleSelectRole = (selectedRole) => {
    setRole(selectedRole);
    setFeedback(null);
    if (selectedRole === 'patient') {
      setCurrentView('login-patient');
    } else {
      setCurrentView('login-therapist');
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!mobileNumber || !password) {
      setFeedback({ type: 'error', message: 'कृपया मोबाइल नंबर और पासवर्ड दर्ज करें।' });
      return;
    }
    // Mock successful login
    const user = {
      name: role === 'therapist' ? 'डॉ. अनन्या शर्मा' : 'अदिति वर्मा',
      mobile: mobileNumber,
      role: role
    };
    setFeedback({ type: 'success', message: 'लॉगिन सफल रहा! Welcome back to Hridaya.' });
    setTimeout(() => {
      onLoginSuccess(user);
      onClose();
    }, 600);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!fullName || !mobileNumber || !password || !confirmPassword) {
      setFeedback({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }
    if (password !== confirmPassword) {
      setFeedback({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    // Mock successful registration
    const user = {
      name: fullName,
      mobile: mobileNumber,
      role: role,
      license: role === 'therapist' ? licenseNumber : null
    };
    setFeedback({ type: 'success', message: 'Account created successfully! Welcome to Hridaya.' });
    setTimeout(() => {
      onLoginSuccess(user);
      onClose();
    }, 600);
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (forgotStep === 1) {
      if (!mobileNumber) {
        setFeedback({ type: 'error', message: 'Please enter your registered mobile number.' });
        return;
      }
      setForgotStep(2);
      setFeedback({ type: 'info', message: 'A verification code has been sent to your mobile.' });
    } else if (forgotStep === 2) {
      if (!otp) {
        setFeedback({ type: 'error', message: 'Please enter the verification code.' });
        return;
      }
      setForgotStep(3);
      setFeedback(null);
    } else {
      if (!newPassword) {
        setFeedback({ type: 'error', message: 'Please enter your new password.' });
        return;
      }
      setFeedback({ type: 'success', message: 'Password reset successfully! You can now log in.' });
      setTimeout(() => {
        setForgotStep(1);
        setCurrentView(role === 'patient' ? 'login-patient' : 'login-therapist');
      }, 700);
    }
  };

  return (
    <div className="auth-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div className="auth-card">
        {/* Top Header with Logo & Brand */}
        <div className="auth-header">
          <div className="auth-brand-area">
            <img
              src="/images/hridaya-logo.png"
              alt="Hridaya Logo"
              className="auth-logo-img"
            />
            <div>
              <span className="auth-hindi-title">हृदय</span>
              <p className="auth-hindi-quote">मानसिक स्वास्थ्य भी स्वास्थ्य है</p>
            </div>
          </div>
          <button
            type="button"
            className="btn-auth-close"
            onClick={onClose}
            aria-label="Close authentication"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`auth-feedback-banner feedback-${feedback.type}`}>
            <span>{feedback.message}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 1: HOW WOULD YOU LIKE TO CONTINUE?                       */}
        {/* ------------------------------------------------------------- */}
        {currentView === 'choice' && (
          <div className="auth-body">
            <div className="auth-step-title-box">
              <h2 id="auth-modal-title" className="auth-title">How would you like to continue?</h2>
              <p className="auth-subtitle">Select your role to access personalized wellness support.</p>
            </div>

            <div className="role-selection-grid">
              {/* Option 1: Patient */}
              <button
                type="button"
                className="role-choice-card"
                onClick={() => handleSelectRole('patient')}
              >
                <div className="role-icon-box role-patient">
                  <UserIcon size={24} />
                </div>
                <div className="role-text-group">
                  <h3 className="role-name">I am a Patient</h3>
                  <p className="role-description">
                    Access private AI wellness companion, confidential screening, and book licensed therapists.
                  </p>
                </div>
              </button>

              {/* Option 2: Therapist */}
              <button
                type="button"
                className="role-choice-card"
                onClick={() => handleSelectRole('therapist')}
              >
                <div className="role-icon-box role-therapist">
                  <TherapistIcon size={24} />
                </div>
                <div className="role-text-group">
                  <h3 className="role-name">I am a Therapist</h3>
                  <p className="role-description">
                    Manage patient appointments, review consented clinical intake summaries, and provide telehealth care.
                  </p>
                </div>
              </button>
            </div>

            <div className="auth-privacy-foot">
              <ShieldCheckIcon size={14} className="privacy-icon" />
              <span>All sessions and medical profiles are 100% confidential.</span>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 2A: PATIENT LOGIN                                        */}
        {/* ------------------------------------------------------------- */}
        {currentView === 'login-patient' && (
          <div className="auth-body">
            <button
              type="button"
              className="btn-back-nav"
              onClick={() => { setCurrentView('choice'); setFeedback(null); }}
            >
              <ArrowLeftIcon size={14} />
              <span>Back to role selection</span>
            </button>

            <div className="auth-step-title-box">
              <span className="role-tag-pill">Patient Portal</span>
              <h2 id="auth-modal-title" className="auth-title">Sign in to Hridaya</h2>
              <p className="auth-subtitle">Enter your mobile number and password to continue.</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="patient-mobile" className="form-label">Mobile Number</label>
                <input
                  id="patient-mobile"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <div className="label-with-link">
                  <label htmlFor="patient-pwd" className="form-label">Password</label>
                  <button
                    type="button"
                    className="link-forgot"
                    onClick={() => { setCurrentView('forgot'); setFeedback(null); }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="password-input-wrapper">
                  <input
                    id="patient-pwd"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    required
                  />
                  <button
                    type="button"
                    className="btn-toggle-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-auth-submit-olive">
                Sign In as Patient
              </button>
            </form>

            <div className="auth-switch-link-box">
              <span>Don't have an account? </span>
              <button
                type="button"
                className="link-switch-auth"
                onClick={() => { setRole('patient'); setCurrentView('register'); setFeedback(null); }}
              >
                Create a new account
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 2B: THERAPIST LOGIN                                      */}
        {/* ------------------------------------------------------------- */}
        {currentView === 'login-therapist' && (
          <div className="auth-body">
            <button
              type="button"
              className="btn-back-nav"
              onClick={() => { setCurrentView('choice'); setFeedback(null); }}
            >
              <ArrowLeftIcon size={14} />
              <span>Back to role selection</span>
            </button>

            <div className="auth-step-title-box">
              <span className="role-tag-pill therapist-tag">Therapist Clinical Portal</span>
              <h2 id="auth-modal-title" className="auth-title">Therapist Sign In</h2>
              <p className="auth-subtitle">Access your clinical appointment dashboard and intake reviews.</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="therapist-mobile" className="form-label">Registered Mobile Number</label>
                <input
                  id="therapist-mobile"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <div className="label-with-link">
                  <label htmlFor="therapist-pwd" className="form-label">Password</label>
                  <button
                    type="button"
                    className="link-forgot"
                    onClick={() => { setCurrentView('forgot'); setFeedback(null); }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="password-input-wrapper">
                  <input
                    id="therapist-pwd"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your clinical password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    required
                  />
                  <button
                    type="button"
                    className="btn-toggle-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-auth-submit-olive">
                Sign In as Therapist
              </button>
            </form>

            <div className="auth-switch-link-box">
              <span>Are you a licensed practitioner? </span>
              <button
                type="button"
                className="link-switch-auth"
                onClick={() => { setRole('therapist'); setCurrentView('register'); setFeedback(null); }}
              >
                Create a new therapist account
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 3: REGISTRATION (PATIENT & THERAPIST)                    */}
        {/* ------------------------------------------------------------- */}
        {currentView === 'register' && (
          <div className="auth-body">
            <button
              type="button"
              className="btn-back-nav"
              onClick={() => { setCurrentView(role === 'patient' ? 'login-patient' : 'login-therapist'); setFeedback(null); }}
            >
              <ArrowLeftIcon size={14} />
              <span>Back to sign in</span>
            </button>

            <div className="auth-step-title-box">
              <h2 id="auth-modal-title" className="auth-title">
                Create {role === 'therapist' ? 'Therapist' : 'Patient'} Account
              </h2>
              <p className="auth-subtitle">Join Hridaya's confidential mental wellness network.</p>
            </div>

            {/* Account Type Selector Switch */}
            <div className="account-type-toggle">
              <button
                type="button"
                className={`type-btn ${role === 'patient' ? 'active' : ''}`}
                onClick={() => setRole('patient')}
              >
                Patient
              </button>
              <button
                type="button"
                className={`type-btn ${role === 'therapist' ? 'active' : ''}`}
                onClick={() => setRole('therapist')}
              >
                Therapist
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="reg-name" className="form-label">Full Name</label>
                <input
                  id="reg-name"
                  type="text"
                  placeholder="e.g. Aditi Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-mobile" className="form-label">Mobile Number</label>
                <input
                  id="reg-mobile"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              {role === 'therapist' && (
                <div className="form-group">
                  <label htmlFor="reg-license" className="form-label">Clinical License / RCI Registration No.</label>
                  <input
                    id="reg-license"
                    type="text"
                    placeholder="e.g. RCI/PSY/2022/1089"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              )}

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="reg-pwd" className="form-label">Password</label>
                  <div className="password-input-wrapper">
                    <input
                      id="reg-pwd"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input"
                      required
                    />
                    <button
                      type="button"
                      className="btn-toggle-eye"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="reg-confirm-pwd" className="form-label">Confirm Password</label>
                  <div className="password-input-wrapper">
                    <input
                      id="reg-confirm-pwd"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="form-input"
                      required
                    />
                    <button
                      type="button"
                      className="btn-toggle-eye"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-auth-submit-olive">
                Create Account
              </button>
            </form>

            <div className="auth-switch-link-box">
              <span>Already have an account? </span>
              <button
                type="button"
                className="link-switch-auth"
                onClick={() => { setCurrentView(role === 'patient' ? 'login-patient' : 'login-therapist'); setFeedback(null); }}
              >
                Log In
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 4: FORGOT PASSWORD FLOW                                  */}
        {/* ------------------------------------------------------------- */}
        {currentView === 'forgot' && (
          <div className="auth-body">
            <button
              type="button"
              className="btn-back-nav"
              onClick={() => { setCurrentView(role === 'patient' ? 'login-patient' : 'login-therapist'); setFeedback(null); }}
            >
              <ArrowLeftIcon size={14} />
              <span>Back to sign in</span>
            </button>

            <div className="auth-step-title-box">
              <h2 id="auth-modal-title" className="auth-title">Reset Your Password</h2>
              <p className="auth-subtitle">
                {forgotStep === 1 && "Enter your registered mobile number to receive a verification OTP."}
                {forgotStep === 2 && `Enter the 4-digit code sent to ${mobileNumber}.`}
                {forgotStep === 3 && "Create a secure new password for your account."}
              </p>
            </div>

            <form onSubmit={handleForgotSubmit} className="auth-form">
              {forgotStep === 1 && (
                <div className="form-group">
                  <label htmlFor="forgot-mobile" className="form-label">Mobile Number</label>
                  <input
                    id="forgot-mobile"
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              )}

              {forgotStep === 2 && (
                <div className="form-group">
                  <label htmlFor="forgot-otp" className="form-label">Enter Verification Code</label>
                  <input
                    id="forgot-otp"
                    type="text"
                    maxLength={4}
                    placeholder="1234"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="form-input otp-input"
                    required
                  />
                  <span className="otp-hint-text">Demo code: Any 4 digits (e.g. 1234)</span>
                </div>
              )}

              {forgotStep === 3 && (
                <div className="form-group">
                  <label htmlFor="forgot-new-pwd" className="form-label">New Password</label>
                  <input
                    id="forgot-new-pwd"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              )}

              <button type="submit" className="btn-auth-submit-olive">
                {forgotStep === 1 && "Send Verification Code"}
                {forgotStep === 2 && "Verify Code"}
                {forgotStep === 3 && "Update Password"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
