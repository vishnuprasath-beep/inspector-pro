import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Check, ShieldCheck } from 'lucide-react';

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Listen for beforeinstallprompt event
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setInstalled(true);
      setShowBanner(false);
      console.log('[PWA] Inspectra Pro successfully installed as an app.');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    window.__promptInstallPwa = handleInstallClick;

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.__promptInstallPwa = null;
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If iOS or unsupported, display guidance
      alert('To install Inspectra Pro on your mobile device:\n\n1. In Safari / Chrome, tap the Share or Menu icon (⋮ / ⎋).\n2. Tap "Add to Home Screen" (📲).\n3. Inspectra Pro will launch in full screen with hardware camera and GPS access!');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('[PWA] User accepted installation prompt');
      setInstalled(true);
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  if (!showBanner && !installed) {
    // Also provide a persistent small trigger in mobile viewport
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: 480,
        zIndex: 9999,
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.96) 100%)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
        borderRadius: 14,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        animation: 'slideUp 0.3s ease-out'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Smartphone size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>
            Install Inspectra Pro App
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>
            Fast native performance & background GPS tracking
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          onClick={handleInstallClick}
          className="btn btn-primary btn-sm"
          style={{
            padding: '6px 14px',
            fontSize: 11.5,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 5
          }}
        >
          <Download size={13} />
          <span>Install</span>
        </button>
        <button
          onClick={() => setShowBanner(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center'
          }}
          title="Dismiss banner"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
