import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import ProfileSettingsModal from '../components/ProfileSettingsModal';
import FirebaseConfigModal from '../components/FirebaseConfigModal';
import ThemeToggle from '../components/ThemeToggle';

// Desktop Pages
import DashboardPage from './DashboardPage';
import LiveMapPage from './LiveMapPage';
import InspectionsPage from './InspectionsPage';
import DefectsPage from './DefectsPage';
import CorrectiveActionsPage from './CorrectiveActionsPage';
import InspectorsPage from './InspectorsPage';
import SitesPage from './SitesPage';
import AnalyticsPage from './AnalyticsPage';
import ReportsPage from './ReportsPage';
import AuditLogsPage from './AuditLogsPage';
import LiveInspectionStreamPage from './LiveInspectionStreamPage';
import CctvMonitoringPage from './CctvMonitoringPage';
import ConstructionZonesPage from './ConstructionZonesPage';
import AiAlertsPage from './AiAlertsPage';
import AiModelHealthPage from './AiModelHealthPage';
import AiInspectionPage from './AiInspectionPage';
import AiDetectionHistoryPage from './AiDetectionHistoryPage';
import ReinspectionsPage from './ReinspectionsPage';
import InspectionPhotosPage from './InspectionPhotosPage';
import InspectorLiveViewPage from './InspectorLiveViewPage';
import InspectorMonitoringPage from './InspectorMonitoringPage';
import ExecutiveOverview from '../components/ExecutiveOverview';
import OperationsOverview from '../components/OperationsOverview';

// Icons
import { 
  LayoutDashboard, 
  Map, 
  MapPin,
  ClipboardCheck, 
  AlertTriangle, 
  Wrench, 
  Users, 
  Building2, 
  BarChart3, 
  FileText, 
  ShieldAlert, 
  Shield, 
  Smartphone, 
  UserCheck, 
  ChevronDown, 
  ChevronRight,
  ExternalLink,
  Bell,
  Settings,
  LogOut,
  Radio,
  Video,
  Flame,
  Download,
  Maximize2,
  Sparkles,
  Zap,
  History,
  Brain,
  Camera,
  RefreshCw,
  RotateCcw,
  Clock,
  CheckCircle2,
  TrendingUp,
  Award,
  Activity,
  Menu,
  X
} from 'lucide-react';
import InspectorCameraFullscreenModal from '../components/InspectorCameraFullscreenModal';
import OnboardingModal from '../components/OnboardingModal';

// Hierarchical navigation structure per user redesign specification
const SIDEBAR_NAV_GROUPS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    tab: 'dashboard',
    roles: ['ADMIN', 'SUPERVISOR', 'DIRECTOR']
  },
  {
    id: 'inspections-group',
    label: 'Inspections',
    icon: ClipboardCheck,
    roles: ['ADMIN', 'SUPERVISOR', 'DIRECTOR'],
    children: [
      { id: 'all-inspections', label: 'All Inspections', icon: ClipboardCheck, tab: 'inspections', filterKey: 'status', filterVal: 'ALL' },
      { id: 'pending-inspections', label: 'Pending', icon: Clock, tab: 'inspections', filterKey: 'status', filterVal: 'PENDING', badge: 'PENDING', badgeClass: 'badge-amber' },
      { id: 'completed-inspections', label: 'Completed', icon: CheckCircle2, tab: 'inspections', filterKey: 'status', filterVal: 'COMPLETED', badge: 'DONE', badgeClass: 'badge-green' },
      { id: 're-inspections', label: 'Re-Inspections', icon: RotateCcw, tab: 'reinspections', badge: 'AUDIT', badgeClass: 'badge-purple' }
    ]
  },
  {
    id: 'monitoring-group',
    label: 'Monitoring',
    icon: Radio,
    roles: ['ADMIN', 'SUPERVISOR'],
    badge: 'LIVE',
    badgeClass: 'badge-blue',
    children: [
      { id: 'cctv-monitoring', label: 'CCTV', icon: Video, tab: 'cctv-matrix', badge: 'CCTV', badgeClass: 'badge-blue' },
      { id: 'inspector-monitoring', label: 'Inspector Monitoring', icon: Radio, tab: 'inspector-monitoring', badge: 'WEBRTC', badgeClass: 'badge-green' }
    ]
  },
  {
    id: 'ai-group',
    label: 'AI & Detection',
    icon: Sparkles,
    roles: ['ADMIN', 'SUPERVISOR', 'DIRECTOR'],
    badge: 'YOLOv8',
    badgeClass: 'badge-purple',
    children: [
      { id: 'ai-inspection', label: 'AI Inspection', icon: Zap, tab: 'ai-inspection', badge: 'ONNX', badgeClass: 'badge-purple' },
      { id: 'ai-findings', label: 'AI Findings', icon: ShieldAlert, tab: 'ai-findings', badge: 'ALERTS', badgeClass: 'badge-purple' },
      { id: 'ai-history', label: 'Detection History', icon: History, tab: 'ai-history' }
    ]
  },
  {
    id: 'issues-group',
    label: 'Issues & Safety',
    icon: AlertTriangle,
    roles: ['ADMIN', 'SUPERVISOR', 'DIRECTOR'],
    children: [
      { id: 'detected-issues', label: 'Detected Issues', icon: AlertTriangle, tab: 'defects', filterKey: 'severity', filterVal: 'ALL' },
      { id: 'high-risk-issues', label: 'High-Risk Issues', icon: ShieldAlert, tab: 'defects', filterKey: 'severity', filterVal: 'CRITICAL', badge: 'HIGH', badgeClass: 'badge-red' },
      { id: 'corrective-actions', label: 'Corrective Actions', icon: Wrench, tab: 'corrective-actions' }
    ]
  },
  {
    id: 'people-group',
    label: 'People',
    icon: Users,
    roles: ['ADMIN', 'SUPERVISOR', 'DIRECTOR'],
    children: [
      { id: 'inspectors-list', label: 'Inspectors', icon: Users, tab: 'inspectors', roleVal: 'INSPECTOR' },
      { id: 'supervisors-list', label: 'Supervisors', icon: UserCheck, tab: 'inspectors', roleVal: 'SUPERVISOR' },
      { id: 'directors-list', label: 'Directors', icon: Award, tab: 'inspectors', roleVal: 'DIRECTOR' }
    ]
  },
  {
    id: 'sites-group',
    label: 'Sites & Locations',
    icon: MapPin,
    roles: ['ADMIN', 'SUPERVISOR', 'DIRECTOR'],
    children: [
      { id: 'site-map', label: 'Site Map', icon: Map, tab: 'live-map' },
      { id: 'site-overview', label: 'Site Overview', icon: Building2, tab: 'sites' }
    ]
  },
  {
    id: 'reports-group',
    label: 'Reports & Analytics',
    icon: BarChart3,
    roles: ['ADMIN', 'SUPERVISOR', 'DIRECTOR'],
    children: [
      { id: 'inspection-reports', label: 'Inspection Reports', icon: FileText, tab: 'reports' },
      { id: 'safety-analytics', label: 'Safety Analytics', icon: BarChart3, tab: 'analytics' },
      { id: 'trends', label: 'Trends', icon: TrendingUp, tab: 'analytics' }
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    roles: ['ADMIN', 'SUPERVISOR', 'DIRECTOR'],
    isAction: true,
    action: 'SETTINGS'
  }
];

export default function AdminDashboardApp() {
  const { user, logout } = useAuth();
  const userRole = user?.role || 'ADMIN';

  const defaultTab = userRole === 'DIRECTOR' 
    ? 'executive-overview' 
    : userRole === 'SUPERVISOR' 
      ? 'operations-overview' 
      : 'dashboard';

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [activeSubId, setActiveSubId] = useState(null);
  const [inspectionsFilter, setInspectionsFilter] = useState('ALL');
  const [defectsSeverity, setDefectsSeverity] = useState('ALL');
  const [activeRoleVal, setActiveRoleVal] = useState('INSPECTOR');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Default accordion state: open inspections & monitoring initially
  const [expandedGroups, setExpandedGroups] = useState({
    'inspections-group': false,
    'monitoring-group': false,
    'ai-group': false,
    'issues-group': false,
    'people-group': false,
    'sites-group': false,
    'reports-group': false
  });

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [showFullscreenCamera, setShowFullscreenCamera] = useState(false);
  const [showAdminTour, setShowAdminTour] = useState(false);

  // Dynamic institutional branding & profile
  const [branding, setBranding] = useState({
    app_name: 'INSPECTRA PRO',
    tagline: 'Management Console',
    agency_name: 'State Infrastructure Inspection Directorate',
    logo_url: '',
    primary_color: '#10b981'
  });
  const [officerProfile, setOfficerProfile] = useState(user);
  const [focusedInspectorForMap, setFocusedInspectorForMap] = useState(null);

  useEffect(() => {
    async function loadBrandingAndProfile() {
      const bRes = await api.getBranding();
      if (bRes.success && bRes.data) {
        setBranding(prev => ({ ...prev, ...bRes.data }));
      }
      const pRes = await api.getUserProfile(user?.id || 'usr-admin-01');
      if (pRes.success && pRes.data) {
        setOfficerProfile(pRes.data);
      }
    }
    loadBrandingAndProfile();
  }, [user]);

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const handleSubNavClick = (child) => {
    setActiveTab(child.tab);
    setActiveSubId(child.id);
    if (child.filterKey === 'status') {
      setInspectionsFilter(child.filterVal);
    }
    if (child.filterKey === 'severity') {
      setDefectsSeverity(child.filterVal);
    }
    if (child.roleVal) {
      setActiveRoleVal(child.roleVal);
    } else {
      setActiveRoleVal('INSPECTOR');
    }
    setIsMobileDrawerOpen(false);
  };

  const handleTopLevelNavClick = (item) => {
    if (item.isAction && item.action === 'SETTINGS') {
      setShowProfileModal(true);
      setIsMobileDrawerOpen(false);
      return;
    }
    if (item.tab) {
      setActiveTab(item.tab);
      setActiveSubId(null);
      setIsMobileDrawerOpen(false);
    }
  };

  const handleNavigate = (tab, opts = {}) => {
    setActiveTab(tab);
    if (opts && typeof opts === 'object') {
      if (opts.subId) setActiveSubId(opts.subId);
      if (opts.inspectionsFilter) setInspectionsFilter(opts.inspectionsFilter);
      if (opts.defectsSeverity) setDefectsSeverity(opts.defectsSeverity);
    }
    // Auto expand parent category
    const parent = SIDEBAR_NAV_GROUPS.find(g => 
      g.children && g.children.some(c => c.tab === tab)
    );
    if (parent) {
      setExpandedGroups(prev => ({ ...prev, [parent.id]: true }));
    }
    setIsMobileDrawerOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} onOpenMobileSim={() => { window.location.href = '/field-inspector'; }} />;
      case 'operations-overview':
        return <OperationsOverview user={officerProfile || user} onNavigate={handleNavigate} />;
      case 'executive-overview':
        return <ExecutiveOverview user={officerProfile || user} onNavigate={handleNavigate} />;
      case 'inspector-monitoring':
      case 'inspector-live':
        return <InspectorMonitoringPage />;
      case 'cctv-matrix':
        return <CctvMonitoringPage />;
      case 'ai-inspection':
        return <AiInspectionPage onNavigate={handleNavigate} />;
      case 'ai-findings':
      case 'ai-alerts':
        return <AiAlertsPage onNavigate={handleNavigate} />;
      case 'ai-history':
      case 'ai-models':
        return <AiDetectionHistoryPage onNavigate={handleNavigate} />;
      case 'reinspections':
        return <ReinspectionsPage />;
      case 'photos':
        return <InspectionPhotosPage />;
      case 'zones':
        return <ConstructionZonesPage />;
      case 'live-stream':
        return <LiveInspectionStreamPage />;
      case 'live-map':
        return (
          <LiveMapPage 
            initialFocusedInspector={focusedInspectorForMap} 
            onClearFocus={() => setFocusedInspectorForMap(null)} 
          />
        );
      case 'inspections':
        return <InspectionsPage initialFilter={inspectionsFilter} />;
      case 'defects':
        return <DefectsPage initialSeverity={defectsSeverity} />;
      case 'corrective-actions':
        return <CorrectiveActionsPage />;
      case 'inspectors':
        return (
          <InspectorsPage 
            roleVal={activeRoleVal}
            onViewDutyOnMap={(insp) => {
              setFocusedInspectorForMap(insp);
              setActiveTab('live-map');
            }} 
          />
        );
      case 'sites':
        return <SitesPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'audit-logs':
        return <AuditLogsPage />;
      default:
        if (userRole === 'DIRECTOR') return <ExecutiveOverview user={officerProfile || user} onNavigate={handleNavigate} />;
        if (userRole === 'SUPERVISOR') return <OperationsOverview user={officerProfile || user} onNavigate={handleNavigate} />;
        return <DashboardPage onNavigate={handleNavigate} onOpenMobileSim={() => { window.location.href = '/field-inspector'; }} />;
    }
  };

  return (
    <div className="app-container">
      {/* Onboarding Tour Modal for Admin */}
      <OnboardingModal
        isOpen={showAdminTour}
        onClose={() => setShowAdminTour(false)}
        onComplete={() => setShowAdminTour(false)}
      />

      {/* Mobile Backdrop */}
      {isMobileDrawerOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setIsMobileDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Desktop & Mobile Responsive Admin Sidebar */}
      <aside className={`sidebar ${isMobileDrawerOpen ? 'drawer-open' : ''}`}>
        <div 
          className="sidebar-logo" 
          style={{ cursor: userRole === 'ADMIN' ? 'pointer' : 'default' }} 
          onClick={() => { if (userRole === 'ADMIN') setShowProfileModal(true); }}
        >
          <div className="logo-badge" style={{ overflow: 'hidden', padding: 0, background: 'transparent' }}>
            <img 
              src={branding.logo_url || "/logo.png"} 
              alt="Inspectra Pro Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} 
            />
          </div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-heading)', margin: 0, letterSpacing: '0.02em', lineHeight: 1.2 }}>
              INSPECTRA PRO
            </h1>
            <p style={{ fontSize: 10.5, color: '#10b981', fontWeight: 700, textTransform: 'uppercase', margin: '3px 0 0', letterSpacing: '0.08em', lineHeight: 1 }}>
              Management Console
            </p>
          </div>
        </div>

        {/* Hierarchical Accordion Sidebar Navigation */}
        <nav className="sidebar-nav" style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {SIDEBAR_NAV_GROUPS.filter(item => !item.roles || item.roles.includes(userRole)).map(item => {
            // Group with sub-items
            if (item.children) {
              const isExpanded = !!expandedGroups[item.id];
              const isGroupActive = item.children.some(c => c.tab === activeTab);
              const GroupIcon = item.icon;

              return (
                <div key={item.id} className="sidebar-group" style={{ marginBottom: 2 }}>
                  <button
                    onClick={() => toggleGroup(item.id)}
                    className={`sidebar-group-btn ${isGroupActive ? 'group-active' : ''}`}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      background: isGroupActive ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                      border: 'none',
                      borderRadius: 8,
                      color: isGroupActive ? 'var(--text-heading)' : 'var(--text-muted)',
                      fontSize: 13,
                      fontWeight: isGroupActive ? 700 : 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <GroupIcon size={17} color={isGroupActive ? '#10b981' : 'var(--text-dim)'} />
                      <span>{item.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {item.badge && (
                        <span className={`badge ${item.badgeClass || 'badge-green'}`} style={{ fontSize: 8.5, padding: '1px 6px' }}>
                          {item.badge}
                        </span>
                      )}
                      <ChevronDown 
                        size={14} 
                        style={{
                          transition: 'transform 0.2s ease',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          color: 'var(--text-dim)'
                        }}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="sidebar-subnav" style={{ paddingLeft: 14, marginTop: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {item.children.map(child => {
                        const ChildIcon = child.icon;
                        const isChildActive = activeTab === child.tab && (!activeSubId || activeSubId === child.id);
                        return (
                          <button
                            key={child.id}
                            onClick={() => handleSubNavClick(child)}
                            className={`sidebar-subitem ${isChildActive ? 'sub-active' : ''}`}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '7px 10px',
                              background: isChildActive ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                              border: 'none',
                              borderRadius: 6,
                              color: isChildActive ? '#10b981' : 'var(--text-muted)',
                              fontSize: 12.5,
                              fontWeight: isChildActive ? 700 : 500,
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {ChildIcon && <ChildIcon size={14} color={isChildActive ? '#10b981' : 'var(--text-dim)'} />}
                            <span style={{ flex: 1 }}>{child.label}</span>
                            {child.badge && (
                              <span className={`badge ${child.badgeClass || 'badge-green'}`} style={{ fontSize: 8, padding: '1px 5px' }}>
                                {child.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Standalone top-level item
            const ItemIcon = item.icon;
            const isItemActive = activeTab === item.tab;
            return (
              <button
                key={item.id}
                onClick={() => handleTopLevelNavClick(item)}
                className={`nav-item ${isItemActive ? 'active' : ''}`}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  background: isItemActive ? 'rgba(16, 185, 129, 0.14)' : 'transparent',
                  border: 'none',
                  borderRadius: 8,
                  color: isItemActive ? '#10b981' : 'var(--text-muted)',
                  fontSize: 13,
                  fontWeight: isItemActive ? 700 : 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <ItemIcon size={17} color={isItemActive ? '#10b981' : 'var(--text-dim)'} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span className={`badge ${item.badgeClass || 'badge-green'}`} style={{ fontSize: 8.5, padding: '1px 6px' }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Management System Status in Sidebar Footer */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} className="pulse-active"></span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>
              {userRole === 'DIRECTOR' ? 'DIRECTORATE' : userRole === 'SUPERVISOR' ? 'SUPERVISORY' : 'ADMIN ACTIVE'}
            </span>
          </div>
          {userRole === 'ADMIN' && (
            <button
              onClick={() => setShowProfileModal(true)}
              data-tooltip="App settings"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700 }}
              title="App settings"
            >
              <Settings size={13} />
              <span>Settings</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Desktop Content Area */}
      <div className="main-content">
        {/* Desktop & Mobile Header */}
        <header className="glass-header" style={{ padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Mobile Hamburger Toggle Button */}
            <button
              className="mobile-menu-btn"
              onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
              aria-label="Toggle navigation menu"
              style={{
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '7px 9px',
                borderRadius: 8,
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-heading)',
                cursor: 'pointer'
              }}
            >
              {isMobileDrawerOpen ? <X size={19} /> : <Menu size={19} />}
            </button>

            <h2 style={{ fontSize: 18, fontWeight: 700, textTransform: 'capitalize', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <span style={{ color: '#10b981' }}>•</span>
              {activeTab.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h2>
            <span style={{ fontSize: 11, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', padding: '3px 10px', borderRadius: 20, fontWeight: 600, border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              MANAGEMENT CONSOLE
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Quick Tour Button */}
            <button
              onClick={() => setShowAdminTour(true)}
              data-tooltip="App Tour"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 14px',
                backgroundColor: 'var(--color-primary-surface, #E8F5E9)',
                border: '1px solid var(--color-border, #C8E6C9)',
                borderRadius: 20,
                color: 'var(--color-primary-dark, #1B5E20)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Sparkles size={13} color="var(--color-primary, #43A047)" />
              <span>Tour</span>
            </button>

            {/* Theme Toggle (Light / Dark Mode) */}
            <ThemeToggle />

            {/* Live Inspector Cam Full Screen Button (ADMIN and SUPERVISOR only) */}
            {(userRole === 'ADMIN' || userRole === 'SUPERVISOR') && (
              <button
                onClick={() => setShowFullscreenCamera(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  backgroundColor: 'rgba(239, 68, 68, 0.18)',
                  border: '1px solid #ef4444',
                  borderRadius: 20,
                  color: '#fca5a5',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 0 14px rgba(239, 68, 68, 0.25)'
                }}
                title="Open Field Inspector Live Camera Feed in Full Screen"
              >
                <Maximize2 size={13} color="#ef4444" />
                <span>🔴 Inspector Cam [Full Screen]</span>
              </button>
            )}

            {/* PWA Mobile & Desktop Install App Button */}
            <button
              onClick={() => {
                if (window.__promptInstallPwa) {
                  window.__promptInstallPwa();
                } else {
                  alert('To install Inspectra Pro as an app:\n\n• On Android/Chrome: Tap browser menu (⋮) -> "Install App" or "Add to Home screen"\n• On iPhone/Safari: Tap Share icon (⎋) -> "Add to Home Screen"\n• On Desktop Chrome/Edge: Click the install icon (⊕) in the URL address bar.\n\nOnce installed, Inspectra Pro runs full-screen as a standalone app with offline support!');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid #38bdf8',
                borderRadius: 20,
                color: '#38bdf8',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Install Inspectra Pro as a Standalone App (PWA)"
            >
              <Download size={13} color="#38bdf8" />
              <span>📲 Install App</span>
            </button>

            {/* Firebase Cloud Status Pill (ADMIN only) */}
            {userRole === 'ADMIN' && (
              <button
                onClick={() => setShowFirebaseModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid #f59e0b',
                  borderRadius: 20,
                  color: '#fbbf24',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Firebase Cloud Realtime Sync Status & Project Settings"
              >
                <Flame size={14} color="#f59e0b" />
                <span>Firebase Cloud: Active</span>
              </button>
            )}

            {/* Branding & Profile Quick Settings Button (ADMIN only) */}
            {userRole === 'ADMIN' && (
              <button
                onClick={() => setShowProfileModal(true)}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                title="Edit Profile, Photo & Institutional Branding"
              >
                <Settings size={14} color="var(--accent-cyan)" />
                <span>Settings & Branding</span>
              </button>
            )}

            {/* Authenticated Role Badge (From backend account) */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6, 
                padding: '6px 14px',
                background: userRole === 'DIRECTOR' ? 'rgba(16, 185, 129, 0.12)' : userRole === 'SUPERVISOR' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(56, 189, 248, 0.12)',
                border: `1px solid ${userRole === 'DIRECTOR' ? '#10b981' : userRole === 'SUPERVISOR' ? '#f59e0b' : '#38bdf8'}`,
                borderRadius: 8,
                fontSize: 12,
                color: '#f8fafc'
              }}
            >
              <UserCheck size={14} color={userRole === 'DIRECTOR' ? '#10b981' : userRole === 'SUPERVISOR' ? '#f59e0b' : 'var(--accent-cyan)'} />
              <span>Role: <strong style={{ color: userRole === 'DIRECTOR' ? '#10b981' : userRole === 'SUPERVISOR' ? '#f59e0b' : 'var(--accent-cyan)' }}>{userRole}</strong></span>
            </div>

            {/* User Profile Badge */}
            <div 
              onClick={() => { if (userRole === 'ADMIN') setShowProfileModal(true); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                paddingLeft: 10,
                borderLeft: '1px solid var(--border-subtle)',
                cursor: userRole === 'ADMIN' ? 'pointer' : 'default',
                transition: 'opacity 0.2s ease'
              }}
              title={userRole === 'ADMIN' ? "Click to view & edit officer profile & photo" : "Authenticated Officer Profile"}
            >
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
                  {officerProfile?.name || user?.name || (userRole === 'DIRECTOR' ? 'Dr. S. Radhakrishnan' : userRole === 'SUPERVISOR' ? 'M. Muthukumar' : 'K. Selvakumar, IAS')}
                </div>
                <div style={{ fontSize: 10, color: userRole === 'DIRECTOR' ? '#34d399' : userRole === 'SUPERVISOR' ? '#fbbf24' : 'var(--accent-cyan)' }}>
                  {officerProfile?.badge_id || officerProfile?.email || user?.email || user?.username}
                </div>
              </div>
              <img
                src={officerProfile?.avatar_url || user?.avatar_url || (userRole === 'DIRECTOR' ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' : userRole === 'SUPERVISOR' ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150')}
                alt={officerProfile?.name || userRole}
                style={{ width: 36, height: 36, borderRadius: 10, border: `2px solid ${userRole === 'DIRECTOR' ? '#10b981' : userRole === 'SUPERVISOR' ? '#f59e0b' : 'var(--accent-cyan)'}`, objectFit: 'cover' }}
              />
            </div>

            {/* Sign Out / Exit to Login Portal */}
            <button
              onClick={() => {
                logout();
                window.history.pushState({}, '', '/login');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                fontSize: 11.5,
                color: '#cbd5e1',
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer'
              }}
              title="Sign Out to Login Portal"
            >
              <LogOut size={13} color="#f87171" />
              <span>Exit</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        {renderContent()}
      </div>

      {/* Modal: Officer Profile & Portal Customization */}
      <ProfileSettingsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentUser={officerProfile || user}
        onProfileUpdated={(updated) => setOfficerProfile(updated)}
        onBrandingUpdated={(updatedBranding) => setBranding(updatedBranding)}
      />

      {/* Modal: Firebase Cloud Integration Hub */}
      <FirebaseConfigModal
        isOpen={showFirebaseModal}
        onClose={() => setShowFirebaseModal(false)}
      />

      {/* Full Screen Inspector Camera Modal (accessible from any Admin tab) */}
      <InspectorCameraFullscreenModal
        isOpen={showFullscreenCamera}
        onClose={() => setShowFullscreenCamera(false)}
      />
    </div>
  );
}
