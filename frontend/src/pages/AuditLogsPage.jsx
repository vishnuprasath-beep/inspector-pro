import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Lock,
  Key,
  Smartphone,
  Laptop,
  AlertTriangle,
  Search,
  Download,
  Trash2,
  RefreshCw,
  Globe,
  Clock,
  UserCheck,
  CheckCircle2,
  XCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  Eye,
  LogOut,
  Filter,
  PlusCircle
} from 'lucide-react';

export default function AuditLogsPage() {
  const toast = useToast();

  // Active Tab: 'audit-trail' | 'sessions' | 'credentials' | 'alerts'
  const [activeSubTab, setActiveSubTab] = useState('audit-trail');

  // Logs state
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedLogDetail, setSelectedLogDetail] = useState(null);

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Security Settings / 2FA / Password state
  const [securitySettings, setSecuritySettings] = useState({
    two_factor_enabled: true,
    two_factor_method: 'APP',
    session_timeout_minutes: 60,
    geofence_login_lock: true,
    ip_whitelisting_enabled: false
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Security Alerts state
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // Load Initial Data
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await api.getAuditLogs({
        category: selectedCategory,
        severity: selectedSeverity,
        search: searchTerm
      });
      if (res.success) {
        setLogs(res.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load audit logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await api.getActiveSessions();
      if (res.success) setSessions(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchSecuritySettings = async () => {
    try {
      const res = await api.getSecuritySettings();
      if (res.success && res.data) setSecuritySettings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const res = await api.getSecurityAlerts();
      if (res.success) setAlerts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedCategory, selectedSeverity]);

  useEffect(() => {
    if (activeSubTab === 'sessions') fetchSessions();
    if (activeSubTab === 'credentials') fetchSecuritySettings();
    if (activeSubTab === 'alerts') fetchAlerts();
  }, [activeSubTab]);

  // Password strength calculation
  const handleNewPasswordChange = (val) => {
    setPasswordForm(prev => ({ ...prev, newPassword: val }));
    let score = 0;
    if (val.length >= 8) score += 25;
    if (/[A-Z]/.test(val)) score += 25;
    if (/[0-9]/.test(val)) score += 25;
    if (/[^A-Za-z0-9]/.test(val)) score += 25;
    setPasswordStrength(score);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      toast.warning('Please enter your current administrator password.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Password confirmation does not match.');
      return;
    }

    const res = await api.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
    if (res.success) {
      toast.success(res.message || 'Password successfully rotated!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordStrength(0);
      fetchLogs(); // refresh audit logs since it was recorded
    } else {
      toast.error(res.error || 'Failed to update password');
    }
  };

  const handleSaveSecuritySettings = async () => {
    const res = await api.updateSecuritySettings(securitySettings);
    if (res.success) {
      toast.success('Security policy and 2FA preferences saved!');
      fetchLogs();
    } else {
      toast.error('Failed to update security settings');
    }
  };

  const handleRevokeSession = async (sessionId, deviceName) => {
    const res = await api.revokeSession(sessionId);
    if (res.success) {
      toast.warning(`Session for ${deviceName} has been revoked`);
      fetchSessions();
      fetchLogs();
    } else {
      toast.error('Failed to revoke session');
    }
  };

  const handleTerminateAllOtherSessions = async () => {
    const res = await api.terminateAllOtherSessions();
    if (res.success) {
      toast.success('All remote sessions have been forcefully disconnected');
      fetchSessions();
      fetchLogs();
    } else {
      toast.error('Failed to terminate sessions');
    }
  };

  const handleDismissAlert = async (alertId) => {
    const res = await api.dismissSecurityAlert(alertId);
    if (res.success) {
      toast.info('Security incident marked as resolved');
      fetchAlerts();
    }
  };

  const handleClearLogs = async () => {
    if (window.confirm('Are you sure you want to clear the audit history? This action is tracked.')) {
      await api.clearAuditLogs();
      toast.warning('Audit trail cleared');
      fetchLogs();
    }
  };

  const handleExportCsv = () => {
    const header = ['ID', 'Timestamp', 'Action', 'Category', 'Severity', 'User', 'Entity Type', 'IP Address', 'Details'];
    const rows = filteredLogs.map(l => [
      l.id,
      new Date(l.created_at || l.timestamp).toISOString(),
      `"${l.action || l.event || ''}"`,
      l.category || '',
      l.severity || '',
      `"${l.user_name || l.user || ''}"`,
      l.entity_type || '',
      l.ip_address || '',
      `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inspectra_audit_ledger_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit ledger CSV exported successfully');
  };

  const handleAddSampleEvent = async () => {
    await api.addAuditLog({
      action: 'SYSTEM_HEALTH_CHECK',
      category: 'SECURITY',
      severity: 'INFO',
      user: 'K. Selvakumar, IAS',
      entity_type: 'SYSTEM_DAEMON',
      details: { memory_usage: '42%', lat_verify: 'OK', geofence_mesh: 'SYNCHRONIZED' }
    });
    toast.success('Manual system health verification log generated');
    fetchLogs();
  };

  // Filter logs by search term
  const filteredLogs = logs.filter(l => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const act = (l.action || l.event || '').toLowerCase();
    const usr = (l.user_name || l.user || '').toLowerCase();
    const ip = (l.ip_address || '').toLowerCase();
    const ent = (l.entity_type || '').toLowerCase();
    return act.includes(term) || usr.includes(term) || ip.includes(term) || ent.includes(term);
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getSeverityBadge = (sev = 'INFO') => {
    switch (sev.toUpperCase()) {
      case 'CRITICAL':
        return <span className="badge badge-critical">CRITICAL</span>;
      case 'WARNING':
        return <span className="badge badge-high">WARNING</span>;
      default:
        return <span className="badge badge-success">INFO</span>;
    }
  };

  return (
    <div className="page-body">
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={24} color="var(--accent-cyan)" />
            Security & Compliance Operations Center
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Immutable chronological ledger, device session authentication, and geofence anomaly monitoring.
          </p>
        </div>

        {/* Security Metric Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={16} color="#34d399" />
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600 }}>ENCRYPTION</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#34d399' }}>AES-256 GCM</div>
            </div>
          </div>

          <div style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={16} color="var(--accent-cyan)" />
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600 }}>2FA STATUS</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#38bdf8' }}>
                {securitySettings.two_factor_enabled ? 'ACTIVE' : 'DISABLED'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveSubTab('audit-trail')}
          className={`btn btn-sm ${activeSubTab === 'audit-trail' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Terminal size={15} />
          <span>Activity Audit Ledger ({filteredLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sessions')}
          className={`btn btn-sm ${activeSubTab === 'sessions' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Laptop size={15} />
          <span>Active Device Sessions</span>
        </button>

        <button
          onClick={() => setActiveSubTab('credentials')}
          className={`btn btn-sm ${activeSubTab === 'credentials' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Key size={15} />
          <span>2FA & Security Policies</span>
        </button>

        <button
          onClick={() => setActiveSubTab('alerts')}
          className={`btn btn-sm ${activeSubTab === 'alerts' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <ShieldAlert size={15} />
          <span>Security & Geofence Alerts</span>
          {alerts.filter(a => !a.resolved).length > 0 && (
            <span style={{ fontSize: 9, background: '#ef4444', color: '#fff', padding: '1px 5px', borderRadius: 10, fontWeight: 800 }}>
              {alerts.filter(a => !a.resolved).length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: AUDIT TRAIL */}
      {activeSubTab === 'audit-trail' && (
        <>
          {/* Controls Bar */}
          <div className="glass-card" style={{ padding: '14px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 260px' }}>
              <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: 12, top: 12 }} />
              <input
                type="text"
                placeholder="Search action, user, IP, or entity..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-control"
                style={{ paddingLeft: 36 }}
              />
            </div>

            {/* Filter: Category */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={14} color="var(--text-dim)" />
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-control"
                style={{ width: 'auto', padding: '8px 12px' }}
              >
                <option value="ALL">All Categories</option>
                <option value="AUTH">Authentication</option>
                <option value="SECURITY">Security Policy</option>
                <option value="FACILITIES">Facilities (Sites)</option>
                <option value="FLEET">Field Inspectors</option>
                <option value="DEFECTS">Defects & Anomaly</option>
                <option value="INSPECTIONS">Inspection Audits</option>
                <option value="USER_MANAGEMENT">User Profiles</option>
              </select>
            </div>

            {/* Filter: Severity */}
            <select
              value={selectedSeverity}
              onChange={(e) => {
                setSelectedSeverity(e.target.value);
                setCurrentPage(1);
              }}
              className="input-control"
              style={{ width: 'auto', padding: '8px 12px' }}
            >
              <option value="ALL">All Severities</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
            </select>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={handleAddSampleEvent}
                className="btn btn-secondary btn-sm"
                title="Generate a sample test audit entry"
              >
                <PlusCircle size={14} />
                <span>Test Event</span>
              </button>

              <button
                onClick={handleExportCsv}
                className="btn btn-secondary btn-sm"
                title="Export filtered log to CSV"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>

              <button
                onClick={fetchLogs}
                className="btn btn-secondary btn-sm"
                title="Refresh log entries"
              >
                <RefreshCw size={14} />
              </button>

              <button
                onClick={handleClearLogs}
                className="btn btn-secondary btn-sm"
                style={{ color: '#f87171' }}
                title="Clear all logs"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="glass-card table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action Event</th>
                  <th>Severity</th>
                  <th>Category</th>
                  <th>Initiated By</th>
                  <th>Network & Device</th>
                  <th>Target Entity</th>
                  <th style={{ textAlign: 'right' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {loadingLogs ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      Loading immutable audit trail...
                    </td>
                  </tr>
                ) : paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 50 }}>
                      <ShieldAlert size={36} color="var(--text-dim)" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }} />
                      <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>No Audit Logs Found</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                        {searchTerm ? 'No entries match your search query.' : 'There are currently no recorded audit logs in the ledger.'}
                      </div>
                      <button
                        onClick={handleAddSampleEvent}
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: 14 }}
                      >
                        Generate Verification Log
                      </button>
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((l) => {
                    const actionName = l.action || l.event || 'UNKNOWN_EVENT';
                    const userName = l.user_name || l.user || 'SYSTEM';
                    const category = l.category || 'SYSTEM';
                    const severity = l.severity || 'INFO';
                    const timeStr = new Date(l.created_at || l.timestamp).toLocaleString();

                    return (
                      <tr key={l.id}>
                        <td style={{ color: 'var(--text-dim)', fontSize: 11, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Clock size={12} color="var(--text-dim)" />
                            {timeStr}
                          </div>
                        </td>
                        <td>
                          <span style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                            color: severity === 'CRITICAL' ? '#f87171' : severity === 'WARNING' ? '#fbbf24' : '#38bdf8'
                          }}>
                            {actionName}
                          </span>
                        </td>
                        <td>
                          {getSeverityBadge(severity)}
                        </td>
                        <td>
                          <span className="badge badge-purple" style={{ fontSize: 10 }}>
                            {category}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--accent-cyan)' }}>
                              {userName.charAt(0)}
                            </div>
                            <div>
                              <div style={{ color: '#fff', fontWeight: 600, fontSize: 12 }}>{userName}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{l.user_role || 'ADMIN'}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#cbd5e1' }}>
                            {l.ip_address || 'CLIENT_IP'}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-dim)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {l.user_agent ? l.user_agent.split(' ')[0] : 'Web Client'}
                          </div>
                        </td>
                        <td>
                          <code style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4, color: '#cbd5e1' }}>
                            {l.entity_type || 'SYSTEM'}
                          </code>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => setSelectedLogDetail(l)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: 11 }}
                          >
                            <Eye size={12} />
                            <span>Payload</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  Showing page {currentPage} of {totalPages} ({filteredLogs.length} total events)
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="btn btn-secondary btn-sm"
                    style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                  >
                    <ChevronLeft size={14} />
                    <span>Prev</span>
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="btn btn-secondary btn-sm"
                    style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB 2: ACTIVE SESSIONS */}
      {activeSubTab === 'sessions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, color: '#fff', fontWeight: 700 }}>Authorized Hardware & Browser Sessions</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Devices with valid cryptographic access tokens currently logged into the Inspectra infrastructure network.
              </p>
            </div>
            <button
              onClick={handleTerminateAllOtherSessions}
              className="btn btn-secondary btn-sm"
              style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
            >
              <LogOut size={14} />
              <span>Terminate All Other Sessions</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {sessions.map(s => (
              <div key={s.id} className="glass-card" style={{ padding: 18, border: s.is_current ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {s.device.toLowerCase().includes('phone') ? <Smartphone size={18} color="var(--accent-cyan)" /> : <Laptop size={18} color="var(--accent-cyan)" />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{s.device}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{s.browser} • {s.os}</div>
                    </div>
                  </div>

                  {s.is_current ? (
                    <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} className="pulse-active"></span>
                      Current Device
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRevokeSession(s.id, s.device)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#f87171', padding: '4px 8px', fontSize: 11 }}
                    >
                      Revoke
                    </button>
                  )}
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 12, borderRadius: 8, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-dim)' }}>IP Address:</span>
                    <span style={{ fontFamily: 'monospace', color: '#fff' }}>{s.ip_address}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-dim)' }}>Location:</span>
                    <span style={{ color: '#fff' }}>{s.location}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Last Active:</span>
                    <span style={{ color: 'var(--accent-cyan)', fontSize: 11 }}>{new Date(s.last_active).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: 2FA & SECURITY POLICIES */}
      {activeSubTab === 'credentials' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
          {/* Password Change Card */}
          <div className="glass-card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Key size={20} color="var(--accent-cyan)" />
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Rotate Administrator Password</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cryptographically update master officer credentials</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>
                  Current Master Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                  placeholder="••••••••••••"
                  className="input-control"
                  required
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>
                  New Secure Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={e => handleNewPasswordChange(e.target.value)}
                  placeholder="Min 8 chars, uppercase, number, symbol"
                  className="input-control"
                  required
                />
                {/* Strength Meter */}
                {passwordForm.newPassword && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${passwordStrength}%`,
                        background: passwordStrength < 50 ? '#ef4444' : passwordStrength < 75 ? '#f59e0b' : '#10b981',
                        transition: 'all 0.3s ease'
                      }}></div>
                    </div>
                    <div style={{ fontSize: 10, color: passwordStrength < 50 ? '#f87171' : passwordStrength < 75 ? '#fbbf24' : '#34d399', marginTop: 4 }}>
                      {passwordStrength < 50 ? 'Weak Password' : passwordStrength < 75 ? 'Moderate Strength' : 'Strong Password'}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                  className="input-control"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <CheckCircle2 size={16} />
                <span>Apply New Password</span>
              </button>
            </form>
          </div>

          {/* 2FA & Security Policies Card */}
          <div className="glass-card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Lock size={20} color="var(--accent-cyan)" />
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Multi-Factor Authentication (2FA)</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Identity proofing & geofence perimeter policy</p>
              </div>
            </div>

            {/* 2FA Toggle */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 14, borderRadius: 8, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>Enforce 2-Factor Authentication</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Mandatory OTP/Authenticator validation upon login</div>
              </div>
              <input
                type="checkbox"
                checked={securitySettings.two_factor_enabled}
                onChange={e => setSecuritySettings(s => ({ ...s, two_factor_enabled: e.target.checked }))}
                style={{ width: 18, height: 18, accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
              />
            </div>

            {/* 2FA Method */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>
                Primary 2FA Delivery Method
              </label>
              <select
                value={securitySettings.two_factor_method}
                onChange={e => setSecuritySettings(s => ({ ...s, two_factor_method: e.target.value }))}
                className="input-control"
              >
                <option value="APP">Authenticator App (TOTP / Google Authenticator)</option>
                <option value="SMS">Encrypted SMS OTP (+91 Registered Officer Mobile)</option>
              </select>
            </div>

            {/* Session Timeout */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>
                Session Idle Expiration Timeout
              </label>
              <select
                value={securitySettings.session_timeout_minutes}
                onChange={e => setSecuritySettings(s => ({ ...s, session_timeout_minutes: parseInt(e.target.value, 10) }))}
                className="input-control"
              >
                <option value={15}>15 Minutes (High Security)</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>60 Minutes (Standard)</option>
                <option value={480}>8 Hours (Shift Duration)</option>
              </select>
            </div>

            {/* Geofence Perimeter Toggle */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 14, borderRadius: 8, marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>Geofence Perimeter Lock</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Deny inspection submissions outside GPS geofence threshold</div>
              </div>
              <input
                type="checkbox"
                checked={securitySettings.geofence_login_lock}
                onChange={e => setSecuritySettings(s => ({ ...s, geofence_login_lock: e.target.checked }))}
                style={{ width: 18, height: 18, accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
              />
            </div>

            <button
              onClick={handleSaveSecuritySettings}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              <CheckCircle2 size={16} />
              <span>Save Security Preferences</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY & GEOFENCE ALERTS */}
      {activeSubTab === 'alerts' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, color: '#fff', fontWeight: 700 }}>Real-Time Geofence & Identity Alerts</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                System-triggered alarms for anomalous inspector coordinates, geofence breaches, and unauthorized login attempts.
              </p>
            </div>
            <button
              onClick={fetchAlerts}
              className="btn btn-secondary btn-sm"
            >
              <RefreshCw size={14} />
              <span>Refresh Alerts</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {alerts.length === 0 ? (
              <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
                <CheckCircle2 size={36} color="#34d399" style={{ margin: '0 auto 10px', display: 'block' }} />
                <div style={{ color: '#fff', fontWeight: 700 }}>Perimeter Secure</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>No security or geofence breaches detected across regional sites.</div>
              </div>
            ) : alerts.map(a => (
              <div
                key={a.id}
                className="glass-card"
                style={{
                  padding: 16,
                  borderLeft: a.severity === 'CRITICAL' ? '4px solid #ef4444' : a.severity === 'HIGH' ? '4px solid #f59e0b' : '4px solid #38bdf8',
                  opacity: a.resolved ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 14,
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
                  <AlertTriangle size={20} color={a.severity === 'CRITICAL' ? '#f87171' : a.severity === 'HIGH' ? '#fbbf24' : '#38bdf8'} style={{ marginTop: 2 }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{a.title}</span>
                      <span className={`badge ${a.severity === 'CRITICAL' ? 'badge-critical' : a.severity === 'HIGH' ? 'badge-high' : 'badge-low'}`}>
                        {a.severity}
                      </span>
                      {a.resolved && (
                        <span className="badge badge-success" style={{ fontSize: 9 }}>RESOLVED</span>
                      )}
                    </div>
                    <p style={{ color: '#cbd5e1', fontSize: 12, marginBottom: 6 }}>{a.description}</p>
                    <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-dim)' }}>
                      <span>Officer: <strong style={{ color: '#fff' }}>{a.inspector_name}</strong></span>
                      <span>Site: <strong style={{ color: '#fff' }}>{a.site_name}</strong></span>
                      <span>Time: {new Date(a.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                {!a.resolved && (
                  <button
                    onClick={() => handleDismissAlert(a.id)}
                    className="btn btn-secondary btn-sm"
                  >
                    <CheckCircle2 size={14} color="#34d399" />
                    <span>Acknowledge & Resolve</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Log Payload Inspector */}
      {selectedLogDetail && (
        <div className="modal-backdrop" onClick={() => setSelectedLogDetail(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Terminal size={18} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Audit Record Payload Inspection</h3>
              </div>
              <button
                onClick={() => setSelectedLogDetail(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14, fontSize: 12 }}>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Event ID:</span>
                  <div style={{ color: '#fff', fontFamily: 'monospace' }}>{selectedLogDetail.id}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Timestamp:</span>
                  <div style={{ color: '#fff' }}>{new Date(selectedLogDetail.created_at || selectedLogDetail.timestamp).toLocaleString()}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Action:</span>
                  <div style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{selectedLogDetail.action || selectedLogDetail.event}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Actor Identity:</span>
                  <div style={{ color: '#fff' }}>{selectedLogDetail.user_name || selectedLogDetail.user}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>IP Address:</span>
                  <div style={{ color: '#fff', fontFamily: 'monospace' }}>{selectedLogDetail.ip_address}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Entity Type:</span>
                  <div style={{ color: '#fff' }}>{selectedLogDetail.entity_type}</div>
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Cryptographic Payload & Parameters:</span>
                <pre style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 11,
                  color: '#38bdf8',
                  overflowX: 'auto',
                  marginTop: 6,
                  border: '1px solid var(--border-subtle)'
                }}>
                  {JSON.stringify(selectedLogDetail.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="btn btn-secondary btn-sm"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
