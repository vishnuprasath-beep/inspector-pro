import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  Monitor, 
  Square, 
  Radio, 
  Clock, 
  User, 
  ShieldCheck, 
  AlertCircle,
  Eye,
  RefreshCw,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Check,
  X
} from 'lucide-react';
import { 
  captureCameraStream, 
  captureScreenStream, 
  toggleLocalMicrophone,
  stopLocalStream, 
  initializePeer,
  listenForIncomingCall 
} from '../services/liveShareService';
import api from '../services/api';

const InspectorLiveShareCard = React.forwardRef(function InspectorLiveShareCard(
  { inspector, onSessionChange, hasPendingRequest, incomingVoiceRequest, onVoiceSessionChange }, 
  ref
) {
  const [sharingStatus, setSharingStatus] = useState('NOT SHARING'); // 'NOT SHARING' | 'CAMERA SHARING' | 'SCREEN SHARING'
  const [activeSession, setActiveSession] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [starting, setStarting] = useState(false);
  const [viewerInfo, setViewerInfo] = useState('Admin (Remote Support)');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [voiceSession, setVoiceSession] = useState(null); // { id, status: 'REQUESTED' | 'CONNECTED' }
  const videoRef = useRef(null);

  // Expose imperative triggers to parent components
  React.useImperativeHandle(ref, () => ({
    startCamera: () => handleStartCamera(),
    startScreen: () => handleStartScreen(),
    stopSharing: () => handleStopSharing(),
    isSharing: sharingStatus !== 'NOT SHARING',
    status: sharingStatus
  }));

  // Attach local media stream to video preview whenever stream or status changes
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
      videoRef.current.play().catch(err => {
        console.warn('[Local Video Preview AutoPlay Info]:', err.message);
      });
    }
  }, [localStream, sharingStatus]);

  // Duration timer when active
  useEffect(() => {
    let timer = null;
    if (sharingStatus !== 'NOT SHARING') {
      timer = setInterval(() => {
        setDurationSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setDurationSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [sharingStatus]);

  // Sync external incoming voice request
  useEffect(() => {
    if (incomingVoiceRequest && incomingVoiceRequest.status === 'REQUESTED') {
      setVoiceSession(incomingVoiceRequest);
    } else if (incomingVoiceRequest && incomingVoiceRequest.status === 'CONNECTED') {
      setVoiceSession(incomingVoiceRequest);
    } else if (!incomingVoiceRequest && voiceSession?.status === 'REQUESTED') {
      setVoiceSession(null);
    }
  }, [incomingVoiceRequest]);

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start Camera Sharing with both camera and microphone enabled
  const handleStartCamera = async () => {
    setErrorMsg(null);
    setStarting(true);
    try {
      const stream = await captureCameraStream({ facingMode: 'environment', audio: true });
      setLocalStream(stream);

      const peerId = `peer-insp-${inspector?.id || 'vp01'}-${Date.now().toString().slice(-4)}`;
      const peer = await initializePeer(peerId);

      // Register session with backend
      const res = await api.startLiveShareSession('CAMERA', peerId);
      const session = res.data;
      setActiveSession(session);
      setSharingStatus('CAMERA SHARING');

      // Listen for WebRTC call from Admin
      listenForIncomingCall(peer, stream, () => {
        // Connected to Admin viewer
      }, () => {
        // Disconnected
      });

      if (onSessionChange) onSessionChange(session);
    } catch (err) {
      console.error('Camera share error:', err);
      setErrorMsg(err.message || 'Camera permission denied or camera unavailable.');
      stopLocalStream();
      setLocalStream(null);
      setSharingStatus('NOT SHARING');
    } finally {
      setStarting(false);
    }
  };

  // Start Screen Sharing
  const handleStartScreen = async () => {
    setErrorMsg(null);
    setStarting(true);
    try {
      const stream = await captureScreenStream();
      setLocalStream(stream);

      const peerId = `peer-screen-${inspector?.id || 'vp01'}-${Date.now().toString().slice(-4)}`;
      const peer = await initializePeer(peerId);

      // Register session with backend
      const res = await api.startLiveShareSession('SCREEN', peerId);
      const session = res.data;
      setActiveSession(session);
      setSharingStatus('SCREEN SHARING');

      // Listen for native stop
      if (stream.getVideoTracks()[0]) {
        stream.getVideoTracks()[0].onended = () => {
          handleStopSharing();
        };
      }

      listenForIncomingCall(peer, stream);

      if (onSessionChange) onSessionChange(session);
    } catch (err) {
      console.error('Screen share error:', err);
      setErrorMsg(err.message || 'Screen sharing is not supported on this device/browser.');
      stopLocalStream();
      setLocalStream(null);
      setSharingStatus('NOT SHARING');
    } finally {
      setStarting(false);
    }
  };

  // Accept incoming voice chat
  const handleAcceptVoice = async () => {
    if (!voiceSession) return;
    try {
      await api.respondVoiceChat(voiceSession.id, 'ACCEPTED', activeSession?.id);
      toggleLocalMicrophone(true);
      setIsMicMuted(false);
      setVoiceSession(prev => ({ ...prev, status: 'CONNECTED' }));
      if (onVoiceSessionChange) onVoiceSessionChange({ ...voiceSession, status: 'CONNECTED' });
    } catch (e) {
      console.error('Failed to accept voice chat:', e);
    }
  };

  // Decline incoming voice chat
  const handleDeclineVoice = async () => {
    if (!voiceSession) return;
    try {
      await api.respondVoiceChat(voiceSession.id, 'DECLINED', activeSession?.id);
      setVoiceSession(null);
      if (onVoiceSessionChange) onVoiceSessionChange(null);
    } catch (e) {
      console.error('Failed to decline voice chat:', e);
    }
  };

  // Toggle Inspector Microphone
  const handleToggleMic = () => {
    const newMuteState = !isMicMuted;
    toggleLocalMicrophone(!newMuteState);
    setIsMicMuted(newMuteState);
  };

  // Stop Sharing
  const handleStopSharing = async () => {
    try {
      if (activeSession) {
        await api.stopLiveShareSession(activeSession.id, 'INSPECTOR_MANUAL_STOP');
      }
      if (voiceSession) {
        await api.endVoiceChat(voiceSession.id, activeSession?.id);
      }
    } catch (e) {}

    stopLocalStream();
    if (localStream) {
      localStream.getTracks().forEach(t => {
        try { t.stop(); } catch (e) {}
      });
      setLocalStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setSharingStatus('NOT SHARING');
    setActiveSession(null);
    setVoiceSession(null);
    setIsMicMuted(false);
    if (onSessionChange) onSessionChange(null);
    if (onVoiceSessionChange) onVoiceSessionChange(null);
  };

  const isLive = sharingStatus !== 'NOT SHARING';
  const displayStatus = (sharingStatus === 'NOT SHARING' && hasPendingRequest)
    ? 'REQUEST RECEIVED'
    : sharingStatus;

  return (
    <div 
      style={{
        backgroundColor: 'var(--card-bg, #FFFFFF)',
        border: isLive ? '2px solid #43A047' : '1px solid var(--color-border, #C8E6C9)',
        borderRadius: 'var(--radius-lg, 18px)',
        padding: '20px 22px',
        boxShadow: isLive ? '0 8px 25px rgba(67, 160, 71, 0.2)' : '0 4px 14px rgba(0, 0, 0, 0.04)',
        boxSizing: 'border-box',
        marginBottom: 20,
        position: 'relative'
      }}
    >
      {/* Top Card Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div 
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: isLive ? 'rgba(67, 160, 71, 0.15)' : 'var(--color-primary-surface, #E8F5E9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Radio size={20} color={isLive ? '#43A047' : 'var(--color-primary-dark, #1B5E20)'} />
          </div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-heading, #0F172A)', margin: 0 }}>
              Live Share
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-secondary, #64748B)' }}>
              Real-time WebRTC remote video & voice guidance with Admin
            </span>
          </div>
        </div>

        {/* Status Pill Badge */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.04em',
            backgroundColor: isLive 
              ? 'rgba(67, 160, 71, 0.15)' 
              : hasPendingRequest 
                ? 'rgba(245, 158, 11, 0.15)' 
                : 'rgba(100, 116, 139, 0.1)',
            color: isLive 
              ? '#1B5E20' 
              : hasPendingRequest 
                ? '#B45309' 
                : '#475569',
            border: `1px solid ${isLive ? '#43A047' : hasPendingRequest ? '#F59E0B' : '#CBD5E1'}`
          }}
        >
          <span 
            style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: isLive ? '#43A047' : hasPendingRequest ? '#F59E0B' : '#94A3B8',
              animation: (isLive || hasPendingRequest) ? 'pulse 1.5s infinite' : 'none'
            }} 
          />
          <span>{displayStatus}</span>
        </div>
      </div>

      {/* Error Alert Box */}
      {errorMsg && (
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 10,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #FCA5A5',
            color: '#B91C1C',
            fontSize: 13,
            marginBottom: 16
          }}
        >
          <AlertCircle size={16} color="#DC2626" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Incoming Voice Chat Request Banner */}
      {isLive && voiceSession && voiceSession.status === 'REQUESTED' && (
        <div 
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '2px solid #38BDF8',
            borderRadius: 14,
            padding: '14px 18px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            boxShadow: '0 8px 24px rgba(56, 189, 248, 0.25)',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mic size={22} color="#38BDF8" />
            </div>
            <div>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#38BDF8', display: 'block' }}>
                🎤 ADMIN WANTS TO START VOICE CHAT
              </span>
              <span style={{ fontSize: 12, color: '#CBD5E1' }}>
                "Admin wants to talk with you about this inspection."
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={handleDeclineVoice}
              className="btn btn-secondary btn-sm"
              style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#F87171' }}
            >
              Decline
            </button>
            <button
              onClick={handleAcceptVoice}
              className="btn btn-primary btn-sm"
              style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, backgroundColor: '#43A047', borderColor: '#43A047' }}
            >
              Accept
            </button>
          </div>
        </div>
      )}

      {/* Active Video Preview & Live Metrics */}
      {isLive ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Local Feed Monitor Window */}
          <div 
            style={{
              position: 'relative',
              width: '100%',
              height: 240,
              backgroundColor: '#0F172A',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
            }}
          >
            <video 
              ref={videoRef}
              autoPlay 
              muted 
              playsInline 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />

            {/* Overlaid Live Badges */}
            <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span 
                style={{ 
                  background: '#DC2626', 
                  color: '#fff', 
                  fontSize: 11, 
                  fontWeight: 900, 
                  padding: '4px 10px', 
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                ● LIVE
              </span>
              <span 
                style={{ 
                  background: 'rgba(15, 23, 42, 0.8)', 
                  color: '#38BDF8', 
                  fontSize: 12, 
                  fontWeight: 700, 
                  padding: '4px 8px', 
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Clock size={13} />
                {formatDuration(durationSeconds)}
              </span>

              {voiceSession && voiceSession.status === 'CONNECTED' && (
                <span 
                  style={{ 
                    background: 'rgba(16, 185, 129, 0.85)', 
                    color: '#ffffff', 
                    fontSize: 11, 
                    fontWeight: 800, 
                    padding: '4px 8px', 
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Mic size={12} />
                  <span>● Voice Connected</span>
                </span>
              )}
            </div>

            <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}>
              <div 
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(6px)',
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#F8FAFC',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Eye size={14} color="#43A047" />
                  <span>Your {sharingStatus === 'SCREEN SHARING' ? 'screen' : 'camera'} is being shared with Admin</span>
                </span>

                {voiceSession && voiceSession.status === 'CONNECTED' ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34D399', fontWeight: 700 }}>
                    <Mic size={13} />
                    <span>🎤 ADMIN CONNECTED</span>
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>Viewing: {viewerInfo}</span>
                )}
              </div>
            </div>
          </div>

          {/* Controls Bar: Voice Mute & Stop Sharing */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {voiceSession && voiceSession.status === 'CONNECTED' && (
              <button
                type="button"
                onClick={handleToggleMic}
                className="btn btn-secondary"
                style={{
                  flex: 1,
                  minHeight: 48,
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: isMicMuted ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                  borderColor: isMicMuted ? '#EF4444' : '#38BDF8',
                  color: isMicMuted ? '#EF4444' : '#0284C7'
                }}
              >
                {isMicMuted ? <MicOff size={18} /> : <Mic size={18} />}
                <span>{isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}</span>
              </button>
            )}

            <button
              onClick={handleStopSharing}
              className="btn btn-danger"
              style={{
                flex: 1,
                minHeight: 48,
                backgroundColor: '#DC2626',
                borderColor: '#DC2626',
                color: '#ffffff',
                fontSize: 15,
                fontWeight: 800,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)'
              }}
            >
              <Square size={16} fill="currentColor" />
              <span>Stop Sharing</span>
            </button>
          </div>
        </div>
      ) : (
        /* Inactive State: Two Big Voluntary Sharing Buttons */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <button
            onClick={handleStartCamera}
            disabled={starting}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '14px 16px',
              minHeight: 52,
              borderRadius: 12,
              backgroundColor: '#43A047',
              border: 'none',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: 15,
              cursor: starting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(67, 160, 71, 0.35)',
              transition: 'transform 0.1s ease, box-shadow 0.2s ease'
            }}
          >
            <Video size={20} />
            <span>{starting ? 'Connecting...' : 'Share My Camera'}</span>
          </button>

          <button
            onClick={handleStartScreen}
            disabled={starting}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '14px 16px',
              minHeight: 52,
              borderRadius: 12,
              backgroundColor: '#0284C7',
              border: 'none',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: 15,
              cursor: starting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
              transition: 'transform 0.1s ease, box-shadow 0.2s ease'
            }}
          >
            <Monitor size={20} />
            <span>{starting ? 'Connecting...' : 'Share My Screen'}</span>
          </button>
        </div>
      )}
    </div>
  );
});

export default InspectorLiveShareCard;
