import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import InspectionModal from '../components/InspectionModal';
import { Search, Filter, FileText, CheckCircle2, AlertTriangle, Download } from 'lucide-react';

export default function InspectionsPage() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState(null);

  const fetchInspections = async () => {
    setLoading(true);
    const params = {};
    if (statusFilter !== 'ALL') params.status = statusFilter;
    const res = await api.getInspections(params);
    if (res.success) setInspections(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchInspections();
    const handleStorageUpdate = () => fetchInspections();
    window.addEventListener('inspectra_storage_update', handleStorageUpdate);
    return () => window.removeEventListener('inspectra_storage_update', handleStorageUpdate);
  }, [statusFilter]);

  const filtered = inspections.filter(i => {
    const term = search.toLowerCase();
    return (
      (i.title || '').toLowerCase().includes(term) ||
      (i.site_name || '').toLowerCase().includes(term) ||
      (i.inspector_name || '').toLowerCase().includes(term) ||
      (i.site_code || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="page-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, color: 'var(--text-heading)' }}>Inspection Audits Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Comprehensive directory of statutory infrastructure inspections, scores, and supervisor sign-offs.
          </p>
        </div>
        <button 
          onClick={() => {
            const headers = ['Audit ID', 'Site Name', 'Inspector', 'Date', 'Compliance Score', 'Status', 'Geofence Verified'];
            const rows = inspections.map(i => [
              i.id,
              `"${(i.site_name || '').replace(/"/g, '""')}"`,
              `"${(i.inspector_name || '').replace(/"/g, '""')}"`,
              i.date ? new Date(i.date).toLocaleDateString() : '',
              `${i.compliance_score || 0}%`,
              i.status || 'SUBMITTED',
              i.geofence_verified ? 'YES' : 'NO'
            ]);
            const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `inspections_export_${new Date().toISOString().slice(0,10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Download size={14} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: 14, marginBottom: 20, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: 12, top: 12 }} />
          <input
            type="text"
            className="input-control"
            placeholder="Search by audit title, site name, or inspector..."
            style={{ paddingLeft: 36 }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter Chips */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {['ALL', 'COMPLETED', 'APPROVED', 'FLAGGED', 'REJECTED', 'IN_PROGRESS', 'SCHEDULED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '6px 12px',
                borderRadius: 8,
                border: 'none',
                background: statusFilter === st ? 'var(--accent-cyan)' : 'rgba(15, 23, 42, 0.6)',
                color: statusFilter === st ? '#0f172a' : '#94a3b8',
                cursor: 'pointer'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Inspections Table */}
      <div className="glass-card table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Audit Dossier</th>
              <th>Target Site</th>
              <th>Inspector</th>
              <th>Date Scheduled</th>
              <th>Compliance Score</th>
              <th>Status</th>
              <th>GPS Geofence</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Loading inspection records...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No inspections match your search filter.
                </td>
              </tr>
            ) : (
              filtered.map(insp => (
                <tr key={insp.id}>
                  <td>
                    <strong style={{ color: '#fff', fontSize: 13.5 }}>{insp.title}</strong>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>ID: {insp.id}</div>
                  </td>
                  <td>
                    <div>{insp.site_name}</div>
                    <span style={{ fontSize: 10, color: 'var(--accent-cyan)', fontWeight: 600 }}>{insp.site_code}</span>
                  </td>
                  <td>
                    <div>{insp.inspector_name}</div>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{insp.inspector_code}</span>
                  </td>
                  <td>{new Date(insp.date || insp.created_at || insp.scheduled_date || Date.now()).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <strong style={{ color: insp.compliance_score >= 80 ? '#34d399' : '#f87171', fontSize: 14 }}>
                        {insp.compliance_score != null ? `${insp.compliance_score}%` : 'N/A'}
                      </strong>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      insp.status === 'APPROVED' || insp.status === 'COMPLETED' ? 'badge-success' :
                      insp.status === 'FLAGGED' ? 'badge-critical' :
                      insp.status === 'REJECTED' ? 'badge-critical' : 'badge-medium'
                    }`}>
                      {insp.status}
                    </span>
                  </td>
                  <td>
                    {insp.geofence_verified ? (
                      <span className="badge badge-success" title="Within geofence">✓ Verified</span>
                    ) : (
                      <span className="badge badge-critical" title="Out of bounds">⚠ Flagged</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                      <button
                        onClick={() => setSelectedId(insp.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: 11 }}
                      >
                        View Dossier
                      </button>
                      <a
                        href={api.getPdfReportUrl(insp.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: 11 }}
                        title="Open Printable PDF"
                      >
                        <FileText size={12} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Dossier Modal */}
      {selectedId && (
        <InspectionModal
          inspectionId={selectedId}
          onClose={() => setSelectedId(null)}
          onRefresh={fetchInspections}
        />
      )}
    </div>
  );
}
