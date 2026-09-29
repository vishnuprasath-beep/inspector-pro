import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  FileText, 
  Sparkles,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import api from '../services/api';
import AnalyticsPage from '../pages/AnalyticsPage';

export default function ExecutiveOverview({ user, onNavigate }) {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDirectorSummary() {
      try {
        const res = await api.getDirectorSummary();
        if (res.success && res.data) {
          setSummaryData(res.data);
        }
      } catch (err) {
        console.error('Failed to load director summary:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDirectorSummary();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Directorate Welcome Banner */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.04) 100%)',
          border: '1.5px solid rgba(16, 185, 129, 0.3)',
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
            <span style={{ fontSize: 12, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              State Directorate of Structural Safety
            </span>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.18)', color: '#34d399', fontWeight: 700 }}>
              EXECUTIVE CLEARANCE
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 4px' }}>
            {user?.name || 'Dr. S. Radhakrishnan'} &mdash; State Director of Inspections
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
            Statutory infrastructure oversight, hold-point approvals, and state-level compliance monitoring.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => onNavigate && onNavigate('reports')}
            className="btn btn-primary"
            style={{ minHeight: 44, padding: '0 18px', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <FileText size={16} />
            <span>Generate Directorate Audit</span>
          </button>
        </div>
      </div>

      {/* Directorate KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label">Statewide Compliance Rate</span>
            <Activity size={18} color="#10b981" />
          </div>
          <div className="stat-value" style={{ color: '#10b981' }}>
            {summaryData?.statewide_compliance_score || 96}%
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Based on statutory IS 456 / IRC specifications</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #38bdf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label">Hold-Points Cleared</span>
            <CheckCircle2 size={18} color="#38bdf8" />
          </div>
          <div className="stat-value">
            {summaryData?.strategic_holdpoints_cleared || 14} / 18
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Critical concrete & MEP milestones certified</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label">Active Non-Conformities</span>
            <AlertTriangle size={18} color="#f59e0b" />
          </div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>
            {summaryData?.critical_nonconformities || 2}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Under mandatory contractor remediation</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #a855f7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label">Supervised Facilities</span>
            <Building2 size={18} color="#a855f7" />
          </div>
          <div className="stat-value">
            {summaryData?.total_supervised_facilities || 5}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Active metro, expressway, and utility projects</span>
        </div>
      </div>

      {/* Embedded Analytics Preview */}
      <AnalyticsPage />
    </div>
  );
}
