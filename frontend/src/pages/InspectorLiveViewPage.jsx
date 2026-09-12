import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Video, 
  Monitor, 
  Clock, 
  User, 
  MapPin, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  History,
  ShieldCheck,
  Mic,
  MicOff,
  Bell,
  Check,
  X
} from 'lucide-react';
import api from '../services/api';
import { subscribeToLiveShareUpdates } from '../services/liveShareService';
import LiveVideoModal from '../components/LiveVideoModal';

export default function InspectorLiveViewPage() {
  const [inspectors, setInspectors] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [history, setHistory] = useState([]);
  const [requestsList, setRequestsList] = useState([]);
  const [activeTabFilter, setActiveTabFilter] = useState('ALL'); // 'ALL' | 'ONLINE' | 'ACTIVE_SHARES' | 'VOICE' | 'HISTORY'
  const [selectedSessionForView, setSelectedSessionForView] = useState(null);
  const [requestingMap, setRequestingMap] = useState({});
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load initial roster, active shares, requests, and history
  const loadData = async () => {
    try {
      const [sharesRes, histRes, reqRes] = await Promise.all([
        api.getActiveLiveShares(),
        api.getLiveShareHistory(),
        api.getLiveShareRequests()
      ]);

      if (sharesRes.success) {
        setInspectors(sharesRes.inspectors || []);
        setActiveSessions(sharesRes.active_sessions || []);
      }
      if (histRes.success) {
        setHistory(histRes.data || []);
      }
      if (reqRes.success) {
        setRequestsList(reqRes.data || []);
      }
    } catch (e) {
      console.error('Failed to load live share data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to real-time 2s updates
    const unsubscribe = subscribeToLiveShareUpdates({
      role: 'ADMIN',
      onActiveSharesUpdate: (data) => {
        if (data) {
          setInspectors(data.inspectors || []);
          setActiveSessions(data.active_sessions || []);
        }
      },
      intervalMs: 2000
    });

    return () => unsubscribe();
  }, []);

  // Handle Admin Requesting Camera or Screen
  const handleRequestAccess = async (inspectorUserId, sourceType) => {
    setRequestingMap(prev => ({ ...prev, [`${inspectorUserId}_${sourceType}`]: true }));
    setFeedbackMsg(null);

    try {
      const res = await api.requestLiveShare(inspectorUserId, sourceType);
      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Request dispatched! ${sourceType.toLowerCase()} access requested. Waiting for inspector to accept.`
        });
        loadData();
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'Failed to dispatch request.' });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Error requesting live share.' });
    } finally {
      setRequestingMap(prev => ({ ...prev, [`${inspectorUserId}_${sourceType}`]: false }));
    }
  };

  // Filter inspectors according to sub-tab
  const filteredInspectors = inspectors.filter(insp => {
    const activeShare = activeSessions.find(s => s.inspector_id === insp.user_id);
    if (activeTabFilter === 'ONLINE') return insp.is_online;
    if (activeTabFilter === 'ACTIVE_SHARES') return !!activeShare;
    if (activeTabFilter === 'VOICE') return insp.voice_status === 'CONNECTED';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(67, 160, 71, 0.12) 0%, rgba(15, 23, 42, 0.04) 100%)',
          border: '1.5px solid var(--color-border, #C8E6C9)',
          borderRadius: 18,
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-primary, #43A047)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Real-Time Remote Support & Voice Guidance
            </span>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: '#E8F5E9', color: '#1B5E20', fontWeight: 700 }}>
              WEBRTC ENCRYPTED
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 4px' }}>
            Inspector Live
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
            Request permission to view an inspector's mobile camera or screen with interactive bidirectional voice discussion.
          </p>
        </div>

        <button 
          onClick={loadData}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} className={loading ? 'pulse-fast' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Feedback Toast Banner */}
      {feedbackMsg && (
        <div 
          style={{
            padding: '12px 18px',
            borderRadius: 12,
            backgroundColor: feedbackMsg.type === 'success' ? 'rgba(67, 160, 71, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1.5px solid ${feedbackMsg.type === 'success' ? '#43A047' : '#EF4444'}`,
            color: feedbackMsg.type === 'success' ? '#1B5E20' : '#B91C1C',
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          {feedbackMsg.type === 'success' ? <CheckCircle2 size={18} color="#43A047" /> : <AlertTriangle size={18} color="#EF4444" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Sub-Navigation Pills (Section 24 Requirement) */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { id: 'ALL', label: `All Inspectors (${inspectors.length})` },
          { id: 'ONLINE', label: `Online Inspectors (${inspectors.filter(i => i.is_online).length})` },
          { id: 'ACTIVE_SHARES', label: `Active Camera Shares (${activeSessions.filter(s => s.source_type === 'CAMERA').length})` },
          { id: 'VOICE', label: `Voice Chats (${inspectors.filter(i => i.voice_status === 'CONNECTED').length})` },
          { id: 'REQUESTS', label: `Camera Requests (${requestsList.length})` },
          { id: 'HISTORY', label: `Share History (${history.length})` }
        ].map(tab => {
          const isSelected = activeTabFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabFilter(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                border: isSelected ? '1.5px solid #43A047' : '1px solid var(--color-border, #E2E8F0)',
                backgroundColor: isSelected ? '#43A047' : 'var(--card-bg, #FFFFFF)',
                color: isSelected ? '#FFFFFF' : 'var(--text-secondary, #64748B)',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Requests Table */}
      {activeTabFilter === 'REQUESTS' && (
        <div 
          style={{
            backgroundColor: 'var(--card-bg, #FFFFFF)',
            border: '1px solid var(--color-border, #E2E8F0)',
            borderRadius: 16,
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
            Camera & Screen Requests Ledger
          </h3>
          {requestsList.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No access requests dispatched yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '10px 12px' }}>Inspector</th>
                    <th style={{ padding: '10px 12px' }}>Requested By</th>
                    <th style={{ padding: '10px 12px' }}>Type</th>
                    <th style={{ padding: '10px 12px' }}>Time</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requestsList.map(req => (
                    <tr key={req.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-heading)' }}>
                        {req.inspector_name}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                        {req.admin_name}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: req.source_type === 'SCREEN' ? 'rgba(2,132,199,0.1)' : 'rgba(67,160,71,0.1)', color: req.source_type === 'SCREEN' ? '#0284C7' : '#1B5E20' }}>
                          {req.source_type}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                        {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ 
                          fontWeight: 700, 
                          color: req.status === 'ACCEPTED' ? '#43A047' : req.status === 'PENDING' ? '#F59E0B' : '#EF4444' 
                        }}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Inspector Live Share Roster Cards */}
      {activeTabFilter !== 'REQUESTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {filteredInspectors.map(insp => {
              const activeShare = activeSessions.find(s => s.inspector_id === insp.user_id);
              const isCameraLive = activeShare && activeShare.source_type === 'CAMERA';
              const isScreenLive = activeShare && activeShare.source_type === 'SCREEN';
              const isVoiceConnected = insp.voice_status === 'CONNECTED';
              const reqCamLoading = requestingMap[`${insp.user_id}_CAMERA`];
              const reqScreenLoading = requestingMap[`${insp.user_id}_SCREEN`];

              return (
                <div
                  key={insp.id}
                  style={{
                    backgroundColor: 'var(--card-bg, #FFFFFF)',
                    border: (isCameraLive || isScreenLive) 
                      ? `2px solid ${isCameraLive ? '#DC2626' : '#0284C7'}` 
                      : '1px solid var(--color-border, #E2E8F0)',
                    borderRadius: 16,
                    padding: 20,
                    boxShadow: (isCameraLive || isScreenLive) 
                      ? '0 8px 24px rgba(0,0,0,0.08)' 
                      : '0 2px 8px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14
                  }}
                >
                  {/* Officer Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div 
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          backgroundColor: 'var(--color-primary-surface, #E8F5E9)',
                          color: 'var(--color-primary-dark, #1B5E20)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: 16
                        }}
                      >
                        {insp.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
                          {insp.name}
                        </h3>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          Badge: {insp.badge_number || 'INSP-2026'}
                        </span>
                      </div>
                    </div>

                    {/* Online / Active Status Badge */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span 
                        style={{
                          fontSize: 11,
                          padding: '3px 8px',
                          borderRadius: 20,
                          fontWeight: 700,
                          backgroundColor: (isCameraLive || isScreenLive) 
                            ? (isCameraLive ? '#DC2626' : '#0284C7') 
                            : insp.is_online ? 'rgba(67, 160, 71, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                          color: (isCameraLive || isScreenLive) ? '#ffffff' : insp.is_online ? '#1B5E20' : '#64748B'
                        }}
                      >
                        {isCameraLive ? '● CAMERA LIVE' : isScreenLive ? '● SCREEN LIVE' : insp.is_online ? '● Online' : '● Offline'}
                      </span>

                      {isVoiceConnected && (
                        <span 
                          style={{
                            fontSize: 10,
                            padding: '2px 6px',
                            borderRadius: 12,
                            fontWeight: 800,
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#059669',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3
                          }}
                        >
                          <Mic size={10} />
                          <span>Voice Connected</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Facility Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <MapPin size={15} color="var(--color-primary, #43A047)" />
                    <span>{insp.assigned_site_name || 'Central Terminal'}</span>
                  </div>

                  {/* Live Share Status Description */}
                  <div 
                    style={{
                      backgroundColor: 'var(--bg-primary, #F8FAFC)',
                      padding: '8px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>Camera: <strong>{isCameraLive ? 'Broadcasting Live' : 'Not Sharing'}</strong></span>
                    <span>Screen: <strong>{isScreenLive ? 'Broadcasting Live' : 'Not Sharing'}</strong></span>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    {isCameraLive ? (
                      <button
                        onClick={() => setSelectedSessionForView(activeShare)}
                        className="btn btn-primary"
                        style={{
                          flex: 1,
                          minHeight: 44,
                          backgroundColor: '#DC2626',
                          borderColor: '#DC2626',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6
                        }}
                      >
                        <Video size={16} />
                        <span>View Camera</span>
                      </button>
                    ) : isScreenLive ? (
                      <button
                        onClick={() => setSelectedSessionForView(activeShare)}
                        className="btn btn-primary"
                        style={{
                          flex: 1,
                          minHeight: 44,
                          backgroundColor: '#0284C7',
                          borderColor: '#0284C7',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6
                        }}
                      >
                        <Monitor size={16} />
                        <span>View Screen</span>
                      </button>
                    ) : !insp.is_online ? (
                      <button
                        disabled
                        className="btn btn-secondary"
                        style={{ flex: 1, minHeight: 40, opacity: 0.6, cursor: 'not-allowed' }}
                      >
                        Request Unavailable
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRequestAccess(insp.user_id, 'CAMERA')}
                          disabled={reqCamLoading}
                          className="btn btn-secondary"
                          style={{
                            flex: 1,
                            minHeight: 40,
                            fontSize: 12,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                          }}
                        >
                          <Video size={14} />
                          <span>{reqCamLoading ? 'Requesting...' : 'Request Camera'}</span>
                        </button>

                        <button
                          onClick={() => handleRequestAccess(insp.user_id, 'SCREEN')}
                          disabled={reqScreenLoading}
                          className="btn btn-secondary"
                          style={{
                            flex: 1,
                            minHeight: 40,
                            fontSize: 12,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                          }}
                        >
                          <Monitor size={14} />
                          <span>{reqScreenLoading ? 'Requesting...' : 'Request Screen'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Live Share History Table */}
      <div 
        style={{
          backgroundColor: 'var(--card-bg, #FFFFFF)',
          border: '1px solid var(--color-border, #E2E8F0)',
          borderRadius: 16,
          padding: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <History size={18} color="var(--color-primary, #43A047)" />
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
            Live Share History
          </h3>
        </div>

        {history.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            No previous live share sessions logged yet.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '10px 12px' }}>Inspector</th>
                  <th style={{ padding: '10px 12px' }}>Type</th>
                  <th style={{ padding: '10px 12px' }}>Started At</th>
                  <th style={{ padding: '10px 12px' }}>Duration</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-heading)' }}>
                      {item.inspector_name || 'Inspector'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span 
                        style={{
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          backgroundColor: item.source_type === 'SCREEN' ? 'rgba(2, 132, 199, 0.15)' : 'rgba(67, 160, 71, 0.15)',
                          color: item.source_type === 'SCREEN' ? '#0284C7' : '#1B5E20'
                        }}
                      >
                        {item.source_type}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                      {new Date(item.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                      {item.duration || '0m 45s'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ color: '#43A047', fontWeight: 700 }}>
                        {item.status || 'COMPLETED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Live Video Modal with Voice Chat */}
      {selectedSessionForView && (
        <LiveVideoModal 
          session={selectedSessionForView}
          inspector={inspectors.find(i => i.user_id === selectedSessionForView.inspector_id)}
          onClose={() => {
            setSelectedSessionForView(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
