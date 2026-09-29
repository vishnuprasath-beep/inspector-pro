import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Map, 
  Radio, 
  RefreshCw, 
  ClipboardCheck, 
  CheckSquare, 
  Activity, 
  AlertTriangle,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import api from '../services/api';

export default function OperationsOverview({ user, onNavigate }) {
  const [operationsData, setOperationsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSupervisorData() {
      try {
        const res = await api.getSupervisorSummary();
        if (res.success && res.data) {
          setOperationsData(res.data);
        }
      } catch (err) {
        console.error('Failed to load supervisor operations data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSupervisorData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Supervisory Welcome Banner */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(15, 23, 42, 0.04) 100%)',
          border: '1.5px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 18,
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Chief Safety & Field Compliance Division
            </span>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', fontWeight: 700 }}>
              OPERATIONAL COMMAND
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 4px' }}>
            {user?.name || 'M. Muthukumar'} &mdash; Chief Infrastructure Supervisor
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
            Active field duty assignments, live GNSS telemetry tracking, and statutory contractor remediation sign-offs.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => onNavigate && onNavigate('reinspections')}
            className="btn btn-primary"
            style={{ minHeight: 44, padding: '0 18px', display: 'flex', alignItems: 'center', gap: 8, background: '#f59e0b', borderColor: '#f59e0b', color: '#0f172a' }}
          >
            <RefreshCw size={16} />
            <span style={{ fontWeight: 700 }}>Dispatch Re-Inspection</span>
          </button>
        </div>
      </div>

      {/* Operational KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #38bdf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label">Active Field Auditors</span>
            <Users size={18} color="#38bdf8" />
          </div>
          <div className="stat-value" style={{ color: '#38bdf8' }}>
            {operationsData?.active_field_inspectors || 6}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Assigned officers broadcasting live telemetry</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label">Pending Field Audits</span>
            <ClipboardCheck size={18} color="#f59e0b" />
          </div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>
            {operationsData?.todays_inspections_pending || 3}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Scheduled for physical inspection today</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #a855f7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label">Pending Re-Inspections</span>
            <RefreshCw size={18} color="#a855f7" />
          </div>
          <div className="stat-value" style={{ color: '#a855f7' }}>
            {operationsData?.pending_reinspections || 1}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Remediated zones awaiting field re-evaluation</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label">Contractor Rework Directives</span>
            <CheckSquare size={18} color="#10b981" />
          </div>
          <div className="stat-value" style={{ color: '#10b981' }}>
            {operationsData?.active_contractor_reworks || 2}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Proof of rework submitted for verification</span>
        </div>
      </div>

      {/* Operational Quick Actions Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <div 
          style={{ 
            background: 'var(--card-bg)', 
            border: '1px solid var(--border-subtle)', 
            borderRadius: 16, 
            padding: 20 
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Radio size={18} color="#38bdf8" />
            <span>Inspector Monitoring & Live Feeds</span>
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Monitor assigned field inspectors, request live camera streams, and initiate authorized voice intercom.
          </p>
          <button 
            onClick={() => onNavigate && onNavigate('inspector-monitoring')} 
            className="btn btn-secondary" 
            style={{ width: '100%', minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <span>Open Inspector Monitoring</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div 
          style={{ 
            background: 'var(--card-bg)', 
            border: '1px solid var(--border-subtle)', 
            borderRadius: 16, 
            padding: 20 
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Map size={18} color="#f59e0b" />
            <span>Live GNSS Telemetry Map</span>
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Real-time geofence compliance map tracking inspector distances to assigned infrastructure sites.
          </p>
          <button 
            onClick={() => onNavigate && onNavigate('live-map')} 
            className="btn btn-secondary" 
            style={{ width: '100%', minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <span>Open Telemetry Map</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div 
          style={{ 
            background: 'var(--card-bg)', 
            border: '1px solid var(--border-subtle)', 
            borderRadius: 16, 
            padding: 20 
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={18} color="#ef4444" />
            <span>AI Defect Alerts & Remediation</span>
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Review AI-flagged safety nonconformities and assign immediate corrective actions to site contractors.
          </p>
          <button 
            onClick={() => onNavigate && onNavigate('defects')} 
            className="btn btn-secondary" 
            style={{ width: '100%', minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <span>View Defect Ledger</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
