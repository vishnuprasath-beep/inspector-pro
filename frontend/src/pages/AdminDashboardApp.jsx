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
import ReinspectionsPage from './ReinspectionsPage';
import InspectionPhotosPage from './InspectionPhotosPage';
import InspectorLiveViewPage from './InspectorLiveViewPage';
import AiModelHealthPage from './AiModelHealthPage';

// Icons
import { 
  LayoutDashboard, 
  Map, 
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
  Camera,
  RefreshCw
} from 'lucide-react';
import InspectorCameraFullscreenModal from '../components/InspectorCameraFullscreenModal';
import OnboardingModal from '../components/OnboardingModal';

const ADMIN_NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'inspector-live', label: 'Inspector Live View', icon: Radio, badge: 'LIVE' },
  { id: 'cctv-matrix', label: 'Live Camera', icon: Video, badge: 'CCTV' },
  { id: 'ai-alerts', label: 'AI Alerts', icon: ShieldAlert, badge: 'AI' },
  { id: 'ai-models', label: 'AI Model & Datasets', icon: Sparkles, badge: 'ONNX' },
  { id: 'inspections', label: 'Recent Inspections', icon: ClipboardCheck },
  { id: 'defects', label: 'Open Issues', icon: AlertTriangle },
  { id: 'reinspections', label: 'Re-Inspections', icon: RefreshCw, badge: 'NEW' },
  { id: 'photos', label: 'Inspection Photos', icon: Camera },
  { id: 'live-map', label: 'Map', icon: Map },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'inspectors', label: 'Inspector Management', icon: Users },
  { id: 'zones', label: 'Zones', icon: Building2, badge: '18 ZONES' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'audit-logs', label: 'Audit Logs', icon: ShieldAlert }
];

export default function AdminDashboardApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [showFullscreenCamera, setShowFullscreenCamera] = useState(false);
  const [showAdminTour, setShowAdminTour] = useState(false);

  // Dynamic institutional branding & profile
  const [branding, setBranding] = useState({
    app_name: 'INSPECTRA PRO',
    tagline: 'ADMIN & EXECUTIVE PORTAL',
    agency_name: 'State Infrastructure Inspection Directorate',
    logo_url: '',
    primary_color: '#38bdf8'
  });
  const [officerProfile, setOfficerProfile] = useState(user);
  const [focusedInspectorForMap, setFocusedInspectorForMap] = useState(null);

  useEffect(() => {
    async function loadBrandingAndProfile() {
      const bRes = await api.getBranding();
      if (bRes.success && bRes.data) {
        setBranding(bRes.data);
      }
      const pRes = await api.getUserProfile(user?.id || 'usr-admin-01');
      if (pRes.success && pRes.data) {
        setOfficerProfile(pRes.data);
      }
    }
    loadBrandingAndProfile();
  }, [user]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={setActiveTab} />;
      case 'inspector-live':
        return <InspectorLiveViewPage />;
      case 'cctv-matrix':
        return <CctvMonitoringPage />;
      case 'ai-alerts':
        return <AiAlertsPage onNavigate={setActiveTab} />;
      case 'ai-models':
        return <AiModelHealthPage />;
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
        return <InspectionsPage />;
      case 'defects':
        return <DefectsPage />;
      case 'corrective-actions':
        return <CorrectiveActionsPage />;
      case 'inspectors':
        return (
          <InspectorsPage 
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
        return <DashboardPage onNavigate={setActiveTab} onOpenMobileSim={() => { window.location.href = '/field-inspector'; }} />;
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

      {/* Desktop Admin Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ cursor: 'pointer' }} onClick={() => setShowProfileModal(true)}>
          <div className="logo-badge" style={{ overflow: 'hidden', padding: 0, background: 'transparent' }}>
            <img 
              src={branding.logo_url || "/logo.png"} 
              alt="Inspectra Pro Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} 
            />
          </div>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-heading)' }}>
              {branding.app_name} <span style={{ color: 'var(--accent-cyan)' }}>MGMT</span>
            </h1>
            <p style={{ fontSize: 9.5, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
              {branding.tagline || 'ADMIN & EXECUTIVE PORTAL'}
            </p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {ADMIN_NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
                style={{ width: '100%', textAlign: 'left', border: 'none' }}
              >
                <Icon size={17} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 5px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Admin System Status in Sidebar Footer */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} className="pulse-active"></span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>SYSTEM ACTIVE</span>
          </div>
          <button
            onClick={() => setShowProfileModal(true)}
            data-tooltip="App settings"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700 }}
            title="App settings"
          >
            <Settings size={13} />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Desktop Content Area */}
      <div className="main-content">
        {/* Desktop Header */}
        <header className="glass-header" style={{ padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, textTransform: 'capitalize', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--accent-cyan)' }}>•</span>
              {activeTab.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h2>
            <span style={{ fontSize: 11, background: 'rgba(56, 189, 248, 0.12)', color: 'var(--accent-cyan)', padding: '3px 10px', borderRadius: 20, fontWeight: 600, border: '1px solid rgba(56, 189, 248, 0.25)' }}>
              {branding.agency_name || 'MANAGEMENT CONSOLE'}
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

            {/* Live Inspector Cam Full Screen Button */}
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

            {/* Firebase Cloud Status Pill */}
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

            {/* Branding & Profile Quick Settings Button */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
              title="Edit Profile, Photo & Institutional Branding"
            >
              <Settings size={14} color="var(--accent-cyan)" />
              <span>Settings & Branding</span>
            </button>

            {/* Read-Only Admin Role Badge (Zero Role Switching Allowed) */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6, 
                padding: '6px 12px',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 8,
                fontSize: 12,
                color: '#f8fafc'
              }}
            >
              <UserCheck size={14} color="var(--accent-cyan)" />
              <span>Role: <strong style={{ color: 'var(--accent-cyan)' }}>ADMIN</strong></span>
            </div>

            {/* User Profile Badge (Clickable to edit Profile & Photo) */}
            <div 
              onClick={() => setShowProfileModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                paddingLeft: 10,
                borderLeft: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'opacity 0.2s ease'
              }}
              title="Click to view & edit officer profile & photo"
            >
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
                  {officerProfile?.name || user?.name || 'K. Selvakumar, IAS'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--accent-cyan)' }}>
                  {officerProfile?.badge_id || officerProfile?.email || user?.email}
                </div>
              </div>
              <img
                src={officerProfile?.avatar_url || user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt={officerProfile?.name || 'Admin'}
                style={{ width: 36, height: 36, borderRadius: 10, border: '2px solid var(--accent-cyan)', objectFit: 'cover' }}
              />
            </div>

            {/* Exit to Login Portal */}
            <a
              href="/login"
              className="btn btn-secondary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                fontSize: 11.5,
                color: '#cbd5e1',
                textDecoration: 'none'
              }}
              title="Sign Out to Login Portal"
            >
              <LogOut size={13} color="#f87171" />
              <span>Exit</span>
            </a>
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
