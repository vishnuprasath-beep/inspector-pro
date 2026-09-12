import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  FileText, 
  Building2, 
  MapPin, 
  ShieldAlert, 
  RefreshCw, 
  AlertTriangle, 
  LogOut, 
  UserCheck, 
  Sparkles,
  Award,
  CheckCircle2,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import ThemeToggle from '../components/ThemeToggle';
import ProfileSettingsModal from '../components/ProfileSettingsModal';

// Imported Executive Modules
import AnalyticsPage from './AnalyticsPage';
import AuditLogsPage from './AuditLogsPage';
import ReportsPage from './ReportsPage';
import SitesPage from './SitesPage';
import ReinspectionsPage from './ReinspectionsPage';
import DefectsPage from './DefectsPage';

const DIRECTOR_NAV_ITEMS = [
  { id: 'overview', label: 'Executive Overview', icon: Award },
  { id: 'analytics', label: 'Risk Analytics', icon: BarChart3 },
  { id: 'audit-logs', label: 'Compliance Audit', icon: ShieldAlert },
  { id: 'reports', label: 'Directorate Reports', icon: FileText },
  { id: 'sites', label: 'Supervised Facilities', icon: Building2 },
  { id: 'reinspections', label: 'Re-Inspections', icon: RefreshCw },
  { id: 'defects', label: 'Critical Anomalies', icon: AlertTriangle }
];

export default function DirectorDashboardApp() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDirectorSummary() {
      try {
        const res = await api.getDirectorSummary();
        if (res.success && res.data) {
          setSummaryData(res.data);
        }
      } catch (err) {
        console.error('Failed to load director summary:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDirectorSummary();
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
            {/* Directorate Welcome Banner */}
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
                    State Directorate of Structural Safety
                  </span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: '#E8F5E9', color: '#1B5E20', fontWeight: 700 }}>
                    EXECUTIVE CLEARANCE
                  </span>
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 4px' }}>
                  Dr. S. Radhakrishnan — State Director of Inspections
                </h1>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
                  Statutory infrastructure oversight, hold-point approvals, and state-level compliance monitoring.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => setActiveTab('reports')}
                  className="btn btn-primary"
                  style={{ minHeight: 44, padding: '0 18px', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <FileText size={16} />
                  <span>Generate Directorate Audit</span>
                </button>
              </div>
            </div>

            {/* Directorate KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div className="stat-card" style={{ borderLeft: '4px solid #43A047' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="stat-label">Statewide Compliance Rate</span>
                  <Activity size={18} color="#43A047" />
                </div>
                <div className="stat-value" style={{ color: '#43A047' }}>
                  {summaryData?.statewide_compliance_score || 96}%
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Based on statutory IS 456 / IRC specifications</span>
              </div>

              <div className="stat-card" style={{ borderLeft: '4px solid #38BDF8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="stat-label">Hold-Points Cleared</span>
                  <CheckCircle2 size={18} color="#38BDF8" />
                </div>
                <div className="stat-value">
                  {summaryData?.strategic_holdpoints_cleared || 14} / 18
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Critical concrete & MEP milestones certified</span>
              </div>

              <div className="stat-card" style={{ borderLeft: '4px solid #F59E0B' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="stat-label">Active Non-Conformities</span>
                  <AlertTriangle size={18} color="#F59E0B" />
                </div>
                <div className="stat-value" style={{ color: '#F59E0B' }}>
                  {summaryData?.critical_nonconformities || 2}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Under mandatory contractor remediation</span>
              </div>

              <div className="stat-card" style={{ borderLeft: '4px solid #A855F7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="stat-label">Supervised Facilities</span>
                  <Building2 size={18} color="#A855F7" />
                </div>
                <div className="stat-value">
                  {summaryData?.total_supervised_facilities || 6}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Active metro, expressway, and port projects</span>
              </div>
            </div>

            {/* Embedded Analytics Preview */}
            <AnalyticsPage />
          </div>
        );
      case 'analytics':
        return <AnalyticsPage />;
      case 'audit-logs':
        return <AuditLogsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'sites':
        return <SitesPage />;
      case 'reinspections':
        return <ReinspectionsPage />;
      case 'defects':
        return <DefectsPage />;
      default:
        return <AnalyticsPage />;
    }
  };

  return (
    <div className="app-container">
      {/* Desktop Directorate Sidebar */}
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
              INSPECTRA PRO <span style={{ color: 'var(--color-primary, #43A047)' }}>DIRECTORATE</span>
            </h1>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>State Oversight Console</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {DIRECTOR_NAV_ITEMS.map(item => {
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
                  background: isActive ? 'rgba(67, 160, 71, 0.15)' : 'transparent',
                  color: isActive ? '#43A047' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={18} color={isActive ? '#43A047' : 'currentColor'} />
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
              {DIRECTOR_NAV_ITEMS.find(n => n.id === activeTab)?.label || 'Directorate Oversight'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ThemeToggle />

            {/* Read-Only Directorate Role Badge (Zero Role Switching) */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6, 
                padding: '6px 14px',
                background: 'rgba(67, 160, 71, 0.12)',
                border: '1px solid rgba(67, 160, 71, 0.35)',
                borderRadius: 8,
                fontSize: 12,
                color: 'var(--text-heading)'
              }}
            >
              <UserCheck size={14} color="#43A047" />
              <span>Role: <strong style={{ color: '#43A047' }}>DIRECTOR</strong></span>
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
                src={user?.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"} 
                alt="Officer Avatar"
                style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid #43A047' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>
                  {user?.name || 'Dr. S. Radhakrishnan'}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                  State Director
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
            branding={{ app_name: 'Inspectra Pro', agency_name: 'State Infrastructure Inspection Directorate' }}
          />
        )}
      </main>
    </div>
  );
}
