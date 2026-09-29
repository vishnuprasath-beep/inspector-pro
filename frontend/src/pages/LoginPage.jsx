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

  // Role selection state (Entry flow: Public Root -> Login/Role Selection -> Enter Credentials -> Authenticate)
  const [selectedRole, setSelectedRole] = useState('INSPECTOR'); // 'INSPECTOR' | 'ADMIN' | 'SUPERVISOR' | 'DIRECTOR'

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

  // Form submit handler with backend role verification
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanId = identifier.trim();
    if (!cleanId || !password) {
      setError('Please enter both your Username/ID and Password.');
      return;
    }

    setLoggingIn(true);
    const res = await login(cleanId, password);
    setLoggingIn(false);

    if (res.success && (res.data || res.user)) {
      const user = res.data?.user || res.user || res.data;
      const userRole = res.role || res.data?.role || user?.role;

      // Backend-authenticated role determines actual portal destination:
      // Inspector -> /field-inspector
      // Admin / Supervisor / Director -> /admin-dashboard
      let redirectPath = '/admin-dashboard';
      if (userRole === 'INSPECTOR') {
        redirectPath = '/field-inspector';
      } else {
        redirectPath = '/admin-dashboard';
      }

      navigateTo(redirectPath);
    } else {
      setError(res.error || "Sorry, that username or password is incorrect.");
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
          {/* Role Selection Section (Required Entry Flow: Public Root -> Select Role -> Enter Credentials -> Authenticate) */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-muted, #555555)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, textAlign: 'center' }}>
              Step 1: Select Your Authorized Role
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {/* 1. Field Inspector */}
              <button
                type="button"
                onClick={() => { setSelectedRole('INSPECTOR'); setError(null); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 12px',
                  backgroundColor: selectedRole === 'INSPECTOR' ? 'rgba(2, 132, 199, 0.08)' : 'var(--color-bg, #FFFFFF)',
                  border: selectedRole === 'INSPECTOR' ? '2px solid #0284c7' : '1px solid var(--color-border, #C8E6C9)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--color-text, #212121)',
                  boxShadow: selectedRole === 'INSPECTOR' ? '0 0 0 2px rgba(2, 132, 199, 0.2)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Smartphone size={18} color="#0284c7" />
                <div>
                  <div style={{ fontWeight: 700 }}>Field Inspector</div>
                  <div style={{ fontSize: 11, color: selectedRole === 'INSPECTOR' ? '#0284c7' : 'var(--color-text-muted, #777)' }}>Mobile Portal</div>
                </div>
              </button>

              {/* 2. System Admin */}
              <button
                type="button"
                onClick={() => { setSelectedRole('ADMIN'); setError(null); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 12px',
                  backgroundColor: selectedRole === 'ADMIN' ? 'rgba(67, 160, 71, 0.08)' : 'var(--color-bg, #FFFFFF)',
                  border: selectedRole === 'ADMIN' ? '2px solid var(--color-primary, #43A047)' : '1px solid var(--color-border, #C8E6C9)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--color-text, #212121)',
                  boxShadow: selectedRole === 'ADMIN' ? '0 0 0 2px rgba(67, 160, 71, 0.2)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <LayoutDashboard size={18} color="var(--color-primary, #43A047)" />
                <div>
                  <div style={{ fontWeight: 700 }}>System Admin</div>
                  <div style={{ fontSize: 11, color: selectedRole === 'ADMIN' ? 'var(--color-primary-dark, #1B5E20)' : 'var(--color-text-muted, #777)' }}>Command Center</div>
                </div>
              </button>

              {/* 3. State Director */}
              <button
                type="button"
                onClick={() => { setSelectedRole('DIRECTOR'); setError(null); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 12px',
                  backgroundColor: selectedRole === 'DIRECTOR' ? 'rgba(139, 92, 246, 0.08)' : 'var(--color-bg, #FFFFFF)',
                  border: selectedRole === 'DIRECTOR' ? '2px solid #8b5cf6' : '1px solid var(--color-border, #C8E6C9)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--color-text, #212121)',
                  boxShadow: selectedRole === 'DIRECTOR' ? '0 0 0 2px rgba(139, 92, 246, 0.2)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Shield size={18} color="#8b5cf6" />
                <div>
                  <div style={{ fontWeight: 700 }}>State Director</div>
                  <div style={{ fontSize: 11, color: selectedRole === 'DIRECTOR' ? '#8b5cf6' : 'var(--color-text-muted, #777)' }}>Executive KPIs</div>
                </div>
              </button>

              {/* 4. Supervisor */}
              <button
                type="button"
                onClick={() => { setSelectedRole('SUPERVISOR'); setError(null); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 12px',
                  backgroundColor: selectedRole === 'SUPERVISOR' ? 'rgba(245, 158, 11, 0.08)' : 'var(--color-bg, #FFFFFF)',
                  border: selectedRole === 'SUPERVISOR' ? '2px solid #f59e0b' : '1px solid var(--color-border, #C8E6C9)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--color-text, #212121)',
                  boxShadow: selectedRole === 'SUPERVISOR' ? '0 0 0 2px rgba(245, 158, 11, 0.2)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <CheckCircle2 size={18} color="#f59e0b" />
                <div>
                  <div style={{ fontWeight: 700 }}>Supervisor</div>
                  <div style={{ fontSize: 11, color: selectedRole === 'SUPERVISOR' ? '#b45309' : 'var(--color-text-muted, #777)' }}>Sign-off & Verify</div>
                </div>
              </button>
            </div>
          </div>

          <div style={{ position: 'relative', textAlign: 'center', margin: '14px 0 16px', borderTop: '1px solid var(--color-border, #E0E0E0)' }}>
            <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--color-bg, #FFFFFF)', padding: '0 10px', fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted, #777)' }}>
              Step 2: Enter {selectedRole === 'INSPECTOR' ? 'Inspector' : selectedRole === 'ADMIN' ? 'Admin' : selectedRole === 'DIRECTOR' ? 'Director' : 'Supervisor'} Credentials
            </span>
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
              {selectedRole === 'INSPECTOR' ? 'Account: vishnu.p' : selectedRole === 'ADMIN' ? 'Account: admin' : selectedRole === 'DIRECTOR' ? 'Account: director' : 'Account: supervisor'}
            </span>
            <span style={{ fontWeight: 600, color: 'var(--color-primary, #43A047)' }}>
              {selectedRole === 'INSPECTOR' ? 'Field Inspector Portal' : selectedRole === 'ADMIN' ? 'Admin Command Center' : selectedRole === 'DIRECTOR' ? 'Executive KPI Portal' : 'Supervisor Portal'}
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
