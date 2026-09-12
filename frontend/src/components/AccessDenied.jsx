import React from 'react';
import { ShieldAlert, ArrowLeft, LogOut, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AccessDenied({ userRole, targetRoute, requiredRole }) {
  const { user, logout } = useAuth();

  const getAuthorizedPath = (role) => {
    switch (role) {
      case 'ADMIN':
        return { path: '/admin-dashboard', label: 'Go to Admin Dashboard' };
      case 'DIRECTOR':
        return { path: '/director-dashboard', label: 'Go to Director Dashboard' };
      case 'SUPERVISOR':
        return { path: '/supervisor-dashboard', label: 'Go to Supervisor Dashboard' };
      case 'INSPECTOR':
      default:
        return { path: '/field-inspector', label: 'Go to Field Inspector Portal' };
    }
  };

  const authorized = getAuthorizedPath(user?.role || userRole);

  const handleGoToAuthorizedDashboard = () => {
    window.history.pushState({}, '', authorized.path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleLogout = () => {
    logout();
    window.history.pushState({}, '', '/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: 20,
        fontFamily: "'Roboto', 'Inter', sans-serif"
      }}
    >
      <div 
        style={{
          maxWidth: 480,
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: 20,
          padding: '36px 28px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}
      >
        <div 
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            backgroundColor: '#FEE2E2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            border: '2px solid #FCA5A5'
          }}
        >
          <ShieldAlert size={36} color="#DC2626" />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 10px' }}>
          You don't have permission to access this page.
        </h1>

        <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.5, margin: '0 0 20px' }}>
          You are signed in as <strong>{user?.name || 'Officer'}</strong> ({user?.role || userRole || 'UNKNOWN'}). 
          {requiredRole ? ` This area is strictly restricted to ${requiredRole} credentials.` : ' You do not have the required authorization.'}
        </p>

        <div 
          style={{
            padding: '12px 16px',
            backgroundColor: '#F8FAFC',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            fontSize: 13,
            color: '#64748B',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          <Lock size={16} color="#94A3B8" />
          <span>Restricted Route: <code>{targetRoute || '/unauthorized'}</code></span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={handleGoToAuthorizedDashboard}
            style={{
              width: '100%',
              minHeight: 48,
              backgroundColor: '#43A047',
              color: '#ffffff',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(67, 160, 71, 0.3)'
            }}
          >
            <ArrowLeft size={18} />
            <span>{authorized.label}</span>
          </button>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              minHeight: 44,
              backgroundColor: 'transparent',
              color: '#64748B',
              border: '1px solid #CBD5E1',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <LogOut size={16} />
            <span>Sign Out & Switch Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
