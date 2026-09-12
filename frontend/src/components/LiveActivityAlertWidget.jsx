import React, { useState, useEffect } from 'react';
import { Radio, Video, Monitor, ExternalLink, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { subscribeToLiveShareUpdates } from '../services/liveShareService';
import LiveVideoModal from './LiveVideoModal';

export default function LiveActivityAlertWidget() {
  const [activeShares, setActiveShares] = useState([]);
  const [selectedSessionForView, setSelectedSessionForView] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToLiveShareUpdates({
      role: 'ADMIN',
      onActiveSharesUpdate: (data) => {
        if (data && Array.isArray(data.active_sessions)) {
          setActiveShares(data.active_sessions);
        }
      },
      intervalMs: 2000
    });

    return () => unsubscribe();
  }, []);

  if (!activeShares || activeShares.length === 0) {
    return null; // Silent when no inspector is streaming to avoid UI clutter
  }

  return (
    <>
      <div 
        style={{
          marginBottom: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          animation: 'fadeIn 0.3s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-heading)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Live Activity ({activeShares.length} Active {activeShares.length === 1 ? 'Share' : 'Shares'})
          </span>
        </div>

        {activeShares.map(session => {
          const isScreen = session.source_type === 'SCREEN';
          return (
            <div
              key={session.id}
              style={{
                background: isScreen 
                  ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(15, 23, 42, 0.05) 100%)' 
                  : 'linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(15, 23, 42, 0.05) 100%)',
                border: `1.5px solid ${isScreen ? '#0284C7' : '#DC2626'}`,
                borderRadius: 14,
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                boxShadow: isScreen 
                  ? '0 4px 16px rgba(2, 132, 199, 0.12)' 
                  : '0 4px 16px rgba(220, 38, 38, 0.12)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div 
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: isScreen ? '#0284C7' : '#DC2626',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {isScreen ? <Monitor size={20} /> : <Video size={20} />}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span 
                      style={{ 
                        fontSize: 11, 
                        fontWeight: 900, 
                        background: isScreen ? '#0284C7' : '#DC2626', 
                        color: '#fff', 
                        padding: '2px 8px', 
                        borderRadius: 4, 
                        letterSpacing: '0.04em' 
                      }}
                    >
                      {isScreen ? 'SCREEN SHARE ACTIVE' : 'LIVE INSPECTOR SHARE'}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>
                      {session.inspector_name || 'Inspector'}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Streaming {isScreen ? 'screen' : 'live camera'} feed in real time via WebRTC
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedSessionForView(session)}
                className="btn btn-primary btn-sm"
                style={{
                  backgroundColor: isScreen ? '#0284C7' : '#DC2626',
                  borderColor: isScreen ? '#0284C7' : '#DC2626',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: 13,
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.15)'
                }}
              >
                <ExternalLink size={14} />
                <span>{isScreen ? 'View Screen' : 'View Live'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Live Video Modal */}
      {selectedSessionForView && (
        <LiveVideoModal 
          session={selectedSessionForView}
          onClose={() => setSelectedSessionForView(null)}
        />
      )}
    </>
  );
}
