import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  subscribeToInspectionStream, 
  getLatestStreamState,
  sendAdminDirective 
} from '../services/yoloVisionService';
import { 
  startViewerSession, 
  stopViewerSession, 
  subscribeToLiveShareUpdates 
} from '../services/liveShareService';
import api from '../services/api';
import { 
  Radio, 
  Activity, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Camera, 
  Layers, 
  Send, 
  Zap, 
  Eye, 
  MapPin, 
  User, 
  Clock, 
  Wifi, 
  Sparkles,
  Download,
  RotateCcw,
  Check,
  Smartphone,
  Video,
  VideoOff,
  RefreshCw,
  Maximize2
} from 'lucide-react';
import InspectorCameraFullscreenModal from '../components/InspectorCameraFullscreenModal';

export default function LiveInspectionStreamPage() {
  const [rawInspectors, setRawInspectors] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedInspectorId, setSelectedInspectorId] = useState(null);
  const [streamData, setStreamData] = useState(null);
  const [customDirective, setCustomDirective] = useState('');
  const [directiveSentMsg, setDirectiveSentMsg] = useState(null);
  const [capturedEvidenceList, setCapturedEvidenceList] = useState([]);
  const [webrtcStream, setWebrtcStream] = useState(null);
  const [webrtcStatus, setWebrtcStatus] = useState('IDLE'); // 'IDLE' | 'CONNECTING' | 'LIVE' | 'DISCONNECTED' | 'ERROR'
  const [captureAlert, setCaptureAlert] = useState(null);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

  const remoteVideoRef = useRef(null);

  // 1. Load real authenticated inspectors and active sessions from database
  const loadData = async () => {
    try {
      const [inspRes, sharesRes] = await Promise.all([
        api.getInspectors(),
        api.getActiveLiveShares()
      ]);

      const insps = inspRes.success && Array.isArray(inspRes.data) ? inspRes.data : [];
      const shares = sharesRes.success && Array.isArray(sharesRes.active_sessions) ? sharesRes.active_sessions : [];

      setRawInspectors(insps);
      setActiveSessions(shares);

      // If an active session exists, auto-select that inspector
      if (shares.length > 0) {
        setSelectedInspectorId(shares[0].inspector_id);
      } else if (insps.length > 0 && !selectedInspectorId) {
        setSelectedInspectorId(insps[0].id || insps[0].user_id);
      }
    } catch (err) {
      console.warn('[LiveInspectionStreamPage] Failed to fetch initial data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to live share updates
    const unsubShares = subscribeToLiveShareUpdates({
      role: 'ADMIN',
      onActiveSharesUpdate: (data) => {
        if (data && Array.isArray(data.active_sessions)) {
          setActiveSessions(data.active_sessions);
        }
      },
      intervalMs: 2000
    });

    // Subscribe to real-time telemetry from inspector's mobile
    const initial = getLatestStreamState();
    if (initial) setStreamData(initial);

    const unsubTelemetry = subscribeToInspectionStream((incoming) => {
      setStreamData(incoming);

      // Handle real-time mobile capture event
      if (incoming?.isCaptureEvent && incoming?.capturedPhotoUrl) {
        const evidenceItem = {
          id: `EV-LIVE-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          defect: incoming.primaryFinding || 'STRUCTURAL_ANOMALY',
          severity: incoming.primarySeverity || 'HIGH',
          inspector: incoming.inspector?.name || 'Field Inspector',
          image: incoming.capturedPhotoUrl
        };
        setCapturedEvidenceList(prev => [evidenceItem, ...prev]);
        setCaptureAlert({
          message: `📸 New evidence captured on mobile by ${incoming.inspector?.name || 'Field Inspector'}!`,
          defect: incoming.primaryFinding || 'STRUCTURAL_ANOMALY',
          severity: incoming.primarySeverity || 'HIGH',
          image: incoming.capturedPhotoUrl
        });
        setTimeout(() => setCaptureAlert(null), 9000);
      }
    });

    return () => {
      unsubShares();
      unsubTelemetry();
      stopViewerSession();
    };
  }, []);

  // 2. Compute selected inspector and their active live session
  const selectedInspector = useMemo(() => {
    return rawInspectors.find(
      i => i.id === selectedInspectorId || i.user_id === selectedInspectorId
    ) || rawInspectors[0] || null;
  }, [rawInspectors, selectedInspectorId]);

  const activeSessionForInspector = useMemo(() => {
    if (!selectedInspector) return null;
    const uid = selectedInspector.user_id || selectedInspector.id;
    return activeSessions.find(s => s.inspector_id === uid && s.status === 'ACTIVE') || null;
  }, [selectedInspector, activeSessions]);

  // 3. Establish WebRTC Peer Connection to the selected inspector's real session
  useEffect(() => {
    if (!activeSessionForInspector || !activeSessionForInspector.id) {
      stopViewerSession();
      setWebrtcStream(null);
      setWebrtcStatus('IDLE');
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      return;
    }

    console.log(`[LiveStreamPage] Connecting to real WebRTC session: ${activeSessionForInspector.id}`);
    setWebrtcStatus('CONNECTING');

    startViewerSession({
      sessionId: activeSessionForInspector.id,
      role: 'ADMIN',
      onRemoteStream: (stream, track) => {
        console.log(`[LiveStreamPage] Received remote track: kind=${track?.kind}, readyState=${track?.readyState}`);
        setWebrtcStream(stream);
        if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== stream) {
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current.play().catch(e => console.warn('[LiveStreamPage] Video play note:', e.message));
        }
        if (stream.getVideoTracks().some(t => t.readyState === 'live')) {
          setWebrtcStatus('LIVE');
        }
      },
      onStateChange: ({ connectionState, iceConnectionState, hasVideo }) => {
        console.log(`[LiveStreamPage] WebRTC State: ${connectionState}, ICE: ${iceConnectionState}`);
        if (connectionState === 'connected' && hasVideo) {
          setWebrtcStatus('LIVE');
        } else if (connectionState === 'connecting' || iceConnectionState === 'checking') {
          setWebrtcStatus('CONNECTING');
        } else if (connectionState === 'failed' || connectionState === 'closed') {
          setWebrtcStatus('DISCONNECTED');
        }
      },
      onDisconnected: (reason) => {
        console.log('[LiveStreamPage] WebRTC disconnected:', reason);
        setWebrtcStatus('DISCONNECTED');
        setWebrtcStream(null);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      }
    }).catch(err => {
      console.warn('[LiveStreamPage] WebRTC startViewer error:', err);
      setWebrtcStatus('ERROR');
    });

    return () => {
      stopViewerSession();
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    };
  }, [activeSessionForInspector?.id]);

  // Ensure video element plays when track is live
  useEffect(() => {
    if (remoteVideoRef.current && webrtcStream && webrtcStatus === 'LIVE') {
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [webrtcStream, webrtcStatus]);

  // Handle sending directive to field inspector
  const handleSendDirective = (message, severity = 'STANDARD') => {
    if (!message.trim()) return;
    sendAdminDirective({
      sender: 'K. Selvakumar, IAS (Admin)',
      message: message.trim(),
      severity
    });
    setDirectiveSentMsg(`Directive dispatched: "${message.trim()}"`);
    setTimeout(() => setDirectiveSentMsg(null), 4000);
    setCustomDirective('');
  };

  const handleCaptureAdminSnapshot = () => {
    if (!remoteVideoRef.current || !webrtcStream) return;
    try {
      const video = remoteVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

      const evidenceItem = {
        id: `EV-ADMIN-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        defect: 'OPERATOR_VERIFICATION',
        severity: 'MEDIUM',
        inspector: selectedInspector?.name || 'Field Inspector',
        image: dataUrl
      };
      setCapturedEvidenceList(prev => [evidenceItem, ...prev]);
    } catch (e) {}
  };

  const isLive = webrtcStatus === 'LIVE' && !!webrtcStream;

  return (
    <div className="page-body">
      {/* 1. Command Center Telemetry Banner */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 20,
          padding: '16px 20px',
          backgroundColor: 'var(--card-bg)',
          borderRadius: 14,
          border: '1px solid rgba(56, 189, 248, 0.25)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          flexWrap: 'wrap',
          gap: 14
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div 
            style={{
              position: 'relative',
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: isLive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${isLive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
            }}
          >
            <Radio size={24} color={isLive ? '#10b981' : '#ef4444'} />
            <div 
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: isLive ? '#10b981' : '#ef4444',
                boxShadow: `0 0 8px ${isLive ? '#10b981' : '#ef4444'}`
              }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Live Field Telemetry & AI Stream
              </h2>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 20,
                  fontSize: 10,
                  fontWeight: 800,
                  backgroundColor: isLive ? 'rgba(16, 185, 129, 0.2)' : webrtcStatus === 'CONNECTING' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                  color: isLive ? '#34d399' : webrtcStatus === 'CONNECTING' ? '#38bdf8' : '#94a3b8',
                  border: `1px solid ${isLive ? '#10b981' : webrtcStatus === 'CONNECTING' ? '#38bdf8' : '#64748b'}`
                }}
              >
                {isLive ? '● BROADCAST LIVE' : webrtcStatus === 'CONNECTING' ? 'CONNECTING...' : '○ STANDBY'}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-dim)' }}>
              Real-time synchronization with Field Inspector camera feed, mobile telemetry, and field directives.
            </p>
          </div>
        </div>

        {/* Top Controls: Inspector Picker & Action Buttons */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Inspector Selection Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(15, 23, 42, 0.7)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <User size={14} color="var(--accent-cyan)" />
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Auditor:</span>
            <select
              value={selectedInspectorId || ''}
              onChange={(e) => setSelectedInspectorId(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {rawInspectors.map(insp => {
                const uid = insp.user_id || insp.id;
                const hasSession = activeSessions.some(s => s.inspector_id === uid && s.status === 'ACTIVE');
                return (
                  <option key={uid} value={uid} style={{ background: '#0f172a', color: '#fff' }}>
                    {insp.name} {hasSession ? '🔴 [Broadcasting]' : `(${insp.status || 'Active'})`}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Full Screen Camera Button */}
          <button
            onClick={() => setShowFullscreen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              backgroundColor: isLive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.15)',
              border: `1px solid ${isLive ? '#10b981' : 'var(--accent-cyan)'}`,
              borderRadius: 8,
              color: isLive ? '#34d399' : '#38bdf8',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer'
            }}
            title="Open Inspector Live Stream in Full Screen Mode"
          >
            <Maximize2 size={14} />
            <span>Full Screen View</span>
          </button>

          <button
            onClick={() => window.open('/field-inspector', '_blank')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: 8,
              color: '#38bdf8',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Smartphone size={14} />
            <span>Open Mobile Portal</span>
          </button>
        </div>
      </div>

      {/* 2. Main Dual-Panel Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
        
        {/* LEFT: Authoritative Live Video Feed */}
        <div 
          style={{ 
            backgroundColor: 'var(--card-bg)', 
            borderRadius: 14, 
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Feed Header */}
          <div 
            style={{ 
              padding: '12px 16px', 
              backgroundColor: 'rgba(15, 23, 42, 0.6)', 
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Camera size={16} color="var(--accent-cyan)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
                Field Optical Feed &bull; {selectedInspector?.name || 'Field Inspector'}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 20,
                  backgroundColor: isLive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                  border: `1px solid ${isLive ? '#10b981' : 'rgba(100, 116, 139, 0.4)'}`,
                  color: isLive ? '#34d399' : '#94a3b8'
                }}
              >
                {isLive ? '● WEBRTC REAL-TIME' : '○ STANDBY'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {isLive && (
                <button
                  onClick={handleCaptureAdminSnapshot}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 6,
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid #38bdf8',
                    color: '#38bdf8',
                    cursor: 'pointer'
                  }}
                  title="Capture live frame snapshot to evidence register"
                >
                  <Camera size={12} />
                  <span>Snapshot</span>
                </button>
              )}
            </div>
          </div>

          {/* Viewport Container */}
          <div 
            onDoubleClick={() => setShowFullscreen(true)}
            title={isLive ? "Double-click to open Full Screen" : ""}
            style={{ 
              position: 'relative', 
              width: '100%', 
              height: 440, 
              backgroundColor: '#020617',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            {/* Real WebRTC Video Element — Always mounted in DOM */}
            <video
              ref={remoteVideoRef}
              playsInline
              autoPlay
              muted
              onLoadedMetadata={(e) => {
                e.target.play().catch(err => console.warn('[LiveStreamPage] Metadata play warning:', err));
              }}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                backgroundColor: '#000000',
                zIndex: 1
              }}
            />

            {/* Standby / Status Placeholder Overlay when Video is NOT Live */}
            {!isLive && (
              <div 
                style={{ 
                  position: 'absolute',
                  inset: 0,
                  zIndex: 5,
                  backgroundColor: '#070b14',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 24,
                  textAlign: 'center'
                }}
              >
                {webrtcStatus === 'CONNECTING' ? (
                  <>
                    <div style={{ width: 44, height: 44, border: '3px solid rgba(56, 189, 248, 0.2)', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 14 }} />
                    <h4 style={{ color: '#ffffff', margin: '0 0 6px', fontSize: 16 }}>Connecting to Inspector Stream...</h4>
                    <p style={{ color: '#94a3b8', fontSize: 13, maxWidth: 380, margin: '0 auto' }}>
                      Negotiating WebRTC peer connection with {selectedInspector?.name || 'Inspector'}.
                    </p>
                  </>
                ) : (
                  <>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(148, 163, 184, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(148, 163, 184, 0.2)', marginBottom: 14 }}>
                      <VideoOff size={24} color="#94a3b8" />
                    </div>
                    <h4 style={{ color: '#ffffff', margin: '0 0 6px', fontSize: 16 }}>
                      Standby — No Live Stream Active for {selectedInspector?.name || 'Selected Inspector'}
                    </h4>
                    <p style={{ color: '#94a3b8', fontSize: 13, maxWidth: 420, margin: '0 auto 16px' }}>
                      {activeSessionForInspector 
                        ? 'Broadcaster session registered. Waiting for media packets...'
                        : `Inspector ${selectedInspector?.name || ''} (ID: ${selectedInspector?.user_id || selectedInspector?.id || 'N/A'}) is currently not broadcasting camera. Go to Inspector Monitoring to dispatch a camera request.`}
                    </p>
                    <button
                      onClick={() => {
                        window.location.hash = '#inspector-monitoring';
                        window.location.href = '/admin-dashboard';
                      }}
                      className="btn btn-primary"
                      style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Video size={14} /> Open Inspector Monitoring
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Incoming Capture Alert Toast Banner */}
            {captureAlert && (
              <div
                style={{
                  position: 'absolute',
                  top: 14,
                  left: 14,
                  right: 14,
                  backgroundColor: 'rgba(16, 185, 129, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid #34d399',
                  borderRadius: 10,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  zIndex: 50,
                  boxShadow: '0 8px 32px rgba(16, 185, 129, 0.5)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img
                    src={captureAlert.image}
                    alt="Captured"
                    style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '2px solid #ffffff' }}
                  />
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#ffffff' }}>
                      {captureAlert.message}
                    </p>
                    <p style={{ margin: 0, fontSize: 10, color: '#d1fae5' }}>
                      Defect: <strong>{captureAlert.defect}</strong> &bull; Synced Across Cloud to Evidence Archive
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCaptureAlert(null)}
                  style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontWeight: 800, fontSize: 14 }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Live Telemetry HUD, Directives & Evidence Register */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* A. Live Inspector Telemetry Card */}
          <div 
            style={{ 
              backgroundColor: 'var(--card-bg)', 
              borderRadius: 14, 
              border: '1px solid var(--border-color)',
              padding: '16px'
            }}
          >
            <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
              Field Auditor Telemetry
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div style={{ padding: '8px 10px', backgroundColor: 'rgba(15, 23, 42, 0.5)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ margin: 0, fontSize: 10, color: 'var(--text-dim)' }}>Auditor</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 700, color: '#ffffff' }}>
                  {selectedInspector?.name || 'Vishnu Prasath'}
                </p>
                <p style={{ margin: 0, fontSize: 9.5, color: '#38bdf8' }}>
                  {selectedInspector?.badge_number || selectedInspector?.employee_code || selectedInspector?.id || 'INSP-2026'}
                </p>
              </div>

              <div style={{ padding: '8px 10px', backgroundColor: 'rgba(15, 23, 42, 0.5)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ margin: 0, fontSize: 10, color: 'var(--text-dim)' }}>Assigned Facility</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 700, color: '#10b981' }}>
                  {selectedInspector?.assigned_site_name || 'Central Infrastructure Terminal'}
                </p>
                <p style={{ margin: 0, fontSize: 9.5, color: '#94a3b8' }}>
                  Status: {selectedInspector?.status || 'Active'}
                </p>
              </div>
            </div>
          </div>

          {/* B. Admin Real-Time Directive Dispatcher */}
          <div 
            style={{ 
              backgroundColor: 'var(--card-bg)', 
              borderRadius: 14, 
              border: '1px solid var(--border-color)',
              padding: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                Dispatch Field Directive
              </h4>
              <span style={{ fontSize: 10, color: '#38bdf8', fontWeight: 700 }}>Real-Time Push</span>
            </div>

            {directiveSentMsg && (
              <div style={{ padding: '8px 10px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: 6, color: '#34d399', fontSize: 11, marginBottom: 10 }}>
                {directiveSentMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <input
                type="text"
                value={customDirective}
                onChange={(e) => setCustomDirective(e.target.value)}
                placeholder="Type directive to field inspector..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 6,
                  color: '#ffffff',
                  fontSize: 12,
                  outline: 'none'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendDirective(customDirective);
                }}
              />
              <button
                onClick={() => handleSendDirective(customDirective)}
                className="btn btn-primary btn-sm"
                style={{ padding: '8px 14px' }}
              >
                <Send size={13} />
              </button>
            </div>

            {/* Quick Preset Directives */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                'Hold position & inspect Pier P-14',
                'Capture high-res evidence photo',
                'Re-check reinforcement spacing',
                'Verify safety barricade clearance'
              ].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendDirective(preset)}
                  style={{
                    padding: '4px 8px',
                    fontSize: 10.5,
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 4,
                    color: '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* C. Captured Evidence Register */}
          <div 
            style={{ 
              backgroundColor: 'var(--card-bg)', 
              borderRadius: 14, 
              border: '1px solid var(--border-color)',
              padding: '16px',
              flex: 1
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                Captured Evidence Register
              </h4>
              <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700 }}>
                {capturedEvidenceList.length} Records
              </span>
            </div>

            {capturedEvidenceList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-dim)', fontSize: 12 }}>
                <Camera size={24} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                <div>No evidence captures recorded in this session.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                {capturedEvidenceList.map((item) => (
                  <div 
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: 8,
                      backgroundColor: 'rgba(15, 23, 42, 0.5)',
                      borderRadius: 8,
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <img
                      src={item.image}
                      alt="Evidence"
                      style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.defect}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                        {item.inspector} &bull; {item.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real Fullscreen Inspector Camera Modal */}
      <InspectorCameraFullscreenModal
        isOpen={showFullscreen}
        onClose={() => setShowFullscreen(false)}
        inspector={selectedInspector}
        session={activeSessionForInspector}
        stream={webrtcStream}
      />
    </div>
  );
}
