import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FileText, Download, ShieldCheck, FileDown, CheckCircle } from 'lucide-react';

export default function ReportsPage() {
  const [inspections, setInspections] = useState([]);
  const [complianceSummary, setComplianceSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      const [inspRes, compRes] = await Promise.all([
        api.getInspections({ limit: 10 }),
        api.getComplianceSummary()
      ]);
      if (inspRes.success) setInspections(inspRes.data);
      if (compRes.success) setComplianceSummary(compRes.data);
      setLoading(false);
    }
    loadReports();
  }, []);

  return (
    <div className="page-body">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, color: '#fff' }}>Compliance Reports & Official Data Exports</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          Statutory government audit summaries, instant printable PDF generation, and Excel/CSV raw data extracts.
        </p>
      </div>

      {/* Statutory Summary Card */}
      {complianceSummary && (
        <div className="glass-card" style={{ padding: 22, marginBottom: 28, background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(30, 41, 59, 0.8) 100%)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 800, textTransform: 'uppercase' }}>
                GOVERNMENT STATUTORY AUDIT SUMMARY
              </span>
              <h2 style={{ fontSize: 20, color: '#fff', margin: '4px 0 6px' }}>
                National Infrastructure Compliance Index: {complianceSummary.overallNationalComplianceScore}%
              </h2>
              <p style={{ fontSize: 12, color: '#cbd5e1' }}>
                Statutory Code: <strong>{complianceSummary.statutoryRegulatoryStandard}</strong>
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Audited Facilities</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{complianceSummary.totalFacilitiesAudited} Sites</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Total Audits Logged</div>
              <strong style={{ fontSize: 16, color: '#fff' }}>{complianceSummary.totalAuditsExecuted} Audits</strong>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Critical Defects Logged</div>
              <strong style={{ fontSize: 16, color: '#f43f5e' }}>{complianceSummary.criticalDefectsIdentified} Defects</strong>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Remediations Resolved</div>
              <strong style={{ fontSize: 16, color: '#34d399' }}>{complianceSummary.resolvedRemediationsCount} Actions</strong>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Remediation Efficiency</div>
              <strong style={{ fontSize: 16, color: 'var(--accent-cyan)' }}>{complianceSummary.remediationEfficiencyPercentage}%</strong>
            </div>
          </div>
        </div>
      )}

      {/* Raw Data Export Center */}
      <h3 style={{ fontSize: 16, color: '#fff', marginBottom: 12 }}>Data Export Center (CSV / Excel Compatible)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 28 }}>
        <div className="glass-card" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontSize: 14, color: '#fff' }}>Field Inspections Full Ledger</h4>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Complete audit log with geofence distance and checklist scores</p>
          </div>
          <a
            href={api.getCsvExportUrl('inspections')}
            download
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={14} />
            <span>Download CSV</span>
          </a>
        </div>

        <div className="glass-card" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontSize: 14, color: '#fff' }}>Defect & Anomaly Ledger</h4>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>All severity categories, deadlines, and corrective status</p>
          </div>
          <a
            href={api.getCsvExportUrl('defects')}
            download
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={14} />
            <span>Download CSV</span>
          </a>
        </div>
      </div>

      {/* Printable PDF Inspection Reports Directory */}
      <h3 style={{ fontSize: 16, color: '#fff', marginBottom: 12 }}>Printable Official Inspection PDF Reports</h3>
      <div className="glass-card table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Inspection Title</th>
              <th>Infrastructure Site</th>
              <th>Auditor</th>
              <th>Status</th>
              <th>Score</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {inspections.map(i => (
              <tr key={i.id}>
                <td>
                  <strong style={{ color: '#fff' }}>{i.title}</strong>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Ref: {i.id}</div>
                </td>
                <td>{i.site_name}</td>
                <td>{i.inspector_name}</td>
                <td>
                  <span className={`badge ${i.status === 'APPROVED' || i.status === 'COMPLETED' ? 'badge-success' : 'badge-critical'}`}>
                    {i.status}
                  </span>
                </td>
                <td>
                  <strong style={{ color: i.compliance_score >= 80 ? '#34d399' : '#f87171' }}>
                    {i.compliance_score}%
                  </strong>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <a
                    href={api.getPdfReportUrl(i.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <FileDown size={13} color="var(--accent-cyan)" />
                    <span>View / Print PDF</span>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
