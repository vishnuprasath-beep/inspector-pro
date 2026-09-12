import React from 'react';
import { Video, Monitor, Check, X, Bell } from 'lucide-react';

export default function IncomingShareRequestBanner({ request, onAccept, onDecline, processing }) {
  if (!request) return null;

  const isScreen = request.source_type === 'SCREEN';

  return (
    <div 
      style={{
        position: 'sticky',
        top: 10,
        zIndex: 9999,
        margin: '0 12px 16px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        border: '2px solid #38BDF8',
        borderRadius: 16,
        padding: '16px 20px',
        boxShadow: '0 16px 32px rgba(15, 23, 42, 0.4), 0 0 20px rgba(56, 189, 248, 0.25)',
        color: '#ffffff',
        animation: 'slideDown 0.3s ease-out'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div 
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: isScreen ? 'rgba(56, 189, 248, 0.2)' : 'rgba(67, 160, 71, 0.2)',
              border: `1.5px solid ${isScreen ? '#38BDF8' : '#43A047'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {isScreen ? <Monitor size={26} color="#38BDF8" /> : <Video size={26} color="#43A047" />}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: '#DC2626', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                LIVE REQUEST
              </span>
              <span style={{ fontSize: 13, color: '#94A3B8' }}>
                From {request.admin_name || 'Admin'}
              </span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 2px', color: '#ffffff' }}>
              {isScreen ? '🖥 Admin wants to view your screen' : '📹 Admin wants to view your camera'}
            </h3>
            <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0 }}>
              Admin has requested permission to view your {isScreen ? 'screen' : 'live mobile camera'} for remote guidance.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: 'center', width: '100%', maxWidth: 260 }}>
          <button
            onClick={() => onDecline(request)}
            disabled={processing}
            className="btn btn-secondary"
            style={{
              flex: 1,
              minHeight: 44,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: '#f8fafc',
              fontSize: 14,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <X size={16} color="#F87171" />
            <span>Decline</span>
          </button>

          <button
            onClick={() => onAccept(request)}
            disabled={processing}
            className="btn btn-primary"
            style={{
              flex: 1,
              minHeight: 44,
              backgroundColor: '#43A047',
              borderColor: '#43A047',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: '0 4px 14px rgba(67, 160, 71, 0.4)'
            }}
          >
            <Check size={16} />
            <span>Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}
