import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Map, 
  Video, 
  ShieldAlert, 
  RefreshCw, 
  AlertTriangle, 
  ClipboardCheck, 
  CheckSquare, 
  Camera, 
  LogOut, 
  UserCheck, 
  Activity, 
  Radio
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import ThemeToggle from '../components/ThemeToggle';
import ProfileSettingsModal from '../components/ProfileSettingsModal';

// Imported Operational Modules
import InspectorsPage from './InspectorsPage';
import LiveMapPage from './LiveMapPage';
import CorrectiveActionsPage from './CorrectiveActionsPage';
import ReinspectionsPage from './ReinspectionsPage';
import CctvMonitoringPage from './CctvMonitoringPage';
import AiAlertsPage from './AiAlertsPage';
import InspectionPhotosPage from './InspectionPhotosPage';
import InspectionsPage from './InspectionsPage';
import DefectsPage from './DefectsPage';

const SUPERVISOR_NAV_ITEMS = [
  { id: 'overview', label: 'Operations Overview', icon: Activity },
  { id: 'inspectors', label: 'Field Roster & Duty', icon: Users },
  { id: 'live-map', label: 'Live Telemetry Map', icon: Map },
  { id: 'reinspections', label: 'Re-Inspections', icon: RefreshCw },
  { id: 'corrective-actions', label: 'Contractor Rework', icon: CheckSquare },
  { id: 'cctv-matrix', label: 'CCTV Monitoring', icon: Video },
  { id: 'ai-alerts', label: 'AI Alerts Triage', icon: ShieldAlert },
  { id: 'inspections', label: 'Inspection Queue', icon: ClipboardCheck },
  { id: 'defects', label: 'Defect Ledger', icon: AlertTriangle },
  { id: 'photos', label: 'Evidence Gallery', icon: Camera }
];

export default function SupervisorDashboardApp() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [focusedInspectorForMap, setFocusedInspectorForMap] = useState(null);
  const [operationsData, setOperationsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSupervisorData() {
      try {
        const res = await api.getSupervisorSummary();
        if (res.success && res.data) {
          setOperationsData(res.data);
        }
      } catch (err) {
        console.error('Failed to load supervisor operations data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSupervisorData();
  }, []);

  const handleLogout = () => {
    logout();
    window.history.pushState({}, '', '/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Supervisory Welcome Banner */}
            <div 
              style={{
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(15, 23, 42, 0.04) 100%)',
                border: '1.5px solid rgba(56, 189, 248, 0.3)',
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
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Chief Safety & Field Compliance Division
                  </span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(56, 189, 248, 0.15)', color: '#0284C7', fontWeight: 700 }}>
                    OPERATIONAL COMMAND
                  </span>
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 4px' }}>
                  M. Muthukumar — Chief Infrastructure Supervisor
                </h1>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
                  Active field duty assignments, live GNSS telemetry tracking, and statutory contractor remediation sign-offs.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => setActiveTab('reinspections')}
                  className="btn btn-primary"
                  style={{ minHeight: 44, padding: '0 18px', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <RefreshCw size={16} />
                  <span>Dispatch Re-Inspection</span>
                </button>
              </div>
            </div>

            {/* Operational KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div className="stat-card" style={{ borderLeft: '4px solid #38BDF8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="stat-label">Active Field Auditors</span>
                  <Users size={18} color="#38BDF8" />
                </div>
                <div className="stat-value" style={{ color: '#38BDF8' }}>
                  {operationsData?.active_field_inspectors || 6}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>All 6 officers broadcasting live GNSS telemetry</span>
              </div>

              <div className="stat-card" style={{ borderLeft: '4px solid #F59E0B' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="stat-label">Pending Field Audits</span>
                  <ClipboardCheck size={18} color="#F59E0B" />
                </div>
                <div className="stat-value" style={{ color: '#F59E0B' }}>
                  {operationsData?.todays_inspections_pending || 3}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Scheduled for physical inspection today</span>
              </div>

              <div className="stat-card" style={{ borderLeft: '4px solid #A855F7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="stat-label">Pending Re-Inspections</span>
                  <RefreshCw size={18} color="#A855F7" />
                </div>
                <div className="stat-value" style={{ color: '#A855F7' }}>
                  {operationsData?.pending_reinspections || 1}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Remediated zones awaiting field re-evaluation</span>
              </div>

              <div className="stat-card" style={{ borderLeft: '4px solid #43A047' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="stat-label">Contractor Rework Directives</span>
                  <CheckSquare size={18} color="#43A047" />
                </div>
                <div className="stat-value" style={{ color: '#43A047' }}>
                  {operationsData?.active_contractor_reworks || 2}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Proof of rework submitted for verification</span>
              </div>
            </div>

            {/* Quick Action Matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              <div 
                style={{ 
                  background: 'var(--card-bg)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: 16, 
                  padding: 20 
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Radio size={18} color="#38BDF8" />
                  <span>Real-Time Inspector Telemetry</span>
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                  View live Great-Circle distance and geofence compliance between each field auditor and their designated facility.
                </p>
                <button 
                  onClick={() => setActiveTab('live-map')} 
                  className="btn btn-secondary" 
                  style={{ width: '100%', minHeight: 40 }}
                >
                  Open Live Telemetry Map
                </button>
              </div>

              <div 
                style={{ 
                  background: 'var(--card-bg)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: 16, 
                  padding: 20 
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldAlert size={18} color="#F59E0B" />
                  <span>CCTV Anomaly Triage</span>
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Review edge CCTV AI alerts, verify detected hazards, and auto-dispatch field officers for physical inspection.
                </p>
                <button 
                  onClick={() => setActiveTab('ai-alerts')} 
                  className="btn btn-secondary" 
                  style={{ width: '100%', minHeight: 40 }}
                >
                  View Active AI Alerts
                </button>
              </div>
            </div>
          </div>
        );
      case 'inspectors':
        return (
          <InspectorsPage 
            onViewDutyOnMap={(insp) => {
              setFocusedInspectorForMap(insp);
              setActiveTab('live-map');
            }} 
          />
        );
      case 'live-map':
        return (
          <LiveMapPage 
            initialFocusedInspector={focusedInspectorForMap} 
            onClearFocus={() => setFocusedInspectorForMap(null)} 
          />
        );
      case 'reinspections':
        return <ReinspectionsPage />;
      case 'corrective-actions':
        return <CorrectiveActionsPage />;
      case 'cctv-matrix':
        return <CctvMonitoringPage />;
      case 'ai-alerts':
        return <AiAlertsPage onNavigate={setActiveTab} />;
      case 'inspections':
        return <InspectionsPage />;
      case 'defects':
        return <DefectsPage />;
      case 'photos':
        return <InspectionPhotosPage />;
      default:
        return <InspectorsPage />;
    }
  };

  return (
    <div className="app-container">
      {/* Desktop Supervisory Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ cursor: 'pointer' }} onClick={() => setShowProfileModal(true)}>
          <div className="logo-badge" style={{ overflow: 'hidden', padding: 0, background: 'transparent' }}>
            <img 
              src="/logo.png" 
              alt="Inspectra Pro Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} 
            />
          </div>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-heading)' }}>
              INSPECTRA PRO <span style={{ color: '#38BDF8' }}>SUPERVISOR</span>
            </h1>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Field Command Console</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {SUPERVISOR_NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: 'none',
                  background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  color: isActive ? '#38BDF8' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={18} color={isActive ? '#38BDF8' : 'currentColor'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
          <button 
            onClick={handleLogout}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 40 }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--card-bg)',
            marginBottom: 20,
            borderRadius: 14
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
              {SUPERVISOR_NAV_ITEMS.find(n => n.id === activeTab)?.label || 'Field Operations Console'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ThemeToggle />

            {/* Read-Only Supervisory Role Badge (Zero Role Switching) */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6, 
                padding: '6px 14px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: 8,
                fontSize: 12,
                color: 'var(--text-heading)'
              }}
            >
              <UserCheck size={14} color="#38BDF8" />
              <span>Role: <strong style={{ color: '#38BDF8' }}>SUPERVISOR</strong></span>
            </div>

            {/* Officer Profile Badge */}
            <div 
              onClick={() => setShowProfileModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                paddingLeft: 10,
                borderLeft: '1px solid var(--border-subtle)',
                cursor: 'pointer'
              }}
              title="Click to view officer profile"
            >
              <img 
                src={user?.avatar_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"} 
                alt="Officer Avatar"
                style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid #38BDF8' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>
                  {user?.name || 'M. Muthukumar'}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                  Chief Supervisor
                </span>
              </div>
            </div>
          </div>
        </header>

        {renderContent()}

        {showProfileModal && (
          <ProfileSettingsModal 
            onClose={() => setShowProfileModal(false)} 
            officerProfile={user}
            branding={{ app_name: 'Inspectra Pro', agency_name: 'Chief Safety & Field Compliance Division' }}
          />
        )}
      </main>
    </div>
  );
}
