import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { cleanupLiveShareOnLogout } from '../services/liveShareService';

const AuthContext = createContext(null);

export const SYSTEM_ACCOUNTS = {
  // 1. Leadership / Admin Posts (Tamil Names)
  ADMIN_SELVAKUMAR: {
    id: 'usr-admin-selvakumar',
    username: 'admin.selvakumar',
    email: 'selvakumar.ias@inspectra.gov.in',
    name: 'K. Selvakumar, IAS',
    role: 'ADMIN',
    post: 'Principal Administrator',
    badge: 'Principal Administrator / State Directorate',
    portal: 'Admin Command Center',
    redirectPath: '/admin-dashboard'
  },
  DIRECTOR_RADHAKRISHNAN: {
    id: 'usr-director-radhakrishnan',
    username: 'director.radhakrishnan',
    email: 'radhakrishnan@inspectra.gov.in',
    name: 'Dr. S. Radhakrishnan',
    role: 'DIRECTOR',
    post: 'State Director of Inspections',
    badge: 'State Director of Inspections',
    portal: 'Management Portal',
    redirectPath: '/admin-dashboard'
  },
  SUPERVISOR_MUTHUKUMAR: {
    id: 'usr-supervisor-muthukumar',
    username: 'supervisor.muthukumar',
    email: 'muthukumar@inspectra.gov.in',
    name: 'M. Muthukumar',
    role: 'SUPERVISOR',
    post: 'Chief Infrastructure Supervisor',
    badge: 'Chief Safety & Compliance Supervisor',
    portal: 'Management Portal',
    redirectPath: '/admin-dashboard'
  },

  // 2. Field Inspectors (6 Specific Accounts)
  INSPECTOR_VISHNU_PRASATH: {
    id: 'usr-insp-vp01',
    username: 'insp.vishnuprasath',
    email: 'vishnu.prasath@inspectra.gov.in',
    name: 'Vishnu Prasath',
    role: 'INSPECTOR',
    post: 'Lead Field Auditor',
    badge: 'Lead Field Auditor / INSP-2026-VP01',
    portal: 'Field Inspector Portal',
    assignedSite: 'Northern Metro Corridor (Delhi Metro Phase 2)',
    redirectPath: '/field-inspector'
  },
  INSPECTOR_VISHNU_VARTHAN: {
    id: 'usr-insp-vv02',
    username: 'insp.vishnuvarthan',
    email: 'vishnu.varthan@inspectra.gov.in',
    name: 'Vishnu Varthan',
    role: 'INSPECTOR',
    post: 'Field Structural Auditor',
    badge: 'Field Structural Auditor / INSP-2026-VV02',
    portal: 'Field Inspector Portal',
    assignedSite: 'Eastern Railway Viaduct (Kolkata Metro Ext.)',
    redirectPath: '/field-inspector'
  },
  INSPECTOR_SIVAVAIYAPURI: {
    id: 'usr-insp-sv03',
    username: 'insp.sivavaiyapuri',
    email: 'sivavaiyapuri@inspectra.gov.in',
    name: 'Sivavaiyapuri',
    role: 'INSPECTOR',
    post: 'Senior NDT Specialist',
    badge: 'Senior NDT Specialist / INSP-2026-SV03',
    portal: 'Field Inspector Portal',
    assignedSite: 'Southern Coastal Bridge (Pamban Rail Complex)',
    redirectPath: '/field-inspector'
  },
  INSPECTOR_SRIRAM: {
    id: 'usr-insp-sr04',
    username: 'insp.sriram',
    email: 'sriram@inspectra.gov.in',
    name: 'Sriram',
    role: 'INSPECTOR',
    post: 'Highway & Geotech Auditor',
    badge: 'Highway & Geotech Auditor / INSP-2026-SR04',
    portal: 'Field Inspector Portal',
    assignedSite: 'Western Industrial Highway (Mumbai-Pune Expy)',
    redirectPath: '/field-inspector'
  },
  INSPECTOR_MAHALAKSHMI: {
    id: 'usr-insp-ml05',
    username: 'insp.mahalakshmi',
    email: 'mahalakshmi@inspectra.gov.in',
    name: 'Mahalakshmi',
    role: 'INSPECTOR',
    post: 'Concrete & Seismic Specialist',
    badge: 'Concrete & Seismic Specialist / INSP-2026-ML05',
    portal: 'Field Inspector Portal',
    assignedSite: 'Central Tunnel & Reservoir (Chenab Rail Arch)',
    redirectPath: '/field-inspector'
  },
  INSPECTOR_SIVAMATHI: {
    id: 'usr-insp-sm06',
    username: 'insp.sivamathi',
    email: 'sivamathi@inspectra.gov.in',
    name: 'Sivamathi',
    role: 'INSPECTOR',
    post: 'Bridge & Viaduct Auditor',
    badge: 'Bridge & Viaduct Auditor / INSP-2026-SM06',
    portal: 'Field Inspector Portal',
    assignedSite: 'Strategic Flyover & Viaduct (Bengaluru Elevated)',
    redirectPath: '/field-inspector'
  }
};

// Aliases for backwards compatibility
export const DEMO_ACCOUNTS = {
  ADMIN: SYSTEM_ACCOUNTS.ADMIN_SELVAKUMAR,
  DIRECTOR: SYSTEM_ACCOUNTS.DIRECTOR_RADHAKRISHNAN,
  SUPERVISOR: SYSTEM_ACCOUNTS.SUPERVISOR_MUTHUKUMAR,
  INSPECTOR: SYSTEM_ACCOUNTS.INSPECTOR_VISHNU_PRASATH
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      // Purge any stale legacy localStorage credentials that cause unintended auto-login
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
      }
      const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('token') : null;
      const saved = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('user') : null;
      if (token && saved) {
        return JSON.parse(saved);
      }
      return null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  // Authenticate session against database on startup to verify token & enforce server role
  useEffect(() => {
    async function verifySession() {
      const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('token') : null;
      if (token) {
        try {
          const res = await api.getProfile();
          if (res && res.success && res.data) {
            setUser(res.data);
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem('user', JSON.stringify(res.data));
              sessionStorage.setItem('role', res.data.role);
            }
          } else if (res && (res.status === 401 || res.status === 403 || res.success === false)) {
            logout();
          }
        } catch (e) {
          // Keep cached user if transient network error
        }
      } else {
        // No token present: ensure clean unauthenticated state
        setUser(null);
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('role');
        }
      }
    }
    verifySession();
  }, []);

  const login = async (identifier, password) => {
    setLoading(true);
    const res = await api.login(identifier, password);
    setLoading(false);

    const loggedUser = res.data?.user || res.user;
    const token = res.data?.token || res.token;
    if (res.success && loggedUser && token) {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(loggedUser));
        sessionStorage.setItem('role', loggedUser.role);
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
      }
      setUser(loggedUser);
      
      let redirectPath = '/admin-dashboard';
      if (loggedUser.role === 'INSPECTOR') {
        redirectPath = '/field-inspector';
      } else {
        redirectPath = '/admin-dashboard';
      }

      return { success: true, user: loggedUser, role: loggedUser.role, redirectPath };
    }
    return { success: false, error: res.error || 'Authentication failed. Please verify credentials.' };
  };

  const logout = () => {
    try {
      cleanupLiveShareOnLogout();
    } catch (e) {}
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('role');
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
    }
    setUser(null);
  };

  const updateUser = (updatedFields) => {
    setUser(prev => {
      const merged = { ...prev, ...updatedFields };
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('user', JSON.stringify(merged));
        }
      } catch (e) {}
      return merged;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
