import React, { useState, useEffect, useRef } from 'react';
import { 
  subscribeToInspectionStream, 
  getLatestStreamState,
  sendAdminDirective,
  runRealtimeYoloDetection
} from '../services/yoloVisionService';
import { initAdminWebRtc } from '../services/cloudStreamService';
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
  RefreshCw,
  Maximize2
} from 'lucide-react';
import InspectorCameraFullscreenModal from '../components/InspectorCameraFullscreenModal';

export default function LiveInspectionStreamPage() {
  const [streamData, setStreamData] = useState(null);
  const [simulationActive, setSimulationActive] = useState(false);
  const [simTick, setSimTick] = useState(0);
  const [customDirective, setCustomDirective] = useState('');
  const [directiveSentMsg, setDirectiveSentMsg] = useState(null);
  const [capturedEvidenceList, setCapturedEvidenceList] = useState([]);
  const [webrtcStream, setWebrtcStream] = useState(null);
  const [webrtcStatus, setWebrtcStatus] = useState('WAITING'); // 'WAITING' | 'CONNECTED' | 'CALLING' | 'READY' | 'ERROR'
  const [viewportMode, setViewportMode] = useState('AUTO'); // 'AUTO' | 'WEBRTC' | 'SNAPSHOT'
  const [captureAlert, setCaptureAlert] = useState(null);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const remoteVideoRef = useRef(null);
  const adminPeerRef = useRef(null);

  // 1. Subscribe to incoming live telemetry stream & WebRTC from Field Inspector
  useEffect(() => {
    // Initial state check
    const initial = getLatestStreamState();
    if (initial) {
      setStreamData(initial);
    }

    const unsubscribe = subscribeToInspectionStream((incoming) => {
      setStreamData(incoming);
      // If real stream arrives, turn off simulation
      if (incoming && incoming.streamActive) {
        setSimulationActive(false);
      }

      // Handle real-time mobile capture event
      if (incoming?.isCaptureEvent && incoming?.capturedPhotoUrl) {
        const evidenceItem = {
          id: `EV-LIVE-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          defect: incoming.primaryFinding || 'CONCRETE_SPALLING',
          severity: incoming.primarySeverity || 'CRITICAL',
          inspector: incoming.inspector?.name || 'R. Saravanan',
          image: incoming.capturedPhotoUrl
        };
        setCapturedEvidenceList(prev => [evidenceItem, ...prev]);
        setCaptureAlert({
          message: `📸 New evidence captured on mobile by ${incoming.inspector?.name || 'R. Saravanan'}!`,
          defect: incoming.primaryFinding || 'CONCRETE_SPALLING',
          severity: incoming.primarySeverity || 'CRITICAL',
          image: incoming.capturedPhotoUrl
        });
        setTimeout(() => setCaptureAlert(null), 9000);
      }
    });

    // Initialize WebRTC P2P Receiver Node
    try {
      adminPeerRef.current = initAdminWebRtc(
        (remoteMedia) => {
          console.log('[LiveStreamPage] Remote MediaStream attached!');
          setWebrtcStream(remoteMedia);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteMedia;
            remoteVideoRef.current.play().catch(e => console.warn('Play remote video warning:', e));
          }
        },
        (status) => {
          setWebrtcStatus(status);
        }
      );
    } catch (err) {
      console.warn('WebRTC init error:', err);
    }

    return () => {
      unsubscribe();
      if (adminPeerRef.current) {
        adminPeerRef.current.close();
      }
    };
  }, []);

  // Sync webrtcStream to video ref when ready
  useEffect(() => {
    if (remoteVideoRef.current && webrtcStream) {
      remoteVideoRef.current.srcObject = webrtcStream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [webrtcStream]);

  // 2. Simulation Loop (Active when Admin wants to test without an inspector phone active)
  useEffect(() => {
    if (!simulationActive) return;

    const interval = setInterval(() => {
      setSimTick(t => t + 1);
      const detection = runRealtimeYoloDetection({
        frameIndex: simTick,
        assetCategory: 'Civil',
        primaryDefectKey: 'CONCRETE_SPALLING',
        cameraActive: true
      });

      setStreamData({
        streamActive: true,
        cameraActive: true,
        isSimulated: true,
        inspector: {
          name: 'R. Saravanan',
          badge: 'INSP-2024-001',
          role: 'Lead Field Auditor'
        },
        site: {
          id: 'DEL-MET-02',
          name: 'Delhi Metro Central Terminal (Phase 2)',
          code: 'DEL-MET-02',
          geofenceRadius: 650,
          geofenceVerified: true
        },
        activeChecklistItem: 'Pier P-14 Concrete Integrity & Spalling',
        checklistProgress: {
          completed: 3,
          total: 4,
          percentage: 75
        },
        yoloEnabled: true,
        fps: detection.fps,
        primaryFinding: detection.primaryFinding,
        primarySeverity: detection.primarySeverity,
        detections: detection.detections,
        previewSnapshot: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?w=1200&auto=format&fit=crop&q=80',
        timestamp: Date.now()
      });
    }, 500);

    return () => clearInterval(interval);
  }, [simulationActive, simTick]);

  // Handle sending directive to field inspector
  const handleSendDirective = (message, severity = 'STANDARD') => {
    const directive = sendAdminDirective({
      sender: 'K. Selvakumar, IAS (Admin)',
      message,
      severity
    });
    setDirectiveSentMsg(`Directive dispatched: "${message}"`);
    setTimeout(() => setDirectiveSentMsg(null), 4000);
    setCustomDirective('');
  };

  const handleCaptureAdminSnapshot = () => {
    if (!streamData) return;
    const evidenceItem = {
      id: `EV-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      defect: streamData.primaryFinding || 'CONCRETE_SPALLING',
      severity: streamData.primarySeverity || 'CRITICAL',
      inspector: streamData.inspector?.name || 'R. Saravanan',
      image: streamData.previewSnapshot
    };
    setCapturedEvidenceList(prev => [evidenceItem, ...prev]);
  };

  const activeData = streamData || {
    streamActive: false,
    inspector: { name: 'R. Saravanan', badge: 'INSP-2024-001' },
    site: { name: 'Delhi Metro Central Terminal (Phase 2)' },
    checklistProgress: { completed: 2, total: 4, percentage: 50 },
    detections: []
  };

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
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div 
            style={{
              position: 'relative',
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(239, 68, 68, 0.4)'
            }}
          >
            <Radio size={24} color="#ef4444" />
            <div 
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                boxShadow: '0 0 8px #ef4444'
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
                  backgroundColor: activeData.streamActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                  color: activeData.streamActive ? '#ef4444' : '#94a3b8',
                  border: `1px solid ${activeData.streamActive ? '#ef4444' : '#64748b'}`
                }}
              >
                {activeData.streamActive ? '● BROADCAST LIVE' : '○ STANDBY'}
              </span>
              {activeData.isSimulated && (
                <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>
                  (Interactive Demo Simulation)
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-dim)' }}>
              Real-time synchronization with Field Inspector camera, YOLO defect bounding boxes, and statutory progress.
            </p>
          </div>
        </div>

        {/* Live Controls */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Reconnect WebRTC Button */}
          <button
            onClick={() => {
              if (adminPeerRef.current) adminPeerRef.current.reconnect();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              backgroundColor: webrtcStatus === 'CONNECTED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.15)',
              border: `1px solid ${webrtcStatus === 'CONNECTED' ? '#10b981' : 'var(--accent-cyan)'}`,
              borderRadius: 8,
              color: webrtcStatus === 'CONNECTED' ? '#34d399' : '#38bdf8',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="Attempt direct P2P WebRTC connection with inspector mobile phone"
          >
            <Video size={14} />
            <span>{webrtcStatus === 'CONNECTED' ? 'WebRTC P2P Active' : 'Connect WebRTC'}</span>
          </button>

          <button
            onClick={() => setSimulationActive(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              backgroundColor: simulationActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.15)',
              border: `1px solid ${simulationActive ? '#ef4444' : 'var(--accent-cyan)'}`,
              borderRadius: 8,
              color: simulationActive ? '#fca5a5' : '#38bdf8',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Zap size={14} />
            <span>{simulationActive ? 'Stop Simulation' : 'Simulate Field Stream'}</span>
          </button>

          <button
            onClick={() => setShowFullscreen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              borderRadius: 8,
              color: '#fca5a5',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(239, 68, 68, 0.25)'
            }}
            title="Open Inspector's Live Camera in Full Screen Mode"
          >
            <Maximize2 size={14} />
            <span>Full Screen Camera</span>
          </button>

          <button
            onClick={() => window.open('/field-inspector', '_blank')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              borderRadius: 8,
              color: '#34d399',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Smartphone size={14} />
            <span>Open Inspector Portal</span>
          </button>
        </div>
      </div>

      {/* 2. Main Dual-Panel Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
        
        {/* LEFT: Live Video Feed & Bounding Box Viewport */}
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
                Field Optical Feed • {activeData.inspector?.name || 'R. Saravanan'}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 20,
                  backgroundColor: webrtcStatus === 'CONNECTED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                  border: `1px solid ${webrtcStatus === 'CONNECTED' ? '#10b981' : 'rgba(56, 189, 248, 0.4)'}`,
                  color: webrtcStatus === 'CONNECTED' ? '#34d399' : '#38bdf8'
                }}
              >
                {webrtcStatus === 'CONNECTED' ? '● 30FPS WEBRTC P2P' : '☁️ CLOUD SYNC RELAY'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Viewport Mode Switcher */}
              <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', padding: 2, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)' }}>
                <button
                  onClick={() => setViewportMode('AUTO')}
                  style={{
                    padding: '3px 8px',
                    fontSize: 9.5,
                    fontWeight: 700,
                    borderRadius: 4,
                    border: 'none',
                    background: viewportMode === 'AUTO' ? 'rgba(56, 189, 248, 0.3)' : 'transparent',
                    color: viewportMode === 'AUTO' ? '#38bdf8' : '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  Auto
                </button>
                <button
                  onClick={() => setViewportMode('WEBRTC')}
                  style={{
                    padding: '3px 8px',
                    fontSize: 9.5,
                    fontWeight: 700,
                    borderRadius: 4,
                    border: 'none',
                    background: viewportMode === 'WEBRTC' ? 'rgba(16, 185, 129, 0.3)' : 'transparent',
                    color: viewportMode === 'WEBRTC' ? '#34d399' : '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  Live Video
                </button>
                <button
                  onClick={() => setViewportMode('SNAPSHOT')}
                  style={{
                    padding: '3px 8px',
                    fontSize: 9.5,
                    fontWeight: 700,
                    borderRadius: 4,
                    border: 'none',
                    background: viewportMode === 'SNAPSHOT' ? 'rgba(56, 189, 248, 0.3)' : 'transparent',
                    color: viewportMode === 'SNAPSHOT' ? '#38bdf8' : '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  Cloud Frames
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#10b981' }}>
                <Wifi size={13} />
                <span>Cloud Relay</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#38bdf8' }}>
                <Activity size={13} />
                <span>{webrtcStatus === 'CONNECTED' ? '30.0' : (activeData.fps || 28.2)} FPS</span>
              </div>

              {/* Full Screen Mode Button */}
              <button
                onClick={() => setShowFullscreen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 12px',
                  backgroundColor: 'rgba(56, 189, 248, 0.2)',
                  border: '1px solid var(--accent-cyan)',
                  borderRadius: 6,
                  color: '#38bdf8',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
                title="Expand Camera into Full Screen View"
              >
                <Maximize2 size={13} />
                <span>Full Screen</span>
              </button>
            </div>
          </div>

          {/* Viewport Container */}
          <div 
            onDoubleClick={() => setShowFullscreen(true)}
            title="Double-click to open in Full Screen"
            style={{ 
              position: 'relative', 
              width: '100%', 
              height: 440, 
              backgroundColor: '#020617',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              cursor: 'pointer'
            }}
          >
            {/* Live WebRTC Video Track from Inspector's Phone */}
            <video
              ref={remoteVideoRef}
              playsInline
              autoPlay
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: (webrtcStream && (viewportMode === 'WEBRTC' || viewportMode === 'AUTO')) ? 'block' : 'none'
              }}
            />

            {/* Cloud Frame Snapshot View (when WebRTC is idle or SNAPSHOT selected) */}
            {(!webrtcStream || viewportMode === 'SNAPSHOT') && (
              activeData.previewSnapshot ? (
                <img
                  src={activeData.previewSnapshot}
                  alt="Live Telemetry Viewport"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'brightness(0.9) contrast(1.05)'
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <Radio size={48} color="#64748b" style={{ marginBottom: 12 }} />
                  <h4 style={{ color: '#ffffff', margin: '0 0 6px' }}>Standby — Waiting for Inspector Stream</h4>
                  <p style={{ color: '#94a3b8', fontSize: 13, maxWidth: 380, margin: '0 auto 16px' }}>
                    The live stream connects automatically across the internet whenever Field Inspector R. Saravanan opens the camera feed on their phone.
                  </p>
                  <button
                    onClick={() => setSimulationActive(true)}
                    className="btn btn-primary"
                    style={{ fontSize: 12 }}
                  >
                    <Zap size={14} /> Simulate Active Field Inspection
                  </button>
                </div>
              )
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

            {/* Scanline Grid */}
            <div 
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))',
                backgroundSize: '100% 3px, 6px 100%',
                pointerEvents: 'none',
                opacity: 0.6
              }}
            />

            {/* Live YOLO Bounding Boxes HUD Overlay */}
            {activeData.detections?.map((det, index) => (
              <div
                key={det.id || index}
                style={{
                  position: 'absolute',
                  left: `${det.box.x}%`,
                  top: `${det.box.y}%`,
                  width: `${det.box.width}%`,
                  height: `${det.box.height}%`,
                  border: `2px solid ${det.color}`,
                  backgroundColor: det.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                  boxShadow: `0 0 16px ${det.color}50`,
                  borderRadius: 4,
                  pointerEvents: 'none',
                  transition: 'all 0.35s ease'
                }}
              >
                {/* Top Pill */}
                <div
                  style={{
                    position: 'absolute',
                    top: -24,
                    left: -2,
                    backgroundColor: det.color,
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.6)'
                  }}
                >
                  <Zap size={11} />
                  <span>{det.label}</span>
                  <span style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '1px 4px', borderRadius: 3, fontSize: 9 }}>
                    {det.confidenceScore}%
                  </span>
                </div>

                {/* Bottom Spec Code */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: -18,
                    right: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    color: det.color,
                    border: `1px solid ${det.color}60`,
                    padding: '1px 6px',
                    borderRadius: 3,
                    fontSize: 9,
                    fontWeight: 700
                  }}
                >
                  {det.specCode}
                </div>
              </div>
            ))}
          </div>

          {/* Viewport Bottom Controls */}
          <div 
            style={{ 
              padding: '12px 16px', 
              backgroundColor: 'rgba(15, 23, 42, 0.7)', 
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                Active Target: <strong style={{ color: '#ffffff' }}>{activeData.site?.name || 'Delhi Metro Terminal'}</strong>
              </span>
              <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>
                ✓ GPS Geofence Locked
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => setShowFullscreen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  borderRadius: 6,
                  color: '#fca5a5',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="View Inspector's Camera in Full Screen"
              >
                <Maximize2 size={13} />
                <span>Full Screen</span>
              </button>

              <button
                onClick={handleCaptureAdminSnapshot}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid var(--accent-cyan)',
                  borderRadius: 6,
                  color: '#38bdf8',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Download size={13} />
                <span>Capture Evidence Snapshot</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Live Telemetry HUD, Defect Diagnostics, Directives */}
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
                  {activeData.inspector?.name || 'R. Saravanan'}
                </p>
                <p style={{ margin: 0, fontSize: 9.5, color: '#38bdf8' }}>
                  {activeData.inspector?.badge || 'INSP-2024-001'}
                </p>
              </div>

              <div style={{ padding: '8px 10px', backgroundColor: 'rgba(15, 23, 42, 0.5)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ margin: 0, fontSize: 10, color: 'var(--text-dim)' }}>Geofence Radius</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 700, color: '#10b981' }}>
                  650m (On-Site)
                </p>
                <p style={{ margin: 0, fontSize: 9.5, color: '#94a3b8' }}>
                  Haversine Anti-Fraud
                </p>
              </div>
            </div>

            {/* Checklist Progress */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: 'var(--text-dim)' }}>Live Checklist Progress</span>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                  {activeData.checklistProgress?.completed || 3} of {activeData.checklistProgress?.total || 4} ({activeData.checklistProgress?.percentage || 75}%)
                </span>
              </div>
              <div style={{ width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${activeData.checklistProgress?.percentage || 75}%`, 
                    height: '100%', 
                    backgroundColor: 'var(--accent-cyan)',
                    transition: 'width 0.4s ease'
                  }} 
                />
              </div>
            </div>
          </div>

          {/* B. Primary Defect Diagnostic Card */}
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
                YOLO Defect Diagnostics
              </h4>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 800,
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.4)'
                }}
              >
                {activeData.primarySeverity || 'CRITICAL'}
              </span>
            </div>

            <div style={{ padding: '10px 12px', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.25)', marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#ffffff' }}>
                {activeData.primaryFinding || 'Concrete Spalling & Delamination'}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#fca5a5', lineHeight: 1.4 }}>
                Ultrasonic pulse velocity test advised. Spalling depth exceeds safety threshold. Reinforcement oxidation risk detected.
              </p>
            </div>

            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              Statutory Code: <strong style={{ color: '#ffffff' }}>IS 456:2000 / IRC:SP:40</strong>
            </div>
          </div>

          {/* C. Admin Real-Time Directive Dispatcher */}
          <div 
            style={{ 
              backgroundColor: 'var(--card-bg)', 
              borderRadius: 14, 
              border: '1px solid var(--border-color)',
              padding: '16px'
            }}
          >
            <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
              Transmit Directive to Field
            </h4>

            {directiveSentMsg && (
              <div style={{ padding: '6px 10px', backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', borderRadius: 6, color: '#34d399', fontSize: 11, marginBottom: 10 }}>
                {directiveSentMsg}
              </div>
            )}

            {/* Quick Action Preset Directives */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
              <button
                onClick={() => handleSendDirective('Please zoom in and capture close-up of rebar spalling.', 'HIGH')}
                style={{
                  padding: '6px 10px',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: 6,
                  color: '#38bdf8',
                  fontSize: 10.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                ⚡ Request Close-Up
              </button>

              <button
                onClick={() => handleSendDirective('Flagged as High Criticality. Direct mitigation mandatory.', 'CRITICAL')}
                style={{
                  padding: '6px 10px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 6,
                  color: '#f87171',
                  fontSize: 10.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                ⚠️ Flag High Severity
              </button>

              <button
                onClick={() => handleSendDirective('Frame verified by HQ Admin. Proceed to shutter capture.', 'STANDARD')}
                style={{
                  padding: '6px 10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 6,
                  color: '#34d399',
                  fontSize: 10.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                ✓ Approve Capture
              </button>

              <button
                onClick={() => handleSendDirective('Check structural expansion joint alignment before moving.', 'STANDARD')}
                style={{
                  padding: '6px 10px',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: 6,
                  color: '#fbbf24',
                  fontSize: 10.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                🔍 Inspect Joints
              </button>
            </div>

            {/* Custom Directive Input */}
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                value={customDirective}
                onChange={e => setCustomDirective(e.target.value)}
                placeholder="Type custom field message..."
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 6,
                  color: '#ffffff',
                  fontSize: 11
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && customDirective.trim()) {
                    handleSendDirective(customDirective.trim());
                  }
                }}
              />
              <button
                onClick={() => {
                  if (customDirective.trim()) handleSendDirective(customDirective.trim());
                }}
                style={{
                  padding: '7px 12px',
                  backgroundColor: 'var(--accent-cyan)',
                  border: 'none',
                  borderRadius: 6,
                  color: '#000000',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <Send size={13} />
              </button>
            </div>
          </div>

          {/* D. Captured Evidence Snapshots */}
          {capturedEvidenceList.length > 0 && (
            <div 
              style={{ 
                backgroundColor: 'var(--card-bg)', 
                borderRadius: 14, 
                border: '1px solid var(--border-color)',
                padding: '14px'
              }}
            >
              <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                Captured Evidence Snapshots ({capturedEvidenceList.length})
              </h4>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {capturedEvidenceList.map((ev, i) => (
                  <div 
                    key={ev.id || i}
                    style={{
                      minWidth: 100,
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      borderRadius: 6,
                      overflow: 'hidden',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <img src={ev.image} alt="Evidence" style={{ width: '100%', height: 55, objectFit: 'cover' }} />
                    <div style={{ padding: '4px 6px' }}>
                      <p style={{ margin: 0, fontSize: 9.5, fontWeight: 700, color: '#ffffff', truncate: true }}>
                        {ev.defect.split('_')[0]}
                      </p>
                      <p style={{ margin: 0, fontSize: 8.5, color: '#94a3b8' }}>{ev.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Full Screen Inspector Camera Modal */}
      <InspectorCameraFullscreenModal
        isOpen={showFullscreen}
        onClose={() => setShowFullscreen(false)}
      />
    </div>
  );
}
