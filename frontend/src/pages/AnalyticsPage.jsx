import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BarChart3, TrendingUp, Sparkles, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

export default function AnalyticsPage() {
  const [siteAnalytics, setSiteAnalytics] = useState([]);
  const [trends, setTrends] = useState(null);
  const [predictiveData, setPredictiveData] = useState(null);
  const [frequencyData, setFrequencyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      const [saRes, trRes, pmRes, fqRes] = await Promise.all([
        api.getSiteWiseAnalytics(),
        api.getHistoricalTrends(),
        api.getPredictiveMaintenance('ast-05'),
        api.getFrequencyRecommendation('site-05')
      ]);

      if (saRes.success) setSiteAnalytics(saRes.data);
      if (trRes.success) setTrends(trRes.data);
      if (pmRes.success) setPredictiveData(pmRes.data);
      if (fqRes.success) setFrequencyData(fqRes.data);
      setLoading(false);
    }
    loadAnalytics();
  }, []);

  return (
    <div className="page-body">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, color: 'var(--text-heading)' }}>Analytics, Risk Forecaster & AI Intelligence</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          Site-wise statutory compliance scores, 6-month historical defect trends, and modular predictive maintenance.
        </p>
      </div>

      {/* AI Modular Insights Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18, marginBottom: 28 }}>
        {/* Predictive Maintenance Card */}
        <div className="glass-card" style={{ padding: 20, border: '1px solid rgba(244, 63, 94, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f87171', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>
            <Sparkles size={16} />
            <span>AI Predictive Maintenance Model (Modular)</span>
          </div>
          <h3 style={{ fontSize: 16, color: 'var(--text-heading)', marginBottom: 4 }}>
            {predictiveData?.assetName || 'Pre-Stressed Concrete Pier P-14'}
          </h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '10px 0' }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: '#f43f5e' }}>
              {predictiveData?.predictedFailureRiskPercentage || 95}%
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Failure Risk Index</span>
          </div>
          <p style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 12 }}>
            <strong>Action Required:</strong> {predictiveData?.recommendedAction || 'Structural NDT testing needed.'}
          </p>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            Predicted Failure Window: <strong>{predictiveData?.predictedFailureWindow || 'Next 14 - 30 Days'}</strong>
          </div>
        </div>

        {/* Dynamic Frequency Recommendation Card */}
        <div className="glass-card" style={{ padding: 20, border: '1px solid rgba(56, 189, 248, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-cyan)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>
            <Sparkles size={16} />
            <span>Smart Inspection-Frequency Optimizer (Modular)</span>
          </div>
          <h3 style={{ fontSize: 16, color: 'var(--text-heading)', marginBottom: 4 }}>
            {frequencyData?.siteName || 'NH-44 Highway Overpass Bridge'}
          </h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '10px 0' }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-cyan)' }}>
              {frequencyData?.frequencyLabel || 'WEEKLY'}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              ({frequencyData?.recommendedIntervalDays || 7} Days Interval)
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
            <strong>Rationale:</strong> {frequencyData?.rationale || 'High-risk defects detected. Accelerated cadence mandated.'}
          </p>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            Average Site Compliance: <strong>{frequencyData?.currentAverageScore || 64}%</strong>
          </div>
        </div>
      </div>

      {/* Site-wise Compliance Breakdown */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 28 }}>
        <h3 style={{ fontSize: 16, color: 'var(--text-heading)', marginBottom: 4 }}>Site-wise Statutory Compliance Index</h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>Aggregated audit results across all 5 monitored regions</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {siteAnalytics.map(site => (
            <div key={site.site_id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 13 }}>
                <div>
                  <strong style={{ color: 'var(--text-heading)' }}>{site.site_name}</strong>
                  <span style={{ color: 'var(--text-dim)', marginLeft: 8, fontSize: 11 }}>({site.city}, {site.state})</span>
                </div>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: site.defects_critical > 0 ? '#f87171' : '#34d399' }}>
                    {site.defects_critical} Critical Defect(s)
                  </span>
                  <strong style={{ color: site.average_compliance_score >= 80 ? '#34d399' : '#f87171', fontSize: 14 }}>
                    {site.average_compliance_score}%
                  </strong>
                </div>
              </div>
              <div style={{ height: 8, width: '100%', background: 'rgba(148, 163, 184, 0.2)', borderRadius: 4, overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${site.average_compliance_score}%`, 
                    background: site.average_compliance_score >= 80 
                      ? 'linear-gradient(90deg, #0284c7, #10b981)' 
                      : 'linear-gradient(90deg, #f97316, #ef4444)',
                    borderRadius: 4 
                  }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6-Month Historical Trends */}
      {trends?.monthlyTrends && (
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, color: 'var(--text-heading)', marginBottom: 4 }}>Historical Compliance & Audit Velocity (6 Months)</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>Monthly volume, average score progression, and defect resolution count</p>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Audit Cycle</th>
                  <th>Inspections Conducted</th>
                  <th>Avg Compliance Score</th>
                  <th>Critical Defects</th>
                  <th>Resolved Corrective Actions</th>
                </tr>
              </thead>
              <tbody>
                {trends.monthlyTrends.map(m => (
                  <tr key={m.month}>
                    <td><strong style={{ color: '#fff' }}>{m.month}</strong></td>
                    <td>{m.inspections} audits</td>
                    <td><strong style={{ color: '#34d399' }}>{m.avg_score}%</strong></td>
                    <td><span className="badge badge-critical">{m.critical_defects}</span></td>
                    <td><span className="badge badge-success">{m.resolved_actions}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
