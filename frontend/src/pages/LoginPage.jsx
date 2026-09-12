import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  Lock, 
  User, 
  ArrowRight, 
  Smartphone, 
  LayoutDashboard, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Eye,
  EyeOff,
  Sparkles,
  Mail,
  ChevronLeft
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import OnboardingModal from '../components/OnboardingModal';

export default function LoginPage() {
  const { login } = useAuth();

  // Input fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Forgot password interactive state
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState(null);

  // Onboarding tour modal state
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem('inspectra_onboarding_completed');
      if (!seen) {
        setShowTour(true);
      }
    } catch (e) {}
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const isFormValid = identifier.trim().length > 0 && password.length > 0;

  // Form submit handler with plain-English, supportive error handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanId = identifier.trim();
    if (!cleanId || !password) {
      setError('Please enter your name and password.');
      return;
    }

    setLoggingIn(true);
    const res = await login(cleanId, password);
    setLoggingIn(false);

    if (res.success && (res.data || res.user)) {
      const user = res.data?.user || res.user || res.data;
      const userRole = res.data?.role || user?.role;

      let redirectPath = '/admin-dashboard';
      if (userRole === 'INSPECTOR') {
        redirectPath = '/field-inspector';
      } else if (userRole === 'DIRECTOR') {
        redirectPath = '/director-dashboard';
      } else if (userRole === 'SUPERVISOR') {
        redirectPath = '/supervisor-dashboard';
      }

      navigateTo(redirectPath);
    } else {
      setError("Sorry, that name or password isn't correct.");
    }
  };

  const handleSendReset = (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetMessage({ type: 'error', text: 'Please enter your email to receive a reset code.' });
      return;
    }
    setResetMessage({ type: 'success', text: 'Reset code sent! Please check your email inbox.' });
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        backgroundColor: 'var(--bg-primary, #F8FAF8)',
        color: 'var(--color-text, #212121)',
        fontFamily: "'Roboto', 'Inter', system-ui, sans-serif"
      }}
    >
      {/* 4-Step Onboarding Interactive Tour */}
      <OnboardingModal
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        onComplete={() => setShowTour(false)}
      />

      <div 
        style={{
          width: '100%',
          maxWidth: 460,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          position: 'relative'
        }}
      >
        {/* Top Floating Controls: Quick Tour & Theme Switcher */}
        <div style={{ position: 'absolute', top: -8, right: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setShowTour(true)}
            data-tooltip="App Tour"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              backgroundColor: 'var(--color-primary-surface, #E8F5E9)',
              color: 'var(--color-primary-dark, #1B5E20)',
              border: '1px solid var(--color-border, #C8E6C9)',
              borderRadius: 20,
              padding: '6px 12px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              minHeight: 36
            }}
          >
            <Sparkles size={14} color="var(--color-primary, #43A047)" />
            <span>Tour</span>
          </button>
          <ThemeToggle compact={true} />
        </div>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', maxWidth: 420, marginTop: 10 }}>
          <div style={{ marginBottom: 10 }}>
            <img 
              src="/logo.png" 
              alt="Inspectra Pro" 
              style={{ 
                width: 68, 
                height: 68, 
                objectFit: 'contain', 
                borderRadius: 'var(--radius-md, 16px)', 
                boxShadow: '0 8px 24px rgba(67, 160, 71, 0.25)',
                backgroundColor: '#FFFFFF',
                padding: 4,
                border: '2px solid var(--color-border, #C8E6C9)'
              }} 
            />
          </div>

          <h1 
            style={{ 
              fontSize: 28, 
              fontWeight: 900, 
              color: 'var(--color-primary-dark, #1B5E20)', 
              letterSpacing: '-0.02em', 
              margin: 0 
            }}
          >
            INSPECTRA PRO
          </h1>

          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-primary, #43A047)', marginTop: 4, marginBottom: 0 }}>
            Inspect • Monitor • Build Better
          </p>
        </div>

        {/* Main Clean Rounded Login Card */}
        <div
          style={{
            width: '100%',
            backgroundColor: 'var(--color-bg, #FFFFFF)',
            borderRadius: 'var(--radius-lg, 20px)',
            border: '2px solid var(--color-border, #C8E6C9)',
            padding: '24px 22px',
            boxShadow: '0 12px 35px -8px rgba(67, 160, 71, 0.15), 0 4px 12px rgba(0, 0, 0, 0.04)',
            boxSizing: 'border-box'
          }}
        >
          {/* Institutional Single Sign-On Assurance Banner */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 8, 
              padding: '12px 14px', 
              backgroundColor: 'var(--color-primary-surface, #E8F5E9)', 
              borderRadius: 'var(--radius-md, 14px)',
              marginBottom: 20,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-primary-dark, #1B5E20)',
              border: '1px solid var(--color-border, #C8E6C9)'
            }}
          >
            <Shield size={16} color="var(--color-primary, #43A047)" />
            <span>Institutional Login • Role Assigned Automatically</span>
          </div>

          {/* Supportive Actionable Error Banner */}
          {error && (
            <div 
              role="alert"
              style={{
                backgroundColor: 'rgba(211, 47, 47, 0.08)',
                border: '1.5px solid var(--color-error, #D32F2F)',
                color: 'var(--color-error, #D32F2F)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm, 12px)',
                fontSize: 15,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 18
              }}
            >
              <AlertCircle size={20} color="var(--color-error, #D32F2F)" style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Main Credentials Form */}
          {!showForgot ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label 
                  htmlFor="login-username"
                  style={{ 
                    display: 'block', 
                    fontSize: 15, 
                    fontWeight: 600, 
                    color: 'var(--color-text, #212121)', 
                    marginBottom: 6 
                  }}
                >
                  User Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User 
                    size={18} 
                    color="var(--color-primary, #43A047)" 
                    style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} 
                  />
                  <input
                    id="login-username"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Your login name"
                    autoComplete="username"
                    required
                    className="input-control"
                    style={{
                      paddingLeft: 42,
                      minHeight: 46,
                      fontSize: 15
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label 
                    htmlFor="login-password"
                    style={{ 
                      fontSize: 15, 
                      fontWeight: 600, 
                      color: 'var(--color-text, #212121)' 
                    }}
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary, #43A047)',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Forgot your password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock 
                    size={18} 
                    color="var(--color-primary, #43A047)" 
                    style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} 
                  />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your secret code"
                    autoComplete="current-password"
                    required
                    className="input-control"
                    style={{
                      paddingLeft: 42,
                      paddingRight: 46,
                      minHeight: 46,
                      fontSize: 15
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-text-muted, #555555)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 6
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Login Button: Disabled until both fields non-empty */}
              <button
                type="submit"
                disabled={loggingIn || !isFormValid}
                className="btn btn-primary"
                style={{
                  marginTop: 6,
                  minHeight: 48,
                  fontSize: 16,
                  fontWeight: 700,
                  opacity: (!isFormValid || loggingIn) ? 0.6 : 1,
                  cursor: (!isFormValid || loggingIn) ? 'not-allowed' : 'pointer'
                }}
              >
                <span>{loggingIn ? 'Logging in...' : 'Log In'}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            /* Forgot Password Box */
            <form onSubmit={handleSendReset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <button
                  type="button"
                  onClick={() => { setShowForgot(false); setResetMessage(null); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary, #43A047)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 14,
                    fontWeight: 700,
                    padding: 0
                  }}
                >
                  <ChevronLeft size={16} />
                  <span>Back to login</span>
                </button>
              </div>

              <h3 style={{ fontSize: 18, color: 'var(--color-primary-dark, #1B5E20)', margin: '0 0 4px' }}>
                Reset Your Password
              </h3>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted, #555555)', margin: '0 0 10px' }}>
                Enter your email below to reset your password.
              </p>

              {resetMessage && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    backgroundColor: resetMessage.type === 'success' ? 'var(--color-primary-surface, #E8F5E9)' : 'rgba(211, 47, 47, 0.1)',
                    color: resetMessage.type === 'success' ? 'var(--color-primary-dark, #1B5E20)' : 'var(--color-error, #D32F2F)',
                    border: `1px solid ${resetMessage.type === 'success' ? 'var(--color-border, #C8E6C9)' : 'var(--color-error, #D32F2F)'}`
                  }}
                >
                  {resetMessage.text}
                </div>
              )}

              <div>
                <label 
                  htmlFor="reset-email"
                  style={{ display: 'block', fontSize: 15, fontWeight: 600, marginBottom: 6 }}
                >
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail 
                    size={18} 
                    color="var(--color-primary, #43A047)" 
                    style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} 
                  />
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@agency.gov.in"
                    required
                    className="input-control"
                    style={{ paddingLeft: 42, minHeight: 46 }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ minHeight: 48, fontSize: 16, fontWeight: 700 }}
              >
                <span>Send Reset Link</span>
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          {/* Quick Demo Hint */}
          <div 
            style={{
              marginTop: 18,
              paddingTop: 14,
              borderTop: '1px solid var(--color-border, #C8E6C9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 13,
              color: 'var(--color-text-muted, #555555)'
            }}
          >
            <span>
              {selectedRole === 'INSPECTOR' ? 'Example: vishnu.p' : 'Example: admin'}
            </span>
            <span style={{ fontWeight: 600, color: 'var(--color-primary, #43A047)' }}>
              {selectedRole === 'INSPECTOR' ? 'Field Portal' : 'Admin Panel'}
            </span>
          </div>
        </div>

        {/* Footer Help Microcopy */}
        <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--color-text-muted, #555555)' }}>
          <span>Need help? Contact support.</span>
        </div>
      </div>
    </div>
  );
}
