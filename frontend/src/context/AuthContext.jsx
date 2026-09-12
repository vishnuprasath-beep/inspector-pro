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
    password: 'Admin@Selva2026',
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
    portal: 'Admin Command Center',
    password: 'Director@Radha2026',
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
    portal: 'Admin Command Center',
    password: 'Super@Muthu2026',
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
    password: 'Insp@VishnuP2026',
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
    password: 'Insp@VishnuV2026',
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
    password: 'Insp@Siva2026',
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
    password: 'Insp@Sriram2026',
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
    password: 'Insp@Maha2026',
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
    password: 'Insp@Sivamathi2026',
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
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  // Authenticate session against database on startup to prevent client-side role forgery
  useEffect(() => {
    async function verifySession() {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.getProfile();
          if (res && res.success && res.data) {
            // Re-sync authentic user profile and enforce server role directly from DB
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
            localStorage.setItem('role', res.data.role);
          } else if (res && (res.status === 401 || res.status === 403)) {
            logout();
          }
        } catch (e) {}
      }
    }
    verifySession();
  }, []);

  const login = async (identifier, password) => {
    setLoading(true);
    const res = await api.login(identifier, password);
    setLoading(false);

    const loggedUser = res.data?.user || res.user;
    if (res.success && loggedUser) {
      const token = res.data?.token || res.token || 'demo-jwt-token-smart-inspector';
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      localStorage.setItem('role', loggedUser.role);
      setUser(loggedUser);
      
      let redirectPath = '/admin-dashboard';
      if (loggedUser.role === 'INSPECTOR') {
        redirectPath = '/field-inspector';
      } else if (loggedUser.role === 'DIRECTOR') {
        redirectPath = '/director-dashboard';
      } else if (loggedUser.role === 'SUPERVISOR') {
        redirectPath = '/supervisor-dashboard';
      }

      return { success: true, user: loggedUser, role: loggedUser.role, redirectPath };
    }
    return { success: false, error: res.error || 'Login failed. Please verify credentials.' };
  };

  const logout = () => {
    try {
      cleanupLiveShareOnLogout();
    } catch (e) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setUser(null);
  };

  const updateUser = (updatedFields) => {
    setUser(prev => {
      const merged = { ...prev, ...updatedFields };
      try {
        localStorage.setItem('user', JSON.stringify(merged));
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
