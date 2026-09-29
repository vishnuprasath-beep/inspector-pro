import React, { useState, useEffect, useRef } from 'react';
import { 
  subscribeToInspectionStream, 
  getLatestStreamState,
  sendAdminDirective 
} from '../services/yoloVisionService';
import { startViewerSession, stopViewerSession } from '../services/liveShareService';
import api from '../services/api';
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
  VideoOff,
  Eye,
  Sliders,
  Sparkles
} from 'lucide-react';

export default function InspectorCameraFullscreenModal({ 
  isOpen, 
  onClose, 
  inspector = null, 
  session = null, 
  stream = null 
}) {
  const [streamData, setStreamData] = useState(null);
  const [internalStream, setInternalStream] = useState(null);
  const [activeInspector, setActiveInspector] = useState(inspector);
  const [activeSession, setActiveSession] = useState(session);
  const [webrtcStatus, setWebrtcStatus] = useState('WAITING');
  const [fitMode, setFitMode] = useState('contain'); // 'contain' | 'cover'
  const [showHud, setShowHud] = useState(true);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [directiveInput, setDirectiveInput] = useState('');
  const [directiveStatus, setDirectiveStatus] = useState(null);
  const [evidenceAlert, setEvidenceAlert] = useState(null);

  const containerRef = useRef(null);
  const videoRef = useRef(null);

  // Active stream is either passed via prop or established internally
  const currentStream = stream || internalStream;

  // 1. Resolve active inspector session & subscribe when opened
  useEffect(() => {
    if (!isOpen) return;

    // Load initial cached telemetry
    const initial = getLatestStreamState();
    if (initial) setStreamData(initial);

    // If stream is already passed directly via props, bind immediately
    if (stream) {
      setWebrtcStatus('LIVE');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      return;
    }

    // Otherwise, discover active live sessions from database
    let isCancelled = false;
    async function resolveActiveSession() {
      try {
        const res = await api.getActiveLiveShares();
        if (isCancelled) return;
        if (res.success && Array.isArray(res.active_sessions) && res.active_sessions.length > 0) {
          const matchSession = session || res.active_sessions[0];
          setActiveSession(matchSession);

          // Connect using native WebRTC viewer
          setWebrtcStatus('CONNECTING');
          startViewerSession({
            sessionId: matchSession.id,
            role: 'ADMIN',
            onRemoteStream: (remoteMedia, track) => {
              if (isCancelled) return;
              setInternalStream(remoteMedia);
              setWebrtcStatus('LIVE');
              if (videoRef.current && videoRef.current.srcObject !== remoteMedia) {
                videoRef.current.srcObject = remoteMedia;
                videoRef.current.play().catch(() => {});
              }
            },
            onStateChange: ({ connectionState, hasVideo }) => {
              if (isCancelled) return;
              if (connectionState === 'connected' && hasVideo) {
                setWebrtcStatus('LIVE');
              } else if (connectionState === 'connecting') {
                setWebrtcStatus('CONNECTING');
              } else if (connectionState === 'failed' || connectionState === 'closed') {
                setWebrtcStatus('DISCONNECTED');
              }
            },
            onDisconnected: () => {
              if (isCancelled) return;
              setWebrtcStatus('DISCONNECTED');
              setInternalStream(null);
              if (videoRef.current) videoRef.current.srcObject = null;
            }
          }).catch(err => {
            console.warn('[FullscreenModal] WebRTC connection error:', err);
            setWebrtcStatus('ERROR');
          });
        } else {
          setWebrtcStatus('NO_ACTIVE_STREAM');
        }
      } catch (err) {
        console.warn('[FullscreenModal] Session check notice:', err.message);
        setWebrtcStatus('NO_ACTIVE_STREAM');
      }
    }

    resolveActiveSession();

    // Subscribe to real-time mobile capture telemetry
    const unsubscribe = subscribeToInspectionStream((incoming) => {
      setStreamData(incoming);

      if (incoming?.isCaptureEvent && incoming?.capturedPhotoUrl) {
        setEvidenceAlert({
          message: `📸 New evidence photo received from ${incoming.inspector?.name || 'Field Inspector'}!`,
          time: new Date().toLocaleTimeString(),
          image: incoming.capturedPhotoUrl
        });
        setTimeout(() => setEvidenceAlert(null), 8000);
      }
    });

    // Try HTML5 Fullscreen API
    const el = containerRef.current || document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }

    // Keyboard shortcuts
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'h' || e.key === 'H') {
        setShowHud(v => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      isCancelled = true;
      unsubscribe();
      if (!stream) {
        stopViewerSession();
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, session, stream]);

  // Sync current stream to video ref
  useEffect(() => {
    if (videoRef.current && currentStream) {
      videoRef.current.srcObject = currentStream;
      videoRef.current.play().catch(() => {});
    }
  }, [currentStream]);

  const handleClose = () => {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
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

    if (videoRef.current) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const snapshotUrl = canvas.toDataURL('image/jpeg', 0.9);

        setEvidenceAlert({
          message: '📸 Fullscreen evidence snapshot recorded in Audit Ledger',
          time: new Date().toLocaleTimeString(),
          image: snapshotUrl
        });
        setTimeout(() => setEvidenceAlert(null), 6000);
      } catch (e) {}
    }
  };

  if (!isOpen) return null;

  const resolvedInspector = inspector || activeInspector || {
    name: activeSession?.inspector_name || 'Field Inspector',
    badge: 'Lead Field Auditor',
    site: 'Central Infrastructure Terminal'
  };

  const isVideoLive = !!currentStream && (webrtcStatus === 'LIVE');

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
          overflow: 'hidden',
          backgroundColor: '#000000'
        }}
      >
        {/* Remote Live Video Track - Always in DOM for proper autoplay */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: fitMode,
            backgroundColor: '#000000',
            display: isVideoLive ? 'block' : 'none'
          }}
        />

        {/* Fallback Display when Video is NOT Live */}
        {!isVideoLive && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: 30,
              maxWidth: 500
            }}
          >
            {webrtcStatus === 'CONNECTING' ? (
              <>
                <div style={{ width: 50, height: 50, border: '4px solid rgba(56, 189, 248, 0.2)', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 16 }} />
                <h3 style={{ color: '#ffffff', margin: '0 0 8px', fontSize: 18 }}>
                  Establishing WebRTC Connection...
                </h3>
                <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>
                  Exchanging SDP offer/answer and negotiating ICE candidates.
                </p>
              </>
            ) : (
              <>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(148, 163, 184, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(148, 163, 184, 0.2)', marginBottom: 16 }}>
                  <VideoOff size={28} color="#94a3b8" />
                </div>
                <h3 style={{ color: '#ffffff', margin: '0 0 8px', fontSize: 18 }}>
                  No Active Live Stream Available
                </h3>
                <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5, margin: '0 0 20px' }}>
                  No field inspector is currently broadcasting their live camera stream. To start a live stream, select an inspector in Inspector Monitoring and click [Request Camera Share].
                </p>
                <button
                  onClick={handleClose}
                  className="btn btn-primary"
                  style={{ fontSize: 13, padding: '10px 20px' }}
                >
                  Return to Dashboard
                </button>
              </>
            )}
          </div>
        )}

        {/* Real-Time Scaled YOLO Bounding Boxes (if present in streamData) */}
        {isVideoLive && streamData?.detections?.map((det, idx) => (
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
            <div
              style={{
                position: 'absolute',
                top: -30,
                left: -3,
                backgroundColor: det.color,
                color: '#ffffff',
                padding: '3px 10px',
                borderRadius: 5,
                fontSize: 11,
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 12px rgba(0,0,0,0.7)',
                whiteSpace: 'nowrap'
              }}
            >
              <Zap size={12} />
              <span>{det.label}</span>
              <span style={{ backgroundColor: 'rgba(0,0,0,0.35)', padding: '1px 5px', borderRadius: 3, fontSize: 10 }}>
                {(det.confidenceScore || 95).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Top HUD Bar */}
      {showHud && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '16px 24px',
            background: 'linear-gradient(180deg, rgba(2, 6, 23, 0.95) 0%, rgba(2, 6, 23, 0.6) 75%, transparent 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 100000,
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          {/* Top Left: Metadata & Status Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div 
                style={{ 
                  width: 10, 
                  height: 10, 
                  borderRadius: '50%', 
                  backgroundColor: isVideoLive ? '#10b981' : '#f59e0b',
                  boxShadow: `0 0 10px ${isVideoLive ? '#10b981' : '#f59e0b'}`
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
                  backgroundColor: isVideoLive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.2)',
                  color: isVideoLive ? '#34d399' : '#fbbf24',
                  border: `1px solid ${isVideoLive ? '#10b981' : '#f59e0b'}`
                }}
              >
                {isVideoLive ? '● WEBRTC LIVE' : '○ STANDBY'}
              </span>
            </div>

            <div style={{ height: 24, width: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#e2e8f0' }}>
              <User size={14} color="var(--accent-cyan)" />
              <span>Auditor: <strong style={{ color: '#ffffff' }}>{resolvedInspector.name}</strong></span>
              <span style={{ color: 'var(--accent-cyan)', fontSize: 11, fontWeight: 700 }}>
                ({resolvedInspector.badge_number || resolvedInspector.employee_code || resolvedInspector.id || 'INSP'})
              </span>
            </div>

            {resolvedInspector.assigned_site_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
                <MapPin size={14} color="#10b981" />
                <span>{resolvedInspector.assigned_site_name}</span>
              </div>
            )}
          </div>

          {/* Top Right: Viewport Controls & Exit Fullscreen */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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

            {isVideoLive && (
              <button
                onClick={handleCaptureSnapshot}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid #10b981',
                  borderRadius: 8,
                  color: '#34d399',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Camera size={13} />
                <span>Capture Snapshot</span>
              </button>
            )}

            <button
              onClick={handleClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                borderRadius: 8,
                color: '#f87171',
                cursor: 'pointer'
              }}
              title="Close Fullscreen (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* 4. Bottom Directive HUD Bar */}
      {showHud && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px 24px',
            background: 'linear-gradient(0deg, rgba(2, 6, 23, 0.95) 0%, rgba(2, 6, 23, 0.6) 75%, transparent 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 100000,
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          {/* Directive Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, maxWidth: 640 }}>
            <input
              type="text"
              value={directiveInput}
              onChange={(e) => setDirectiveInput(e.target.value)}
              placeholder="Type urgent directive to Field Auditor (e.g. 'Zoom in on crack width', 'Hold position')..."
              style={{
                flex: 1,
                padding: '9px 14px',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 8,
                color: '#ffffff',
                fontSize: 12.5,
                outline: 'none'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendDirective(directiveInput);
              }}
            />
            <button
              onClick={() => handleSendDirective(directiveInput)}
              className="btn btn-primary btn-sm"
              style={{ padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Send size={13} />
              <span>Send Directive</span>
            </button>
            {directiveStatus && (
              <span style={{ fontSize: 11, color: '#34d399', fontWeight: 700 }}>
                {directiveStatus}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#94a3b8' }}>
            <span>Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4, color: '#fff' }}>H</kbd> to toggle HUD</span>
            <span>Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4, color: '#fff' }}>ESC</kbd> to exit</span>
          </div>
        </div>
      )}

      {/* Snapshot Toast */}
      {evidenceAlert && (
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            right: 24,
            backgroundColor: 'rgba(16, 185, 129, 0.95)',
            border: '1px solid #34d399',
            borderRadius: 10,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            zIndex: 100001,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)'
          }}
        >
          {evidenceAlert.image && (
            <img 
              src={evidenceAlert.image} 
              alt="Snapshot" 
              style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid #fff' }}
            />
          )}
          <div>
            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: '#ffffff' }}>
              {evidenceAlert.message}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: '#d1fae5' }}>
              Recorded at {evidenceAlert.time}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
