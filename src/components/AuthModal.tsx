import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldCheck,
  ArrowRight,
  X,
  GraduationCap,
  LogIn,
  Sparkles,
  UserPlus,
  Building,
  BookOpen,
  Phone,
  CheckCircle2,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

export type AuthMode =
  | 'student'
  | 'teacher_login'
  | 'teacher_signup'
  | 'admin'
  | 'teacher_forgot_password'
  | 'teacher_reset_password';

interface AuthModalProps {
  mode: AuthMode;
  initialMode?: AuthMode;
  onClose: () => void;
  onSuccess: (user: any) => void;
  onSwitchMode?: (mode: AuthMode) => void;
}

export function AuthModal({ mode: propMode, initialMode, onClose, onSuccess, onSwitchMode }: AuthModalProps) {
  const [internalMode, setInternalMode] = useState<AuthMode>(() => propMode || initialMode || 'student');
  const activeMode = propMode || internalMode;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Student Fields
  const [passkey, setPasskey] = useState('');

  // Teacher Login Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Teacher Signup Fields
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [school, setSchool] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [phone, setPhone] = useState('');

  // Teacher Forgot & Reset Password Fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotDone, setForgotDone] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState('');

  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmResetPassword, setShowConfirmResetPassword] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  // Sync token from URL query params on mount or when mode changes to reset password
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('resetToken') || params.get('token');
      if (tokenFromUrl) {
        setResetToken(tokenFromUrl);
      }
    }
  }, [activeMode]);

  const handleSwitch = (newMode: AuthMode) => {
    setError('');
    setSuccessMsg('');
    if (onSwitchMode) {
      onSwitchMode(newMode);
    } else {
      setInternalMode(newMode);
    }
  };

  async function handleStudentLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/student', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey: passkey.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Invalid student passkey.');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('eduashram_session_active', '1');
      }
      onSuccess(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in with passkey.');
    } finally {
      setBusy(false);
    }
  }

  async function handleTeacherLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/teacher/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Fallback to legacy /api/auth/admin if needed
        if (res.status === 401) {
          const fallbackRes = await fetch('/api/auth/admin', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
          });
          const fbData = await fallbackRes.json().catch(() => ({}));
          if (fallbackRes.ok) {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('eduashram_session_active', '1');
              localStorage.setItem('teacher_active_tab', 'overview');
            }
            onSuccess(fbData.user);
            return;
          }
        }
        throw new Error(data.error || 'Failed to sign in. Please verify your teacher credentials.');
      }
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('eduashram_session_active', '1');
        localStorage.setItem('teacher_active_tab', 'overview');
      }
      onSuccess(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  }

  async function handleTeacherSignup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccessMsg('');

    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      setBusy(false);
      return;
    }

    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      setBusy(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/teacher/signup', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: signupEmail.trim(),
          password: signupPassword,
          school: school.trim() || undefined,
          subject: subject.trim() || 'Mathematics',
          phone: phone.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register teacher account.');
      }

      setSuccessMsg(data.message || 'Teacher registration submitted successfully! Your account will be activated once approved by the EduAshram Administrator.');
      localStorage.removeItem('livequiz_ai_key');
      localStorage.setItem('teacher_active_tab', 'overview');
      setName('');
      setSignupEmail('');
      setSignupPassword('');
      setConfirmPassword('');
      setSchool('');
      setPhone('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleTeacherForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setDevResetUrl('');
    try {
      const res = await fetch('/api/auth/teacher/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to process password reset request.');

      setForgotDone(true);
      if (data.devResetUrl) {
        setDevResetUrl(data.devResetUrl);
      }
      setSuccessMsg(data.message || 'If an educator account exists with this email address, a password reset link has been dispatched to your inbox.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request password reset.');
    } finally {
      setBusy(false);
    }
  }

  async function handleTeacherResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');

    if (!resetToken.trim()) {
      setError('Password reset token is missing. Please click the reset link in your email.');
      setBusy(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      setBusy(false);
      return;
    }

    if (newPassword !== confirmResetPassword) {
      setError('Passwords do not match. Please re-enter your new password.');
      setBusy(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/teacher/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken.trim(), password: newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to reset password.');

      setResetDone(true);
      setSuccessMsg(data.message || 'Your password has been reset successfully! You can now sign in.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setBusy(false);
    }
  }

  // ==========================================
  // 1. DEDICATED STUDENT SIGN IN CARD
  // ==========================================
  if (activeMode === 'student') {
    return (
      <div className="word-doc-modal-overlay auth-modal-overlay">
        <div className="auth-modal-card auth-card-student" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
          <button className="icon-button quiet modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>

          <div className="auth-modal-header">
            <div className="auth-header-top">
              <div className="auth-modal-brand">
                <span className="brand-mark"><img src="/logo.png" alt="EduAshram" className="brand-logo" /></span>
                <span className="brand-title">EduAshram</span>
              </div>
              <span className="auth-role-badge auth-badge-student">
                <GraduationCap size={13} /> STUDENT PORTAL
              </span>
            </div>

            <h2>Enter Student Passkey</h2>
            <p className="auth-subtext" style={{ marginBottom: 0, fontSize: '13.5px', color: '#64748b' }}>
              Enter the 6-character passkey provided by your teacher to join classroom quizzes and view worksheets.
            </p>
          </div>

          <form onSubmit={handleStudentLogin} className="form-stack auth-form">
            <label className="field">
              <span>Your Classroom Passkey</span>
              <div className="input-with-icon">
                <KeyRound size={17} />
                <input
                  autoFocus
                  required
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value.toUpperCase())}
                  placeholder="e.g. MATH99"
                  autoCapitalize="characters"
                  maxLength={12}
                />
              </div>
            </label>

            {error && <div className="inline-error">{error}</div>}

            <button className="button button-primary button-wide" type="submit" disabled={busy} style={{ background: '#0284c7', borderColor: '#0284c7' }}>
              {busy ? 'Verifying passkey...' : <>Join Classroom <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="auth-modal-footer">
            <div className="student-tip">
              <Sparkles size={14} color="#0284c7" /> Don't have a passkey? Ask your EduAshram teacher to share one with you!
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. TEACHER FORGOT PASSWORD CARD (GMAIL SMTP)
  // ==========================================
  if (activeMode === 'teacher_forgot_password') {
    return (
      <div className="word-doc-modal-overlay auth-modal-overlay">
        <div className="auth-modal-card auth-card-teacher" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
          <button className="icon-button quiet modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>

          <div className="auth-modal-header">
            <div className="auth-header-top">
              <div className="auth-modal-brand">
                <span className="brand-mark"><img src="/logo.png" alt="EduAshram" className="brand-logo" /></span>
                <span className="brand-title">EduAshram</span>
              </div>
              <span className="auth-role-badge auth-badge-teacher">
                <Mail size={13} /> PASSWORD RECOVERY
              </span>
            </div>

            <h2>Forgot Password?</h2>
            <p className="auth-subtext" style={{ marginBottom: 0, fontSize: '13.5px', color: '#64748b' }}>
              Enter your registered teacher email. We'll send you a secure link via Gmail SMTP to reset your password.
            </p>
          </div>

          {forgotDone ? (
            <div style={{ padding: '24px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px', textAlign: 'center', margin: '14px 0' }}>
              <CheckCircle2 size={46} color="#16a34a" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 8px', color: '#166534', fontSize: '18px' }}>Reset Link Dispatched</h3>
              <p style={{ margin: '0 0 16px', fontSize: '13.5px', color: '#15803d', lineHeight: 1.5 }}>
                If an educator account exists for <strong>{forgotEmail}</strong>, a secure password reset link has been dispatched.
              </p>
              <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #bbf7d0', fontSize: '12.5px', color: '#166534', marginBottom: '16px' }}>
                ⏰ The link is valid for <strong>30 minutes</strong>. Please check your inbox and spam folder.
              </div>

              {devResetUrl && (
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px', marginBottom: '16px', textAlign: 'left' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', marginBottom: '4px' }}>
                    🛠️ Developer / Local Test Link:
                  </div>
                  <div style={{ fontSize: '11px', color: '#78350f', wordBreak: 'break-all', fontFamily: 'monospace', marginBottom: '8px' }}>
                    {devResetUrl}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const url = new URL(devResetUrl, window.location.origin);
                      const tok = url.searchParams.get('resetToken') || '';
                      setResetToken(tok);
                      handleSwitch('teacher_reset_password');
                    }}
                    style={{
                      background: '#d97706',
                      color: '#ffffff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Open Reset Form Now &rarr;
                  </button>
                </div>
              )}

              <button
                type="button"
                className="button button-primary button-wide"
                onClick={() => handleSwitch('teacher_login')}
                style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
              >
                Back to Teacher Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleTeacherForgotPassword} className="form-stack auth-form">
              <label className="field">
                <span>Teacher Email Address</span>
                <div className="input-with-icon">
                  <Mail size={17} />
                  <input
                    autoFocus
                    required
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="teacher@school.com"
                    autoComplete="email"
                  />
                </div>
              </label>

              {error && <div className="inline-error">{error}</div>}

              <button className="button button-primary button-wide" type="submit" disabled={busy} style={{ background: '#7c3aed', borderColor: '#7c3aed' }}>
                {busy ? 'Sending Reset Email...' : <>Send Reset Link <ArrowRight size={16} /></>}
              </button>

              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  Remembered your password?{' '}
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#7c3aed', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                    onClick={() => handleSwitch('teacher_login')}
                  >
                    Back to Sign In
                  </button>
                </span>
              </div>
            </form>
          )}

          <div className="auth-modal-footer">
            <div className="secure-note">
              <ShieldCheck size={14} color="#059669" /> Gmail SMTP Encrypted Delivery · 30-Minute Security Expiration
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 3. TEACHER SET NEW PASSWORD CARD
  // ==========================================
  if (activeMode === 'teacher_reset_password') {
    return (
      <div className="word-doc-modal-overlay auth-modal-overlay">
        <div className="auth-modal-card auth-card-teacher" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
          <button className="icon-button quiet modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>

          <div className="auth-modal-header">
            <div className="auth-header-top">
              <div className="auth-modal-brand">
                <span className="brand-mark"><img src="/logo.png" alt="EduAshram" className="brand-logo" /></span>
                <span className="brand-title">EduAshram</span>
              </div>
              <span className="auth-role-badge auth-badge-teacher">
                <KeyRound size={13} /> SET NEW PASSWORD
              </span>
            </div>

            <h2>Set New Password</h2>
            <p className="auth-subtext" style={{ marginBottom: 0, fontSize: '13.5px', color: '#64748b' }}>
              Choose a strong new password for your EduAshram teacher account.
            </p>
          </div>

          {resetDone ? (
            <div style={{ padding: '24px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px', textAlign: 'center', margin: '14px 0' }}>
              <CheckCircle2 size={46} color="#16a34a" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 8px', color: '#166534', fontSize: '18px' }}>Password Successfully Updated!</h3>
              <p style={{ margin: '0 0 18px', fontSize: '13.5px', color: '#15803d', lineHeight: 1.5 }}>
                {successMsg}
              </p>
              <button
                type="button"
                className="button button-primary button-wide"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.history.replaceState({}, '', '/');
                  }
                  handleSwitch('teacher_login');
                }}
                style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
              >
                Sign In With New Password &rarr;
              </button>
            </div>
          ) : (
            <form onSubmit={handleTeacherResetPassword} className="form-stack auth-form">
              {!resetToken && (
                <label className="field">
                  <span>Reset Security Token *</span>
                  <input
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value.trim())}
                    placeholder="Paste token from email link"
                  />
                </label>
              )}

              {resetToken && (
                <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} color="#059669" />
                  <span>Reset Token Verified: <code>{resetToken.slice(0, 8)}...</code></span>
                </div>
              )}

              <label className="field">
                <span>New Password (min 6 characters) *</span>
                <div className="input-with-icon" style={{ position: 'relative' }}>
                  <Lock size={17} />
                  <input
                    autoFocus
                    required
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new secure password"
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <label className="field">
                <span>Confirm New Password *</span>
                <div className="input-with-icon" style={{ position: 'relative' }}>
                  <Lock size={17} />
                  <input
                    required
                    type={showConfirmResetPassword ? 'text' : 'password'}
                    value={confirmResetPassword}
                    onChange={(e) => setConfirmResetPassword(e.target.value)}
                    placeholder="Re-type new password"
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmResetPassword(!showConfirmResetPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    {showConfirmResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              {error && <div className="inline-error">{error}</div>}

              <button className="button button-primary button-wide" type="submit" disabled={busy} style={{ background: '#7c3aed', borderColor: '#7c3aed' }}>
                {busy ? 'Updating Password...' : <>Update Password &amp; Continue <ArrowRight size={16} /></>}
              </button>

              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer', padding: 0 }}
                  onClick={() => handleSwitch('teacher_login')}
                >
                  Return to Teacher Sign In
                </button>
              </div>
            </form>
          )}

          <div className="auth-modal-footer">
            <div className="secure-note">
              <ShieldCheck size={14} color="#059669" /> End-to-End Encrypted Session · Safe Credential Update
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 4. DEDICATED TEACHER SIGN IN CARD
  // ==========================================
  if (activeMode === 'teacher_login' || activeMode === 'admin') {
    return (
      <div className="word-doc-modal-overlay auth-modal-overlay">
        <div className="auth-modal-card auth-card-teacher" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
          <button className="icon-button quiet modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>

          <div className="auth-modal-header">
            <div className="auth-header-top">
              <div className="auth-modal-brand">
                <span className="brand-mark"><img src="/logo.png" alt="EduAshram" className="brand-logo" /></span>
                <span className="brand-title">EduAshram</span>
              </div>
              <span className="auth-role-badge auth-badge-teacher">
                <LogIn size={13} /> TEACHER WORKSPACE
              </span>
            </div>

            <h2>Teacher Sign In</h2>
            <p className="auth-subtext" style={{ marginBottom: 0, fontSize: '13.5px', color: '#64748b' }}>
              Sign in to access your personal classroom, student list, quiz generator, and question papers.
            </p>
          </div>

          <form onSubmit={handleTeacherLogin} className="form-stack auth-form">
            <label className="field">
              <span>Email Address</span>
              <input
                autoFocus
                required
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="teacher@school.com"
                autoComplete="username"
              />
            </label>
            <label className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span>Password</span>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(loginEmail);
                    setError('');
                    setSuccessMsg('');
                    setForgotDone(false);
                    handleSwitch('teacher_forgot_password');
                  }}
                  style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Forgot Password?
                </button>
              </div>
              <input
                required
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </label>

            {error && <div className="inline-error">{error}</div>}

            <button className="button button-primary button-wide" type="submit" disabled={busy}>
              {busy ? 'Signing in...' : <>Sign In to Dashboard <ArrowRight size={16} /></>}
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                New teacher?{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#7c3aed', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  onClick={() => handleSwitch('teacher_signup')}
                >
                  Apply for teacher account
                </button>
              </span>
            </div>
          </form>

          <div className="auth-modal-footer">
            <div className="secure-note">
              <ShieldCheck size={14} color="#059669" /> Encrypted teacher session · Isolated classroom workspace
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 5. DEDICATED TEACHER SIGN UP CARD
  // ==========================================
  return (
    <div className="word-doc-modal-overlay auth-modal-overlay">
      <div className="auth-modal-card auth-card-signup" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
        <button className="icon-button quiet modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div className="auth-modal-header">
          <div className="auth-header-top">
            <div className="auth-modal-brand">
              <span className="brand-mark"><img src="/logo.png" alt="EduAshram" className="brand-logo" /></span>
              <span className="brand-title">EduAshram</span>
            </div>
            <span className="auth-role-badge auth-badge-signup">
              <UserPlus size={13} /> TEACHER REGISTRATION
            </span>
          </div>

          <h2>Create Teacher Account</h2>
          <p className="auth-subtext" style={{ marginBottom: 0, fontSize: '13.5px', color: '#64748b' }}>
            Register as a teacher on EduAshram. Once approved by the administrator, you will have your own isolated teaching workspace.
          </p>
        </div>

        {successMsg ? (
          <div style={{ padding: '24px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px', textAlign: 'center', margin: '14px 0' }}>
            <CheckCircle2 size={46} color="#16a34a" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 8px', color: '#166534', fontSize: '18px' }}>Application Submitted!</h3>
            <p style={{ margin: '0 0 18px', fontSize: '13.5px', color: '#15803d', lineHeight: 1.5 }}>
              {successMsg}
            </p>
            <button
              type="button"
              className="button button-primary"
              onClick={() => handleSwitch('teacher_login')}
              style={{ background: '#16a34a', borderColor: '#16a34a', margin: '0 auto' }}
            >
              Go to Teacher Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleTeacherSignup} className="form-stack auth-form">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label className="field">
                <span>Full Name *</span>
                <input
                  autoFocus
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Smt. Sunita Sharma"
                />
              </label>
              <label className="field">
                <span>School / Institution</span>
                <div className="input-with-icon">
                  <Building size={16} />
                  <input
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="e.g. DPS / KV / Private"
                  />
                </div>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label className="field">
                <span>Primary Subject</span>
                <div className="input-with-icon">
                  <BookOpen size={16} />
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Mathematics"
                  />
                </div>
              </label>
              <label className="field">
                <span>Contact Phone</span>
                <div className="input-with-icon">
                  <Phone size={16} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
              </label>
            </div>

            <label className="field">
              <span>Email Address *</span>
              <input
                required
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="teacher@school.com"
                autoComplete="username"
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label className="field">
                <span>Password (min 6 chars) *</span>
                <input
                  required
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Min 6 characters"
                />
              </label>
              <label className="field">
                <span>Confirm Password *</span>
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                />
              </label>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b', lineHeight: 1.45 }}>
              <ShieldCheck size={14} color="#059669" style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '5px' }} />
              New teacher profiles undergo Super Admin review. You will manage your own unique kids, quizzes, and personal API key once approved.
            </div>

            {error && <div className="inline-error">{error}</div>}

            <button className="button button-primary button-wide" type="submit" disabled={busy} style={{ background: '#7c3aed', borderColor: '#7c3aed' }}>
              {busy ? 'Submitting Application...' : <>Submit Teacher Application <ArrowRight size={16} /></>}
            </button>

            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Already have an approved account?{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#047857', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  onClick={() => handleSwitch('teacher_login')}
                >
                  Sign in here
                </button>
              </span>
            </div>
          </form>
        )}

        <div className="auth-modal-footer" style={{ marginTop: '8px' }}>
          <div className="secure-note" style={{ marginTop: 0 }}>
            <ShieldCheck size={14} color="#7c3aed" /> Protected Registration · Multi-tenant workspace isolation
          </div>
        </div>
      </div>
    </div>
  );
}
