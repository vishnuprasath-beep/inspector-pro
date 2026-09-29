import React, { useState, useEffect } from 'react';
import {
  Radio,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Check,
  X,
  ShieldCheck,
  Clock,
  User,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import InspectorLiveShareCard from '../InspectorLiveShareCard';

export default function InspectorCommunicationView({
  currentInspector,
  pendingLiveRequest,
  onAcceptLiveRequest,
  onDeclineLiveRequest,
  incomingVoiceRequest,
  onVoiceSessionChange,
  liveShareCardRef
}) {
  const [activeTab, setActiveTab] = useState('CAMERA'); // 'CAMERA' | 'VOICE'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-blue" style={{ fontSize: 10 }}>WEBRTC SECURE TUNNEL</span>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
              Live Communication Station
            </h2>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Real-time peer-to-peer live camera broadcasting and encrypted two-way voice chat.
          </p>
        </div>

        {/* Tab Toggle: Camera Sharing vs Voice Chat */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(56, 189, 248, 0.08)', padding: 3, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setActiveTab('CAMERA')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              fontSize: 12,
              fontWeight: activeTab === 'CAMERA' ? 800 : 600,
              cursor: 'pointer',
              background: activeTab === 'CAMERA' ? 'var(--card-bg)' : 'transparent',
              color: activeTab === 'CAMERA' ? '#0284c7' : 'var(--text-muted)',
              boxShadow: activeTab === 'CAMERA' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Video size={14} />
            <span>Camera Sharing</span>
          </button>
          <button
            onClick={() => setActiveTab('VOICE')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              fontSize: 12,
              fontWeight: activeTab === 'VOICE' ? 800 : 600,
              cursor: 'pointer',
              background: activeTab === 'VOICE' ? 'var(--card-bg)' : 'transparent',
              color: activeTab === 'VOICE' ? '#0284c7' : 'var(--text-muted)',
              boxShadow: activeTab === 'VOICE' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Mic size={14} />
            <span>Voice Chat</span>
          </button>
        </div>
      </div>

      {/* Incoming Request Dialog (Requirement 8 & 9) */}
      {pendingLiveRequest && (
        <div
          className="glass-card"
          style={{
            padding: '20px',
            borderRadius: 16,
            border: '2px solid #ef4444',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
            boxShadow: '0 8px 32px rgba(239, 68, 68, 0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <Radio size={26} className="pulse-active" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-heading)' }}>
                Admin is requesting access to your camera.
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                Officer: <strong style={{ color: '#ef4444' }}>{pendingLiveRequest.requester_name || 'State Directorate Admin'}</strong>
                {pendingLiveRequest.notes ? ` — "${pendingLiveRequest.notes}"` : ''}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => onDeclineLiveRequest(pendingLiveRequest)}
              className="btn btn-secondary"
              style={{ fontWeight: 700, padding: '8px 18px' }}
            >
              Decline
            </button>
            <button
              onClick={() => onAcceptLiveRequest(pendingLiveRequest)}
              className="btn btn-primary"
              style={{ fontWeight: 800, padding: '8px 22px', background: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Check size={16} />
              <span>Accept</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Working WebRTC Component (Preserves 100% of the tested live session logic) */}
      <div style={{ width: '100%' }}>
        <InspectorLiveShareCard
          ref={liveShareCardRef}
          inspector={currentInspector}
          hasPendingRequest={!!pendingLiveRequest}
          incomingVoiceRequest={incomingVoiceRequest}
          onVoiceSessionChange={onVoiceSessionChange}
        />
      </div>
    </div>
  );
}
