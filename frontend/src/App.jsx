import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';

import InstallAppBanner from './components/InstallAppBanner';

// 2 Main Portal Interfaces
import FieldInspectorApp from './pages/FieldInspectorApp';
import AdminDashboardApp from './pages/AdminDashboardApp';
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

  // 1. Unauthenticated users:
  if (!user) {
    // Both "/" and "/login" display the LoginPage directly.
    if (p === '/' || p === '/login') {
      return <LoginPage />;
    }
    // If an unauthenticated user manually enters any protected route,
    // redirect them to /login
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      try {
        window.history.replaceState({}, '', '/login');
      } catch (e) {}
    }
    return <LoginPage initialRedirectPath={p} />;
  }

  // 2. Authenticated user visiting "/" or "/login":
  // Route them directly to their authorized portal
  if (p === '/login' || p === '/') {
    const target = user.role === 'INSPECTOR' ? '/field-inspector' : '/admin-dashboard';
    if (typeof window !== 'undefined' && window.location.pathname !== target) {
      try {
        window.history.replaceState({}, '', target);
      } catch (e) {}
    }
    if (user.role === 'INSPECTOR') return <FieldInspectorApp />;
    if (user.role === 'ADMIN' || user.role === 'SUPERVISOR' || user.role === 'DIRECTOR') {
      return <AdminDashboardApp />;
    }
  }

  // 3. Portal 1: Field Inspector Portal (Used ONLY by Inspectors)
  if (p === '/field-inspector' || p === '/inspector') {
    if (user.role === 'INSPECTOR') return <FieldInspectorApp />;
    return <AccessDenied userRole={user.role} targetRoute={p} requiredRole="INSPECTOR" />;
  }

  // 4. Portal 2: Management Portal (Used by Admin, Supervisor, and Director)
  if (p === '/admin-dashboard' || p === '/admin') {
    if (user.role === 'ADMIN' || user.role === 'SUPERVISOR' || user.role === 'DIRECTOR') {
      return <AdminDashboardApp />;
    }
    return <AccessDenied userRole={user.role} targetRoute={p} requiredRole="MANAGEMENT" />;
  }

  // Backward-compatibility: Legacy routes gracefully redirect to /admin-dashboard
  if (p === '/director-dashboard' || p === '/director' || p === '/supervisor-dashboard' || p === '/supervisor') {
    if (user.role === 'ADMIN' || user.role === 'SUPERVISOR' || user.role === 'DIRECTOR') {
      if (typeof window !== 'undefined') {
        try {
          window.history.replaceState({}, '', '/admin-dashboard');
        } catch (e) {}
      }
      return <AdminDashboardApp />;
    }
    return <AccessDenied userRole={user.role} targetRoute={p} requiredRole="MANAGEMENT" />;
  }

  // 5. Any other unknown route:
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
