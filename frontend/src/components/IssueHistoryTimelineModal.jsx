import React from 'react';
import { 
  History, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  X, 
  Camera, 
  ChevronRight, 
  RotateCcw,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

export default function IssueHistoryTimelineModal({ isOpen, historyData, onClose }) {
  if (!isOpen || !historyData) return null;

  const { issue, original_inspection, timeline = [], current_status } = historyData;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CLOSED':
      case 'FIXED':
      case 'RESOLVED':
        return { bg: '#E8F5E9', color: '#1B5E20', border: '#A5D6A7', text: '✓ Fixed & Closed' };
      case 'STILL_OPEN':
      case 'OPEN':
        return { bg: '#FEF9C3', color: '#854D0E', border: '#FDE047', text: '● Open' };
      case 'REINSPECTION_REQUIRED':
      case 'NEEDS_MORE_WORK':
        return { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5', text: '! Needs More Work' };
      default:
        return { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1', text: status };
    }
  };

  const badge = getStatusBadge(current_status || issue?.status);

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        fontFamily: "'Roboto', 'Inter', sans-serif"
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: 580,
          maxHeight: '88vh',
          overflowY: 'auto',
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '2px solid #C8E6C9',
          boxSizing: 'border-box',
          padding: 24
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div 
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: '#E8F5E9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #A5D6A7'
              }}
            >
              <History size={20} color="#43A047" />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Complete Issue Audit History
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  Issue: <strong>{issue?.title || 'Defect'}</strong>
                </span>
                <span 
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 6,
                    backgroundColor: badge.bg,
                    color: badge.color,
                    border: `1px solid ${badge.border}`
                  }}
                >
                  {badge.text}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Timeline Items */}
        <div style={{ position: 'relative', paddingLeft: 24, marginTop: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Vertical Connecting Line */}
          <div 
            style={{
              position: 'absolute',
              top: 8,
              bottom: 8,
              left: 7,
              width: 2,
              backgroundColor: '#E2E8F0'
            }}
          />

          {timeline.map((item, idx) => {
            const isOriginal = item.step === 'ORIGINAL_INSPECTION' || item.step === 'ISSUE_IDENTIFIED';
            const isLatest = idx === timeline.length - 1;

            let dotColor = '#3B82F6';
            if (item.result === 'FIXED') dotColor = '#10B981';
            else if (item.result === 'STILL_OPEN') dotColor = '#F59E0B';
            else if (item.result === 'NEEDS_MORE_WORK') dotColor = '#EF4444';
            else if (isOriginal) dotColor = '#43A047';

            return (
              <div key={idx} style={{ position: 'relative' }}>
                {/* Node Circle */}
                <div 
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: -24,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    border: `3px solid ${dotColor}`,
                    zIndex: 2
                  }}
                />

                <div 
                  style={{
                    backgroundColor: isLatest ? '#F8FAFC' : '#FFFFFF',
                    borderRadius: 12,
                    border: isLatest ? '1.5px solid #CBD5E1' : '1px solid #E2E8F0',
                    padding: 14,
                    boxShadow: isLatest ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <strong style={{ fontSize: 14, color: '#0F172A' }}>
                      {item.title}
                    </strong>
                    <span style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} />
                      {new Date(item.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>
                    Inspector / Author: <strong>{item.actor}</strong>
                  </div>

                  {item.details && (
                    <p style={{ fontSize: 13, color: '#334155', margin: '4px 0 8px', lineHeight: 1.5 }}>
                      {item.details}
                    </p>
                  )}

                  {item.notes && (
                    <div style={{ backgroundColor: '#F1F5F9', padding: '8px 10px', borderRadius: 8, fontSize: 12, color: '#334155', marginBottom: 8 }}>
                      <strong>Re-Inspection Notes:</strong> {item.notes}
                    </div>
                  )}

                  {item.result && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Outcome:</span>
                      <span 
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 6,
                          backgroundColor: item.result === 'FIXED' ? '#E8F5E9' : item.result === 'STILL_OPEN' ? '#FEF9C3' : '#FEE2E2',
                          color: item.result === 'FIXED' ? '#1B5E20' : item.result === 'STILL_OPEN' ? '#854D0E' : '#991B1B'
                        }}
                      >
                        {item.result}
                      </span>
                    </div>
                  )}

                  {/* Evidence Photo */}
                  {item.photo && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Camera size={12} />
                        <span>{isOriginal ? 'Inspection Photo (Original Evidence)' : 'Re-Inspection Evidence Photo'}</span>
                      </div>
                      <img 
                        src={item.photo} 
                        alt="Evidence" 
                        style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, border: '1px solid #CBD5E1' }}
                      />
                    </div>
                  )}

                  {/* YOLO Result if available */}
                  {item.yolo && (
                    <div style={{ marginTop: 8, padding: '6px 10px', backgroundColor: '#F0FDF4', borderRadius: 6, border: '1px solid #BBF7D0', fontSize: 11, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={13} color="#16A34A" />
                      <span>YOLO Detection: {item.yolo.finding || item.yolo.label} ({(item.yolo.confidence * 100).toFixed(0)}% confidence)</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              backgroundColor: '#43A047',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
}
