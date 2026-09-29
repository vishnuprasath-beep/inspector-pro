import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { subscribeToInspectionStream } from '../services/yoloVisionService';
import LiveMapComponent from '../components/LiveMapComponent';
import InspectionModal from '../components/InspectionModal';
import InspectorCameraFullscreenModal from '../components/InspectorCameraFullscreenModal';
import LiveActivityAlertWidget from '../components/LiveActivityAlertWidget';
import { 
  ClipboardCheck, 
  Clock,
  AlertTriangle,
  Users,
  Video,
  Radio,
  Sparkles,
  FileText,
  RefreshCw,
  MapPin,
  Navigation,
  Crosshair,
  Maximize2,
  Plus,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Building2,
  Zap
} from 'lucide-react';

export default function DashboardPage({ onNavigate, onOpenMobileSim }) {
  const [kpis, setKpis] = useState(null);
  const [sites, setSites] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [recentInspections, setRecentInspections] = useState([]);
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInspectionId, setSelectedInspectionId] = useState(null);
  const [focusedDestination, setFocusedDestination] = useState(null);
  const [autoLocatingName, setAutoLocatingName] = useState('');
  const [liveStreamInfo, setLiveStreamInfo] = useState(null);
  const [showFullscreenCam, setShowFullscreenCam] = useState(false);
  const [reinspectionsCount, setReinspectionsCount] = useState(2);
  const [aiAlertsCount, setAiAlertsCount] = useState(4);

  const loadData = async () => {
    setLoading(true);
    try {
      const [kpiRes, sitesRes, inspRes, inspListRes, reinsRes, alertsRes, defectsRes] = await Promise.all([
        api.getOverviewKpis(),
        api.getSites(),
        api.getInspectors(),
        api.getInspections({ limit: 6 }),
        api.getReinspections(),
        api.getAiAlerts(),
        api.getDefects()
      ]);

      if (kpiRes.success) setKpis(kpiRes.data);
      if (sitesRes.success) setSites(sitesRes.data || []);
      if (inspRes.success) setInspectors(inspRes.data || []);
      if (inspListRes.success) setRecentInspections(inspListRes.data || []);
      if (defectsRes && defectsRes.success) setDefects(defectsRes.data || []);
      if (reinsRes.success && reinsRes.data) {
        setReinspectionsCount(reinsRes.data.filter(r => r.status !== 'COMPLETED').length || reinsRes.data.length);
      }
      if (alertsRes.success && alertsRes.data) {
        setAiAlertsCount(alertsRes.data.filter(a => a.status === 'OPEN').length || alertsRes.data.length);
      }
    } catch (err) {
      console.error('Error loading dashboard command center data:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleStorageUpdate = () => loadData();
    window.addEventListener('inspectra_storage_update', handleStorageUpdate);

    // Real active live shares from server
    api.getActiveLiveShares().then(res => {
      if (res.success && Array.isArray(res.active_sessions) && res.active_sessions.length > 0) {
        const s = res.active_sessions[0];
        setLiveStreamInfo({
          streamActive: true,
          inspector: { name: s.inspector_name },
          site: { name: s.site_name || 'Assigned Site' }
        });
      }
    }).catch(() => {});

    const unsubscribeStream = subscribeToInspectionStream((incoming) => {
      if (incoming && incoming.streamActive) {
        setLiveStreamInfo(incoming);
      }
    });

    return () => {
      window.removeEventListener('inspectra_storage_update', handleStorageUpdate);
      if (unsubscribeStream) unsubscribeStream();
    };
  }, []);

  // Time-aware greeting
  const currentHour = new Date().getHours();
  const greetingText = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  // Derived counts for the 4 primary KPI cards
  const totalInspectionsCount = kpis?.total_inspections ?? 24;
  const pendingInspectionsCount = recentInspections.filter(i => i.status === 'PENDING' || i.status === 'SUBMITTED').length || 8;
  const criticalDefectsList = defects.filter(d => (d.severity === 'CRITICAL' || d.severity === 'HIGH') && d.status !== 'RESOLVED' && d.status !== 'CLOSED');
  const criticalIssuesCount = defects.filter(d => d.severity === 'CRITICAL' && d.status !== 'RESOLVED').length || 3;
  const activeInspectorsCount = inspectors.filter(i => i.is_online || i.live_share_status === 'CAMERA_LIVE').length || 6;

  // AI Safety breakdown counts
  const aiCriticalCount = criticalIssuesCount;
  const aiHighRiskCount = defects.filter(d => d.severity === 'HIGH').length || 7;
  const aiAttentionCount = defects.filter(d => d.severity === 'MEDIUM' || d.severity === 'LOW').length || 12;
  const aiSafeCount = (kpis?.completed_inspections || 30) + 12;
  const totalSafetyItems = aiCriticalCount + aiHighRiskCount + aiAttentionCount + aiSafeCount;

  return (
    <div className="page-body" style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 40 }}>
      {/* 1. Header & Command Center Greeting */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-heading)', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{greetingText}, Admin</span>
            <span>👋</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 0', fontWeight: 500 }}>
            Here's what's happening across your inspection operations.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 20 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} className="pulse-active"></span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>Live System Active</span>
          </div>

          <button
            onClick={loadData}
            title="Refresh live data"
            className="btn btn-secondary btn-sm"
            style={{ height: 38, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} className={loading ? 'pulse-active' : ''} />
            <span style={{ fontSize: 12 }}>Sync</span>
          </button>
        </div>
      </div>

      {/* Real-Time Live Activity Notification Banner */}
      <LiveActivityAlertWidget />

      {/* 2. 4 Focused KPI Command Center Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Card 1: Inspections */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-label" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Inspections
            </span>
            <div className="kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <ClipboardCheck size={20} />
            </div>
          </div>
          <div>
            <div className="kpi-number" style={{ color: 'var(--text-heading)' }}>
              {String(totalInspectionsCount).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>●</span>
              <span>All scheduled checks</span>
            </div>
          </div>
        </div>

        {/* Card 2: Pending */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-label" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pending
            </span>
            <div className="kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Clock size={20} />
            </div>
          </div>
          <div>
            <div className="kpi-number" style={{ color: 'var(--text-heading)' }}>
              {String(pendingInspectionsCount).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>●</span>
              <span>Awaiting review & sign-off</span>
            </div>
          </div>
        </div>

        {/* Card 3: Critical Issues */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-label" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Critical Issues
            </span>
            <div className="kpi-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div>
            <div className="kpi-number" style={{ color: '#ef4444' }}>
              {String(criticalIssuesCount).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>●</span>
              <span>Immediate hazard remediation</span>
            </div>
          </div>
        </div>

        {/* Card 4: Active Inspectors */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #38bdf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-label" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Inspectors
            </span>
            <div className="kpi-icon-wrap" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
              <Users size={20} />
            </div>
          </div>
          <div>
            <div className="kpi-number" style={{ color: 'var(--text-heading)' }}>
              {String(activeInspectorsCount).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 12, color: '#38bdf8', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>●</span>
              <span>Field personnel on duty</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Quick Actions Section */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
            Quick Actions
          </h3>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Frequently used management operations</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
          <button
            onClick={() => onNavigate && onNavigate('inspections')}
            className="quick-action-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 14px',
              borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#10b981',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={16} />
            <span>+ New Inspection</span>
          </button>

          <button
            onClick={() => onNavigate && onNavigate('inspector-monitoring')}
            className="quick-action-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 14px',
              borderRadius: 10,
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: '#38bdf8',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Radio size={16} />
            <span>Inspector Monitoring</span>
          </button>

          <button
            onClick={() => onNavigate && onNavigate('cctv-matrix')}
            className="quick-action-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 14px',
              borderRadius: 10,
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: '#38bdf8',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Video size={16} />
            <span>CCTV Monitoring</span>
          </button>

          <button
            onClick={() => onNavigate && onNavigate('defects', { defectsSeverity: 'CRITICAL' })}
            className="quick-action-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 14px',
              borderRadius: 10,
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#ef4444',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <AlertTriangle size={16} />
            <span>Critical Issues</span>
          </button>

          <button
            onClick={() => onNavigate && onNavigate('reports')}
            className="quick-action-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 14px',
              borderRadius: 10,
              background: 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              color: '#8b5cf6',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <FileText size={16} />
            <span>Reports</span>
          </button>
        </div>
      </div>

      {/* 4. Main Two-Column Layout (Left: Inspection Overview & Tables | Right: Live Monitoring & AI Safety) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1.2fr)', gap: 20, marginBottom: 24 }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Section 6: Inspection Overview */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
                  Inspection Overview
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Real-time operational distribution across active phases
                </p>
              </div>
              <span className="badge badge-green" style={{ fontSize: 11, fontWeight: 700 }}>
                {totalInspectionsCount} Total Audits
              </span>
            </div>

            {/* Segmented Visual Progress Bar */}
            <div style={{ height: 10, width: '100%', background: 'var(--border-subtle)', borderRadius: 6, overflow: 'hidden', display: 'flex', marginBottom: 16 }}>
              <div style={{ width: '46%', background: '#10b981', title: 'Completed' }} />
              <div style={{ width: '21%', background: '#38bdf8', title: 'In Progress' }} />
              <div style={{ width: '25%', background: '#f59e0b', title: 'Pending' }} />
              <div style={{ width: '8%', background: '#8b5cf6', title: 'Re-Inspections' }} />
            </div>

            {/* Metrics Breakdown Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Completed</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981', marginTop: 2 }}>
                  {kpis?.completed_inspections || 11}
                </div>
              </div>

              <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>In Progress</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>
                  05
                </div>
              </div>

              <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Pending</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>
                  {String(pendingInspectionsCount).padStart(2, '0')}
                </div>
              </div>

              <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Re-Inspections</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#8b5cf6', marginTop: 2 }}>
                  {String(reinspectionsCount).padStart(2, '0')}
                </div>
              </div>
            </div>
          </div>

          {/* Section 9: Recent Inspections */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
                  Recent Inspections
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Audits submitted and recorded from field terminals
                </p>
              </div>
              <button 
                onClick={() => onNavigate && onNavigate('inspections')} 
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}
              >
                <span>View All</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Desktop Table View */}
            <div className="table-container desktop-table-view">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Inspection</th>
                    <th>Site</th>
                    <th>Inspector</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInspections.slice(0, 5).map(insp => {
                    const isCompleted = insp.status === 'COMPLETED' || insp.status === 'APPROVED';
                    const isPending = insp.status === 'PENDING' || insp.status === 'SUBMITTED';
                    const isCritical = insp.status === 'FLAGGED';

                    const badgeClass = isCompleted ? 'badge-green' : isPending ? 'badge-amber' : isCritical ? 'badge-red' : 'badge-blue';

                    return (
                      <tr key={insp.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: 13 }}>
                            {insp.title}
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>
                            {insp.id}
                          </div>
                        </td>
                        <td>
                          <div 
                            style={{ color: '#38bdf8', fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}
                            onClick={() => {
                              const matchedSite = sites.find(s => s.id === insp.site_id || s.name === insp.site_name);
                              if (matchedSite) {
                                setFocusedDestination(matchedSite);
                                setAutoLocatingName(matchedSite.name);
                              }
                            }}
                            title="Locate site on map"
                          >
                            {insp.site_name}
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                            {insp.site_code || 'SITE'}
                          </div>
                        </td>
                        <td style={{ fontSize: 12.5, color: 'var(--text-heading)' }}>
                          {insp.inspector_name}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {new Date(insp.date || insp.created_at || Date.now()).toLocaleDateString()}
                        </td>
                        <td>
                          <span className={`badge ${badgeClass}`} style={{ fontSize: 10.5 }}>
                            {insp.status || 'SUBMITTED'}
                          </span>
                        </td>
                        <td>
                          <strong style={{ fontSize: 12.5, color: (insp.compliance_score ?? 85) >= 80 ? '#10b981' : '#ef4444' }}>
                            {insp.compliance_score ?? 85}%
                          </strong>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => setSelectedInspectionId(insp.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: 11, padding: '4px 10px' }}
                          >
                            Dossier
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards View */}
            <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: 10 }}>
              {recentInspections.slice(0, 4).map(insp => (
                <div 
                  key={insp.id} 
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: 'var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: 13, color: 'var(--text-heading)' }}>{insp.title}</strong>
                    <span className={`badge ${insp.status === 'COMPLETED' ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: 10 }}>
                      {insp.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    {insp.site_name} &bull; {insp.inspector_name} &bull; {new Date(insp.date || Date.now()).toLocaleDateString()}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: (insp.compliance_score ?? 85) >= 80 ? '#10b981' : '#ef4444' }}>
                      Score: {insp.compliance_score ?? 85}%
                    </span>
                    <button
                      onClick={() => setSelectedInspectionId(insp.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 11, padding: '3px 8px' }}
                    >
                      Dossier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 10: Critical Issues */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} className="pulse-active"></span>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
                  Critical Issues Requiring Attention
                </h3>
              </div>
              <button 
                onClick={() => onNavigate && onNavigate('defects', { defectsSeverity: 'CRITICAL' })}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11.5 }}
              >
                <span>View All ({criticalDefectsList.length || 3})</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(criticalDefectsList.length > 0 ? criticalDefectsList.slice(0, 3) : [
                {
                  id: 'def-sample-01',
                  title: 'Spalling Delamination along Girder Joint P-14',
                  site_name: 'NH-44 Flyover Sector 9',
                  category: 'STRUCTURAL',
                  severity: 'CRITICAL',
                  inspector_name: 'Vishnu Prasath',
                  status: 'OPEN',
                  date: '2026-09-12'
                },
                {
                  id: 'def-sample-02',
                  title: 'Water Seepage & Cable Corrosion in Substation Pit',
                  site_name: 'Metro Underground Terminal Pier 4',
                  category: 'ELECTRICAL',
                  severity: 'CRITICAL',
                  inspector_name: 'M. Muthukumar',
                  status: 'OPEN',
                  date: '2026-09-13'
                },
                {
                  id: 'def-sample-03',
                  title: 'Deep Scour Excavation Adjacent to Abutment B',
                  site_name: 'Cauvery River Bridge Ext. 2',
                  category: 'FOUNDATION',
                  severity: 'HIGH',
                  inspector_name: 'K. Selvakumar',
                  status: 'ASSIGNED',
                  date: '2026-09-14'
                }
              ]).map((issue, idx) => (
                <div 
                  key={issue.id || idx}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: 'var(--bg-subtle, rgba(255, 255, 255, 0.02))',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: '4px solid #ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12
                  }}
                >
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="badge badge-red" style={{ fontSize: 9.5 }}>
                        {issue.severity || 'CRITICAL'}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>
                        {issue.category || 'STRUCTURAL'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-heading)' }}>
                      {issue.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                      📍 {issue.site_name} &bull; Auditor: {issue.inspector_name || issue.assigned_to || 'Field Auditor'} &bull; {issue.date || 'Recent'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="badge badge-amber" style={{ fontSize: 10 }}>
                      {issue.status || 'OPEN'}
                    </span>
                    <button
                      onClick={() => onNavigate && onNavigate('defects', { defectsSeverity: 'CRITICAL' })}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 11, padding: '5px 12px' }}
                    >
                      Review Issue
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Section 7: Live Monitoring */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Radio size={16} color="#38bdf8" />
                  <span>Live Monitoring</span>
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Real-time telemetry and edge optical feeds
                </p>
              </div>
            </div>

            {/* Sub-Card 1: CCTV Monitoring */}
            <div 
              style={{
                padding: '14px 16px',
                borderRadius: 10,
                background: 'rgba(56, 189, 248, 0.06)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                marginBottom: 14
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Video size={16} color="#38bdf8" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
                      CCTV Monitoring
                    </h4>
                    <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Autonomous edge scanning</span>
                  </div>
                </div>
                <span className="badge badge-green" style={{ fontSize: 9.5 }}>
                  ● 4 NODES ONLINE
                </span>
              </div>

              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '0 0 10px' }}>
                Continuous edge-YOLO hazard detection across perimeter cameras.
              </p>

              <button
                onClick={() => onNavigate && onNavigate('cctv-matrix')}
                className="btn btn-primary btn-sm"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  fontSize: 12,
                  padding: '7px 12px',
                  backgroundColor: '#10b981',
                  borderColor: '#059669'
                }}
              >
                <Video size={13} />
                <span>Open CCTV Matrix</span>
              </button>
            </div>

            {/* Sub-Card 2: Inspector Monitoring (Real connection status) */}
            <div 
              style={{
                padding: '14px 16px',
                borderRadius: 10,
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={16} color="#10b981" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
                      Inspector Monitoring
                    </h4>
                    <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Live telemetry & camera sharing</span>
                  </div>
                </div>
              </div>

              {/* Real Inspector Connection List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                {inspectors.slice(0, 3).map((insp, idx) => {
                  const isCameraLive = insp.live_share_status === 'CAMERA_LIVE' || (liveStreamInfo?.streamActive && liveStreamInfo?.inspector?.name === insp.name);
                  const isOnline = insp.is_online || isCameraLive;

                  return (
                    <div 
                      key={insp.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        borderRadius: 6,
                        background: 'var(--bg-subtle, rgba(255, 255, 255, 0.02))'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img 
                          src={insp.avatar_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"} 
                          alt={insp.name}
                          style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-heading)' }}>
                          {insp.name}
                        </span>
                      </div>

                      {isCameraLive ? (
                        <span className="badge badge-green" style={{ fontSize: 9.5, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} className="pulse-active"></span>
                          Connected
                        </span>
                      ) : isOnline ? (
                        <span className="badge badge-blue" style={{ fontSize: 9.5, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8' }}></span>
                          Available
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#64748b' }}></span>
                          Offline
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {liveStreamInfo?.streamActive && (
                <div style={{ marginBottom: 10, padding: '8px 10px', borderRadius: 6, background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 11, color: '#fca5a5', fontWeight: 600 }}>
                    🔴 {liveStreamInfo.inspector?.name || 'Field Auditor'} is broadcasting live
                  </div>
                  <button
                    onClick={() => setShowFullscreenCam(true)}
                    className="btn btn-sm"
                    style={{ background: '#ef4444', color: '#fff', fontSize: 10, padding: '2px 8px' }}
                  >
                    View Stream
                  </button>
                </div>
              )}

              <button
                onClick={() => onNavigate && onNavigate('inspector-monitoring')}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'center', fontSize: 12, padding: '7px 12px' }}
              >
                <Radio size={13} />
                <span>Launch Inspector Monitoring</span>
              </button>
            </div>
          </div>

          {/* Section 8: Safety / AI Overview */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={16} color="#8b5cf6" />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
                    AI Safety Overview
                  </h3>
                  <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Computer vision & neural inspection</span>
                </div>
              </div>
              <span className="badge badge-purple" style={{ fontSize: 9.5 }}>
                YOLO VISION
              </span>
            </div>

            {/* 4 Status Rows per User Specification */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderRadius: 6, background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: '#ef4444' }}>
                  <span>🔴</span>
                  <span>Critical</span>
                </div>
                <strong style={{ fontSize: 14, color: '#ef4444' }}>
                  {String(aiCriticalCount).padStart(2, '0')}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderRadius: 6, background: 'rgba(249, 115, 22, 0.06)', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: '#f97316' }}>
                  <span>🟠</span>
                  <span>High Risk</span>
                </div>
                <strong style={{ fontSize: 14, color: '#f97316' }}>
                  {String(aiHighRiskCount).padStart(2, '0')}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderRadius: 6, background: 'rgba(234, 179, 8, 0.06)', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: '#eab308' }}>
                  <span>🟡</span>
                  <span>Attention</span>
                </div>
                <strong style={{ fontSize: 14, color: '#eab308' }}>
                  {String(aiAttentionCount).padStart(2, '0')}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: '#10b981' }}>
                  <span>🟢</span>
                  <span>Safe</span>
                </div>
                <strong style={{ fontSize: 14, color: '#10b981' }}>
                  {String(aiSafeCount).padStart(2, '0')}
                </strong>
              </div>
            </div>

            {/* AI Predictive Insight Box */}
            <div 
              style={{
                padding: 12,
                borderRadius: 8,
                background: 'rgba(139, 92, 246, 0.06)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                marginBottom: 12
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Sparkles size={14} color="#8b5cf6" />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase' }}>
                  Neural Predictive Diagnostic
                </span>
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 3 }}>
                NH-44 Pier P-14 Failure Risk at 95%
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                Computer vision detected spalling delamination. Epoxy grouting recommended before monsoon season.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                onClick={() => onNavigate && onNavigate('ai-findings')}
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '7px 10px' }}
              >
                <ShieldAlert size={13} color="#8b5cf6" />
                <span>AI Findings</span>
              </button>
              <button
                onClick={() => onNavigate && onNavigate('ai-inspection')}
                className="btn btn-primary btn-sm"
                style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '7px 10px', background: '#8b5cf6', borderColor: '#7c3aed' }}
              >
                <Zap size={13} />
                <span>AI Inspection</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Section 11: Site / Telemetry Map Area */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={16} color="#10b981" />
              <span>Site Telemetry & Geofencing Map</span>
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Active infrastructure perimeters, health metrics, and field auditor tracking
            </p>
          </div>

          <button 
            onClick={() => onNavigate && onNavigate('live-map')} 
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 11.5 }}
          >
            <span>Full Geofence Map</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {/* Touch-to-Locate Destination Selector Strip */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Navigation size={13} color="#10b981" />
              <span>Touch Destination to Auto-Locate:</span>
            </span>
            {autoLocatingName && (
              <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Crosshair size={12} className="pulse-active" />
                <span>Focused: {autoLocatingName}</span>
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {sites.map(s => {
              const isFocused = focusedDestination?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setFocusedDestination(s);
                    setAutoLocatingName(s.name);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: isFocused ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                    background: isFocused ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-subtle, rgba(255, 255, 255, 0.02))',
                    color: isFocused ? '#10b981' : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <MapPin size={12} color={isFocused ? '#10b981' : 'var(--text-dim)'} />
                  <span>{s.name}</span>
                  <span style={{ fontSize: 9.5, opacity: 0.8, padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.08)' }}>
                    {s.code || 'ZONE'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Real Live Map Component */}
        <LiveMapComponent 
          sites={sites} 
          inspectors={inspectors} 
          height="360px" 
          focusedDestination={focusedDestination}
          onSelectDestination={(site) => {
            setFocusedDestination(site);
            setAutoLocatingName(site.name);
          }}
        />

        {/* Auto-Located Destination Telemetry HUD */}
        {focusedDestination && (
          <div
            style={{
              marginTop: 12,
              padding: '12px 14px',
              borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={18} color="#10b981" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-heading)' }}>
                  {focusedDestination.name} ({focusedDestination.code || 'ZONE'})
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  GPS: <strong>{(focusedDestination.latitude ?? focusedDestination.geo_fence_lat)?.toFixed(4)}° N, {(focusedDestination.longitude ?? focusedDestination.geo_fence_lng)?.toFixed(4)}° E</strong> • Geofence: <strong>{focusedDestination.geofence_radius || 600}m</strong> • Safety Health: <strong style={{ color: '#10b981' }}>{focusedDestination.health_score || 88}%</strong>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => onNavigate && onNavigate('cctv-matrix')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11, padding: '5px 10px' }}
              >
                <Video size={12} />
                <span>View CCTV</span>
              </button>
              <button
                onClick={() => {
                  const lat = focusedDestination.latitude ?? focusedDestination.geo_fence_lat;
                  const lng = focusedDestination.longitude ?? focusedDestination.geo_fence_lng;
                  window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
                }}
                className="btn btn-primary btn-sm"
                style={{ fontSize: 11, padding: '5px 10px' }}
              >
                <Navigation size={12} />
                <span>External Maps</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Inspection Dossier Detail */}
      {selectedInspectionId && (
        <InspectionModal
          inspectionId={selectedInspectionId}
          onClose={() => setSelectedInspectionId(null)}
          onRefresh={loadData}
        />
      )}

      {/* Modal: Full Screen Inspector Live Camera */}
      <InspectorCameraFullscreenModal
        isOpen={showFullscreenCam}
        onClose={() => setShowFullscreenCam(false)}
      />
    </div>
  );
}
