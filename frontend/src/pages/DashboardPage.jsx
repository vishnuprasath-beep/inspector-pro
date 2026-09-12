import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { subscribeToInspectionStream } from '../services/yoloVisionService';
import StatCard from '../components/StatCard';
import LiveMapComponent from '../components/LiveMapComponent';
import InspectionModal from '../components/InspectionModal';
import { 
  ClipboardCheck, 
  AlertOctagon, 
  ShieldAlert, 
  AlertTriangle,
  CheckCircle2, 
  TrendingUp, 
  Building2, 
  Users, 
  ArrowRight,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Radio,
  Video,
  MapPin,
  Navigation,
  Crosshair,
  Maximize2,
  Plus,
  FileText,
  Edit2,
  Trash2
} from 'lucide-react';
import InspectorCameraFullscreenModal from '../components/InspectorCameraFullscreenModal';
import LiveActivityAlertWidget from '../components/LiveActivityAlertWidget';

export default function DashboardPage({ onNavigate, onOpenMobileSim }) {
  const [kpis, setKpis] = useState(null);
  const [sites, setSites] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [recentInspections, setRecentInspections] = useState([]);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInspectionId, setSelectedInspectionId] = useState(null);
  const [focusedDestination, setFocusedDestination] = useState(null);
  const [autoLocatingName, setAutoLocatingName] = useState('');
  const [liveStreamInfo, setLiveStreamInfo] = useState(null);
  const [showFullscreenCam, setShowFullscreenCam] = useState(false);
  const [coverage, setCoverage] = useState(null);
  const [reinspectionsCount, setReinspectionsCount] = useState(2);
  const [aiAlertsCount, setAiAlertsCount] = useState(4);

  const loadData = async () => {
    setLoading(true);
    try {
      const [kpiRes, sitesRes, inspRes, inspListRes, trendsRes, covRes, reinsRes, alertsRes] = await Promise.all([
        api.getOverviewKpis(),
        api.getSites(),
        api.getInspectors(),
        api.getInspections({ limit: 5 }),
        api.getHistoricalTrends(),
        api.getInspectionCoverage(),
        api.getReinspections(),
        api.getAiAlerts()
      ]);

      if (kpiRes.success) setKpis(kpiRes.data);
      if (sitesRes.success) setSites(sitesRes.data);
      if (inspRes.success) setInspectors(inspRes.data);
      if (inspListRes.success) setRecentInspections(inspListRes.data);
      if (trendsRes.success) setTrends(trendsRes.data);
      if (covRes.success) setCoverage(covRes.data);
      if (reinsRes.success && reinsRes.data) {
        setReinspectionsCount(reinsRes.data.filter(r => r.status !== 'COMPLETED').length || reinsRes.data.length);
      }
      if (alertsRes.success && alertsRes.data) {
        setAiAlertsCount(alertsRes.data.filter(a => a.status === 'OPEN').length || alertsRes.data.length);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleStorageUpdate = () => loadData();
    window.addEventListener('inspectra_storage_update', handleStorageUpdate);

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

  return (
    <div className="page-body">
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
            Admin Panel
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4, marginBottom: 0 }}>
            Manage inspectors and review results.
          </p>
        </div>

        {/* Main Action Buttons: + Add Inspector and View Reports */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigate && onNavigate('inspectors')}
            data-tooltip="Add new inspector"
            className="btn btn-primary"
            style={{
              minHeight: 44,
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 'var(--radius-md, 14px)'
            }}
          >
            <Plus size={16} />
            <span>+ Add Inspector</span>
          </button>

          <button
            onClick={() => onNavigate && onNavigate('reports')}
            data-tooltip="See all inspection reports"
            className="btn btn-secondary"
            style={{
              minHeight: 44,
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 'var(--radius-md, 14px)'
            }}
          >
            <FileText size={16} />
            <span>View Reports</span>
          </button>

          <button
            onClick={loadData}
            data-tooltip="Refresh live data"
            className="btn btn-secondary btn-sm"
            style={{ minHeight: 44, padding: '10px 14px' }}
          >
            <RefreshCw size={15} className={loading ? 'pulse-active' : ''} />
          </button>
        </div>
      </div>

      {/* Real-Time Inspector Live Share Activity Banner */}
      <LiveActivityAlertWidget />

      {/* Section 11: 18-Zone Inspection Coverage & Hold-Point Assurance Strip */}
      <div
        style={{
          background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.7) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: 12,
          padding: '14px 18px',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Building2 size={22} color="var(--accent-cyan)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#ffffff' }}>
                Site Construction Assurance: 18 Inspection Zones
              </span>
              <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 12, background: 'rgba(56, 189, 248, 0.2)', color: 'var(--accent-cyan)' }}>
                {coverage?.coverage_percentage ?? 61}% AUDITED
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
              <span>🟢 {coverage?.inspected_zones ?? 11} Inspected</span> &bull; 
              <span style={{ color: '#f87171', fontWeight: 600 }}> 🔴 {coverage?.critical_pending ?? 3} Critical Hold-Points</span> &bull; 
              <span style={{ color: '#fca5a5' }}> 🔴 {coverage?.overdue_inspections ?? 2} Overdue</span> &bull; 
              <span style={{ color: '#38bdf8' }}> 🔵 {coverage?.active_ai_alerts ?? 3} AI Alerts</span> &bull; 
              <span style={{ color: '#fb923c' }}> 🟠 {coverage?.open_defects ?? 4} Defects</span> &bull; 
              <span style={{ color: '#c084fc' }}> 🟣 {coverage?.reinspections_due ?? 2} Reinspections Due</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate && onNavigate('zones')}
          className="btn btn-primary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '8px 14px' }}
        >
          <span>Open 18-Zone Building Map</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Dual Command Strip: Autonomous CCTV Matrix + Live Field Stream */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Strip 1: 24/7 Autonomous CCTV Edge-YOLO Matrix */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 18px',
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.14) 0%, rgba(56, 189, 248, 0.08) 100%)',
            borderRadius: 12,
            border: '1px solid rgba(16, 185, 129, 0.35)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #10b981'
              }}
            >
              <Video size={20} color="#34d399" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: '#ffffff' }}>
                  24/7 CCTV AI Matrix
                </h3>
                <span
                  style={{
                    padding: '1px 6px',
                    borderRadius: 12,
                    fontSize: 9,
                    fontWeight: 800,
                    backgroundColor: 'rgba(16, 185, 129, 0.25)',
                    color: '#34d399',
                    border: '1px solid #10b981'
                  }}
                >
                  ● 4 NODES ONLINE
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>
                78% Headcount Optimization • Continuous Edge-YOLO scanning
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate && onNavigate('cctv-matrix')}
            className="btn btn-primary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11.5,
              padding: '6px 12px',
              backgroundColor: '#10b981',
              borderColor: '#059669',
              cursor: 'pointer'
            }}
          >
            <Video size={13} />
            <span>Open CCTV Grid</span>
          </button>
        </div>

        {/* Strip 2: Mobile Inspector Live Telemetry Stream */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 18px',
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.14) 0%, rgba(56, 189, 248, 0.08) 100%)',
            borderRadius: 12,
            border: '1px solid rgba(239, 68, 68, 0.35)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(239, 68, 68, 0.5)'
              }}
            >
              <Radio size={20} color="#ef4444" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: '#ffffff' }}>
                  Field Inspector Live Stream
                </h3>
                <span
                  style={{
                    padding: '1px 6px',
                    borderRadius: 12,
                    fontSize: 9,
                    fontWeight: 800,
                    backgroundColor: liveStreamInfo?.streamActive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                    color: liveStreamInfo?.streamActive ? '#34d399' : '#f87171',
                    border: `1px solid ${liveStreamInfo?.streamActive ? '#10b981' : '#ef4444'}`
                  }}
                >
                  {liveStreamInfo?.streamActive ? '● MOBILE CAM LIVE' : '● 1 ACTIVE AUDIT'}
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>
                {liveStreamInfo?.streamActive
                  ? `${liveStreamInfo.inspector?.name || 'R. Saravanan'} streaming live from ${liveStreamInfo.site?.name || 'Assigned Site'}`
                  : 'R. Saravanan streaming from Delhi Metro Phase 2'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => setShowFullscreenCam(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11.5,
                padding: '6px 12px',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                borderRadius: 6,
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Open Inspector Camera in Full Screen Mode"
            >
              <Maximize2 size={13} />
              <span>Full Screen Camera</span>
            </button>

            <button
              onClick={() => onNavigate && onNavigate('live-stream')}
              className="btn btn-primary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11.5,
                padding: '6px 12px',
                backgroundColor: '#ef4444',
                borderColor: '#dc2626',
                cursor: 'pointer'
              }}
            >
              <Radio size={13} />
              <span>Launch Stream</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Executive Summary Cards Grid (6 Metric Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard
          title="Total Inspections"
          value={kpis ? (kpis.total_inspections || 42) : '42'}
          subtitle="All scheduled checks"
          icon={ClipboardCheck}
          color="var(--color-primary, #43A047)"
          trend="Audits recorded"
          trendUp={true}
        />
        <StatCard
          title="Open Issues"
          value={kpis ? (kpis.open_defects ?? 6) : '6'}
          subtitle="Active anomalies"
          icon={AlertTriangle}
          color="#f97316"
          trend="Needs remediation"
          trendUp={false}
        />
        <StatCard
          title="Re-Inspections"
          value={reinspectionsCount}
          subtitle="Verification requests"
          icon={RefreshCw}
          color="#8b5cf6"
          trend="Assigned to field"
          trendUp={true}
        />
        <StatCard
          title="Completed"
          value={kpis ? (kpis.completed_inspections || 30) : '30'}
          subtitle="Signed off by field"
          icon={CheckCircle2}
          color="var(--color-primary-dark, #1B5E20)"
          trend="Compliant & closed"
          trendUp={true}
        />
        <StatCard
          title="AI Alerts"
          value={aiAlertsCount}
          subtitle="Neural detections"
          icon={ShieldAlert}
          color="var(--accent-cyan, #0284c7)"
          trend="CCTV & Inspector"
          trendUp={true}
        />
        <StatCard
          title="Cameras Online"
          value={kpis ? (kpis.cameras_online ?? 4) : '4'}
          subtitle="Edge CCTV nodes"
          icon={Video}
          color="#10b981"
          trend="Optional monitoring"
          trendUp={true}
        />
      </div>

      {/* Users Section: Field Inspectors Roster */}
      <div 
        className="glass-card" 
        style={{ 
          padding: 22, 
          borderRadius: 'var(--radius-lg, 18px)', 
          border: '2px solid var(--color-border, #C8E6C9)', 
          backgroundColor: 'var(--color-bg, #FFFFFF)',
          marginBottom: 28 
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary-dark, #1B5E20)', margin: 0 }}>
              Team Inspectors
            </h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted, #555555)', margin: '3px 0 0' }}>
              Active field personnel, assigned duty spots, and credentials.
            </p>
          </div>

          <button
            onClick={() => onNavigate && onNavigate('inspectors')}
            data-tooltip="Add new inspector"
            className="btn btn-primary btn-sm"
            style={{ minHeight: 38, fontSize: 13, fontWeight: 700 }}
          >
            <Plus size={14} />
            <span>+ Add Inspector</span>
          </button>
        </div>

        <div className="table-container" style={{ border: '1px solid var(--color-border, #C8E6C9)', borderRadius: 'var(--radius-md, 14px)' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Inspector Name</th>
                <th>Role / Post</th>
                <th>Assigned Facility</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inspectors.slice(0, 6).map((insp) => (
                <tr key={insp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img
                        src={insp.avatar_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"}
                        alt={insp.name}
                        style={{ width: 34, height: 34, borderRadius: 10, border: '1.5px solid var(--color-primary, #43A047)', objectFit: 'cover' }}
                      />
                      <div>
                        <strong style={{ fontSize: 14, color: 'var(--color-text, #212121)' }}>{insp.name}</strong>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted, #555555)' }}>{insp.badge_number || 'INSP-2026'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--color-text, #212121)' }}>
                    {insp.role || 'Field Inspector'}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--color-text-muted, #555555)' }}>
                    {insp.assigned_site_name || 'Delhi Metro Central Terminal'}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 12,
                        backgroundColor: 'var(--color-primary-surface, #E8F5E9)',
                        color: 'var(--color-primary-dark, #1B5E20)',
                        border: '1px solid var(--color-border, #C8E6C9)'
                      }}
                    >
                      {insp.status || 'Active'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => onNavigate && onNavigate('inspectors')}
                        data-tooltip="Edit user details"
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid var(--color-border, #C8E6C9)',
                          color: 'var(--color-primary, #43A047)',
                          borderRadius: 8,
                          width: 34,
                          height: 34,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => onNavigate && onNavigate('inspectors')}
                        data-tooltip="Remove user"
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #FFCDD2',
                          color: '#D32F2F',
                          borderRadius: 8,
                          width: 34,
                          height: 34,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Content Split: Live Map & Defect Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* Live Map Preview with Touch-To-Locate Destination Matrix */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 16, color: '#fff' }}>National Geofencing & Telemetry Map</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Active infrastructure perimeters & 5 field inspectors on duty
              </p>
            </div>
            <button 
              onClick={() => onNavigate('live-map')} 
              className="btn btn-secondary btn-sm"
              style={{ fontSize: 11 }}
            >
              <span>Expand Map</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {/* Interactive Touch-To-Locate Destination Selector Strip */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Navigation size={13} />
                <span>Touch Destination to Auto-Locate:</span>
              </span>
              {autoLocatingName && (
                <span style={{ fontSize: 11, color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
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
                      border: isFocused ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                      background: isFocused ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.7)',
                      color: isFocused ? '#38bdf8' : '#cbd5e1',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.2s ease',
                      boxShadow: isFocused ? '0 0 12px rgba(56, 189, 248, 0.4)' : 'none'
                    }}
                  >
                    <MapPin size={12} color={isFocused ? '#38bdf8' : '#94a3b8'} />
                    <span>{s.name}</span>
                    <span style={{ fontSize: 9.5, opacity: 0.7, padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.1)' }}>
                      {s.code || 'ZONE'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Map Component with Auto-Locate and click handlers */}
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
                background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={18} color="#38bdf8" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>
                    {focusedDestination.name} ({focusedDestination.code || 'ZONE'})
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    GPS: <strong>{(focusedDestination.latitude ?? focusedDestination.geo_fence_lat)?.toFixed(4)}° N, {(focusedDestination.longitude ?? focusedDestination.geo_fence_lng)?.toFixed(4)}° E</strong> • Geofence Radius: <strong>{focusedDestination.geofence_radius || 600}m</strong> • Health Score: <strong style={{ color: '#34d399' }}>{focusedDestination.health_score || 88}%</strong>
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

        {/* Severity Distribution & AI Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Defect Severity breakdown */}
          <div className="glass-card" style={{ padding: 20, flex: 1 }}>
            <h3 style={{ fontSize: 15, color: '#fff', marginBottom: 4 }}>Defect Severity Breakdown</h3>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>Risk classification of identified anomalies</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Critical Severity', count: 2, pct: 40, color: '#f43f5e' },
                { label: 'High Priority', count: 2, pct: 40, color: '#fb923c' },
                { label: 'Medium Risk', count: 1, pct: 20, color: '#fbbf24' },
                { label: 'Low Severity', count: 1, pct: 10, color: '#38bdf8' }
              ].map(item => (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{item.label}</span>
                    <span style={{ color: item.color, fontWeight: 700 }}>{item.count} defects</span>
                  </div>
                  <div style={{ height: 6, width: '100%', background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
              <button 
                onClick={() => onNavigate('defects')}
                className="btn btn-secondary btn-sm" 
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span>Manage All Defects</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Quick AI Diagnostic Box */}
          <div className="glass-card" style={{ padding: 18, background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Sparkles size={16} color="var(--accent-cyan)" />
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                AI Predictive Alert
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              NH-44 Pier P-14 Failure Risk at 95%
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Computer vision detected spalling delamination. Epoxy grouting recommended before monsoon season.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Inspections Table */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, color: '#fff' }}>Recent Field Inspections</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Latest statutory audits submitted from field terminals</p>
          </div>
          <button 
            onClick={() => onNavigate('inspections')} 
            className="btn btn-secondary btn-sm"
          >
            <span>View All ({kpis ? kpis.total_inspections : 10})</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Audit Title</th>
                <th>Infrastructure Site</th>
                <th>Auditor</th>
                <th>Date</th>
                <th>Status</th>
                <th>Score</th>
                <th>GPS Geofence</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentInspections.map(insp => (
                <tr key={insp.id}>
                  <td>
                    <strong style={{ color: '#fff' }}>{insp.title}</strong>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{insp.id}</div>
                  </td>
                  <td
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      const matchedSite = sites.find(s => s.id === insp.site_id || s.name === insp.site_name);
                      if (matchedSite) {
                        setFocusedDestination(matchedSite);
                        setAutoLocatingName(matchedSite.name);
                        window.scrollTo({ top: 380, behavior: 'smooth' });
                      }
                    }}
                    title="Touch to auto-locate facility on map"
                  >
                    <div style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{insp.site_name}</div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{insp.site_code} • Tap to locate</span>
                  </td>
                  <td>{insp.inspector_name}</td>
                  <td>{new Date(insp.date || insp.created_at || insp.scheduled_date || Date.now()).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${
                      insp.status === 'COMPLETED' || insp.status === 'APPROVED' ? 'badge-success' :
                      insp.status === 'FLAGGED' ? 'badge-critical' : 'badge-low'
                    }`}>
                      {insp.status}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: insp.compliance_score >= 80 ? '#34d399' : '#f87171' }}>
                      {insp.compliance_score}%
                    </strong>
                  </td>
                  <td>
                    {insp.geofence_verified ? (
                      <span className="badge badge-success">✓ Verified</span>
                    ) : (
                      <span className="badge badge-critical">⚠ Flagged</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => setSelectedInspectionId(insp.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 11, padding: '4px 8px' }}
                    >
                      Dossier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Inspection Detail */}
      {selectedInspectionId && (
        <InspectionModal
          inspectionId={selectedInspectionId}
          onClose={() => setSelectedInspectionId(null)}
          onRefresh={loadData}
        />
      )}

      {/* Full Screen Inspector Camera Modal */}
      <InspectorCameraFullscreenModal
        isOpen={showFullscreenCam}
        onClose={() => setShowFullscreenCam(false)}
      />
    </div>
  );
}
