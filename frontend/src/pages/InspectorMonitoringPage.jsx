import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Clock, 
  User, 
  MapPin, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  ShieldCheck,
  Search,
  Check,
  X,
  Phone,
  Mail,
  AlertCircle,
  Activity,
  Layers,
  StopCircle,
  Smartphone,
  Maximize2
} from 'lucide-react';
import api from '../services/api';
import InspectorCameraFullscreenModal from '../components/InspectorCameraFullscreenModal';
import { 
  subscribeToLiveShareUpdates, 
  startViewerSession, 
  stopViewerSession, 
  toggleAdminMicrophone, 
  enableViewerVoiceChat 
} from '../services/liveShareService';

export default function InspectorMonitoringPage() {
  const [rawInspectorsList, setRawInspectorsList] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [requestsList, setRequestsList] = useState([]);
  const [selectedInspectorId, setSelectedInspectorId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ONLINE' | 'OFFLINE' | 'WITH_CAMERA'
  const [loading, setLoading] = useState(true);
  const [requestingCamera, setRequestingCamera] = useState(false);
  const [requestingVoice, setRequestingVoice] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error' | 'info', message: '' }
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  
  // Real WebRTC Media & Diagnostics State
  const videoRef = React.useRef(null);
  const audioRef = React.useRef(null);
  const [currentRemoteStream, setCurrentRemoteStream] = useState(null);
  const [webrtcStatus, setWebrtcStatus] = useState('IDLE'); // 'IDLE' | 'CONNECTING' | 'LIVE' | 'DISCONNECTED' | 'ERROR'
  const [hasVideoTrack, setHasVideoTrack] = useState(false);
  const [hasAudioTrack, setHasAudioTrack] = useState(false);
  const [isAdminMicMuted, setIsAdminMicMuted] = useState(false);
  const [isIncomingAudioMuted, setIsIncomingAudioMuted] = useState(false);
  const [webrtcError, setWebrtcError] = useState(null);
  const [iceState, setIceState] = useState('new');
  const [connState, setConnState] = useState('new');

  // Load registered inspectors, active sessions, and pending requests
  const loadData = async () => {
    try {
      const [inspRes, sharesRes, reqRes] = await Promise.all([
        api.getInspectors(),
        api.getActiveLiveShares(),
        api.getLiveShareRequests()
      ]);

      const rawInspectors = inspRes.success && Array.isArray(inspRes.data) ? inspRes.data : [];
      const rawSessions = sharesRes.success && Array.isArray(sharesRes.active_sessions) ? sharesRes.active_sessions : [];
      const rawRequests = reqRes.success && Array.isArray(reqRes.data) ? reqRes.data : [];

      setRawInspectorsList(rawInspectors);
      setActiveSessions(rawSessions);
      setRequestsList(rawRequests);

      // Select first inspector by default if none selected
      if (rawInspectors.length > 0 && !selectedInspectorId) {
        setSelectedInspectorId(rawInspectors[0].id || rawInspectors[0].user_id);
      }
    } catch (err) {
      console.warn('[InspectorMonitoringPage] Data fetch notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to real-time live share state updates
    const unsubscribe = subscribeToLiveShareUpdates({
      role: 'ADMIN',
      onActiveSharesUpdate: (data) => {
        if (data && Array.isArray(data.active_sessions)) {
          setActiveSessions(data.active_sessions);
        }
      },
      onRequestsUpdate: (reqs) => {
        if (Array.isArray(reqs)) {
          setRequestsList(reqs);
        }
      },
      intervalMs: 2000
    });

    return () => unsubscribe();
  }, []);

  // Reactively merge inspectors with active sessions and requests
  const inspectors = React.useMemo(() => {
    return rawInspectorsList.map(insp => {
      const userId = insp.user_id || insp.id;
      const matchingSessions = activeSessions.filter(s => s.inspector_id === userId || s.inspector_id === insp.id || (insp.user_id && s.inspector_id === insp.user_id));
      matchingSessions.sort((a, b) => new Date(b.started_at || 0).getTime() - new Date(a.started_at || 0).getTime());
      const activeSession = matchingSessions[0] || null;
      const pendingReq = requestsList.find(r => 
        (r.inspector_id === userId || r.inspector_id === insp.id || (insp.user_id && r.inspector_id === insp.user_id)) && 
        r.status === 'PENDING' && 
        r.source_type === 'CAMERA'
      );
      const rejectedReq = requestsList.find(r => 
        (r.inspector_id === userId || r.inspector_id === insp.id || (insp.user_id && r.inspector_id === insp.user_id)) && 
        r.status === 'DECLINED' && 
        r.source_type === 'CAMERA'
      );
      
      const isOnline = insp.status !== 'OFFLINE' && insp.status !== 'INACTIVE';
      let cameraStatus = isOnline ? 'Available' : 'Offline';
      if (activeSession && (activeSession.source_type === 'CAMERA' || activeSession.status === 'ACTIVE')) {
        cameraStatus = (webrtcStatus === 'LIVE' && hasVideoTrack) ? 'Connected' : 'Connecting';
      } else if (pendingReq) {
        cameraStatus = 'Waiting for Inspector';
      } else if (rejectedReq) {
        cameraStatus = 'Rejected';
      }

      let voiceStatus = isOnline ? 'Available' : 'Offline';
      if (activeSession && activeSession.voice_status === 'CONNECTED') {
        voiceStatus = 'Live';
      } else if (activeSession && activeSession.voice_status === 'REQUESTED') {
        voiceStatus = 'Waiting for Inspector';
      }

      return {
        ...insp,
        user_id: userId,
        is_online: isOnline,
        camera_status: cameraStatus,
        voice_status: voiceStatus,
        active_session: activeSession || null,
        pending_request: pendingReq || null
      };
    });
  }, [rawInspectorsList, activeSessions, requestsList, webrtcStatus, hasVideoTrack]);

  // Resolve currently selected inspector
  const selectedInspector = inspectors.find(
    i => i.id === selectedInspectorId || i.user_id === selectedInspectorId
  ) || inspectors[0] || null;

  // Establish WebRTC connection when selected inspector has an active session
  useEffect(() => {
    const activeSession = selectedInspector?.active_session;
    if (!activeSession || !activeSession.id) {
      stopViewerSession();
      setWebrtcStatus('IDLE');
      setHasVideoTrack(false);
      setHasAudioTrack(false);
      setCurrentRemoteStream(null);
      if (videoRef.current) videoRef.current.srcObject = null;
      if (audioRef.current) audioRef.current.srcObject = null;
      return;
    }

    console.log(`[InspectorMonitoringPage] Connecting to inspector stream session ${activeSession.id} for ${selectedInspector?.name} (${selectedInspector?.id})...`);
    setWebrtcStatus('CONNECTING');
    setWebrtcError(null);

    startViewerSession({
      sessionId: activeSession.id,
      role: 'ADMIN',
      onRemoteStream: (stream, newTrack) => {
        console.log(`[InspectorMonitoringPage] Track received: kind=${newTrack?.kind}, id=${newTrack?.id}, readyState=${newTrack?.readyState}`);
        setCurrentRemoteStream(stream);

        if (videoRef.current) {
          if (videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream;
          }
          videoRef.current.play().catch(e => console.warn('[Video Autoplay Note]:', e.message));
        }
        if (audioRef.current && audioRef.current.srcObject !== stream) {
          audioRef.current.srcObject = stream;
          audioRef.current.play().catch(e => console.warn('[Audio Autoplay Note]:', e.message));
        }

        const vTracks = stream.getVideoTracks().filter(t => t.readyState === 'live');
        const aTracks = stream.getAudioTracks().filter(t => t.readyState === 'live');
        const hasV = vTracks.length > 0;
        const hasA = aTracks.length > 0;
        setHasVideoTrack(hasV);
        setHasAudioTrack(hasA);
        if (hasV || hasA) {
          setWebrtcStatus('LIVE');
        }
      },
      onStateChange: ({ connectionState, iceConnectionState, hasVideo, hasAudio }) => {
        setConnState(connectionState);
        setIceState(iceConnectionState);
        setHasVideoTrack(hasVideo);
        setHasAudioTrack(hasAudio);
        if ((connectionState === 'connected' || iceConnectionState === 'connected') && (hasVideo || hasAudio)) {
          setWebrtcStatus('LIVE');
        } else if (hasVideo) {
          setWebrtcStatus('LIVE');
        } else if (connectionState === 'connecting' || iceConnectionState === 'checking') {
          setWebrtcStatus(prev => prev === 'LIVE' ? 'LIVE' : 'CONNECTING');
        } else if (connectionState === 'failed' || connectionState === 'closed') {
          setWebrtcStatus('DISCONNECTED');
        }
      },
      onDisconnected: (reason) => {
        console.log('[InspectorMonitoringPage] WebRTC Disconnected:', reason);
        setWebrtcStatus('DISCONNECTED');
        setWebrtcError(reason || 'Inspector camera stream was disconnected.');
        setHasVideoTrack(false);
        setHasAudioTrack(false);
        setCurrentRemoteStream(null);
        if (videoRef.current) videoRef.current.srcObject = null;
        if (audioRef.current) audioRef.current.srcObject = null;
      }
    }).catch(err => {
      console.error('[InspectorMonitoringPage] WebRTC connection error:', err);
      setWebrtcStatus('ERROR');
      setWebrtcError(err.message || 'Unable to establish peer connection.');
    });

    return () => {
      stopViewerSession();
      if (videoRef.current) videoRef.current.srcObject = null;
      if (audioRef.current) audioRef.current.srcObject = null;
    };
  }, [selectedInspector?.active_session?.id]);

  // Ensure video element plays as soon as track arrives
  useEffect(() => {
    if (videoRef.current && videoRef.current.srcObject && (webrtcStatus === 'LIVE' || hasVideoTrack)) {
      videoRef.current.play().catch(e => console.warn('[Video Retry Note]:', e.message));
    }
  }, [webrtcStatus, hasVideoTrack]);

  // Filter inspectors by search and status chips
  const filteredInspectors = inspectors.filter(insp => {
    const matchesSearch = 
      (insp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (insp.employee_code || insp.badge_number || insp.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (insp.assigned_site_name || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'ONLINE') return insp.is_online;
    if (statusFilter === 'OFFLINE') return !insp.is_online;
    if (statusFilter === 'WITH_CAMERA') return insp.camera_status === 'Live' || insp.camera_status === 'Connecting' || insp.active_session;
    return true;
  });

  // Action Handlers
  const handleRequestCameraShare = async () => {
    if (!selectedInspector) return;
    if (!selectedInspector.is_online) {
      setFeedback({
        type: 'error',
        message: 'Inspector is currently offline. Camera share request cannot be received.'
      });
      return;
    }

    setRequestingCamera(true);
    setFeedback(null);

    try {
      const res = await api.requestLiveShare(selectedInspector.user_id || selectedInspector.id, 'CAMERA');
      if (res && res.success) {
        setFeedback({
          type: 'success',
          message: `Camera share request dispatched to ${selectedInspector.name}. Waiting for Inspector approval...`
        });
        await loadData();
      } else {
        setFeedback({
          type: 'error',
          message: res?.error || 'Failed to dispatch camera share request. Please try again.'
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Request failed: ' + (err.message || 'Network error')
      });
    } finally {
      setRequestingCamera(false);
    }
  };

  const handleEndCameraSession = async () => {
    if (!selectedInspector || !selectedInspector.active_session) return;
    const sessionId = selectedInspector.active_session.id;

    try {
      stopViewerSession();
      setWebrtcStatus('DISCONNECTED');
      setHasVideoTrack(false);
      setHasAudioTrack(false);
      if (videoRef.current) videoRef.current.srcObject = null;
      if (audioRef.current) audioRef.current.srcObject = null;

      const res = await api.stopLiveShareSession(sessionId, 'ADMIN_TERMINATED');
      if (res && res.success) {
        setFeedback({
          type: 'info',
          message: `Camera session with ${selectedInspector.name} ended.`
        });
        await loadData();
      } else {
        setFeedback({
          type: 'error',
          message: res?.error || 'Failed to end camera session.'
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Error ending camera session: ' + err.message
      });
    }
  };

  const handleRequestVoiceChat = async () => {
    if (!selectedInspector) return;
    setRequestingVoice(true);
    setFeedback(null);

    try {
      const activeSessionId = selectedInspector.active_session?.id || null;
      const inspectorId = selectedInspector.user_id || selectedInspector.id;
      const res = await api.requestVoiceChat(activeSessionId, inspectorId);
      if (res && res.success) {
        setFeedback({
          type: 'success',
          message: `Voice chat requested with ${selectedInspector.name}. Waiting for inspector to join...`
        });
        await loadData();
      } else {
        setFeedback({
          type: 'error',
          message: res?.error || 'Voice chat request failed.'
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Voice chat request error: ' + err.message
      });
    } finally {
      setRequestingVoice(false);
    }
  };

  const handleEndVoiceChat = async () => {
    if (!selectedInspector) return;
    const sessionId = selectedInspector.active_session?.id;
    const voiceSessionId = selectedInspector.active_voice?.id;

    try {
      toggleAdminMicrophone(false);
      setIsAdminMicMuted(true);
      const res = await api.endVoiceChat(voiceSessionId, sessionId);
      if (res && res.success) {
        setFeedback({
          type: 'info',
          message: `Voice chat session ended.`
        });
        await loadData();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Error ending voice chat: ' + err.message
      });
    }
  };

  const handleToggleAdminMic = async () => {
    if (!isAdminMicMuted) {
      toggleAdminMicrophone(false);
      setIsAdminMicMuted(true);
    } else {
      try {
        await enableViewerVoiceChat();
        toggleAdminMicrophone(true);
        setIsAdminMicMuted(false);
      } catch (e) {
        setFeedback({ type: 'error', message: 'Microphone error: ' + e.message });
      }
    }
  };

  const handleToggleIncomingAudio = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsIncomingAudioMuted(audioRef.current.muted);
    }
  };

  return (
    <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Header Banner */}
      <div 
        style={{
          padding: '20px 24px',
          background: 'var(--card-bg, #0f172a)',
          border: '1px solid var(--border-subtle, rgba(56, 189, 248, 0.2))',
          borderRadius: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div 
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid var(--accent-cyan, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Radio size={22} color="var(--accent-cyan, #38bdf8)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Inspector Monitoring
              </h1>
              <span 
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 20,
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  color: 'var(--accent-cyan, #38bdf8)'
                }}
              >
                FIELD TELEMETRY & MEDIA
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-dim, #94a3b8)', margin: '4px 0 0' }}>
              Real-time monitoring panel for authorized field auditors. Request live camera sharing and voice discussion on-demand.
            </p>
          </div>
        </div>

        <button 
          onClick={loadData}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          title="Refresh inspector connectivity states"
        >
          <RefreshCw size={13} className={loading ? 'pulse-fast' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2. Feedback Notification Toast */}
      {feedback && (
        <div 
          style={{
            padding: '12px 18px',
            borderRadius: 10,
            background: feedback.type === 'success' 
              ? 'rgba(16, 185, 129, 0.15)' 
              : feedback.type === 'info' 
              ? 'rgba(56, 189, 248, 0.15)' 
              : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${
              feedback.type === 'success' ? '#10b981' : feedback.type === 'info' ? '#38bdf8' : '#ef4444'
            }`,
            color: feedback.type === 'success' ? '#6ee7b7' : feedback.type === 'info' ? '#bae6fd' : '#fca5a5',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} color="#10b981" /> : <AlertTriangle size={16} color="#ef4444" />}
            <span>{feedback.message}</span>
          </div>
          <button 
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 2 }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 3. Responsive 2-Column Workspace (Master List + Detail Monitoring Panel) */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
          alignItems: 'start'
        }}
      >
        {/* ======================================================== */}
        {/* LEFT COLUMN: INSPECTOR ROSTER LIST                       */}
        {/* ======================================================== */}
        <div 
          style={{
            background: 'var(--card-bg, #0f172a)',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
            borderRadius: 14,
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Available Inspectors</span>
              <span style={{ fontSize: 11, background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: 12, color: 'var(--text-dim, #94a3b8)' }}>
                {filteredInspectors.length}
              </span>
            </h2>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={14} color="var(--text-dim, #94a3b8)" style={{ position: 'absolute', left: 10, top: 11 }} />
            <input 
              type="text"
              placeholder="Search by inspector name, ID, site..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input-control"
              style={{ paddingLeft: 32, fontSize: 12 }}
            />
          </div>

          {/* Filter Chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'ONLINE', label: 'Online' },
              { id: 'OFFLINE', label: 'Offline' },
              { id: 'WITH_CAMERA', label: 'Camera Active' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 16,
                  border: statusFilter === f.id ? '1px solid var(--accent-cyan, #38bdf8)' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: statusFilter === f.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: statusFilter === f.id ? 'var(--accent-cyan, #38bdf8)' : 'var(--text-dim, #94a3b8)',
                  cursor: 'pointer'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Inspector Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '640px', overflowY: 'auto' }}>
            {filteredInspectors.length === 0 ? (
              <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-dim, #94a3b8)', fontSize: 13 }}>
                <User size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                <div>No inspectors match the filter criteria.</div>
              </div>
            ) : (
              filteredInspectors.map(insp => {
                const isSelected = selectedInspector && (selectedInspector.id === insp.id || selectedInspector.user_id === insp.user_id);
                const isOnline = insp.is_online;
                const cameraConnected = insp.camera_status === 'Connected';
                const cameraPending = insp.camera_status === 'Request Pending';
                const voiceConnected = insp.voice_status === 'Connected';

                return (
                  <div
                    key={insp.id || insp.user_id}
                    onClick={() => setSelectedInspectorId(insp.id || insp.user_id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: isSelected ? '1.5px solid var(--accent-cyan, #38bdf8)' : '1px solid rgba(255, 255, 255, 0.06)',
                      background: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}
                  >
                    {/* Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ position: 'relative' }}>
                          <img 
                            src={insp.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'} 
                            alt={insp.name}
                            style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                          />
                          <span 
                            style={{
                              position: 'absolute',
                              bottom: -1,
                              right: -1,
                              width: 9,
                              height: 9,
                              borderRadius: '50%',
                              backgroundColor: isOnline ? '#10b981' : '#64748b',
                              border: '2px solid #0f172a'
                            }}
                            title={isOnline ? 'Online' : 'Offline'}
                          />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
                            {insp.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-dim, #94a3b8)' }}>
                            {insp.employee_code || insp.badge_number || insp.user_id || insp.id}
                          </div>
                        </div>
                      </div>

                      {/* Online Status Badge */}
                      <span 
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 4,
                          backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                          color: isOnline ? '#34d399' : '#94a3b8'
                        }}
                      >
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>

                    {/* Site Information */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-dim, #94a3b8)' }}>
                      <MapPin size={11} color="var(--accent-cyan, #38bdf8)" />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {insp.assigned_site_name || 'Site Assignment Pending'}
                      </span>
                    </div>

                    {/* Hardware Modality Status Indicators */}
                    <div style={{ display: 'flex', gap: 6, paddingTop: 4, borderTop: '1px solid rgba(255, 255, 255, 0.04)', fontSize: 10.5 }}>
                      <span 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 6px',
                          borderRadius: 4,
                          backgroundColor: cameraConnected 
                            ? 'rgba(16, 185, 129, 0.2)' 
                            : cameraPending 
                            ? 'rgba(245, 158, 11, 0.2)' 
                            : 'rgba(255, 255, 255, 0.05)',
                          color: cameraConnected ? '#34d399' : cameraPending ? '#fbbf24' : '#64748b',
                          fontWeight: 700
                        }}
                      >
                        <Video size={11} />
                        <span>{insp.camera_status}</span>
                      </span>

                      <span 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 6px',
                          borderRadius: 4,
                          backgroundColor: voiceConnected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          color: voiceConnected ? '#34d399' : '#64748b',
                          fontWeight: 700
                        }}
                      >
                        <Mic size={11} />
                        <span>{insp.voice_status}</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: DETAIL MONITORING PANEL                    */}
        {/* ======================================================== */}
        <div 
          style={{
            background: 'var(--card-bg, #0f172a)',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
            borderRadius: 14,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 18
          }}
        >
          {!selectedInspector ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-dim, #94a3b8)' }}>
              <User size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>No Inspector Selected</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Select an inspector from the roster list on the left to begin monitoring.</div>
            </div>
          ) : (
            <>
              {/* 1. Inspector Detail Header */}
              <div 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  paddingBottom: 16,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  flexWrap: 'wrap',
                  gap: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <img 
                    src={selectedInspector.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'} 
                    alt={selectedInspector.name}
                    style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-cyan, #38bdf8)' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h2 style={{ fontSize: 17, fontWeight: 800, color: '#ffffff', margin: 0 }}>
                        {selectedInspector.name}
                      </h2>
                      <span 
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 4,
                          backgroundColor: selectedInspector.is_online ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                          color: selectedInspector.is_online ? '#34d399' : '#94a3b8'
                        }}
                      >
                        {selectedInspector.is_online ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim, #94a3b8)', marginTop: 2 }}>
                      ID: <strong>{selectedInspector.employee_code || selectedInspector.badge_number || selectedInspector.user_id || selectedInspector.id}</strong> • {selectedInspector.specialization || 'General Infrastructure Inspector'}
                    </div>
                  </div>
                </div>

                {/* Duty Site Pill */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-dim, #94a3b8)' }}>Current Duty Site</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-cyan, #38bdf8)', marginTop: 2 }}>
                    {selectedInspector.assigned_site_name || 'No Site Assigned'}
                  </div>
                </div>
              </div>

              {/* 2. Structured Status Overview Grid (Requirement Section 3) */}
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 10,
                  background: 'rgba(255, 255, 255, 0.02)',
                  padding: 12,
                  borderRadius: 10,
                  border: '1px solid rgba(255, 255, 255, 0.04)'
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim, #94a3b8)' }}>Inspector:</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', marginTop: 2 }}>{selectedInspector.name}</div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim, #94a3b8)' }}>Status:</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: selectedInspector.is_online ? '#34d399' : '#94a3b8', marginTop: 2 }}>
                    {selectedInspector.is_online ? 'Online' : 'Offline'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim, #94a3b8)' }}>Camera:</div>
                  <div style={{ 
                    fontSize: 13, 
                    fontWeight: 700, 
                    color: selectedInspector.camera_status === 'Connected' ? '#34d399' : selectedInspector.camera_status === 'Request Pending' ? '#fbbf24' : '#94a3b8',
                    marginTop: 2 
                  }}>
                    {selectedInspector.camera_status}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim, #94a3b8)' }}>Voice:</div>
                  <div style={{ 
                    fontSize: 13, 
                    fontWeight: 700, 
                    color: selectedInspector.voice_status === 'Connected' ? '#34d399' : selectedInspector.voice_status === 'Request Pending' ? '#fbbf24' : '#94a3b8',
                    marginTop: 2 
                  }}>
                    {selectedInspector.voice_status}
                  </div>
                </div>
              </div>

              {/* 3. Prominent Camera Viewing Area (Requirement Section 4) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Video size={14} color="var(--accent-cyan, #38bdf8)" />
                    <span>Inspector Live Camera Stream</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {webrtcStatus === 'LIVE' && hasVideoTrack && (
                      <button
                        onClick={() => setShowFullscreenModal(true)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 8px',
                          fontSize: 11,
                          fontWeight: 700,
                          borderRadius: 4,
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid var(--accent-cyan, #38bdf8)',
                          color: 'var(--accent-cyan, #38bdf8)',
                          cursor: 'pointer'
                        }}
                        title="Expand camera into Full Screen mode"
                      >
                        <Maximize2 size={12} />
                        <span>Full Screen</span>
                      </button>
                    )}
                    <span 
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 12,
                        backgroundColor: (webrtcStatus === 'LIVE' && hasVideoTrack)
                          ? 'rgba(16, 185, 129, 0.2)' 
                          : (webrtcStatus === 'CONNECTING' && hasVideoTrack)
                          ? 'rgba(56, 189, 248, 0.2)'
                          : (webrtcStatus === 'CONNECTING' || selectedInspector.camera_status === 'Connecting')
                          ? 'rgba(56, 189, 248, 0.2)' 
                          : (selectedInspector.camera_status === 'Waiting for Inspector' || selectedInspector.camera_status === 'Request Pending')
                          ? 'rgba(245, 158, 11, 0.2)' 
                          : selectedInspector.camera_status === 'Rejected'
                          ? 'rgba(239, 68, 68, 0.2)'
                          : 'rgba(255, 255, 255, 0.05)',
                        color: (webrtcStatus === 'LIVE' && hasVideoTrack)
                          ? '#34d399' 
                          : (webrtcStatus === 'CONNECTING' && hasVideoTrack)
                          ? '#38bdf8'
                          : (webrtcStatus === 'CONNECTING' || selectedInspector.camera_status === 'Connecting')
                          ? '#38bdf8' 
                          : (selectedInspector.camera_status === 'Waiting for Inspector' || selectedInspector.camera_status === 'Request Pending')
                          ? '#fbbf24' 
                          : selectedInspector.camera_status === 'Rejected'
                          ? '#f87171'
                          : '#94a3b8',
                        border: `1px solid ${(webrtcStatus === 'LIVE' && hasVideoTrack) ? '#10b981' : (webrtcStatus === 'CONNECTING' || selectedInspector.camera_status === 'Connecting') ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'}`
                      }}
                    >
                      {(webrtcStatus === 'LIVE' && hasVideoTrack)
                        ? '● LIVE' 
                        : (webrtcStatus === 'CONNECTING' && hasVideoTrack)
                        ? 'RECEIVING VIDEO'
                        : (webrtcStatus === 'CONNECTING' || selectedInspector.camera_status === 'Connecting')
                        ? 'CONNECTING...' 
                        : (selectedInspector.camera_status === 'Waiting for Inspector' || selectedInspector.camera_status === 'Request Pending')
                        ? 'WAITING FOR INSPECTOR' 
                        : selectedInspector.camera_status === 'Rejected'
                        ? 'REJECTED'
                        : (webrtcStatus === 'DISCONNECTED')
                        ? 'DISCONNECTED'
                        : 'AVAILABLE'}
                    </span>
                  </div>
                </div>

                {/* 16:9 Prominent Viewport Container (Zero fake images/videos) */}
                <div 
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16 / 9',
                    backgroundColor: '#070b14',
                    border: '1.5px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.6)'
                  }}
                >
                  {/* REAL WEBRTC VIDEO ELEMENT - ALWAYS MOUNTED IN DOM FOR AUTOPLAY */}
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    muted 
                    controls={false}
                    onLoadedMetadata={(e) => {
                      e.target.play().catch(err => console.warn('Loaded metadata play warning:', err));
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
                  {/* REAL WEBRTC AUDIO ELEMENT */}
                  <audio ref={audioRef} autoPlay playsInline style={{ display: 'none' }} />

                  {/* Overlays when Video is LIVE */}
                  {webrtcStatus === 'LIVE' && hasVideoTrack ? (
                    <>
                      {/* Top Left Floating Stream Badge */}
                      <div 
                        style={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          zIndex: 10
                        }}
                      >
                        <span 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            background: 'rgba(220, 38, 38, 0.9)',
                            color: '#ffffff',
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 4,
                            letterSpacing: '0.04em',
                            boxShadow: '0 2px 8px rgba(220, 38, 38, 0.5)'
                          }}
                        >
                          <Radio size={12} className="pulse-fast" />
                          <span>LIVE</span>
                        </span>
                        <span 
                          style={{
                            background: 'rgba(15, 23, 42, 0.85)',
                            color: '#94a3b8',
                            fontSize: 11,
                            padding: '3px 8px',
                            borderRadius: 4,
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                        >
                          WebRTC ICE: {iceState}
                        </span>
                      </div>

                      {/* Top Right Floating Controls */}
                      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, display: 'flex', gap: 8 }}>
                        <button
                          onClick={handleToggleIncomingAudio}
                          style={{
                            background: 'rgba(15, 23, 42, 0.85)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: isIncomingAudioMuted ? '#f87171' : '#34d399',
                            borderRadius: 6,
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5
                          }}
                        >
                          {isIncomingAudioMuted ? <MicOff size={13} /> : <Mic size={13} />}
                          <span>{isIncomingAudioMuted ? 'Unmute Audio' : 'Audio Active'}</span>
                        </button>
                        <button
                          onClick={() => setShowFullscreenModal(true)}
                          style={{
                            background: 'rgba(15, 23, 42, 0.85)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#38bdf8',
                            borderRadius: 6,
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5
                          }}
                        >
                          <Maximize2 size={13} />
                          <span>Full Screen</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    /* Fallback HUD Overlay when NOT Live (sitting on top of video element) */
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
                      {/* CONNECTING HUD */}
                      {webrtcStatus === 'CONNECTING' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 44, height: 44, border: '3px solid rgba(56, 189, 248, 0.2)', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>
                            Establishing WebRTC Peer Connection...
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-dim, #94a3b8)', maxWidth: 380, lineHeight: 1.5 }}>
                            Exchanging SDP offer/answer and negotiating ICE candidates via STUN/TURN relays. Waiting for inspector's device camera stream.
                          </div>
                          <button
                            onClick={handleEndCameraSession}
                            className="btn btn-secondary btn-sm"
                            style={{
                              marginTop: 4,
                              color: '#f87171',
                              borderColor: 'rgba(239, 68, 68, 0.4)',
                              fontSize: 12,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                            title="Reset this connection and return to Available state"
                          >
                            <StopCircle size={13} />
                            <span>Reset / End Connection</span>
                          </button>
                        </div>
                      )}

                      {/* WAITING FOR APPROVAL HUD */}
                      {(selectedInspector.camera_status === 'Waiting for Inspector' || selectedInspector.camera_status === 'Request Pending') && webrtcStatus !== 'CONNECTING' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                          <div 
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: '50%',
                              background: 'rgba(245, 158, 11, 0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1.5px solid #f59e0b'
                            }}
                          >
                            <Clock size={22} color="#f59e0b" className="pulse-fast" />
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>
                            Waiting for Inspector Approval
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-dim, #94a3b8)', maxWidth: 360 }}>
                            A real-time camera share request was sent to {selectedInspector.name}. Once the inspector clicks [Accept], this viewport will display their live camera.
                          </div>
                        </div>
                      )}

                      {/* REJECTED HUD */}
                      {selectedInspector.camera_status === 'Rejected' && webrtcStatus !== 'CONNECTING' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                          <div 
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: '50%',
                              background: 'rgba(239, 68, 68, 0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1.5px solid #ef4444'
                            }}
                          >
                            <X size={22} color="#ef4444" />
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#f87171' }}>
                            Camera Request Declined
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-dim, #94a3b8)', maxWidth: 360 }}>
                            {selectedInspector.name} declined the camera sharing request.
                          </div>
                        </div>
                      )}

                      {/* DISCONNECTED / NOT CONNECTED HUD */}
                      {(webrtcStatus === 'IDLE' || webrtcStatus === 'DISCONNECTED' || webrtcStatus === 'ERROR') && selectedInspector.camera_status !== 'Waiting for Inspector' && selectedInspector.camera_status !== 'Request Pending' && selectedInspector.camera_status !== 'Rejected' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                          <div 
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: '50%',
                              background: 'rgba(148, 163, 184, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid rgba(148, 163, 184, 0.2)'
                            }}
                          >
                            <VideoOff size={22} color="#94a3b8" />
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#cbd5e1' }}>
                            {webrtcStatus === 'DISCONNECTED' ? 'Inspector camera disconnected.' : 'Inspector camera is not connected.'}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-dim, #94a3b8)', maxWidth: 400 }}>
                            {!selectedInspector.is_online ? (
                              <span style={{ color: '#f87171' }}>Inspector is currently offline. Remote camera cannot be requested.</span>
                            ) : (
                              <span>Click <strong>[Request Camera Share]</strong> below to request permission to stream this inspector's live device camera.</span>
                            )}
                          </div>
                          {webrtcError && (
                            <div style={{ fontSize: 11, color: '#f87171', marginTop: 4, background: 'rgba(239, 68, 68, 0.1)', padding: '4px 10px', borderRadius: 6 }}>
                              {webrtcError}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Voice Chat Section (Requirement Section 5) */}
              <div 
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 10,
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div 
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: (selectedInspector.voice_status === 'Live' || selectedInspector.voice_status === 'Connected') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${(selectedInspector.voice_status === 'Live' || selectedInspector.voice_status === 'Connected') ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`
                    }}
                  >
                    {(selectedInspector.voice_status === 'Live' || selectedInspector.voice_status === 'Connected') ? <Mic size={18} color="#10b981" /> : <MicOff size={18} color="#94a3b8" />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
                      Voice Chat: <span style={{ color: (selectedInspector.voice_status === 'Live' || selectedInspector.voice_status === 'Connected') ? '#34d399' : '#94a3b8' }}>{selectedInspector.voice_status}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim, #94a3b8)', marginTop: 2 }}>
                      {(selectedInspector.voice_status === 'Live' || selectedInspector.voice_status === 'Connected') 
                        ? 'Bidirectional audio communication is active.' 
                        : 'Interactive two-way audio discussion during live field inspection.'}
                    </div>
                  </div>
                </div>

                {/* Voice Action Buttons */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {(selectedInspector.voice_status === 'Live' || selectedInspector.voice_status === 'Connected') && (
                    <button
                      onClick={handleToggleAdminMic}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                      title={isAdminMicMuted ? 'Unmute your microphone' : 'Mute your microphone'}
                    >
                      {isAdminMicMuted ? <MicOff size={13} color="#f87171" /> : <Mic size={13} color="#34d399" />}
                      <span>{isAdminMicMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
                    </button>
                  )}

                  {(selectedInspector.voice_status === 'Live' || selectedInspector.voice_status === 'Connected') ? (
                    <button
                      onClick={handleEndVoiceChat}
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)', fontSize: 12 }}
                    >
                      <StopCircle size={13} style={{ marginRight: 4 }} />
                      End Voice Chat
                    </button>
                  ) : (
                    <button
                      onClick={handleRequestVoiceChat}
                      disabled={requestingVoice || !selectedInspector.is_online}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 12 }}
                      title={!selectedInspector.is_online ? 'Inspector is currently offline' : 'Request two-way voice chat with inspector'}
                    >
                      <Mic size={13} style={{ marginRight: 4 }} />
                      {requestingVoice ? 'Requesting...' : 'Request Voice Chat'}
                    </button>
                  )}
                </div>
              </div>

              {/* 5. Master Actions Row (Requirement Section 3 & 6) */}
              <div 
                style={{
                  display: 'flex',
                  gap: 10,
                  flexWrap: 'wrap',
                  paddingTop: 12,
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                {/* Request Camera Share Button */}
                {!(selectedInspector.active_session && selectedInspector.active_session.status === 'ACTIVE') && (
                  <button
                    onClick={handleRequestCameraShare}
                    disabled={requestingCamera || selectedInspector.camera_status === 'Waiting for Inspector' || !selectedInspector.is_online}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    title={!selectedInspector.is_online ? 'Inspector is currently offline' : 'Request real-time camera share'}
                  >
                    <Video size={14} />
                    <span>
                      {requestingCamera 
                        ? 'Dispatching Request...' 
                        : selectedInspector.camera_status === 'Waiting for Inspector' 
                        ? 'Request Pending (Waiting)' 
                        : 'Request Camera Share'}
                    </span>
                  </button>
                )}

                {/* End Camera Session Button */}
                {(selectedInspector.active_session && selectedInspector.active_session.status === 'ACTIVE') && (
                  <button
                    onClick={handleEndCameraSession}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                  >
                    <StopCircle size={14} />
                    <span>End Camera Session</span>
                  </button>
                )}

                {/* Additional Inspector Details info */}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--text-dim, #94a3b8)' }}>
                  {selectedInspector.phone && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Phone size={11} /> {selectedInspector.phone}
                    </span>
                  )}
                  {selectedInspector.email && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Mail size={11} /> {selectedInspector.email}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Real Fullscreen Inspector Camera Modal */}
      <InspectorCameraFullscreenModal
        isOpen={showFullscreenModal}
        onClose={() => setShowFullscreenModal(false)}
        inspector={selectedInspector}
        session={selectedInspector?.active_session}
        stream={currentRemoteStream}
      />
    </div>
  );
}
