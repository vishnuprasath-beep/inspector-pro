import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Radio,
  ClipboardCheck,
  RotateCcw,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

export default function InspectorNotificationsView({
  notificationsList = [],
  onNavigate,
  onMarkAllRead
}) {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'REQUESTS' | 'INSPECTIONS'

  const unreadCount = notificationsList.filter(n => !n.read).length;

  const filteredList = notificationsList.filter(n => {
    if (filter === 'REQUESTS') return n.type === 'CAMERA_REQUEST' || n.type === 'VOICE_REQUEST';
    if (filter === 'INSPECTIONS') return n.type === 'INSPECTION_ASSIGNED' || n.type === 'REINSPECTION_REQUEST';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
              Notification Center
            </h2>
            {unreadCount > 0 && (
              <span className="badge badge-red" style={{ fontSize: 11 }}>
                {unreadCount} UNREAD
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Real-time administrative orders, camera requests, and hold-point notifications.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(16, 185, 129, 0.08)', padding: 3, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            {['ALL', 'REQUESTS', 'INSPECTIONS'].map(key => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 11.5,
                  fontWeight: filter === key ? 800 : 600,
                  cursor: 'pointer',
                  background: filter === key ? 'var(--card-bg)' : 'transparent',
                  color: filter === key ? '#10b981' : 'var(--text-muted)',
                  boxShadow: filter === key ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                {key}
              </button>
            ))}
          </div>

          {onMarkAllRead && (
            <button
              onClick={onMarkAllRead}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <CheckCheck size={13} />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredList.length === 0 ? (
          <div
            className="glass-card"
            style={{
              padding: 40,
              textAlign: 'center',
              borderRadius: 14,
              border: '1px dashed var(--border-subtle)',
              color: 'var(--text-muted)'
            }}
          >
            <Bell size={36} color="var(--text-dim)" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>
              No New Notifications
            </h4>
            <p style={{ margin: '6px 0 0', fontSize: 12.5 }}>
              You are completely caught up with all field directives and hold-point assignments.
            </p>
          </div>
        ) : (
          filteredList.map((notif, idx) => {
            const isRequest = notif.type === 'CAMERA_REQUEST' || notif.type === 'VOICE_REQUEST';
            const isReinspection = notif.type === 'REINSPECTION_REQUEST';

            return (
              <div
                key={notif.id || idx}
                className="glass-card"
                style={{
                  padding: '14px 18px',
                  borderRadius: 14,
                  border: `1px solid ${notif.read ? 'var(--border-subtle)' : isRequest ? '#ef4444' : '#10b981'}`,
                  backgroundColor: notif.read ? 'var(--card-bg)' : isRequest ? 'rgba(239, 68, 68, 0.04)' : 'rgba(16, 185, 129, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: isRequest ? 'rgba(239, 68, 68, 0.12)' : isReinspection ? 'rgba(139, 92, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                      color: isRequest ? '#ef4444' : isReinspection ? '#8b5cf6' : '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {isRequest ? <Radio size={18} /> : isReinspection ? <RotateCcw size={18} /> : <ClipboardCheck size={18} />}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: 14, color: 'var(--text-heading)' }}>
                        {notif.title || notif.message}
                      </strong>
                      {!notif.read && (
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: isRequest ? '#ef4444' : '#10b981' }} />
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                      {notif.body || notif.details || notif.message}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 4 }}>
                      {notif.timestamp ? new Date(notif.timestamp).toLocaleTimeString() : 'Just now'}
                    </div>
                  </div>
                </div>

                {isRequest && (
                  <button
                    onClick={() => onNavigate && onNavigate('communication')}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: 11, fontWeight: 700, padding: '6px 14px', background: '#ef4444', borderColor: '#ef4444' }}
                  >
                    Open Live Feed
                  </button>
                )}
                {isReinspection && (
                  <button
                    onClick={() => onNavigate && onNavigate('my-inspections')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 11, fontWeight: 700, padding: '6px 14px' }}
                  >
                    View Order
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
