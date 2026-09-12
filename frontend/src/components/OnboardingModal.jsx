import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Search, 
  ClipboardList, 
  Users, 
  ArrowRight, 
  ChevronLeft, 
  X, 
  LogIn, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';

const ONBOARDING_SCREENS = [
  {
    id: 'welcome',
    title: 'Welcome to Inspectra Pro!',
    text: 'Easily track inspections and team tasks.',
    icon: Search,
    secondaryIcon: CheckCircle2,
    badge: 'Getting Started',
    detail: 'Complete daily checks, take photo proof, and keep construction sites safe with ease.'
  },
  {
    id: 'inspector',
    title: 'Inspector Dashboard',
    text: 'Add new inspections and complete reports.',
    icon: ClipboardList,
    secondaryIcon: ShieldCheck,
    badge: 'For Field Inspectors',
    detail: 'Use one tap to record new defects, check GPS locations, and sign off on completed repairs.'
  },
  {
    id: 'admin',
    title: 'Admin Tools',
    text: 'Manage inspectors and review results.',
    icon: Users,
    secondaryIcon: Sparkles,
    badge: 'For Team Admins',
    detail: 'View all 18 site zones, assign team members, and download ready-to-share summary reports.'
  },
  {
    id: 'get-started',
    title: 'Ready to Go?',
    text: 'Log in below to begin.',
    icon: LogIn,
    secondaryIcon: ArrowRight,
    badge: 'Quick Access',
    detail: 'Pick your role as an Inspector or Admin, enter your secret code, and get to work.'
  }
];

export default function OnboardingModal({ isOpen, onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') handleSkip();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handleBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const currentScreen = ONBOARDING_SCREENS[currentStep];
  const IconComponent = currentScreen.icon;
  const SecondaryIcon = currentScreen.secondaryIcon;
  const isLastStep = currentStep === ONBOARDING_SCREENS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    try {
      localStorage.setItem('inspectra_onboarding_completed', 'true');
    } catch (e) {}
    if (onClose) onClose();
  };

  const handleComplete = () => {
    try {
      localStorage.setItem('inspectra_onboarding_completed', 'true');
    } catch (e) {}
    if (onComplete) onComplete();
    if (onClose) onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={handleSkip}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: 'var(--color-bg, #FFFFFF)',
          color: 'var(--color-text, #212121)',
          borderRadius: 'var(--radius-lg, 20px)',
          border: '2px solid var(--color-border, #C8E6C9)',
          boxShadow: '0 20px 45px -10px rgba(67, 160, 71, 0.25), 0 10px 20px -5px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border, #C8E6C9)',
            backgroundColor: 'var(--color-primary-surface, #E8F5E9)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--color-primary-dark, #1B5E20)',
                backgroundColor: '#FFFFFF',
                padding: '3px 10px',
                borderRadius: 20,
                border: '1px solid var(--color-border, #C8E6C9)'
              }}
            >
              Step {currentStep + 1} of {ONBOARDING_SCREENS.length}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary-dark, #1B5E20)' }}>
              {currentScreen.badge}
            </span>
          </div>

          <button
            onClick={handleSkip}
            aria-label="Skip onboarding tour"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-primary-dark, #1B5E20)',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 10px',
              borderRadius: 8
            }}
          >
            <span>Skip</span>
            <X size={16} />
          </button>
        </div>

        {/* Center Illustration & Content */}
        <div style={{ padding: '32px 24px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Rounded Icon Illustration */}
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-surface, #E8F5E9)',
              border: '3px solid var(--color-primary, #43A047)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              marginBottom: 20,
              boxShadow: '0 8px 24px rgba(67, 160, 71, 0.2)'
            }}
          >
            <IconComponent size={42} color="var(--color-primary, #43A047)" />
            <div
              style={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                backgroundColor: 'var(--color-primary-dark, #1B5E20)',
                color: '#FFFFFF',
                borderRadius: '50%',
                width: 26,
                height: 26,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #FFFFFF'
              }}
            >
              <SecondaryIcon size={14} />
            </div>
          </div>

          <h2
            id="onboarding-title"
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: 'var(--color-primary-dark, #1B5E20)',
              marginBottom: 8,
              lineHeight: 1.3
            }}
          >
            {currentScreen.title}
          </h2>

          <p
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: 'var(--color-primary, #43A047)',
              marginBottom: 8,
              lineHeight: 1.4
            }}
          >
            {currentScreen.text}
          </p>

          <p
            style={{
              fontSize: 15,
              color: 'var(--color-text-muted, #555555)',
              maxWidth: 380,
              lineHeight: 1.5,
              margin: '0 0 24px'
            }}
          >
            {currentScreen.detail}
          </p>

          {/* Indicator Dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {ONBOARDING_SCREENS.map((screen, idx) => (
              <button
                key={screen.id}
                onClick={() => setCurrentStep(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                style={{
                  width: idx === currentStep ? 24 : 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: idx === currentStep ? 'var(--color-primary, #43A047)' : 'var(--color-border, #C8E6C9)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  padding: 0
                }}
              />
            ))}
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--color-border, #C8E6C9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            backgroundColor: 'var(--color-primary-surface, #E8F5E9)'
          }}
        >
          {currentStep > 0 ? (
            <button
              onClick={handleBack}
              className="btn btn-secondary"
              style={{
                minHeight: 44,
                padding: '10px 18px',
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--color-primary-dark, #1B5E20)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <ChevronLeft size={18} />
              <span>Back</span>
            </button>
          ) : (
            <button
              onClick={handleSkip}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted, #555555)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '10px 14px'
              }}
            >
              Skip Tour
            </button>
          )}

          <button
            onClick={handleNext}
            className="btn btn-primary"
            style={{
              minHeight: 46,
              padding: '10px 24px',
              fontSize: 16,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginLeft: 'auto'
            }}
          >
            <span>{isLastStep ? 'Log In Now' : 'Next'}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
