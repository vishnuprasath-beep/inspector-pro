import React from 'react';
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
  Smartphone,
  Shield,
  Activity
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'live-map', label: 'Live Map & GPS', icon: Map, badge: 'LIVE' },
  { id: 'inspections', label: 'Inspections', icon: ClipboardCheck },
  { id: 'defects', label: 'Defect Tracking', icon: AlertTriangle },
  { id: 'corrective-actions', label: 'Remediation Workflow', icon: Wrench },
  { id: 'inspectors', label: 'Field Inspectors', icon: Users },
  { id: 'sites', label: 'Infrastructure Sites', icon: Building2 },
  { id: 'analytics', label: 'Analytics & Risk', icon: BarChart3 },
  { id: 'reports', label: 'Reports & Export', icon: FileText },
  { id: 'audit-logs', label: 'Security & Audit', icon: ShieldAlert },
  { id: 'mobile-app', label: 'Mobile Inspector View', icon: Smartphone, highlight: true }
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="sidebar">
      {/* App Branding */}
      <div className="sidebar-logo">
        <div className="logo-badge" style={{ overflow: 'hidden', padding: 0, background: 'transparent' }}>
          <img 
            src="/logo.png" 
            alt="Inspectra Pro" 
            style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} 
          />
        </div>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.04em', color: 'var(--text-heading)' }}>
            INSPECTRA <span style={{ color: 'var(--accent-cyan)' }}>PRO</span>
          </h1>
          <p style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600 }}>
            ENTERPRISE COMPLIANCE
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
              style={{
                width: '100%',
                border: 'none',
                background: isActive 
                  ? 'linear-gradient(90deg, rgba(2, 132, 199, 0.25) 0%, rgba(56, 189, 248, 0.1) 100%)' 
                  : item.highlight 
                    ? 'rgba(56, 189, 248, 0.05)'
                    : 'transparent',
                textAlign: 'left'
              }}
            >
              <Icon size={18} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{
                  fontSize: 9,
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.4)'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div style={{ padding: '16px 18px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(15, 23, 42, 0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#f8fafc' }}>Core API & Geofence Active</span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
          Haversine Engine • JWT RBAC
        </div>
      </div>
    </aside>
  );
}
