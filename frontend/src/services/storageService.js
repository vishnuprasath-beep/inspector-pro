/**
 * Inspectra Pro Comprehensive Persistent Storage Engine
 * Provides persistent database operations for:
 * - Security Management (Sessions, 2FA, Security Alerts, Password History)
 * - Real-time System & Activity Logs with categorization & filtering
 * - User Profile & Media Editing (Avatars, Bio, Role, Contact)
 * - Custom Branding (Logo Upload & Title customization)
 * - Complete CRUD across Facilities (Sites), Inspectors, Defects, and Inspections
 */

import {
  MOCK_SITES,
  MOCK_INSPECTORS,
  MOCK_INSPECTIONS,
  MOCK_DEFECTS,
  MOCK_CORRECTIVE_ACTIONS,
  MOCK_ANALYTICS,
  MOCK_AUDIT_LOGS,
  MOCK_CONSTRUCTION_ZONES,
  MOCK_ZONE_ALERTS,
  ZONE_CHECKLIST_TEMPLATES,
  MOCK_REINSPECTIONS,
  MOCK_AI_ALERTS,
  MOCK_CAMERAS
} from './mockData.js';

const KEYS = {
  INSPECTIONS: 'INSPECTRA_INSPECTIONS_V4',
  DEFECTS: 'INSPECTRA_DEFECTS_V4',
  AUDIT_LOGS: 'INSPECTRA_AUDIT_LOGS_V4',
  SITES: 'INSPECTRA_SITES_V4',
  INSPECTORS: 'INSPECTRA_INSPECTORS_V4',
  ZONES: 'INSPECTRA_CONSTRUCTION_ZONES_V1',
  ZONE_ALERTS: 'INSPECTRA_ZONE_ALERTS_V1',
  SYNC_QUEUE: 'INSPECTRA_SYNC_QUEUE_V4',
  SECURITY_SETTINGS: 'INSPECTRA_SECURITY_SETTINGS_V4',
  ACTIVE_SESSIONS: 'INSPECTRA_ACTIVE_SESSIONS_V4',
  SECURITY_ALERTS: 'INSPECTRA_SECURITY_ALERTS_V4',
  USER_PROFILES: 'INSPECTRA_USER_PROFILES_V4',
  BRANDING: 'INSPECTRA_BRANDING_V4',
  CORRECTIVE_ACTIONS: 'INSPECTRA_CORRECTIVE_ACTIONS_V5',
  SUPERVISORS: 'INSPECTRA_SUPERVISORS_V5',
  REINSPECTIONS: 'INSPECTRA_REINSPECTIONS_V6',
  AI_ALERTS: 'INSPECTRA_AI_ALERTS_V6',
  CAMERAS: 'INSPECTRA_CAMERAS_V6'
};

// Safe localStorage helpers
function hasLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function safeGet(key, fallback) {
  if (!hasLocalStorage()) return fallback;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
}

function safeSet(key, value) {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('inspectra_storage_update', { detail: { key } }));
    }
  } catch (e) {
    // Silent catch
  }
}

// Default initial datasets for security & user management
const INITIAL_SECURITY_SETTINGS = {
  two_factor_enabled: true,
  two_factor_method: 'AUTHENTICATOR_APP',
  session_timeout_minutes: 60,
  strict_geofence_enforcement: true,
  password_rotation_days: 90,
  ip_restriction_enabled: false,
  allowed_ip_range: '103.21.144.0/24'
};

const INITIAL_SESSIONS = [
  {
    id: 'sess-curr',
    device: 'Desktop Workstation (Chrome 128 on Windows 11)',
    ip_address: '103.21.144.92',
    location: 'Chennai, Tamil Nadu, India',
    is_current: true,
    last_active: 'Just now',
    login_time: '2026-09-11 08:30:12',
    status: 'ACTIVE'
  },
  {
    id: 'sess-02',
    device: 'Field Android Tablet (Inspectra Mobile v2.4)',
    ip_address: '103.21.144.110',
    location: 'Karnal Corridor, Haryana',
    is_current: false,
    last_active: '18 minutes ago',
    login_time: '2026-09-11 09:12:44',
    status: 'ACTIVE'
  },
  {
    id: 'sess-03',
    device: 'Field Inspector Smartphone (Android 14 Chrome)',
    ip_address: '103.21.144.15',
    location: 'Bengaluru Energy Park, Karnataka',
    is_current: false,
    last_active: '2 hours ago',
    login_time: '2026-09-11 07:05:19',
    status: 'ACTIVE'
  }
];

const INITIAL_SECURITY_ALERTS = [
  {
    id: 'alt-01',
    severity: 'CRITICAL',
    title: 'Geofence Perimeter Breach Detected',
    message: 'Inspector K. Anbalagan attempted inspection submission 1,840m outside authorized perimeter (Limit: 500m).',
    timestamp: '2026-09-10 17:10:04',
    entity: 'Bengaluru 400kV Grid',
    resolved: false
  },
  {
    id: 'alt-02',
    severity: 'WARNING',
    title: 'Multiple Failed PIN Verifications',
    message: '3 consecutive failed PKI signature token challenges detected on device Terminal 04.',
    timestamp: '2026-09-11 06:45:22',
    entity: 'Authentication Gateway',
    resolved: false
  },
  {
    id: 'alt-03',
    severity: 'INFO',
    title: 'Mandatory Two-Factor Authentication Activated',
    message: 'System administrator enforced TOTP authentication protocol across all active officer accounts.',
    timestamp: '2026-09-11 08:00:00',
    entity: 'Security Policy Engine',
    resolved: true
  }
];

const INITIAL_BRANDING = {
  app_name: 'INSPECTRA PRO',
  appName: 'INSPECTRA PRO',
  tagline: 'ADMIN & EXECUTIVE PORTAL',
  portalSubtitle: 'National Infrastructure Compliance Suite',
  agency_name: 'State Infrastructure Inspection Directorate',
  logo_url: '/logo.png',
  logoUrl: '/logo.png',
  primary_color: '#38bdf8'
};

const INITIAL_USER_PROFILES = {
  'usr-admin-01': {
    id: 'usr-admin-01',
    name: 'K. Selvakumar, IAS',
    email: 'selvakumar.ias@inspection.gov.in',
    phone: '+91 98401 23451',
    role: 'ADMIN',
    department: 'State Infrastructure Vigilance Commission',
    badge: 'IAS / TN-2008-042',
    bio: 'Principal Secretary & Chief Vigilance Commissioner overseeing statutory auditing of state infrastructure assets.',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
  },
  'usr-director-01': {
    id: 'usr-director-01',
    name: 'Dr. S. Radhakrishnan',
    email: 'radhakrishnan@inspection.gov.in',
    phone: '+91 98401 23452',
    role: 'DIRECTOR',
    department: 'State Directorate of Structural Safety',
    badge: 'DIR-ENG-01',
    bio: 'Chief Engineering Executive overseeing compliance frameworks and predictive structural analytics.',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
  },
  'usr-supervisor-01': {
    id: 'usr-supervisor-01',
    name: 'M. Muthukumar',
    email: 'muthukumar@inspection.gov.in',
    phone: '+91 98401 23453',
    role: 'SUPERVISOR',
    department: 'Safety & Remediation Zonal Command',
    badge: 'SUP-ZN-03',
    bio: 'Senior Quality & Safety Supervisor coordinating corrective work orders with engineering contractors.',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
  }
};

export const INITIAL_SUPERVISORS = [
  {
    id: 'usr-supervisor-01',
    name: 'M. Muthukumar',
    role: 'Senior Safety & Remediation Supervisor',
    badge: 'SUP-ZN-03',
    department: 'Safety & Remediation Zonal Command',
    email: 'muthukumar@inspection.gov.in',
    phone: '+91 98401 23453',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
  },
  {
    id: 'usr-director-01',
    name: 'Dr. S. Radhakrishnan',
    role: 'State Director of Structural Safety',
    badge: 'DIR-ENG-01',
    department: 'State Directorate of Structural Safety',
    email: 'radhakrishnan@inspection.gov.in',
    phone: '+91 98401 23452',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
  },
  {
    id: 'usr-admin-01',
    name: 'K. Selvakumar, IAS',
    role: 'Principal Administrator & Chief Vigilance Commissioner',
    badge: 'IAS / TN-2008-042',
    department: 'State Infrastructure Vigilance Commission',
    email: 'selvakumar.ias@inspection.gov.in',
    phone: '+91 98401 23451',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
  },
  {
    id: 'usr-supervisor-02',
    name: 'A. Murugan',
    role: 'Executive Compliance & Quality Supervisor',
    badge: 'SUP-QC-08',
    department: 'Quality Assurance & Non-Destructive Testing',
    email: 'murugan.a@inspection.gov.in',
    phone: '+91 98401 23455',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
  }
];

export const INITIAL_CORRECTIVE_ACTIONS = [
  {
    id: 'ACT-2026-001',
    defect_id: 'def-01',
    defect_title: 'Concrete Spalling & Exposed Rebar',
    defect_severity: 'CRITICAL',
    site_name: 'NH-44 Elevated Expressway Flyover',
    directive_title: 'Polymer Modified Mortar Grouting & Rebar Passivation',
    action_type: 'STRUCTURAL_REPAIR',
    priority: 'CRITICAL',
    assigned_supervisor_id: 'usr-supervisor-01',
    assigned_supervisor_name: 'M. Muthukumar',
    assigned_supervisor_role: 'Senior Safety & Remediation Supervisor',
    assigned_contractor: 'L&T Infrastructure Rehabilitation Team',
    estimated_cost: 85000,
    target_date: '2026-09-20',
    statutory_code: 'IRC:SP:40-2019 / IS 456-2000',
    proof_requirements: 'Compressive strength cube test (>35 MPa) + 4K Optical Photo Evidence',
    status: 'WORK_IN_PROGRESS',
    notes: 'Safety barricade established around Pier P-14. High-pressure hydro-demolition underway to clear loose concrete cover.',
    verified_by_id: null,
    verified_by_name: null,
    verified_at: null,
    verification_notes: null,
    created_at: '2026-09-10T10:30:00Z',
    payload: {
      action_id: 'ACT-2026-001',
      directive_title: 'Polymer Modified Mortar Grouting & Rebar Passivation',
      defect_reference: {
        defect_id: 'def-01',
        title: 'Concrete Spalling & Exposed Rebar',
        severity: 'CRITICAL',
        site: 'NH-44 Elevated Expressway Flyover'
      },
      supervisory_officer: {
        id: 'usr-supervisor-01',
        name: 'M. Muthukumar',
        badge: 'SUP-ZN-03',
        department: 'Safety & Remediation Zonal Command'
      },
      execution_agency: 'L&T Infrastructure Rehabilitation Team',
      remediation_type: 'STRUCTURAL_REPAIR',
      sla_deadline: '2026-09-20',
      estimated_budget_inr: 85000,
      statutory_compliance: 'IRC:SP:40-2019 / IS 456-2000',
      verification_protocol: 'Compressive strength cube test (>35 MPa) + 4K Optical Photo Evidence',
      status: 'WORK_IN_PROGRESS'
    }
  },
  {
    id: 'ACT-2026-002',
    defect_id: 'def-02',
    defect_title: 'Transformer Bushing Overheating (78°C)',
    defect_severity: 'HIGH',
    site_name: '400kV Ultra-High Voltage Substation',
    directive_title: 'Shutdown Maintenance, Bushing Replacement & DGA Sampling',
    action_type: 'ELECTRICAL_ISOLATION',
    priority: 'HIGH',
    assigned_supervisor_id: 'usr-director-01',
    assigned_supervisor_name: 'Dr. S. Radhakrishnan',
    assigned_supervisor_role: 'State Director of Structural Safety',
    assigned_contractor: 'BHEL Grid Specialist Unit',
    estimated_cost: 145000,
    target_date: '2026-09-16',
    statutory_code: 'CEA Grid Standard 2010 / IEEE C57.104',
    proof_requirements: 'DGA Gas Chromatography Report + FLIR Thermal Scan < 45°C',
    status: 'ASSIGNED',
    notes: 'Scheduled grid outage window approved by State Load Despatch Centre for 02:00-06:00 hrs.',
    verified_by_id: null,
    verified_by_name: null,
    verified_at: null,
    verification_notes: null,
    created_at: '2026-09-09T14:15:00Z',
    payload: {
      action_id: 'ACT-2026-002',
      directive_title: 'Shutdown Maintenance, Bushing Replacement & DGA Sampling',
      defect_reference: {
        defect_id: 'def-02',
        title: 'Transformer Bushing Overheating (78°C)',
        severity: 'HIGH',
        site: '400kV Ultra-High Voltage Substation'
      },
      supervisory_officer: {
        id: 'usr-director-01',
        name: 'Dr. S. Radhakrishnan',
        badge: 'DIR-ENG-01',
        department: 'State Directorate of Structural Safety'
      },
      execution_agency: 'BHEL Grid Specialist Unit',
      remediation_type: 'ELECTRICAL_ISOLATION',
      sla_deadline: '2026-09-16',
      estimated_budget_inr: 145000,
      statutory_compliance: 'CEA Grid Standard 2010 / IEEE C57.104',
      verification_protocol: 'DGA Gas Chromatography Report + FLIR Thermal Scan < 45°C',
      status: 'ASSIGNED'
    }
  },
  {
    id: 'ACT-2026-003',
    defect_id: 'def-03',
    defect_title: 'Crown Delamination & Water Ingress',
    defect_severity: 'MEDIUM',
    site_name: 'Coastal Road Subsea Tunnel Twin-Tube',
    directive_title: 'Hydrophobic Polyurethane Grouting & Void Injection',
    action_type: 'WATERPROOFING_MEMBRANE',
    priority: 'MEDIUM',
    assigned_supervisor_id: 'usr-admin-01',
    assigned_supervisor_name: 'K. Selvakumar, IAS',
    assigned_supervisor_role: 'Principal Administrator',
    assigned_contractor: 'Afcons Marine Civil Engineering',
    estimated_cost: 92000,
    target_date: '2026-09-25',
    statutory_code: 'BS EN 1504-5 / ASTM D4580',
    proof_requirements: 'Zero seepage acoustic sensor log for 72 continuous hours',
    status: 'WORK_IN_PROGRESS',
    notes: 'Dual-component injection packers drilled along fissure perimeter at Chainage 2+410.',
    verified_by_id: null,
    verified_by_name: null,
    verified_at: null,
    verification_notes: null,
    created_at: '2026-09-08T11:00:00Z',
    payload: {
      action_id: 'ACT-2026-003',
      directive_title: 'Hydrophobic Polyurethane Grouting & Void Injection',
      defect_reference: {
        defect_id: 'def-03',
        title: 'Crown Delamination & Water Ingress',
        severity: 'MEDIUM',
        site: 'Coastal Road Subsea Tunnel Twin-Tube'
      },
      supervisory_officer: {
        id: 'usr-admin-01',
        name: 'K. Selvakumar, IAS',
        badge: 'IAS / TN-2008-042',
        department: 'State Infrastructure Vigilance Commission'
      },
      execution_agency: 'Afcons Marine Civil Engineering',
      remediation_type: 'WATERPROOFING_MEMBRANE',
      sla_deadline: '2026-09-25',
      estimated_budget_inr: 92000,
      statutory_compliance: 'BS EN 1504-5 / ASTM D4580',
      verification_protocol: 'Zero seepage acoustic sensor log for 72 continuous hours',
      status: 'WORK_IN_PROGRESS'
    }
  },
  {
    id: 'ACT-2026-004',
    defect_id: 'def-04',
    defect_title: 'Emergency Fire Exit Blockage',
    defect_severity: 'CRITICAL',
    site_name: 'Delhi Metro Anand Vihar Interchange',
    directive_title: 'Immediate Physical Egress Clearance & Obstruction Penalty',
    action_type: 'SAFETY_CORRECTION',
    priority: 'CRITICAL',
    assigned_supervisor_id: 'usr-supervisor-01',
    assigned_supervisor_name: 'M. Muthukumar',
    assigned_supervisor_role: 'Senior Safety & Remediation Supervisor',
    assigned_contractor: 'Delhi Metro Rapid Facilities Wing',
    estimated_cost: 0,
    target_date: '2026-09-08',
    statutory_code: 'National Building Code (NBC) 2016 Part 4',
    proof_requirements: '2.4m unencumbered corridor width verified + Door latch test',
    status: 'VERIFIED',
    notes: 'Obstruction cleared within 45 minutes of directive issuance.',
    verified_by_id: 'usr-supervisor-01',
    verified_by_name: 'M. Muthukumar',
    verified_at: '2026-09-08T17:30:00Z',
    verification_notes: 'Physical walk-through conducted. Emergency panic bar operational. Contractor penalty notice served under Clause 14B.',
    created_at: '2026-09-08T09:30:00Z',
    payload: {
      action_id: 'ACT-2026-004',
      directive_title: 'Immediate Physical Egress Clearance & Obstruction Penalty',
      defect_reference: {
        defect_id: 'def-04',
        title: 'Emergency Fire Exit Blockage',
        severity: 'CRITICAL',
        site: 'Delhi Metro Anand Vihar Interchange'
      },
      supervisory_officer: {
        id: 'usr-supervisor-01',
        name: 'M. Muthukumar',
        badge: 'SUP-ZN-03',
        department: 'Safety & Remediation Zonal Command'
      },
      execution_agency: 'Delhi Metro Rapid Facilities Wing',
      remediation_type: 'SAFETY_CORRECTION',
      sla_deadline: '2026-09-08',
      estimated_budget_inr: 0,
      statutory_compliance: 'NBC 2016 Part 4',
      verification_protocol: '2.4m unencumbered corridor width verified + Door latch test',
      status: 'VERIFIED'
    }
  }
];

// Normalize and standardize audit log items
function normalizeLogItem(item) {
  return {
    id: item.id || `log-${Math.random().toString(36).substring(2, 8)}`,
    timestamp: item.timestamp || item.created_at || new Date().toISOString(),
    action: item.action || item.event || 'SYSTEM_EVENT',
    event: item.event || item.action || 'SYSTEM_EVENT',
    category: item.category || (item.event?.includes('INSPECTION') ? 'INSPECTION' : item.event?.includes('GEOFENCE') ? 'GEOFENCE' : 'SECURITY'),
    severity: item.severity || (item.event?.includes('ALERT') || item.event?.includes('FLAGGED') ? 'WARNING' : 'INFO'),
    user: item.user || item.user_name || 'System Admin',
    user_name: item.user_name || item.user || 'System Admin',
    user_role: item.user_role || (item.user?.includes('INSP') ? 'INSPECTOR' : 'ADMIN'),
    entity_type: item.entity_type || item.site || 'SECURITY_GATEWAY',
    site: item.site || item.entity_type || 'General System',
    ip_address: item.ip_address || item.ip || '103.21.144.' + Math.floor(10 + Math.random() * 80),
    ip: item.ip || item.ip_address || '103.21.144.92',
    user_agent: item.user_agent || 'Inspectra Pro Enterprise v2.4 (Win64; x64)',
    details: item.details || item.geofence_result ? { note: item.geofence_result } : { status: 'SUCCESS' }
  };
}

// Initial storage bootstrap
export function initStorage() {
  if (!safeGet(KEYS.INSPECTIONS, null)) safeSet(KEYS.INSPECTIONS, MOCK_INSPECTIONS);
  if (!safeGet(KEYS.DEFECTS, null)) safeSet(KEYS.DEFECTS, MOCK_DEFECTS);
  if (!safeGet(KEYS.SITES, null)) safeSet(KEYS.SITES, MOCK_SITES);
  if (!safeGet(KEYS.INSPECTORS, null)) safeSet(KEYS.INSPECTORS, MOCK_INSPECTORS);
  if (!safeGet(KEYS.ZONES, null)) safeSet(KEYS.ZONES, MOCK_CONSTRUCTION_ZONES);
  if (!safeGet(KEYS.ZONE_ALERTS, null)) safeSet(KEYS.ZONE_ALERTS, MOCK_ZONE_ALERTS);
  if (!safeGet(KEYS.SYNC_QUEUE, null)) safeSet(KEYS.SYNC_QUEUE, []);
  if (!safeGet(KEYS.SECURITY_SETTINGS, null)) safeSet(KEYS.SECURITY_SETTINGS, INITIAL_SECURITY_SETTINGS);
  if (!safeGet(KEYS.ACTIVE_SESSIONS, null)) safeSet(KEYS.ACTIVE_SESSIONS, INITIAL_SESSIONS);
  if (!safeGet(KEYS.SECURITY_ALERTS, null)) safeSet(KEYS.SECURITY_ALERTS, INITIAL_SECURITY_ALERTS);
  if (!safeGet(KEYS.USER_PROFILES, null)) safeSet(KEYS.USER_PROFILES, INITIAL_USER_PROFILES);
  if (!safeGet(KEYS.BRANDING, null)) safeSet(KEYS.BRANDING, INITIAL_BRANDING);
  if (!safeGet(KEYS.SUPERVISORS, null)) safeSet(KEYS.SUPERVISORS, INITIAL_SUPERVISORS);
  if (!safeGet(KEYS.CORRECTIVE_ACTIONS, null)) safeSet(KEYS.CORRECTIVE_ACTIONS, INITIAL_CORRECTIVE_ACTIONS);

  // Normalize initial logs
  const existingLogs = safeGet(KEYS.AUDIT_LOGS, null);
  if (!existingLogs || existingLogs.length === 0) {
    const normalized = MOCK_AUDIT_LOGS.map(normalizeLogItem);
    safeSet(KEYS.AUDIT_LOGS, normalized);
  }
}

initStorage();

export const storageService = {
  // ==========================================
  // 1. BRANDING & LOGO CUSTOMIZATION
  // ==========================================
  getBranding: () => {
    return safeGet(KEYS.BRANDING, INITIAL_BRANDING);
  },

  updateBranding: (updates) => {
    const current = safeGet(KEYS.BRANDING, INITIAL_BRANDING);
    const updated = { ...current, ...updates };
    safeSet(KEYS.BRANDING, updated);
    return { success: true, data: updated };
  },

  // ==========================================
  // 2. USER PROFILES & PHOTO EDITING
  // ==========================================
  getUserProfile: (userId = 'usr-admin-01') => {
    const profiles = safeGet(KEYS.USER_PROFILES, INITIAL_USER_PROFILES);
    return profiles[userId] || INITIAL_USER_PROFILES['usr-admin-01'];
  },

  updateUserProfile: (userId, updates) => {
    const profiles = safeGet(KEYS.USER_PROFILES, INITIAL_USER_PROFILES);
    const current = profiles[userId] || INITIAL_USER_PROFILES['usr-admin-01'];
    const updatedUser = { ...current, ...updates };
    profiles[userId] = updatedUser;
    safeSet(KEYS.USER_PROFILES, profiles);

    // Also update logged-in session user in localStorage
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u.id === userId) {
          localStorage.setItem('user', JSON.stringify({ ...u, ...updates }));
        }
      }
    } catch (e) {}

    // Record audit log event
    storageService.addAuditLog({
      action: 'PROFILE_UPDATED',
      category: 'USER_MANAGEMENT',
      severity: 'INFO',
      user: updatedUser.name,
      entity_type: 'USER_PROFILE',
      details: { updated_fields: Object.keys(updates) }
    });

    return { success: true, data: updatedUser };
  },

  // ==========================================
  // 3. SECURITY & ACTIVE SESSIONS
  // ==========================================
  getSecuritySettings: () => {
    return safeGet(KEYS.SECURITY_SETTINGS, INITIAL_SECURITY_SETTINGS);
  },

  updateSecuritySettings: (settings) => {
    const current = safeGet(KEYS.SECURITY_SETTINGS, INITIAL_SECURITY_SETTINGS);
    const updated = { ...current, ...settings };
    safeSet(KEYS.SECURITY_SETTINGS, updated);

    storageService.addAuditLog({
      action: 'SECURITY_POLICY_CHANGED',
      category: 'SECURITY',
      severity: 'WARNING',
      user: 'K. Selvakumar, IAS',
      entity_type: 'SECURITY_SETTINGS',
      details: settings
    });

    return { success: true, data: updated };
  },

  getActiveSessions: () => {
    return safeGet(KEYS.ACTIVE_SESSIONS, INITIAL_SESSIONS);
  },

  revokeSession: (sessionId) => {
    const sessions = safeGet(KEYS.ACTIVE_SESSIONS, INITIAL_SESSIONS);
    const updated = sessions.filter(s => s.id !== sessionId);
    safeSet(KEYS.ACTIVE_SESSIONS, updated);

    storageService.addAuditLog({
      action: 'SESSION_TERMINATED',
      category: 'SECURITY',
      severity: 'WARNING',
      user: 'K. Selvakumar, IAS',
      entity_type: 'AUTH_SESSION',
      details: { revoked_session_id: sessionId }
    });

    return { success: true };
  },

  terminateAllOtherSessions: () => {
    const sessions = safeGet(KEYS.ACTIVE_SESSIONS, INITIAL_SESSIONS);
    const currentOnly = sessions.filter(s => s.is_current);
    safeSet(KEYS.ACTIVE_SESSIONS, currentOnly);

    storageService.addAuditLog({
      action: 'ALL_SESSIONS_REVOKED',
      category: 'SECURITY',
      severity: 'CRITICAL',
      user: 'K. Selvakumar, IAS',
      entity_type: 'AUTH_SESSION',
      details: { remaining: currentOnly.length }
    });

    return { success: true };
  },

  getSecurityAlerts: () => {
    return safeGet(KEYS.SECURITY_ALERTS, INITIAL_SECURITY_ALERTS);
  },

  dismissSecurityAlert: (alertId) => {
    const alerts = safeGet(KEYS.SECURITY_ALERTS, INITIAL_SECURITY_ALERTS);
    const updated = alerts.map(a => a.id === alertId ? { ...a, resolved: true } : a);
    safeSet(KEYS.SECURITY_ALERTS, updated);
    return { success: true };
  },

  changePassword: (oldPassword, newPassword) => {
    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long.' };
    }

    storageService.addAuditLog({
      action: 'PASSWORD_CHANGED',
      category: 'SECURITY',
      severity: 'INFO',
      user: 'K. Selvakumar, IAS',
      entity_type: 'CREDENTIALS',
      details: { method: 'USER_INITIATED_ROTATION' }
    });

    return { success: true, message: 'Password updated successfully across all active nodes.' };
  },

  // ==========================================
  // 4. ACTIVITY & AUDIT LOGS (ROBUST & SEARCHABLE)
  // ==========================================
  getAuditLogs: (filter = {}) => {
    const rawLogs = safeGet(KEYS.AUDIT_LOGS, []);
    let list = rawLogs.map(normalizeLogItem);

    if (filter.category && filter.category !== 'ALL') {
      list = list.filter(l => l.category === filter.category);
    }
    if (filter.severity && filter.severity !== 'ALL') {
      list = list.filter(l => l.severity === filter.severity);
    }
    if (filter.search) {
      const term = filter.search.toLowerCase();
      list = list.filter(l => 
        l.action.toLowerCase().includes(term) ||
        l.user.toLowerCase().includes(term) ||
        l.entity_type.toLowerCase().includes(term) ||
        l.ip_address.includes(term)
      );
    }

    return list;
  },

  addAuditLog: (entry) => {
    const rawLogs = safeGet(KEYS.AUDIT_LOGS, []);
    const normalized = normalizeLogItem(entry);
    const updated = [normalized, ...rawLogs];
    safeSet(KEYS.AUDIT_LOGS, updated);
    return normalized;
  },

  clearAuditLogs: () => {
    safeSet(KEYS.AUDIT_LOGS, []);
    return { success: true };
  },

  // ==========================================
  // 5. FACILITIES (SITES) CRUD
  // ==========================================
  getSites: () => {
    return safeGet(KEYS.SITES, MOCK_SITES);
  },

  getSiteById: (id) => {
    const sites = safeGet(KEYS.SITES, MOCK_SITES);
    return sites.find(s => s.id === id) || sites[0];
  },

  createSite: (siteData) => {
    const sites = safeGet(KEYS.SITES, MOCK_SITES);
    const newSite = {
      id: `site-${Date.now().toString().slice(-5)}`,
      name: siteData.name || 'New Monitored Infrastructure',
      code: siteData.code || `FAC-${Math.floor(100 + Math.random() * 900)}`,
      category: siteData.category || 'CIVIL_STRUCTURE',
      address: siteData.address || 'Designated Infrastructure Location',
      latitude: parseFloat(siteData.latitude) || 28.6139,
      longitude: parseFloat(siteData.longitude) || 77.2090,
      geofence_radius: parseInt(siteData.geofence_radius, 10) || 600,
      status: siteData.status || 'ACTIVE',
      health_score: 95.0,
      last_inspection: new Date().toISOString().split('T')[0]
    };

    safeSet(KEYS.SITES, [newSite, ...sites]);

    storageService.addAuditLog({
      action: 'FACILITY_CREATED',
      category: 'FACILITIES',
      severity: 'INFO',
      user: 'K. Selvakumar, IAS',
      entity_type: 'SITE_REGISTRY',
      details: { site_id: newSite.id, name: newSite.name }
    });

    return { success: true, data: newSite };
  },

  updateSite: (id, updates) => {
    const sites = safeGet(KEYS.SITES, MOCK_SITES);
    const updated = sites.map(s => s.id === id ? { 
      ...s, 
      ...updates,
      latitude: updates.latitude != null ? parseFloat(updates.latitude) : s.latitude,
      longitude: updates.longitude != null ? parseFloat(updates.longitude) : s.longitude,
      geofence_radius: updates.geofence_radius != null ? parseInt(updates.geofence_radius, 10) : s.geofence_radius
    } : s);
    safeSet(KEYS.SITES, updated);

    storageService.addAuditLog({
      action: 'FACILITY_UPDATED',
      category: 'FACILITIES',
      severity: 'INFO',
      user: 'K. Selvakumar, IAS',
      entity_type: 'SITE_REGISTRY',
      details: { site_id: id, ...updates }
    });

    return { success: true };
  },

  deleteSite: (id) => {
    const sites = safeGet(KEYS.SITES, MOCK_SITES);
    const target = sites.find(s => s.id === id);
    safeSet(KEYS.SITES, sites.filter(s => s.id !== id));

    storageService.addAuditLog({
      action: 'FACILITY_DELETED',
      category: 'FACILITIES',
      severity: 'WARNING',
      user: 'K. Selvakumar, IAS',
      entity_type: 'SITE_REGISTRY',
      details: { site_id: id, name: target?.name }
    });

    return { success: true };
  },

  // ==========================================
  // 6. INSPECTORS CRUD
  // ==========================================
  getInspectors: () => {
    return safeGet(KEYS.INSPECTORS, MOCK_INSPECTORS);
  },

  getInspectorById: (id) => {
    const list = safeGet(KEYS.INSPECTORS, MOCK_INSPECTORS);
    return list.find(i => i.id === id) || list[0];
  },

  createInspector: (data) => {
    const list = safeGet(KEYS.INSPECTORS, MOCK_INSPECTORS);
    const newInsp = {
      id: `usr-insp-${Date.now().toString().slice(-4)}`,
      name: data.name || 'New Field Inspector',
      badge_number: data.badge_number || `INSP-2024-00${list.length + 1}`,
      email: data.email || 'inspector@inspection.gov.in',
      phone: data.phone || '+91 98401 00000',
      status: data.status || 'ACTIVE',
      battery_level: 100,
      latitude: data.latitude ? parseFloat(data.latitude) : 28.7041,
      longitude: data.longitude ? parseFloat(data.longitude) : 77.1025,
      assigned_site_id: data.assigned_site_id || 'site-nh44-flyover',
      assigned_site_name: data.assigned_site_name || 'Designated Facility',
      geofence_status: 'IN_GEOFENCE',
      completed_audits: 0,
      performance_score: 98.0
    };

    safeSet(KEYS.INSPECTORS, [newInsp, ...list]);

    storageService.addAuditLog({
      action: 'INSPECTOR_COMMISSIONED',
      category: 'FLEET',
      severity: 'INFO',
      user: 'K. Selvakumar, IAS',
      entity_type: 'OFFICER_FLEET',
      details: { inspector_id: newInsp.id, name: newInsp.name }
    });

    return { success: true, data: newInsp };
  },

  updateInspector: (id, updates) => {
    const list = safeGet(KEYS.INSPECTORS, MOCK_INSPECTORS);
    const updated = list.map(i => i.id === id ? { ...i, ...updates } : i);
    safeSet(KEYS.INSPECTORS, updated);

    // Also update logged-in session user in localStorage if this inspector is active
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u.id === id || u.username === id || (updates.name && u.name === updates.name)) {
          localStorage.setItem('user', JSON.stringify({ ...u, ...updates }));
        }
      }
    } catch (e) {}

    storageService.addAuditLog({
      action: 'INSPECTOR_MODIFIED',
      category: 'FLEET',
      severity: 'INFO',
      user: 'K. Selvakumar, IAS',
      entity_type: 'OFFICER_FLEET',
      details: { inspector_id: id, ...updates }
    });

    return { success: true };
  },

  deleteInspector: (id) => {
    const list = safeGet(KEYS.INSPECTORS, MOCK_INSPECTORS);
    safeSet(KEYS.INSPECTORS, list.filter(i => i.id !== id));

    storageService.addAuditLog({
      action: 'INSPECTOR_DECOMMISSIONED',
      category: 'FLEET',
      severity: 'WARNING',
      user: 'K. Selvakumar, IAS',
      entity_type: 'OFFICER_FLEET',
      details: { inspector_id: id }
    });

    return { success: true };
  },

  // ==========================================
  // 7. DEFECTS CRUD
  // ==========================================
  getDefects: (filter = {}) => {
    let list = safeGet(KEYS.DEFECTS, MOCK_DEFECTS);
    if (filter.status && filter.status !== 'ALL') {
      list = list.filter(d => d.status === filter.status);
    }
    if (filter.severity && filter.severity !== 'ALL') {
      list = list.filter(d => d.severity === filter.severity);
    }
    return list;
  },

  getDefectById: (id) => {
    const list = safeGet(KEYS.DEFECTS, MOCK_DEFECTS);
    return list.find(d => d.id === id) || null;
  },

  createDefect: (defectData) => {
    const defects = safeGet(KEYS.DEFECTS, MOCK_DEFECTS);
    const newDefect = {
      id: `def-${Date.now().toString().slice(-4)}`,
      site_name: defectData.site_name || 'Designated Facility',
      component: defectData.component || 'Structural Element',
      category: defectData.category || 'STRUCTURAL',
      severity: defectData.severity || 'CRITICAL',
      title: defectData.title || 'Engineering Defect',
      description: defectData.description || 'Observed anomaly during inspection.',
      status: 'OPEN',
      assigned_to: defectData.assigned_to || 'Regional Maintenance Wing',
      created_at: new Date().toISOString().split('T')[0]
    };

    safeSet(KEYS.DEFECTS, [newDefect, ...defects]);

    storageService.addAuditLog({
      action: 'DEFECT_REGISTERED',
      category: 'DEFECTS',
      severity: defectData.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      user: 'K. Selvakumar, IAS',
      entity_type: 'DEFECT_LEDGER',
      details: { defect_id: newDefect.id, title: newDefect.title }
    });

    return { success: true, data: newDefect };
  },

  updateDefect: (id, updates) => {
    const defects = safeGet(KEYS.DEFECTS, MOCK_DEFECTS);
    const updated = defects.map(d => d.id === id ? { ...d, ...updates, updated_at: new Date().toISOString() } : d);
    safeSet(KEYS.DEFECTS, updated);

    storageService.addAuditLog({
      action: 'DEFECT_STATUS_MODIFIED',
      category: 'DEFECTS',
      severity: 'INFO',
      user: 'K. Selvakumar, IAS',
      entity_type: 'DEFECT_LEDGER',
      details: { defect_id: id, ...updates }
    });

    return { success: true };
  },

  updateDefectStatus: (id, status, rootCause) => {
    return storageService.updateDefect(id, { status, root_cause: rootCause });
  },

  recordReinspection: (defectId, passOrFailOrPayload, evidencePhoto, remarks, inspectorName) => {
    let result = passOrFailOrPayload;
    let photo = evidencePhoto;
    let notes = remarks;
    let auditor = inspectorName;

    // Support object payload: { result, photo_url, remarks, reinspected_by }
    if (typeof passOrFailOrPayload === 'object' && passOrFailOrPayload !== null) {
      result = passOrFailOrPayload.result || 'PASS';
      photo = passOrFailOrPayload.photo_url || passOrFailOrPayload.reinspection_evidence;
      notes = passOrFailOrPayload.remarks || passOrFailOrPayload.notes;
      auditor = passOrFailOrPayload.reinspected_by || passOrFailOrPayload.inspector_name;
    }

    const defects = safeGet(KEYS.DEFECTS, MOCK_DEFECTS);
    const isPass = result === 'PASS';
    const updated = defects.map(d => {
      if (d.id === defectId) {
        return {
          ...d,
          status: isPass ? 'CLOSED' : 'CORRECTIVE_ACTION_REQUIRED',
          reinspection_status: isPass ? 'PASSED' : 'FAILED',
          reinspected_at: new Date().toISOString(),
          reinspected_by: auditor || 'Field Auditor',
          reinspection_evidence: photo || d.photo_url,
          reinspection_notes: notes || ''
        };
      }
      return d;
    });
    safeSet(KEYS.DEFECTS, updated);

    // Also update any matching corrective action
    try {
      const actions = safeGet(KEYS.CORRECTIVE_ACTIONS, []);
      const updatedActions = actions.map(act => {
        if (act.defect_id === defectId || act.id === defectId) {
          return {
            ...act,
            status: isPass ? 'VERIFIED' : 'WORK_IN_PROGRESS',
            verified_by_name: auditor || 'Field Auditor',
            verified_at: new Date().toISOString(),
            verification_notes: notes || ''
          };
        }
        return act;
      });
      safeSet(KEYS.CORRECTIVE_ACTIONS, updatedActions);
    } catch (e) {}

    storageService.addAuditLog({
      action: isPass ? 'DEFECT_REINSPECTION_PASSED' : 'DEFECT_REINSPECTION_FAILED',
      category: 'DEFECTS',
      severity: isPass ? 'INFO' : 'WARNING',
      user: auditor || 'Field Auditor',
      entity_type: 'DEFECT_LEDGER',
      details: { defect_id: defectId, result: isPass ? 'PASSED_CLOSED' : 'FAILED_REOPENED', remarks: notes }
    });

    try {
      window.dispatchEvent(new Event('inspectra_storage_update'));
    } catch (e) {}

    return { success: true, isPass };
  },

  // ==========================================
  // COMPREHENSIVE MULTI-STEP RE-INSPECTION LIFECYCLE
  // ==========================================
  getReinspections: (filter = {}) => {
    const list = safeGet(KEYS.REINSPECTIONS, MOCK_REINSPECTIONS);
    return list.filter(r => {
      if (filter.defect_id && r.defect_id !== filter.defect_id) return false;
      if (filter.assigned_inspector_id && r.assigned_inspector_id !== filter.assigned_inspector_id) return false;
      if (filter.status && r.status.toUpperCase() !== filter.status.toUpperCase()) return false;
      return true;
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getReinspectionById: (id) => {
    const list = safeGet(KEYS.REINSPECTIONS, MOCK_REINSPECTIONS);
    return list.find(r => r.id === id) || null;
  },

  createReinspectionRequest: (payload = {}) => {
    const list = safeGet(KEYS.REINSPECTIONS, MOCK_REINSPECTIONS);
    const defects = safeGet(KEYS.DEFECTS, MOCK_DEFECTS);
    const defect = defects.find(d => d.id === payload.defect_id) || {};

    const newReinspection = {
      id: `reinsp-${Date.now().toString().slice(-6)}`,
      defect_id: payload.defect_id,
      original_inspection_id: defect.inspection_id || payload.original_inspection_id || 'insp-001',
      site_id: payload.site_id || defect.site_id || 'site-001',
      site_name: payload.site_name || defect.site_name || 'Main Construction Site',
      assigned_inspector_id: payload.assigned_inspector_id || 'usr-insp-vp01',
      assigned_inspector_name: payload.assigned_inspector_name || 'Vishnu Prasath',
      priority: (payload.priority || 'HIGH').toUpperCase(),
      deadline: payload.deadline || new Date(Date.now() + 86400000 * 2).toISOString(),
      instructions: payload.instructions || 'Conduct physical site inspection and verify corrective actions.',
      original_defect: {
        id: defect.id || payload.defect_id,
        title: defect.title || payload.title || 'Reported Issue',
        description: defect.description || '',
        severity: defect.severity || 'HIGH',
        photo_url: defect.photo_url || null,
        location_details: defect.location_details || defect.component || ''
      },
      status: 'ASSIGNED',
      result: null,
      new_evidence_photo: null,
      notes: null,
      yolo_detection: null,
      location_verified: false,
      coords: null,
      created_by: payload.created_by || 'Administrator',
      created_at: new Date().toISOString(),
      completed_at: null
    };

    list.unshift(newReinspection);
    safeSet(KEYS.REINSPECTIONS, list);

    // Update parent defect status to REINSPECTION_REQUIRED
    const updatedDefects = defects.map(d => {
      if (d.id === payload.defect_id) {
        return {
          ...d,
          status: 'REINSPECTION_REQUIRED',
          reinspection_status: 'PENDING_INSPECTION',
          active_reinspection_id: newReinspection.id
        };
      }
      return d;
    });
    safeSet(KEYS.DEFECTS, updatedDefects);

    try {
      window.dispatchEvent(new Event('inspectra_storage_update'));
    } catch (e) {}

    return { success: true, data: newReinspection };
  },

  submitReinspection: (reinspectionId, payload = {}) => {
    const list = safeGet(KEYS.REINSPECTIONS, MOCK_REINSPECTIONS);
    const defects = safeGet(KEYS.DEFECTS, MOCK_DEFECTS);
    const now = new Date().toISOString();

    const outcome = (payload.result || 'FIXED').toUpperCase(); // 'FIXED' | 'STILL_OPEN' | 'NEEDS_MORE_WORK'
    let updatedTarget = null;

    const updatedList = list.map(r => {
      if (r.id === reinspectionId) {
        updatedTarget = {
          ...r,
          status: 'COMPLETED',
          result: outcome,
          new_evidence_photo: payload.new_photo_url || payload.photo_url || r.original_defect?.photo_url,
          notes: payload.notes || payload.remarks || 'Re-inspection completed on site.',
          yolo_detection: payload.yolo_result || null,
          location_verified: !!payload.location_verified,
          coords: payload.coords || null,
          completed_at: now,
          completed_by: payload.completed_by || r.assigned_inspector_name
        };
        return updatedTarget;
      }
      return r;
    });
    safeSet(KEYS.REINSPECTIONS, updatedList);

    // Determine new defect status based on outcome
    let newDefectStatus = 'OPEN';
    if (outcome === 'FIXED') {
      newDefectStatus = 'CLOSED';
    } else if (outcome === 'NEEDS_MORE_WORK') {
      newDefectStatus = 'REINSPECTION_REQUIRED';
    }

    if (updatedTarget) {
      const updatedDefects = defects.map(d => {
        if (d.id === updatedTarget.defect_id) {
          return {
            ...d,
            status: newDefectStatus,
            reinspection_status: outcome,
            last_reinspection_at: now,
            last_reinspected_by: updatedTarget.completed_by,
            latest_evidence_photo: updatedTarget.new_evidence_photo
          };
        }
        return d;
      });
      safeSet(KEYS.DEFECTS, updatedDefects);
    }

    try {
      window.dispatchEvent(new Event('inspectra_storage_update'));
    } catch (e) {}

    return { success: true, data: updatedTarget };
  },

  getIssueHistory: (defectId) => {
    const defects = safeGet(KEYS.DEFECTS, MOCK_DEFECTS);
    const defect = defects.find(d => d.id === defectId) || {};
    const inspections = safeGet(KEYS.INSPECTIONS, MOCK_INSPECTIONS);
    const originalInspection = inspections.find(i => i.id === defect.inspection_id) || null;
    const allReinspections = safeGet(KEYS.REINSPECTIONS, MOCK_REINSPECTIONS)
      .filter(r => r.defect_id === defectId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    return {
      issue: defect,
      original_inspection: originalInspection,
      timeline: [
        {
          step: 'ORIGINAL_INSPECTION',
          title: 'Original Inspection Conducted',
          date: originalInspection ? originalInspection.created_at : defect.created_at,
          actor: originalInspection ? originalInspection.inspector_name : 'Field Auditor',
          details: originalInspection ? `Inspection #${originalInspection.id}` : 'Initial Inspection',
          photo: defect.photo_url
        },
        {
          step: 'ISSUE_IDENTIFIED',
          title: `Issue Logged: ${defect.title || 'Anomaly'}`,
          date: defect.created_at,
          actor: defect.inspector_name || 'Field Auditor',
          severity: defect.severity,
          details: defect.description,
          photo: defect.photo_url
        },
        ...allReinspections.map((r, idx) => ({
          step: `REINSPECTION_${idx + 1}`,
          reinspection_id: r.id,
          title: `Re-Inspection #${idx + 1}`,
          status: r.status,
          result: r.result,
          date: r.completed_at || r.created_at,
          actor: r.assigned_inspector_name,
          notes: r.notes || r.instructions,
          photo: r.new_evidence_photo || null,
          yolo: r.yolo_detection || null
        }))
      ],
      reinspections: allReinspections,
      current_status: defect.status
    };
  },

  // ==========================================
  // AI ALERTS & CAMERAS REPOSITORY
  // ==========================================
  getAiAlerts: (filter = {}) => {
    const alerts = safeGet(KEYS.AI_ALERTS, MOCK_AI_ALERTS);
    return alerts.filter(a => {
      if (filter.source && a.source !== filter.source) return false;
      if (filter.status && a.status.toUpperCase() !== filter.status.toUpperCase()) return false;
      return true;
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  updateAiAlert: (id, updates = {}) => {
    const alerts = safeGet(KEYS.AI_ALERTS, MOCK_AI_ALERTS);
    const updated = alerts.map(a => (a.id === id ? { ...a, ...updates } : a));
    safeSet(KEYS.AI_ALERTS, updated);
    return { success: true };
  },

  getCameras: () => {
    return safeGet(KEYS.CAMERAS, MOCK_CAMERAS);
  },

  updateCameraStatus: (id, status) => {
    const cameras = safeGet(KEYS.CAMERAS, MOCK_CAMERAS);
    const updated = cameras.map(c => (c.id === id ? { ...c, status } : c));
    safeSet(KEYS.CAMERAS, updated);
    return { success: true };
  },

  submitContractorRework: (defectId, reworkData = {}) => {
    const defects = safeGet(KEYS.DEFECTS, MOCK_DEFECTS);
    const updated = defects.map(d => {
      if (d.id === defectId) {
        return {
          ...d,
          status: 'REINSPECTION_REQUIRED',
          rework_photo_url: reworkData.photo_url || reworkData.rework_photo || '',
          rework_notes: reworkData.notes || reworkData.remediation_notes || '',
          rework_contractor: reworkData.contractor_name || reworkData.assigned_contractor || 'Contractor Team',
          rework_submitted_at: new Date().toISOString(),
          reinspection_status: 'PENDING'
        };
      }
      return d;
    });
    safeSet(KEYS.DEFECTS, updated);

    // Also update corresponding Corrective Action if present
    try {
      const actions = safeGet(KEYS.CORRECTIVE_ACTIONS, []);
      const updatedActions = actions.map(act => {
        if (act.defect_id === defectId || act.id === defectId || act.id === reworkData.action_id) {
          return {
            ...act,
            status: 'VERIFICATION_REQUIRED',
            proof_photo_url: reworkData.photo_url || '',
            contractor_remarks: reworkData.notes || '',
            rework_submitted_at: new Date().toISOString()
          };
        }
        return act;
      });
      safeSet(KEYS.CORRECTIVE_ACTIONS, updatedActions);
    } catch (e) {}

    storageService.addAuditLog({
      action: 'CONTRACTOR_REWORK_SUBMITTED',
      category: 'REMEDIATION',
      severity: 'INFO',
      user: reworkData.contractor_name || 'Contractor Agency',
      entity_type: 'DEFECT_LEDGER',
      details: { defect_id: defectId, notes: reworkData.notes, photo_url: reworkData.photo_url }
    });

    try {
      window.dispatchEvent(new Event('inspectra_storage_update'));
    } catch (e) {}

    return { success: true, defectId };
  },

  deleteDefect: (id) => {
    const defects = safeGet(KEYS.DEFECTS, MOCK_DEFECTS);
    safeSet(KEYS.DEFECTS, defects.filter(d => d.id !== id));
    return { success: true };
  },

  // ==========================================
  // 7B. CONSTRUCTION INSPECTION ZONES
  // ==========================================
  getZones: (filter = {}) => {
    let list = safeGet(KEYS.ZONES, MOCK_CONSTRUCTION_ZONES);
    if (filter.priority && filter.priority !== 'ALL') {
      list = list.filter(z => z.priority === filter.priority);
    }
    if (filter.status && filter.status !== 'ALL') {
      list = list.filter(z => z.status === filter.status);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(z => z.name.toLowerCase().includes(q) || z.location.toLowerCase().includes(q) || z.code.toLowerCase().includes(q));
    }
    return list;
  },

  getZoneById: (id) => {
    const list = safeGet(KEYS.ZONES, MOCK_CONSTRUCTION_ZONES);
    return list.find(z => z.id === id) || null;
  },

  updateZone: (id, updates) => {
    const list = safeGet(KEYS.ZONES, MOCK_CONSTRUCTION_ZONES);
    const updated = list.map(z => z.id === id ? { ...z, ...updates } : z);
    safeSet(KEYS.ZONES, updated);
    return { success: true, data: updated.find(z => z.id === id) };
  },

  getInspectionCoverage: () => {
    const zones = safeGet(KEYS.ZONES, MOCK_CONSTRUCTION_ZONES);
    const defects = safeGet(KEYS.DEFECTS, MOCK_DEFECTS);
    const alerts = safeGet(KEYS.ZONE_ALERTS, MOCK_ZONE_ALERTS);

    const total = zones.length;
    const inspected = zones.filter(z => z.status === 'INSPECTED').length;
    const criticalPending = zones.filter(z => z.priority === 'CRITICAL' && z.status !== 'INSPECTED').length;
    const overdue = zones.filter(z => z.status === 'OVERDUE' || z.status === 'CRITICAL_PENDING' && new Date(z.next_inspection_due) < new Date()).length;
    const activeAlerts = alerts.filter(a => a.status === 'AI_FLAG_INSPECTOR_VERIFICATION_REQUIRED').length;
    const openDefects = defects.filter(d => d.status !== 'CLOSED').length;
    const reinspectionsDue = defects.filter(d => d.status === 'REINSPECTION_REQUIRED' || d.status === 'CORRECTED').length;

    const coveragePercentage = total > 0 ? Math.round((inspected / total) * 100) : 0;

    return {
      total_zones: total,
      inspected_zones: inspected,
      coverage_percentage: coveragePercentage,
      critical_pending: criticalPending,
      overdue_inspections: overdue,
      active_ai_alerts: activeAlerts,
      open_defects: openDefects,
      reinspections_due: reinspectionsDue,
      zones: zones
    };
  },

  // ==========================================
  // 7C. AI CAMERA ALERTS & INSPECTOR ACTIONS
  // ==========================================
  getZoneAlerts: (filter = {}) => {
    let list = safeGet(KEYS.ZONE_ALERTS, MOCK_ZONE_ALERTS);
    if (filter.status && filter.status !== 'ALL') {
      list = list.filter(a => a.status === filter.status);
    }
    if (filter.zone_id) {
      list = list.filter(a => a.zone_id === filter.zone_id);
    }
    return list;
  },

  updateAlertDecision: (alertId, decision, remarks, evidenceUrl, inspectorName = 'Vishnu Prasath') => {
    const alerts = safeGet(KEYS.ZONE_ALERTS, MOCK_ZONE_ALERTS);
    let targetAlert = null;

    const updatedAlerts = alerts.map(a => {
      if (a.id === alertId) {
        targetAlert = a;
        return {
          ...a,
          status: decision === 'VERIFIED_NO_ISSUE' ? 'RESOLVED_VERIFIED' : 'ACTION_LOGGED',
          inspector_decision: decision,
          inspector_remarks: remarks || '',
          verified_by: inspectorName,
          verified_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
          evidence_url: evidenceUrl || null
        };
      }
      return a;
    });

    safeSet(KEYS.ZONE_ALERTS, updatedAlerts);

    // If decision confirmed an issue or corrective action required, automatically create a Defect
    if (decision === 'ISSUE_CONFIRMED' || decision === 'CORRECTIVE_ACTION_REQUIRED' || decision === 'REINSPECTION_REQUIRED') {
      if (targetAlert) {
        storageService.createDefect({
          site_name: targetAlert.zone_name || 'Active Construction Zone',
          component: `${targetAlert.zone_name} (${targetAlert.camera_name || 'CCTV Node'})`,
          category: 'SAFETY',
          severity: targetAlert.priority || 'HIGH',
          title: `Confirmed Issue: ${targetAlert.observation.slice(0, 60)}...`,
          description: `${targetAlert.observation} | Recommended Action: ${targetAlert.recommended_action} | Inspector Remarks: ${remarks || 'Physical verification confirmed anomaly.'}`,
          assigned_to: 'Safety Remediation Wing',
          status: 'OPEN'
        });
      }
    }

    storageService.addAuditLog({
      action: 'AI_ALERT_VERIFIED',
      category: 'AI_SURVEILLANCE',
      severity: decision === 'ISSUE_CONFIRMED' ? 'WARNING' : 'INFO',
      user: inspectorName,
      entity_type: 'ZONE_ALERT',
      details: { alert_id: alertId, decision, remarks }
    });

    return { success: true };
  },

  createZoneAlert: (alertData) => {
    const alerts = safeGet(KEYS.ZONE_ALERTS, MOCK_ZONE_ALERTS);
    const newAlert = {
      id: `alert-${Date.now().toString().slice(-4)}`,
      zone_id: alertData.zone_id || 'zone-01',
      zone_name: alertData.zone_name || 'Construction Zone',
      camera_id: alertData.camera_id || 'CAM-01',
      camera_name: alertData.camera_name || 'Site Camera',
      observation: alertData.observation || 'Visible anomaly detected by computer vision.',
      confidence: alertData.confidence || 90.0,
      priority: alertData.priority || 'HIGH',
      detected_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      recommended_action: alertData.recommended_action || 'Inspect physical site condition and log verification.',
      verification_checklist: alertData.verification_checklist || ['Physical inspection required'],
      required_evidence: alertData.required_evidence || 'Photo of physical inspection.',
      status: 'AI_FLAG_INSPECTOR_VERIFICATION_REQUIRED',
      inspector_decision: null,
      inspector_remarks: null,
      verified_by: null,
      verified_at: null
    };

    safeSet(KEYS.ZONE_ALERTS, [newAlert, ...alerts]);
    return { success: true, data: newAlert };
  },

  // ==========================================
  // 8. INSPECTIONS & COMPLIANCE
  // ==========================================
  getInspections: (filter = {}) => {
    let list = safeGet(KEYS.INSPECTIONS, MOCK_INSPECTIONS);
    if (filter.status && filter.status !== 'ALL') {
      list = list.filter(i => i.status === filter.status);
    }
    if (filter.inspector_id) {
      list = list.filter(i => i.inspector_id === filter.inspector_id);
    }
    return list;
  },

  getInspectionById: (id) => {
    const list = safeGet(KEYS.INSPECTIONS, MOCK_INSPECTIONS);
    return list.find(i => i.id === id) || null;
  },

  saveInspection: (payload) => {
    const inspections = safeGet(KEYS.INSPECTIONS, MOCK_INSPECTIONS);
    const defects = safeGet(KEYS.DEFECTS, MOCK_DEFECTS);
    const sites = safeGet(KEYS.SITES, MOCK_SITES);

    const site = sites.find(s => s.id === payload.site_id) || {
      name: payload.site_name || 'Designated Infrastructure Facility',
      address: 'GPS Verified Location'
    };

    const newId = payload.id || `INSP-2026-${String(Math.floor(100 + Math.random() * 900))}`;
    const newDefects = payload.detected_defects || [];
    const criticalCount = newDefects.filter(d => d.severity === 'CRITICAL').length;

    const newInspection = {
      id: newId,
      site_id: payload.site_id,
      site_name: site.name,
      site_address: site.address,
      zone_id: payload.zone_id || null,
      zone_name: payload.zone_name || null,
      floor_level: payload.floor_level || null,
      inspector_id: payload.inspector_id || 'usr-insp-vp01',
      inspector_name: payload.inspector_name || 'Vishnu Prasath',
      inspector_badge: payload.inspector_badge || 'INSP-2026-VP01',
      date: payload.date || new Date().toISOString(),
      status: 'SUBMITTED',
      compliance_score: payload.compliance_score ?? 85.0,
      geofence_verified: payload.geofence_verified !== false,
      location_verified: payload.location_verified !== false,
      override_reason: payload.override_reason || null,
      gps_lat: payload.gps_lat || site.latitude || 28.7041,
      gps_lng: payload.gps_lng || site.longitude || 77.1025,
      defect_count: newDefects.length,
      critical_defects: criticalCount,
      summary: payload.summary || `Statutory inspection conducted with ${newDefects.length} defect(s) logged.`,
      checklist_results: payload.checklist_results || [],
      detected_defects: newDefects,
      photo_evidence_url: payload.photo_evidence_url || null,
      ai_analysis: payload.ai_analysis || null,
      digital_signature: payload.digital_signature || 'Verified Digital Signature: Vishnu Prasath',
      sync_status: payload.sync_status || 'LOCAL_PERSISTED_READY_SYNC',
      created_at: new Date().toISOString()
    };

    safeSet(KEYS.INSPECTIONS, [newInspection, ...inspections]);

    // Update the corresponding Construction Zone status and inspector visit
    if (payload.zone_id) {
      const zones = safeGet(KEYS.ZONES, MOCK_CONSTRUCTION_ZONES);
      const updatedZones = zones.map(z => {
        if (z.id === payload.zone_id) {
          return {
            ...z,
            status: 'INSPECTED',
            last_inspector_visit: new Date().toISOString().replace('T', ' ').slice(0, 16),
            open_defects_count: (z.open_defects_count || 0) + newDefects.length
          };
        }
        return z;
      });
      safeSet(KEYS.ZONES, updatedZones);
    }

    // Propagate defects into Defect Ledger
    if (newDefects.length > 0) {
      const generatedDefects = newDefects.map((d, index) => ({
        id: `def-${Date.now().toString().slice(-4)}-${index + 1}`,
        site_name: site.name,
        component: d.location_details || d.component || 'Structural Element',
        category: d.category || 'STRUCTURAL',
        severity: d.severity || 'CRITICAL',
        title: d.title || 'Identified Structural Anomaly',
        description: d.description || 'Observed defect requiring engineering remediation.',
        status: 'OPEN',
        assigned_to: 'Regional Maintenance Wing',
        inspection_id: newId,
        created_at: new Date().toISOString().split('T')[0]
      }));
      safeSet(KEYS.DEFECTS, [...generatedDefects, ...defects]);
    }

    // Register Audit Log
    storageService.addAuditLog({
      action: 'INSPECTION_SUBMITTED',
      category: 'INSPECTION',
      severity: 'INFO',
      user: `${newInspection.inspector_name} (${newInspection.inspector_badge})`,
      entity_type: site.name,
      details: {
        inspection_id: newId,
        compliance_score: newInspection.compliance_score,
        geofence: newInspection.geofence_verified ? 'PASSED' : 'FLAGGED'
      }
    });

    const queue = safeGet(KEYS.SYNC_QUEUE, []);
    safeSet(KEYS.SYNC_QUEUE, [...queue, { id: newId, timestamp: Date.now() }]);

    return {
      success: true,
      data: newInspection,
      message: 'Inspection submitted successfully and stored in persistent database.'
    };
  },

  updateInspectionStatus: (id, status, supervisorRemarks) => {
    const inspections = safeGet(KEYS.INSPECTIONS, MOCK_INSPECTIONS);
    const updated = inspections.map(i => {
      if (i.id === id) {
        return {
          ...i,
          status,
          supervisor_remarks: supervisorRemarks,
          reviewed_at: new Date().toISOString()
        };
      }
      return i;
    });
    safeSet(KEYS.INSPECTIONS, updated);

    storageService.addAuditLog({
      action: 'INSPECTION_REVIEWED',
      category: 'INSPECTION',
      severity: 'INFO',
      user: 'M. Muthukumar (Supervisor)',
      entity_type: 'INSPECTION_AUDIT',
      details: { inspection_id: id, status, supervisor_remarks: supervisorRemarks }
    });

    return { success: true };
  },

  // ==========================================
  // 9. REMEDIATION & SUPERVISOR WORKFLOW
  // ==========================================
  getSupervisors: () => {
    return safeGet(KEYS.SUPERVISORS, INITIAL_SUPERVISORS);
  },

  getCorrectiveActions: (filter = {}) => {
    let list = safeGet(KEYS.CORRECTIVE_ACTIONS, INITIAL_CORRECTIVE_ACTIONS);
    if (filter.status && filter.status !== 'ALL') {
      list = list.filter(a => a.status === filter.status);
    }
    if (filter.supervisor_id && filter.supervisor_id !== 'ALL') {
      list = list.filter(a => a.assigned_supervisor_id === filter.supervisor_id);
    }
    return list;
  },

  getCorrectiveActionById: (id) => {
    const list = safeGet(KEYS.CORRECTIVE_ACTIONS, INITIAL_CORRECTIVE_ACTIONS);
    return list.find(a => a.id === id) || null;
  },

  createCorrectiveAction: (data) => {
    const list = safeGet(KEYS.CORRECTIVE_ACTIONS, INITIAL_CORRECTIVE_ACTIONS);
    const supervisors = safeGet(KEYS.SUPERVISORS, INITIAL_SUPERVISORS);
    const defects = safeGet(KEYS.DEFECTS, MOCK_DEFECTS);

    const sup = supervisors.find(s => s.id === data.assigned_supervisor_id) || supervisors[0];
    const def = defects.find(d => d.id === data.defect_id) || {};
    const newId = `ACT-2026-${String(Math.floor(100 + Math.random() * 900))}`;

    const newPayload = {
      action_id: newId,
      directive_title: data.directive_title || 'Corrective Engineering Directive',
      defect_reference: {
        defect_id: data.defect_id || def.id || 'GEN-01',
        title: def.title || data.defect_title || 'Identified Defect',
        severity: def.severity || data.defect_severity || 'HIGH',
        site: def.site_name || data.site_name || 'Designated Facility'
      },
      supervisory_officer: {
        id: sup.id,
        name: sup.name,
        badge: sup.badge,
        department: sup.department,
        email: sup.email
      },
      execution_agency: data.assigned_contractor || 'State Engineering Services',
      remediation_type: data.action_type || 'STRUCTURAL_REPAIR',
      sla_deadline: data.target_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      estimated_budget_inr: Number(data.estimated_cost) || 50000,
      statutory_compliance: data.statutory_code || 'IS 456-2000 / IRC:SP:40',
      verification_protocol: data.proof_requirements || 'Physical inspection + Proof photo',
      status: 'ASSIGNED'
    };

    const newAction = {
      id: newId,
      defect_id: data.defect_id || def.id || 'GEN-01',
      defect_title: def.title || data.defect_title || 'Identified Defect',
      defect_severity: def.severity || data.defect_severity || 'HIGH',
      site_name: def.site_name || data.site_name || 'Designated Facility',
      directive_title: data.directive_title || 'Corrective Engineering Directive',
      action_type: data.action_type || 'STRUCTURAL_REPAIR',
      priority: data.priority || def.severity || 'HIGH',
      assigned_supervisor_id: sup.id,
      assigned_supervisor_name: sup.name,
      assigned_supervisor_role: sup.role,
      assigned_contractor: data.assigned_contractor || 'State Engineering Services',
      estimated_cost: Number(data.estimated_cost) || 50000,
      target_date: data.target_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      statutory_code: data.statutory_code || 'IS 456-2000 / IRC:SP:40',
      proof_requirements: data.proof_requirements || 'Physical inspection + Proof photo',
      status: 'ASSIGNED',
      notes: data.notes || '',
      verified_by_id: null,
      verified_by_name: null,
      verified_at: null,
      verification_notes: null,
      created_at: new Date().toISOString(),
      payload: newPayload
    };

    safeSet(KEYS.CORRECTIVE_ACTIONS, [newAction, ...list]);

    storageService.addAuditLog({
      action: 'REMEDIATION_DIRECTIVE_INITIATED',
      category: 'REMEDIATION',
      severity: 'INFO',
      user: 'K. Selvakumar, IAS',
      entity_type: 'WORKFLOW_DIRECTIVE',
      details: { action_id: newId, supervisor: sup.name, contractor: newAction.assigned_contractor }
    });

    return { success: true, data: newAction };
  },

  updateCorrectiveAction: (id, updates) => {
    const list = safeGet(KEYS.CORRECTIVE_ACTIONS, INITIAL_CORRECTIVE_ACTIONS);
    const supervisors = safeGet(KEYS.SUPERVISORS, INITIAL_SUPERVISORS);

    const updated = list.map(a => {
      if (a.id === id) {
        let sup = a.assigned_supervisor_name;
        let supRole = a.assigned_supervisor_role;
        let supId = a.assigned_supervisor_id;
        if (updates.assigned_supervisor_id) {
          const found = supervisors.find(s => s.id === updates.assigned_supervisor_id);
          if (found) {
            sup = found.name;
            supRole = found.role;
            supId = found.id;
          }
        }

        const merged = {
          ...a,
          ...updates,
          assigned_supervisor_id: supId,
          assigned_supervisor_name: sup,
          assigned_supervisor_role: supRole
        };

        // Synchronize embedded payload
        merged.payload = updates.payload || {
          ...a.payload,
          action_id: a.id,
          directive_title: merged.directive_title,
          supervisory_officer: {
            id: supId,
            name: sup,
            role: supRole
          },
          execution_agency: merged.assigned_contractor,
          remediation_type: merged.action_type,
          sla_deadline: merged.target_date,
          estimated_budget_inr: Number(merged.estimated_cost) || 0,
          statutory_compliance: merged.statutory_code,
          verification_protocol: merged.proof_requirements,
          status: merged.status
        };

        return merged;
      }
      return a;
    });

    safeSet(KEYS.CORRECTIVE_ACTIONS, updated);

    storageService.addAuditLog({
      action: 'REMEDIATION_PAYLOAD_CONFIGURED',
      category: 'REMEDIATION',
      severity: 'INFO',
      user: 'K. Selvakumar, IAS',
      entity_type: 'WORKFLOW_PAYLOAD',
      details: { action_id: id, ...updates }
    });

    const modified = updated.find(a => a.id === id);
    return { success: true, data: modified };
  },

  assignSupervisor: (id, supervisorId, additionalPayload = {}) => {
    const supervisors = safeGet(KEYS.SUPERVISORS, INITIAL_SUPERVISORS);
    const sup = supervisors.find(s => s.id === supervisorId);
    if (!sup) return { success: false, error: 'Supervisor not found.' };

    return storageService.updateCorrectiveAction(id, {
      assigned_supervisor_id: sup.id,
      assigned_supervisor_name: sup.name,
      assigned_supervisor_role: sup.role,
      status: 'ASSIGNED',
      ...additionalPayload
    });
  },

  verifyCorrectiveAction: (id, verificationNotes, verifierName = 'M. Muthukumar') => {
    const list = safeGet(KEYS.CORRECTIVE_ACTIONS, INITIAL_CORRECTIVE_ACTIONS);
    const action = list.find(a => a.id === id);
    if (!action) return { success: false, error: 'Directive not found' };

    const result = storageService.updateCorrectiveAction(id, {
      status: 'VERIFIED',
      verified_by_id: 'usr-supervisor-01',
      verified_by_name: verifierName,
      verified_at: new Date().toISOString(),
      verification_notes: verificationNotes || 'Physical inspection and statutory test proof certified.'
    });

    // Also mark associated defect as RESOLVED in Defect Ledger
    if (action.defect_id) {
      storageService.updateDefectStatus(action.defect_id, 'RESOLVED', verificationNotes || 'Remediation completed.');
    }

    storageService.addAuditLog({
      action: 'REMEDIATION_DIRECTIVE_VERIFIED',
      category: 'REMEDIATION',
      severity: 'INFO',
      user: verifierName,
      entity_type: 'SUPERVISOR_SIGNOFF',
      details: { action_id: id, verifier: verifierName }
    });

    return result;
  },

  getOverviewKpis: () => {
    const inspections = safeGet(KEYS.INSPECTIONS, MOCK_INSPECTIONS);
    const defects = safeGet(KEYS.DEFECTS, MOCK_DEFECTS);

    const totalInspections = inspections.length;
    const verifiedCount = inspections.filter(i => i.geofence_verified).length;
    const geofenceRate = totalInspections > 0 ? ((verifiedCount / totalInspections) * 100).toFixed(1) + '%' : '100%';
    const criticalDefects = defects.filter(d => d.severity === 'CRITICAL' && d.status !== 'RESOLVED').length;

    return {
      total_inspections: totalInspections,
      geofence_compliance_rate: geofenceRate,
      critical_defects: criticalDefects,
      active_fleet_readiness: '98.4%',
      average_audit_time: '34 mins',
      statutory_health_index: '92.1/100'
    };
  },

  getSiteWiseAnalytics: () => {
    const sites = safeGet(KEYS.SITES, MOCK_SITES);
    const inspections = safeGet(KEYS.INSPECTIONS, MOCK_INSPECTIONS);
    const defects = safeGet(KEYS.DEFECTS, MOCK_DEFECTS);

    return sites.map(site => {
      const siteInsp = inspections.filter(i => i.site_id === site.id || i.site_name === site.name);
      const avgScore = siteInsp.length > 0
        ? parseFloat((siteInsp.reduce((sum, i) => sum + (i.compliance_score || 0), 0) / siteInsp.length).toFixed(1))
        : (site.health_score || 85.0);

      const siteDef = defects.filter(d => d.site_id === site.id || d.site_name === site.name);
      const critical = siteDef.filter(d => d.severity === 'CRITICAL' && d.status !== 'RESOLVED').length;
      const high = siteDef.filter(d => d.severity === 'HIGH' && d.status !== 'RESOLVED').length;

      return {
        site_id: site.id,
        site_name: site.name,
        site_code: site.code,
        city: site.city || 'Strategic Zone',
        state: site.state || 'India',
        total_inspections: siteInsp.length || 4,
        average_compliance_score: avgScore,
        defects_total: siteDef.length,
        defects_critical: critical,
        defects_high: high,
        risk_level: critical > 0 ? 'CRITICAL' : high > 0 ? 'HIGH' : 'NORMAL'
      };
    });
  },

  getHistoricalTrends: () => {
    return {
      monthlyTrends: [
        { month: 'Apr 2026', inspections: 6, avg_score: 79.2, critical_defects: 4, resolved_actions: 3 },
        { month: 'May 2026', inspections: 8, avg_score: 81.5, critical_defects: 3, resolved_actions: 4 },
        { month: 'Jun 2026', inspections: 7, avg_score: 83.0, critical_defects: 2, resolved_actions: 3 },
        { month: 'Jul 2026', inspections: 9, avg_score: 84.8, critical_defects: 3, resolved_actions: 5 },
        { month: 'Aug 2026', inspections: 11, avg_score: 87.2, critical_defects: 1, resolved_actions: 7 },
        { month: 'Sep 2026', inspections: 14, avg_score: 89.6, critical_defects: 2, resolved_actions: 8 }
      ],
      severityBreakdown: [
        { name: 'Critical', count: 3, color: '#ef4444' },
        { name: 'High', count: 4, color: '#f97316' },
        { name: 'Medium', count: 7, color: '#f59e0b' },
        { name: 'Low', count: 12, color: '#3b82f6' }
      ]
    };
  },

  getPredictiveMaintenance: (assetId = 'ast-05') => {
    return {
      assetId,
      assetName: 'Pre-Stressed Concrete Pier P-14 (Zone 2B)',
      predictedFailureRiskPercentage: 88,
      predictedFailureWindow: 'Next 14 - 28 Days',
      recommendedAction: 'Ultrasonic Pulse Velocity (UPV) Non-Destructive Testing and crack injection grouting required.',
      urgency: 'HIGH',
      confidenceScore: 0.94
    };
  },

  getFrequencyRecommendation: (siteId = 'site-01') => {
    return {
      siteId,
      siteName: 'NH-44 Elevated Expressway Flyover',
      frequencyLabel: 'WEEKLY',
      recommendedIntervalDays: 7,
      rationale: 'Active vibration anomalies and heavy monsoon expansion joint wear detected.',
      currentAverageScore: 74.8,
      recommendedAuditsPerMonth: 4
    };
  },

  getComplianceSummary: () => {
    const inspections = safeGet(KEYS.INSPECTIONS, MOCK_INSPECTIONS);
    const defects = safeGet(KEYS.DEFECTS, MOCK_DEFECTS);
    const sites = safeGet(KEYS.SITES, MOCK_SITES);
    const actions = safeGet(KEYS.CORRECTIVE_ACTIONS, []);

    const totalScore = inspections.reduce((acc, i) => acc + (i.compliance_score || 0), 0);
    const avgScore = inspections.length > 0 ? (totalScore / inspections.length).toFixed(1) : 88.5;

    return {
      totalFacilitiesAudited: sites.length,
      totalAuditsExecuted: inspections.length,
      averageComplianceScore: parseFloat(avgScore),
      criticalDefectCount: defects.filter(d => d.severity === 'CRITICAL' && d.status !== 'RESOLVED').length,
      activeRemediationsCount: actions.filter(a => a.status !== 'VERIFIED').length,
      statutoryAuditPassRate: '94.2%'
    };
  }
};
