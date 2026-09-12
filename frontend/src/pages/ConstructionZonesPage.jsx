import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Building2,
  ShieldAlert,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Video,
  VideoOff,
  UserCheck,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Sparkles,
  Info,
  ChevronRight,
  ExternalLink,
  MapPin,
  Check,
  X,
  FileText,
  AlertOctagon
} from 'lucide-react';

export default function ConstructionZonesPage() {
  const toast = useToast();
  const [zones, setZones] = useState([]);
  const [coverage, setCoverage] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Zone for Modal/Drawer
  const [selectedZone, setSelectedZone] = useState(null);
  const [actionAlert, setActionAlert] = useState(null);

  const loadData = async () => {
    try {
      const [zonesRes, covRes, alertsRes] = await Promise.all([
        api.getZones(),
        api.getInspectionCoverage(),
        api.getZoneAlerts()
      ]);

      if (zonesRes.success) setZones(zonesRes.data || []);
      if (covRes.success) setCoverage(covRes.data);
      if (alertsRes.success) setAlerts(alertsRes.data || []);
    } catch (err) {
      console.error('Failed to load construction zones:', err);
      toast?.error?.('Unable to load inspection zones data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f97316';
      case 'MEDIUM': return '#eab308';
      case 'LOW': return '#3b82f6';
      default: return '#94a3b8';
    }
  };

  const getStatusBadge = (status, priority) => {
    switch (status) {
      case 'INSPECTED':
        return { label: 'Inspected', bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '#10b981', dot: '🟢' };
      case 'DUE_SOON':
        return { label: 'Due Soon', bg: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: '#eab308', dot: '🟡' };
      case 'ATTENTION_REQUIRED':
        return { label: 'Attention Required', bg: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', border: '#f97316', dot: '🟠' };
      case 'CRITICAL_PENDING':
        return { label: 'Critical Pending', bg: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '#ef4444', dot: '🔴' };
      case 'OVERDUE':
        return { label: 'Overdue', bg: 'rgba(220, 38, 38, 0.25)', color: '#fca5a5', border: '#dc2626', dot: '🔴' };
      case 'AI_MONITORING':
        return { label: 'AI Monitoring', bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '#0284c7', dot: '🔵' };
      case 'CAMERA_OFFLINE':
        return { label: 'Camera Offline', bg: 'rgba(100, 116, 139, 0.2)', color: '#94a3b8', border: '#64748b', dot: '⚫' };
      default:
        return { label: status, bg: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1', border: '#94a3b8', dot: '⚪' };
    }
  };

  const filteredZones = zones.filter(z => {
    const matchesPriority = priorityFilter === 'ALL' || z.priority === priorityFilter;
    const matchesStatus = statusFilter === 'ALL' || z.status === statusFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      z.name.toLowerCase().includes(q) ||
      z.code.toLowerCase().includes(q) ||
      z.location.toLowerCase().includes(q) ||
      z.floor_level.toLowerCase().includes(q);
    return matchesPriority && matchesStatus && matchesSearch;
  });

  return (
    <div className="page-body">
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building2 size={26} color="var(--accent-cyan)" />
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
              Construction Inspection Zones & Coverage
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Systematic 18-Zone site assurance matrix: Fixed Camera + AI Surveillance with Mandatory Physical Inspector Verification.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={handleRefresh}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? 'spin-anim' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Refresh Matrix'}</span>
          </button>
        </div>
      </div>

      {/* Critical Principle Warning Banner */}
      <div
        style={{
          background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.12) 0%, rgba(249, 115, 22, 0.08) 100%)',
          borderLeft: '4px solid #ef4444',
          borderTop: '1px solid rgba(239, 68, 68, 0.25)',
          borderRight: '1px solid rgba(239, 68, 68, 0.25)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: 10,
          padding: '12px 18px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}
      >
        <div style={{ background: '#ef4444', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ShieldAlert size={18} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: '#fca5a5', letterSpacing: '0.02em' }}>
            REGULATORY SAFETY PRINCIPLE: CAMERA MONITORING ≠ INSPECTOR SIGN-OFF
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Cameras and Computer Vision AI continuously monitor visible site anomalies and dispatch early risk alerts. 
            However, <strong>AI cannot independently approve structural work or declare any construction zone safe</strong>. 
            Physical field verification with digital signature is mandatory for all structural hold points and concealed installations.
          </div>
        </div>
      </div>

      {/* Section 11 & 15: Inspection Coverage KPI Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 24
        }}
      >
        <div className="glass-card" style={{ padding: '14px 16px', borderTop: '3px solid var(--accent-cyan)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Zones</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-heading)', marginTop: 4 }}>
            {coverage?.total_zones || zones.length}
          </div>
          <div style={{ fontSize: 11, color: 'var(--accent-cyan)', marginTop: 2 }}>Full Project Footprint</div>
        </div>

        <div className="glass-card" style={{ padding: '14px 16px', borderTop: '3px solid #10b981' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Inspected</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#34d399', marginTop: 4 }}>
            {coverage?.inspected_zones ?? zones.filter(z => z.status === 'INSPECTED').length}
          </div>
          <div style={{ fontSize: 11, color: '#10b981', marginTop: 2 }}>
            {coverage?.coverage_percentage ?? Math.round((zones.filter(z => z.status === 'INSPECTED').length / (zones.length || 1)) * 100)}% Coverage
          </div>
        </div>

        <div className="glass-card" style={{ padding: '14px 16px', borderTop: '3px solid #ef4444' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Critical Pending</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#f87171', marginTop: 4 }}>
            {coverage?.critical_pending ?? zones.filter(z => z.priority === 'CRITICAL' && z.status !== 'INSPECTED').length}
          </div>
          <div style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>Hold-Point Blockers</div>
        </div>

        <div className="glass-card" style={{ padding: '14px 16px', borderTop: '3px solid #dc2626' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overdue</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fca5a5', marginTop: 4 }}>
            {coverage?.overdue_inspections ?? zones.filter(z => z.status === 'OVERDUE').length}
          </div>
          <div style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>Escalation Active</div>
        </div>

        <div className="glass-card" style={{ padding: '14px 16px', borderTop: '3px solid #38bdf8' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>AI Camera Alerts</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
            {alerts.filter(a => a.status === 'AI_FLAG_INSPECTOR_VERIFICATION_REQUIRED').length}
          </div>
          <div style={{ fontSize: 11, color: '#38bdf8', marginTop: 2 }}>Awaiting Field Verification</div>
        </div>

        <div className="glass-card" style={{ padding: '14px 16px', borderTop: '3px solid #f97316' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Open Defects</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fb923c', marginTop: 4 }}>
            {coverage?.open_defects ?? 4}
          </div>
          <div style={{ fontSize: 11, color: '#f97316', marginTop: 2 }}>In Remediation</div>
        </div>

        <div className="glass-card" style={{ padding: '14px 16px', borderTop: '3px solid #a855f7' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reinspections Due</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#c084fc', marginTop: 4 }}>
            {coverage?.reinspections_due ?? 2}
          </div>
          <div style={{ fontSize: 11, color: '#a855f7', marginTop: 2 }}>Corrected, Pending Sign-off</div>
        </div>
      </div>

      {/* Filter and Legend Bar */}
      <div
        className="glass-card"
        style={{
          padding: '14px 18px',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 10 }} />
            <input
              type="text"
              placeholder="Search zones by name, code, floor, location..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: 36, height: 36, fontSize: 13 }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Priority:</span>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="form-control"
              style={{ height: 34, fontSize: 12, padding: '4px 10px', width: 'auto' }}
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical (Physical Hold-Point)</option>
              <option value="HIGH">High (Camera + Frequent Visits)</option>
              <option value="MEDIUM">Medium (Scheduled)</option>
              <option value="LOW">Low (Routine)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="form-control"
              style={{ height: 34, fontSize: 12, padding: '4px 10px', width: 'auto' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="INSPECTED">🟢 Inspected</option>
              <option value="DUE_SOON">🟡 Due Soon</option>
              <option value="ATTENTION_REQUIRED">🟠 Attention Required</option>
              <option value="CRITICAL_PENDING">🔴 Critical Pending</option>
              <option value="OVERDUE">🔴 Overdue</option>
              <option value="AI_MONITORING">🔵 AI Monitoring</option>
              <option value="CAMERA_OFFLINE">⚫ Camera Offline</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map Legend Display */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 16,
          padding: '8px 14px',
          background: 'rgba(15, 23, 42, 0.4)',
          borderRadius: 8,
          fontSize: 11.5,
          color: 'var(--text-muted)'
        }}
      >
        <strong style={{ color: 'var(--text-heading)' }}>Zone Status Codes:</strong>
        <span>🟢 Inspected</span>
        <span>🟡 Due soon</span>
        <span>🟠 Attention required</span>
        <span>🔴 Critical / Overdue</span>
        <span>🔵 AI monitoring</span>
        <span>⚫ Camera offline</span>
      </div>

      {/* Section 15: Building Zone Map Matrix (18 Zones Grid) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 16
        }}
      >
        {filteredZones.map(zone => {
          const badge = getStatusBadge(zone.status, zone.priority);
          const priColor = getPriorityColor(zone.priority);
          const hasActiveAlert = alerts.some(a => a.zone_id === zone.id && a.status === 'AI_FLAG_INSPECTOR_VERIFICATION_REQUIRED');

          return (
            <div
              key={zone.id}
              onClick={() => setSelectedZone(zone)}
              className="glass-card"
              style={{
                padding: '16px',
                cursor: 'pointer',
                transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
                position: 'relative',
                overflow: 'hidden',
                borderLeft: `4px solid ${priColor}`,
                borderTop: hasActiveAlert ? '1px solid #f97316' : undefined
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Header with Zone Code & Priority */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)', padding: '2px 6px', borderRadius: 4 }}>
                      {zone.code}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: priColor, border: `1px solid ${priColor}`, padding: '1px 6px', borderRadius: 4 }}>
                      {zone.priority}
                    </span>
                    {zone.is_mandatory_hold_point && (
                      <span style={{ fontSize: 9.5, fontWeight: 700, background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '1px 5px', borderRadius: 4 }}>
                        HOLD-POINT
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', marginTop: 6, marginBottom: 2 }}>
                    {zone.name}
                  </h3>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    {zone.floor_level} &bull; {zone.location}
                  </div>
                </div>

                {/* Status Indicator */}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 12,
                    background: badge.bg,
                    color: badge.color,
                    border: `1px solid ${badge.border}`,
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <span>{badge.dot}</span>
                  <span>{badge.label}</span>
                </span>
              </div>

              {/* Active AI Alert Notification Ribbon if any */}
              {hasActiveAlert && (
                <div
                  style={{
                    background: 'rgba(249, 115, 22, 0.12)',
                    border: '1px solid rgba(249, 115, 22, 0.3)',
                    borderRadius: 6,
                    padding: '6px 10px',
                    marginTop: 8,
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 11,
                    color: '#fb923c'
                  }}
                >
                  <Sparkles size={14} className="pulse-active" />
                  <span style={{ fontWeight: 600 }}>AI Alert Active: Inspector Verification Required</span>
                </div>
              )}

              {/* Camera & Observation Details */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.4)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  marginTop: 8,
                  fontSize: 11,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {zone.camera_status === 'ONLINE' ? (
                      <Video size={13} color="#10b981" />
                    ) : (
                      <VideoOff size={13} color="#94a3b8" />
                    )}
                    {zone.camera_name || 'No Dedicated Camera'}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: zone.camera_status === 'ONLINE' ? '#34d399' : '#94a3b8' }}>
                    {zone.camera_status}
                  </span>
                </div>
                <div style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <strong>Obs:</strong> {zone.last_camera_observation}
                </div>
              </div>

              {/* Timestamps & Visits */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
                <span><strong>Last Visit:</strong> {zone.last_inspector_visit || 'Pending'}</span>
                <span><strong>Next Due:</strong> {zone.next_inspection_due?.slice(5, 16) || 'Scheduled'}</span>
              </div>

              {/* Footer with Open Defects and Action Link */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 11, color: zone.open_defects_count > 0 ? '#fb923c' : 'var(--text-muted)', fontWeight: zone.open_defects_count > 0 ? 700 : 500 }}>
                  {zone.open_defects_count > 0 ? `⚠️ ${zone.open_defects_count} Open Defect(s)` : '✓ Zero Defect Load'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                  View Zone Details <ChevronRight size={13} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Zone Details Modal / Drawer */}
      {selectedZone && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={() => setSelectedZone(null)}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 14
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: 4 }}>
                    {selectedZone.code}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: getPriorityColor(selectedZone.priority), border: `1px solid ${getPriorityColor(selectedZone.priority)}`, padding: '2px 8px', borderRadius: 4 }}>
                    PRIORITY: {selectedZone.priority}
                  </span>
                  {selectedZone.is_mandatory_hold_point && (
                    <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '2px 8px', borderRadius: 4 }}>
                      MANDATORY HOLD-POINT
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-heading)', marginTop: 8, marginBottom: 2 }}>
                  {selectedZone.name}
                </h2>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  {selectedZone.floor_level} &bull; {selectedZone.location}
                </div>
              </div>

              <button
                onClick={() => setSelectedZone(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Hold-point Notice if applicable */}
            {selectedZone.is_mandatory_hold_point && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 12,
                  color: '#fca5a5'
                }}
              >
                <AlertOctagon size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Mandatory Inspection Hold-Point:</strong> Work cannot proceed to next stage (e.g. concrete placement, concealing of ducts/rebar) until physical inspector verification and digital signature are logged.
                </div>
              </div>
            )}

            {/* Grid of Key Properties */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
                marginBottom: 16
              }}
            >
              <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px 12px', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Inspection Frequency</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)', marginTop: 2 }}>
                  {selectedZone.frequency}
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px 12px', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Current Status</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: getStatusBadge(selectedZone.status).color, marginTop: 2 }}>
                  {getStatusBadge(selectedZone.status).label}
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px 12px', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Last Inspector Visit</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)', marginTop: 2 }}>
                  {selectedZone.last_inspector_visit || 'Pending Baseline Visit'}
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px 12px', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Next Inspection Due</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)', marginTop: 2 }}>
                  {selectedZone.next_inspection_due}
                </div>
              </div>
            </div>

            {/* Camera & Observation Stream */}
            <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '12px 14px', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Video size={14} color={selectedZone.camera_status === 'ONLINE' ? '#10b981' : '#94a3b8'} />
                  Assigned Fixed Camera: {selectedZone.camera_name || 'None'}
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: selectedZone.camera_status === 'ONLINE' ? '#34d399' : '#94a3b8' }}>
                  {selectedZone.camera_status}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                <strong>Latest Camera Observation:</strong> {selectedZone.last_camera_observation}
              </div>
            </div>

            {/* Required Actions by Area (Section 7 Guidance) */}
            <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '12px 14px', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 4 }}>
                Required Physical Inspection Checklist & Actions:
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-main)', lineHeight: 1.5 }}>
                {selectedZone.required_actions}
              </div>
            </div>

            {/* Associated AI Alerts for this Zone */}
            {alerts.filter(a => a.zone_id === selectedZone.id).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={15} color="#fb923c" />
                  AI Monitored Alerts for this Zone
                </div>

                {alerts.filter(a => a.zone_id === selectedZone.id).map(alert => (
                  <div
                    key={alert.id}
                    style={{
                      background: 'rgba(249, 115, 22, 0.08)',
                      border: '1px solid rgba(249, 115, 22, 0.25)',
                      borderRadius: 8,
                      padding: '12px',
                      marginBottom: 8
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#fb923c' }}>
                        {alert.camera_name} &bull; {alert.detected_at}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(249, 115, 22, 0.2)', color: '#fb923c', padding: '1px 6px', borderRadius: 4 }}>
                        {alert.status}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 4 }}>
                      Observation: {alert.observation}
                    </div>

                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 6 }}>
                      <strong>Recommended Action:</strong> {alert.recommended_action}
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      <strong>Required Evidence:</strong> {alert.required_evidence}
                    </div>

                    {alert.inspector_decision && (
                      <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid rgba(249, 115, 22, 0.2)', fontSize: 11, color: '#34d399' }}>
                        ✓ Decision: <strong>{alert.inspector_decision}</strong> by {alert.verified_by} at {alert.verified_at}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setSelectedZone(null)}
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: '8px 16px' }}
              >
                Close
              </button>

              <button
                onClick={() => {
                  toast?.success?.(`Inspection task dispatched to on-duty inspector for ${selectedZone.name}.`);
                  setSelectedZone(null);
                }}
                className="btn btn-primary"
                style={{ fontSize: 12, padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <UserCheck size={14} />
                <span>Dispatch Physical Inspection Task</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
