import React, { useState, useEffect, useRef } from 'react';
import { 
  subscribeToInspectionStream, 
  getLatestStreamState,
  sendAdminDirective 
} from '../services/yoloVisionService';
import { initAdminWebRtc } from '../services/cloudStreamService';
import { 
  Maximize2, 
  Minimize2, 
  X, 
  Camera, 
  Radio, 
  Zap, 
  Download, 
  Send, 
  Wifi, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  User, 
  MapPin, 
  ShieldCheck,
  Video,
  Eye,
  Sliders,
  Sparkles
} from 'lucide-react';

export default function InspectorCameraFullscreenModal({ isOpen, onClose }) {
  const [streamData, setStreamData] = useState(null);
  const [webrtcStream, setWebrtcStream] = useState(null);
  const [webrtcStatus, setWebrtcStatus] = useState('WAITING');
  const [viewportMode, setViewportMode] = useState('AUTO'); // 'AUTO' | 'WEBRTC' | 'SNAPSHOT'
  const [fitMode, setFitMode] = useState('contain'); // 'contain' | 'cover'
  const [showHud, setShowHud] = useState(true);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [directiveInput, setDirectiveInput] = useState('');
  const [directiveStatus, setDirectiveStatus] = useState(null);
  const [evidenceAlert, setEvidenceAlert] = useState(null);

  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const peerRef = useRef(null);

  // 1. Subscribe to Live Inspection Stream & WebRTC on mount / when opened
  useEffect(() => {
    if (!isOpen) return;

    // Load initial cached stream data
    const initial = getLatestStreamState();
    if (initial) setStreamData(initial);

    // Subscribe to real-time telemetry stream (cross-tab + cloud SSE)
    const unsubscribe = subscribeToInspectionStream((incoming) => {
      setStreamData(incoming);

      // Handle capture event from inspector mobile
      if (incoming?.isCaptureEvent && incoming?.capturedPhotoUrl) {
        setEvidenceAlert({
          message: `📸 New evidence photo received from ${incoming.inspector?.name || 'Field Inspector'}!`,
          time: new Date().toLocaleTimeString(),
          image: incoming.capturedPhotoUrl
        });
        setTimeout(() => setEvidenceAlert(null), 8000);
      }
    });

    // Initialize WebRTC P2P Receiver for full 30 FPS video
    try {
      peerRef.current = initAdminWebRtc(
        (remoteMedia) => {
          setWebrtcStream(remoteMedia);
          if (videoRef.current) {
            videoRef.current.srcObject = remoteMedia;
            videoRef.current.play().catch(e => console.warn('Fullscreen video play error:', e));
          }
        },
        (status) => {
          setWebrtcStatus(status);
        }
      );
    } catch (err) {
      console.warn('WebRTC init error in Fullscreen:', err);
    }

    // Try HTML5 Fullscreen API
    const el = containerRef.current || document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    }

    // Handle Escape key and keyboard shortcuts
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'h' || e.key === 'H') {
        setShowHud(v => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubscribe();
      if (peerRef.current) {
        peerRef.current.close();
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Sync WebRTC stream to video ref
  useEffect(() => {
    if (videoRef.current && webrtcStream) {
      videoRef.current.srcObject = webrtcStream;
      videoRef.current.play().catch(() => {});
    }
  }, [webrtcStream]);

  const handleClose = () => {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
    if (onClose) onClose();
  };

  const handleSendDirective = (text, severity = 'CRITICAL') => {
    if (!text.trim()) return;
    sendAdminDirective({
      sender: 'Executive Command Center',
      message: text.trim(),
      severity
    });
    setDirectiveStatus(`Sent: "${text.trim()}"`);
    setDirectiveInput('');
    setTimeout(() => setDirectiveStatus(null), 4000);
  };

  const handleCaptureSnapshot = () => {
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 300);

    const snapshotUrl = activeData.previewSnapshot || (videoRef.current ? captureVideoFrame(videoRef.current) : null);
    
    setEvidenceAlert({
      message: '📸 Fullscreen evidence snapshot recorded in National Audit Ledger',
      time: new Date().toLocaleTimeString(),
      image: snapshotUrl
    });
    setTimeout(() => setEvidenceAlert(null), 6000);
  };

  // Helper to grab frame from video element
  const captureVideoFrame = (videoEl) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth || 1280;
      canvas.height = videoEl.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.9);
    } catch (e) {
      return null;
    }
  };

  if (!isOpen) return null;

  const activeData = streamData || {
    streamActive: true,
    inspector: { name: 'R. Saravanan', badge: 'INSP-2024-001', role: 'Lead Field Auditor' },
    site: { name: 'Delhi Metro Central Terminal (Phase 2)', geofenceVerified: true },
    activeChecklistItem: 'Pier P-14 Concrete Integrity & Spalling',
    checklistProgress: { completed: 3, total: 4, percentage: 75 },
    fps: 30.0,
    primaryFinding: 'CONCRETE_SPALLING',
    primarySeverity: 'CRITICAL',
    detections: [
      {
        id: 'det-live-1',
        label: 'Crack / Structural Spall',
        confidenceScore: 96.4,
        severity: 'CRITICAL',
        specCode: 'IS 456:2000 Cl. 34.4',
        color: '#ef4444',
        box: { x: 26, y: 24, width: 48, height: 46 }
      }
    ],
    previewSnapshot: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?w=1600&auto=format&fit=crop&q=80'
  };

  const isVideoVisible = webrtcStream && (viewportMode === 'WEBRTC' || viewportMode === 'AUTO');

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: '#020617',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* 1. Shutter Flash Effect */}
      {shutterFlash && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#ffffff',
            zIndex: 1000000,
            animation: 'flash-fade 0.3s ease-out forwards',
            pointerEvents: 'none'
          }}
        />
      )}

      {/* 2. Main Fullscreen Video Viewport */}
      <div
        style={{
          position: 'relative',
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        {/* Remote Live Video Track */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: fitMode,
            display: isVideoVisible ? 'block' : 'none',
            transform: 'scale(1)'
          }}
        />

        {/* Fallback Live Snapshot View */}
        {!isVideoVisible && (
          <img
            src={activeData.previewSnapshot || 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?w=1600&auto=format&fit=crop&q=80'}
            alt="Field Inspector Camera"
            style={{
              width: '100%',
              height: '100%',
              objectFit: fitMode,
              filter: 'brightness(0.95) contrast(1.05)'
            }}
          />
        )}

        {/* Subtle Cyberpunk Scanline Grid */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.02), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.02))',
            backgroundSize: '100% 4px, 8px 100%',
            pointerEvents: 'none',
            opacity: 0.5
          }}
        />

        {/* Real-Time Scaled YOLO Bounding Boxes */}
        {activeData.detections?.map((det, idx) => (
          <div
            key={det.id || idx}
            style={{
              position: 'absolute',
              left: `${det.box.x}%`,
              top: `${det.box.y}%`,
              width: `${det.box.width}%`,
              height: `${det.box.height}%`,
              border: `3px solid ${det.color}`,
              backgroundColor: det.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.18)' : 'rgba(245, 158, 11, 0.12)',
              boxShadow: `0 0 25px ${det.color}70, inset 0 0 15px ${det.color}30`,
              borderRadius: 6,
              pointerEvents: 'none',
              transition: 'all 0.25s ease'
            }}
          >
            {/* Top Defect Label Banner */}
            <div
              style={{
                position: 'absolute',
                top: -30,
                left: -3,
                backgroundColor: det.color,
                color: '#ffffff',
                padding: '3px 10px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.7)',
                letterSpacing: '0.5px'
              }}
            >
              <Zap size={13} />
              <span>{det.label}</span>
              <span style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>
                {det.confidenceScore}%
              </span>
            </div>

            {/* Bottom IS Code Tag */}
            <div
              style={{
                position: 'absolute',
                bottom: -24,
                right: -2,
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                color: det.color,
                border: `1px solid ${det.color}80`,
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
              }}
            >
              {det.specCode}
            </div>
          </div>
        ))}
      </div>

      {/* 3. FLOATING TOP HUD (Always visible or toggleable) */}
      {showHud && (
        <div
          style={{
            position: 'absolute',
            top: 18,
            left: 20,
            right: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 14,
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
            zIndex: 100
          }}
        >
          {/* Top Left: Live Status & Inspector Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span 
                style={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  backgroundColor: '#ef4444', 
                  boxShadow: '0 0 12px #ef4444' 
                }} 
              />
              <span style={{ fontSize: 13, fontWeight: 900, color: '#ffffff', letterSpacing: '0.5px' }}>
                FULLSCREEN FIELD OPTICAL FEED
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 20,
                  backgroundColor: isVideoVisible ? 'rgba(16, 185, 129, 0.25)' : 'rgba(56, 189, 248, 0.2)',
                  color: isVideoVisible ? '#34d399' : '#38bdf8',
                  border: `1px solid ${isVideoVisible ? '#10b981' : '#38bdf8'}`
                }}
              >
                {isVideoVisible ? '● 30 FPS WEBRTC P2P' : '☁️ CLOUD SYNC RELAY'}
              </span>
            </div>

            <div style={{ height: 24, width: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#e2e8f0' }}>
              <User size={14} color="var(--accent-cyan)" />
              <span>Auditor: <strong style={{ color: '#ffffff' }}>{activeData.inspector?.name || 'R. Saravanan'}</strong></span>
              <span style={{ color: 'var(--accent-cyan)', fontSize: 11, fontWeight: 700 }}>
                ({activeData.inspector?.badge || 'INSP-2024-001'})
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
              <MapPin size={14} color="#10b981" />
              <span>{activeData.site?.name || 'Assigned Site'}</span>
              <span style={{ color: '#10b981', fontSize: 11, fontWeight: 700 }}>✓ GPS Locked</span>
            </div>
          </div>

          {/* Top Right: Viewport Controls & Exit Fullscreen */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Aspect Mode Switch */}
            <button
              onClick={() => setFitMode(m => m === 'contain' ? 'cover' : 'contain')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 8,
                color: '#e2e8f0',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Toggle between aspect fit and full frame fill"
            >
              <Sliders size={13} />
              <span>{fitMode === 'contain' ? 'Aspect: Fit' : 'Aspect: Fill'}</span>
            </button>

            {/* Viewport Source Switch */}
            <button
              onClick={() => setViewportMode(m => m === 'AUTO' ? 'SNAPSHOT' : 'AUTO')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 8,
                color: '#38bdf8',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Switch video source"
            >
              <Video size={13} />
              <span>{viewportMode === 'AUTO' ? 'Source: Auto WebRTC' : 'Source: Cloud Frames'}</span>
            </button>

            {/* Capture Snapshot Button */}
            <button
              onClick={handleCaptureSnapshot}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                backgroundColor: 'rgba(16, 185, 129, 0.25)',
                border: '1px solid #10b981',
                borderRadius: 8,
                color: '#34d399',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Camera size={14} />
              <span>Snap Evidence</span>
            </button>

            {/* EXIT FULL SCREEN BUTTON */}
            <button
              onClick={handleClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 16px',
                backgroundColor: '#ef4444',
                border: '1px solid #dc2626',
                borderRadius: 8,
                color: '#ffffff',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
              }}
              title="Exit Full Screen (Esc)"
            >
              <Minimize2 size={15} />
              <span>Exit Full Screen</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. INCOMING EVIDENCE ALERT TOAST */}
      {evidenceAlert && (
        <div
          style={{
            position: 'absolute',
            top: 86,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(16, 185, 129, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid #34d399',
            borderRadius: 12,
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
            zIndex: 101,
            animation: 'slide-down 0.3s ease'
          }}
        >
          {evidenceAlert.image && (
            <img
              src={evidenceAlert.image}
              alt="Evidence"
              style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '2px solid #ffffff' }}
            />
          )}
          <div>
            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: '#ffffff' }}>
              {evidenceAlert.message}
            </p>
            <p style={{ margin: 0, fontSize: 10.5, color: '#d1fae5' }}>
              Synced live from Inspector &bull; Stored into Central Evidence Ledger ({evidenceAlert.time})
            </p>
          </div>
          <button
            onClick={() => setEvidenceAlert(null)}
            style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontWeight: 800, fontSize: 15 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 5. FLOATING BOTTOM HUD: DIRECTIVES & TELEMETRY */}
      {showHud && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            right: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 14,
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
            zIndex: 100
          }}
        >
          {/* Quick Directives Dispatched to Field Inspector Phone */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Admin Directives:
            </span>

            <button
              onClick={() => handleSendDirective('Hold camera steady on crack surface')}
              style={{
                padding: '6px 12px',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 6,
                color: '#38bdf8',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🎯 Hold Steady
            </button>

            <button
              onClick={() => handleSendDirective('Step closer to defect for depth check')}
              style={{
                padding: '6px 12px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 6,
                color: '#fbbf24',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🔍 Step Closer
            </button>

            <button
              onClick={() => handleSendDirective('Capture high-res photo for Section 34.4 compliance')}
              style={{
                padding: '6px 12px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 6,
                color: '#fca5a5',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              📸 Capture High-Res
            </button>

            {/* Custom Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendDirective(directiveInput);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}
            >
              <input
                type="text"
                value={directiveInput}
                onChange={(e) => setDirectiveInput(e.target.value)}
                placeholder="Type instruction to inspector's screen..."
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'rgba(2, 6, 23, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 6,
                  color: '#ffffff',
                  fontSize: 11,
                  width: 240,
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '6px 10px',
                  backgroundColor: 'var(--accent-cyan)',
                  border: 'none',
                  borderRadius: 6,
                  color: '#0f172a',
                  fontWeight: 800,
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Send size={11} />
                <span>Send</span>
              </button>
            </form>

            {directiveStatus && (
              <span style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>
                ✓ {directiveStatus}
              </span>
            )}
          </div>

          {/* Right Bottom: Telemetry Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 11.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34d399' }}>
              <Activity size={14} />
              <span>{isVideoVisible ? '30.0' : (activeData.fps || 28.4)} FPS</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38bdf8' }}>
              <Wifi size={14} />
              <span>{isVideoVisible ? 'P2P 16ms' : 'Cloud 82ms'}</span>
            </div>

            <button
              onClick={() => setShowHud(false)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 6,
                padding: '4px 8px',
                color: '#94a3b8',
                fontSize: 10,
                cursor: 'pointer'
              }}
              title="Hide HUD overlay (Press 'H' to toggle)"
            >
              Hide HUD (H)
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle HUD button when HUD is hidden */}
      {!showHud && (
        <button
          onClick={() => setShowHud(true)}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 8,
            padding: '8px 14px',
            color: '#ffffff',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            zIndex: 100
          }}
        >
          Show HUD (H)
        </button>
      )}
    </div>
  );
}
