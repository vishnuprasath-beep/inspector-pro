import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';

import InstallAppBanner from './components/InstallAppBanner';

// Dedicated Completely Separate Role Portals
import FieldInspectorApp from './pages/FieldInspectorApp';
import AdminDashboardApp from './pages/AdminDashboardApp';
import DirectorDashboardApp from './pages/DirectorDashboardApp';
import SupervisorDashboardApp from './pages/SupervisorDashboardApp';
import LoginPage from './pages/LoginPage';
import AccessDenied from './components/AccessDenied';
import { useAuth } from './context/AuthContext';

function normalizePath(rawPath) {
  if (!rawPath) return '/';
  let p = rawPath.toLowerCase().trim();
  // Strip trailing slashes (e.g. /field-inspector/ -> /field-inspector)
  if (p.length > 1 && p.endsWith('/')) {
    p = p.slice(0, -1);
  }
  return p;
}

function AppRouter({ currentPath }) {
  const { user } = useAuth();
  const p = normalizePath(currentPath || window.location.pathname);

  // 1. Not logged in: Protected routes redirect to login
  if (!user) {
    return <LoginPage initialRedirectPath={p} />;
  }

  // If already authenticated and on /login or /, auto-route to the user's specific portal
  if (p === '/login' || p === '/') {
    if (user.role === 'ADMIN') return <AdminDashboardApp />;
    if (user.role === 'DIRECTOR') return <DirectorDashboardApp />;
    if (user.role === 'SUPERVISOR') return <SupervisorDashboardApp />;
    if (user.role === 'INSPECTOR') return <FieldInspectorApp />;
  }

  // 2. Admin Dashboard: Strictly ADMIN only
  if (p === '/admin-dashboard') {
    if (user.role !== 'ADMIN') {
      return <AccessDenied userRole={user.role} targetRoute={p} requiredRole="ADMIN" />;
    }
    return <AdminDashboardApp />;
  }

  // 3. Director Dashboard: Strictly DIRECTOR only
  if (p === '/director-dashboard') {
    if (user.role !== 'DIRECTOR') {
      return <AccessDenied userRole={user.role} targetRoute={p} requiredRole="DIRECTOR" />;
    }
    return <DirectorDashboardApp />;
  }

  // 4. Supervisor Dashboard: Strictly SUPERVISOR only
  if (p === '/supervisor-dashboard') {
    if (user.role !== 'SUPERVISOR') {
      return <AccessDenied userRole={user.role} targetRoute={p} requiredRole="SUPERVISOR" />;
    }
    return <SupervisorDashboardApp />;
  }

  // 5. Field Inspector Portal: Strictly INSPECTOR only
  if (p === '/field-inspector') {
    if (user.role !== 'INSPECTOR') {
      return <AccessDenied userRole={user.role} targetRoute={p} requiredRole="INSPECTOR" />;
    }
    return <FieldInspectorApp />;
  }

  // 6. Unknown / Unauthorized route
  return <AccessDenied userRole={user.role} targetRoute={p} />;
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(normalizePath(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(normalizePath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);

    // Global link interceptor for clean internal routing
    const handleGlobalClick = (e) => {
      const anchor = e.target.closest('a');
      if (anchor && anchor.getAttribute('href')?.startsWith('/')) {
        const targetHref = anchor.getAttribute('href');
        const norm = normalizePath(targetHref);
        const validRoutes = [
          '/field-inspector', 
          '/admin-dashboard', 
          '/director-dashboard', 
          '/supervisor-dashboard', 
          '/login', 
          '/'
        ];
        if (validRoutes.includes(norm)) {
          e.preventDefault();
          window.history.pushState({}, '', targetHref);
          setCurrentPath(norm);
        }
      }
    };

    document.addEventListener('click', handleGlobalClick);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <div className="app-shell" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
            <InstallAppBanner />
            <AppRouter currentPath={currentPath} />
          </div>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
