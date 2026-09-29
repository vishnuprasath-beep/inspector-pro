import React from 'react';
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Sparkles,
  Radio,
  Mic,
  ArrowRight,
  ShieldCheck,
  QrCode,
  ScanLine,
  MapPin,
  Calendar,
  AlertOctagon,
  ChevronRight,
  Zap,
  Check
} from 'lucide-react';

export default function InspectorDashboardView({
  currentInspector,
  selectedSite,
  zones = [],
  historyList = [],
  allDefects = [],
  pendingLiveRequest,
  onAcceptLiveRequest,
  onDeclineLiveRequest,
  qrVerified,
  qrData,
  onOpenQrScanner,
  onSelectZone,
  onNavigate
}) {
  const pendingCount = zones.filter(z => z.status !== 'INSPECTED').length;
  const completedCount = historyList.length + zones.filter(z => z.status === 'INSPECTED').length;
  const openIssuesCount = allDefects.filter(d => d.status !== 'RESOLVED').length;
  const todayCount = zones.length;

  // Next inspection zone to audit
  const nextZone = zones.find(z => z.status !== 'INSPECTED') || zones[0];

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Welcome & Inspector Profile Bar */}
      <div
        className="glass-card"
        style={{
          padding: '18px 20px',
          borderRadius: 16,
          border: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--card-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img
            src={currentInspector?.avatar_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"}
            alt={currentInspector?.name || "Inspector"}
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #10b981',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
            }}
          />
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
              {getGreeting()}, {currentInspector?.name?.split(' ')[0] || 'Inspector'} 👋
            </h2>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 700, color: '#10b981' }}>{currentInspector?.badge || 'INSP-2026-VP01'}</span>
              <span>&bull;</span>
              <span>{selectedSite?.name || 'Assigned Facility'}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge badge-green" style={{ fontSize: 11, padding: '4px 10px' }}>
            ● ON DUTY
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* 2. Admin Live Stream Request Banner (High Priority Alert) */}
      {pendingLiveRequest && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
            border: '2px solid #ef4444',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.2)',
            animation: 'pulse 2s infinite'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <Radio size={22} className="pulse-active" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-heading)' }}>
                Admin is requesting access to your camera
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                State Directorate Command Center requested a real-time visual inspection feed.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => onDeclineLiveRequest(pendingLiveRequest)}
              className="btn btn-secondary btn-sm"
              style={{ fontWeight: 700, padding: '8px 16px' }}
            >
              Decline
            </button>
            <button
              onClick={() => onAcceptLiveRequest(pendingLiveRequest)}
              className="btn btn-primary btn-sm"
              style={{ fontWeight: 700, padding: '8px 18px', background: '#10b981', borderColor: '#10b981' }}
            >
              <Check size={16} />
              <span>Accept & Start</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Four Useful KPI Summary Cards */}
      <div className="inspector-kpi-grid">
        <div
          className="glass-card"
          style={{
            padding: '16px',
            borderRadius: 14,
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--card-bg)',
            borderLeft: '4px solid #10b981'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Today's Inspections</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <Calendar size={16} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-heading)', marginTop: 8 }}>
            {String(todayCount).padStart(2, '0')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>
            Scheduled zone check-points
          </div>
        </div>

        <div
          className="glass-card"
          style={{
            padding: '16px',
            borderRadius: 14,
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--card-bg)',
            borderLeft: '4px solid #f59e0b'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Pending Inspections</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#f59e0b', marginTop: 8 }}>
            {String(pendingCount).padStart(2, '0')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>
            Awaiting field sign-off
          </div>
        </div>

        <div
          className="glass-card"
          style={{
            padding: '16px',
            borderRadius: 14,
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--card-bg)',
            borderLeft: '4px solid #38bdf8'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Completed</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#38bdf8', marginTop: 8 }}>
            {String(completedCount).padStart(2, '0')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>
            Audited & verified records
          </div>
        </div>

        <div
          className="glass-card"
          style={{
            padding: '16px',
            borderRadius: 14,
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--card-bg)',
            borderLeft: '4px solid #ef4444'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Open Issues</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#ef4444', marginTop: 8 }}>
            {String(openIssuesCount).padStart(2, '0')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>
            Reported defects & hazards
          </div>
        </div>
      </div>

      {/* 4. NEXT INSPECTION Hero Card */}
      {nextZone && (
        <div className="inspector-hero-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                NEXT SCHEDULED INSPECTION
              </span>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-heading)', margin: '4px 0 0' }}>
                {nextZone.name}
              </h3>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span><MapPin size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} /> {selectedSite?.name || 'Assigned Site'}</span>
                <span>&bull;</span>
                <span>{nextZone.floor_level || 'Ground Level'}</span>
                <span>&bull;</span>
                <span>Due: {nextZone.frequency || 'Daily Verification'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {nextZone.priority === 'CRITICAL' ? (
                <span className="badge badge-red" style={{ fontSize: 10 }}>CRITICAL HOLD-POINT</span>
              ) : (
                <span className="badge badge-amber" style={{ fontSize: 10 }}>DAILY CHECK</span>
              )}
              <span className="badge badge-purple" style={{ fontSize: 10 }}>{nextZone.code || 'ZN-01'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingTop: 12, borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              Status: <strong style={{ color: nextZone.status === 'INSPECTED' ? '#10b981' : '#f59e0b' }}>
                {nextZone.status === 'INSPECTED' ? 'Completed' : 'Pending Verification'}
              </strong>
            </div>

            <button
              onClick={() => {
                if (onSelectZone) onSelectZone(nextZone);
                if (onNavigate) onNavigate('start-inspection');
              }}
              className="btn btn-primary"
              style={{
                background: '#10b981',
                borderColor: '#10b981',
                fontWeight: 700,
                fontSize: 13,
                padding: '10px 20px',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Camera size={16} />
              <span>Start Inspection</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* 5. Quick Actions Bar */}
      <div>
        <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 10px 2px' }}>
          Quick Actions
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
          <button
            onClick={() => onNavigate('start-inspection')}
            className="glass-card"
            style={{
              padding: '14px',
              borderRadius: 12,
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--card-bg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center'
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={20} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-heading)' }}>Start Inspection</span>
          </button>

          <button
            onClick={() => onNavigate('ai-inspection')}
            className="glass-card"
            style={{
              padding: '14px',
              borderRadius: 12,
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--card-bg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center'
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-heading)' }}>AI Inspection</span>
          </button>

          <button
            onClick={() => onNavigate('communication')}
            className="glass-card"
            style={{
              padding: '14px',
              borderRadius: 12,
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--card-bg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center'
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Radio size={20} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-heading)' }}>Camera Sharing</span>
          </button>

          <button
            onClick={() => onNavigate('communication')}
            className="glass-card"
            style={{
              padding: '14px',
              borderRadius: 12,
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--card-bg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center'
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mic size={20} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-heading)' }}>Voice Chat</span>
          </button>

          <button
            onClick={() => onNavigate('my-issues')}
            className="glass-card"
            style={{
              padding: '14px',
              borderRadius: 12,
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--card-bg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center'
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-heading)' }}>View Issues</span>
          </button>
        </div>
      </div>

      {/* 6. Physical Site Presence & Anti-Spoofing QR Card */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          borderRadius: 14,
          border: qrVerified ? '1px solid #10b981' : '1px solid var(--border-subtle)',
          backgroundColor: qrVerified ? 'rgba(16, 185, 129, 0.06)' : 'var(--card-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: qrVerified ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.12)', color: qrVerified ? '#10b981' : '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <QrCode size={20} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-heading)' }}>
              {qrVerified ? '✓ Physical Site Presence Verified' : 'Site Presence QR Token'}
            </div>
            <div style={{ fontSize: 11.5, color: qrVerified ? '#10b981' : 'var(--text-muted)' }}>
              {qrVerified
                ? `Authenticated: ${qrData?.site_name || selectedSite?.name}`
                : 'Scan the statutory barcode at facility hold-point'}
            </div>
          </div>
        </div>

        <button
          onClick={onOpenQrScanner}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: 11.5, fontWeight: 700, padding: '7px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <ScanLine size={14} />
          <span>{qrVerified ? 'Re-Verify QR' : 'Scan Site QR'}</span>
        </button>
      </div>
    </div>
  );
}
