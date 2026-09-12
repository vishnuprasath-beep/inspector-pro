import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Radio, 
  Clock, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  User, 
  MapPin, 
  Square,
  Maximize2,
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff
} from 'lucide-react';
import { connectToInspectorStream, disconnectView, toggleAdminMicrophone } from '../services/liveShareService';
import api from '../services/api';

export default function LiveVideoModal({ session, inspector, onClose }) {
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING'); // 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'
  const [duration, setDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [voiceState, setVoiceState] = useState('IDLE'); // 'IDLE' | 'REQUESTING' | 'CONNECTED'
  const [isAdminMuted, setIsAdminMuted] = useState(false);
  const [voiceSession, setVoiceSession] = useState(null);
  const [voiceFeedback, setVoiceFeedback] = useState(null);
  const videoRef = useRef(null);

  // Duration counter while stream is connected
  useEffect(() => {
    let timer = null;
    if (connectionStatus === 'CONNECTED') {
      timer = setInterval(() => setDuration(prev => prev + 1), 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [connectionStatus]);

  // Establish WebRTC connection to Inspector
  useEffect(() => {
    if (!session || !session.peer_id) {
      setErrorMsg('No active WebRTC peer ID found for this session.');
      setConnectionStatus('DISCONNECTED');
      return;
    }

    const adminPeerId = `peer-admin-${Date.now().toString().slice(-4)}`;

    async function initCall() {
      try {
        setConnectionStatus('CONNECTING');
        await connectToInspectorStream(
          adminPeerId,
          session.peer_id,
          (remoteStream) => {
            if (videoRef.current) {
              videoRef.current.srcObject = remoteStream;
              videoRef.current.play().catch(e => console.warn('Remote video playback note:', e));
              setConnectionStatus('CONNECTED');
            }
          },
          (disconnectReason) => {
            setConnectionStatus('DISCONNECTED');
            setErrorMsg(disconnectReason || 'Inspector camera connection lost.');
          }
        );
      } catch (err) {
        console.error('[WebRTC Viewer Connect Error]:', err);
        setConnectionStatus('DISCONNECTED');
        setErrorMsg(err.message || 'Inspector camera connection could not be established.');
      }
    }

    initCall();

    return () => {
      disconnectView();
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [session]);

  // Poll voice session status while in REQUESTING state
  useEffect(() => {
    let interval = null;
    if (voiceState === 'REQUESTING' && session?.id) {
      interval = setInterval(async () => {
        try {
          const res = await api.getVoiceSession(session.id);
          if (res.success && res.data) {
            if (res.data.status === 'CONNECTED') {
              toggleAdminMicrophone(true);
              setIsAdminMuted(false);
              setVoiceState('CONNECTED');
              setVoiceSession(res.data);
            } else if (res.data.status === 'DECLINED') {
              setVoiceState('IDLE');
              setVoiceFeedback('Inspector declined voice chat.');
              setVoiceSession(null);
            }
          }
        } catch (e) {}
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [voiceState, session]);

  // Start Voice Chat
  const handleStartVoice = async () => {
    setVoiceFeedback(null);
    setVoiceState('REQUESTING');
    try {
      const res = await api.requestVoiceChat(session.id);
      if (res.success && res.data) {
        setVoiceSession(res.data);
      } else {
        setVoiceState('IDLE');
        setVoiceFeedback(res.error || 'Could not start voice chat.');
      }
    } catch (err) {
      setVoiceState('IDLE');
      setVoiceFeedback(err.message || 'Failed to dispatch voice chat request.');
    }
  };

  // End Voice Chat
  const handleEndVoice = async () => {
    try {
      if (voiceSession) {
        await api.endVoiceChat(voiceSession.id, session.id);
      }
    } catch (e) {}
    toggleAdminMicrophone(false);
    setVoiceState('IDLE');
    setVoiceSession(null);
  };

  // Toggle Admin Microphone
  const handleToggleAdminMic = () => {
    const newMuteState = !isAdminMuted;
    toggleAdminMicrophone(!newMuteState);
    setIsAdminMuted(newMuteState);
  };

  const handleCloseModal = () => {
    if (voiceState === 'CONNECTED') {
      handleEndVoice();
    }
    disconnectView();
    onClose();
  };

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isScreen = session?.source_type === 'SCREEN';

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: 920,
          backgroundColor: '#0F172A',
          border: '1px solid #334155',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Top Bar */}
        <div 
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span 
              style={{
                backgroundColor: connectionStatus === 'CONNECTED' ? '#DC2626' : '#64748B',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 900,
                padding: '4px 10px',
                borderRadius: 6,
                letterSpacing: '0.06em',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Radio size={14} className={connectionStatus === 'CONNECTED' ? 'pulse-fast' : ''} />
              <span>{connectionStatus === 'CONNECTED' ? '● LIVE' : connectionStatus}</span>
            </span>

            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                {isScreen ? 'Inspector Screen Live Share' : 'INSPECTOR LIVE CAMERA'} — {session?.inspector_name || inspector?.name || 'Field Auditor'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                <MapPin size={13} color="#38BDF8" />
                <span>{inspector?.assigned_site_name || 'Central Infrastructure Terminal'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {connectionStatus === 'CONNECTED' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38BDF8', fontSize: 13, fontWeight: 700 }}>
                <Clock size={15} />
                <span>{formatDuration(duration)}</span>
              </div>
            )}

            <button 
              onClick={handleCloseModal}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#94A3B8',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Close Stream"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Video Canvas Area */}
        <div 
          style={{
            position: 'relative',
            width: '100%',
            height: 480,
            backgroundColor: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            controls={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: connectionStatus === 'CONNECTED' ? 'block' : 'none'
            }}
          />

          {/* Connecting HUD */}
          {connectionStatus === 'CONNECTING' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: '#94A3B8' }}>
              <div style={{ width: 44, height: 44, border: '3px solid #334155', borderTopColor: '#38BDF8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Establishing secure WebRTC peer connection...</span>
              <span style={{ fontSize: 12, color: '#64748B' }}>Requesting direct video feed from inspector's device</span>
            </div>
          )}

          {/* Disconnected / Error HUD */}
          {connectionStatus === 'DISCONNECTED' && (
            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                color: '#F87171',
                padding: 30,
                textAlign: 'center'
              }}
            >
              <WifiOff size={44} color="#EF4444" />
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#FCA5A5' }}>
                Inspector Camera Connection Lost
              </h3>
              <p style={{ fontSize: 13, color: '#94A3B8', maxWidth: 420, margin: 0 }}>
                {errorMsg || 'The live stream was ended by the inspector or the network connection was interrupted.'}
              </p>
              <button
                onClick={handleCloseModal}
                className="btn btn-secondary"
                style={{ marginTop: 8 }}
              >
                Close Viewer
              </button>
            </div>
          )}
        </div>

        {/* Voice Feedback Toast Banner */}
        {voiceFeedback && (
          <div style={{ padding: '8px 20px', backgroundColor: 'rgba(245, 158, 11, 0.15)', borderBottom: '1px solid #F59E0B', color: '#FCD34D', fontSize: 12, fontWeight: 600 }}>
            {voiceFeedback}
          </div>
        )}

        {/* Modal Bottom Footer: Voice Controls & Cost Control */}
        <div 
          style={{
            padding: '14px 22px',
            borderTop: '1px solid #1E293B',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#0F172A',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          {/* Left: Voice Chat Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {connectionStatus === 'CONNECTED' && (
              <>
                {voiceState === 'IDLE' && (
                  <button
                    onClick={handleStartVoice}
                    className="btn btn-secondary btn-sm"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      borderColor: '#38BDF8',
                      color: '#38BDF8',
                      fontWeight: 700,
                      padding: '8px 14px'
                    }}
                  >
                    <Mic size={15} />
                    <span>Start Voice Chat</span>
                  </button>
                )}

                {voiceState === 'REQUESTING' && (
                  <span style={{ fontSize: 12, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mic size={14} className="pulse-fast" />
                    <span>🎤 Calling Inspector... waiting for response</span>
                  </span>
                )}

                {voiceState === 'CONNECTED' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: '#34D399', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Mic size={15} />
                      <span>🎤 VOICE CONNECTED</span>
                    </span>

                    <button
                      onClick={handleToggleAdminMic}
                      className="btn btn-secondary btn-sm"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: isAdminMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        borderColor: isAdminMuted ? '#EF4444' : 'rgba(255, 255, 255, 0.2)',
                        color: isAdminMuted ? '#F87171' : '#FFFFFF',
                        fontWeight: 700,
                        padding: '6px 12px'
                      }}
                    >
                      {isAdminMuted ? <MicOff size={14} /> : <Mic size={14} />}
                      <span>{isAdminMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
                    </button>

                    <button
                      onClick={handleEndVoice}
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#F87171', borderColor: 'rgba(239, 68, 68, 0.4)', padding: '6px 12px', fontSize: 12 }}
                    >
                      End Voice
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right: End Camera View */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94A3B8' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: connectionStatus === 'CONNECTED' ? '#43A047' : '#EF4444' }} />
              <span>Connection: {connectionStatus === 'CONNECTED' ? 'Good (WebRTC P2P)' : 'Standby'}</span>
            </div>

            <button
              onClick={handleCloseModal}
              className="btn btn-danger btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                backgroundColor: '#DC2626',
                borderColor: '#DC2626',
                fontWeight: 800,
                borderRadius: 10
              }}
            >
              <Square size={14} fill="currentColor" />
              <span>End Camera View</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
