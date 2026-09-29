import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import InspectionModal from '../components/InspectionModal';
import { Search, Filter, FileText, CheckCircle2, AlertTriangle, Download, Plus, Calendar, X } from 'lucide-react';

export default function InspectionsPage({ initialFilter = 'ALL' }) {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilter);
  const [selectedId, setSelectedId] = useState(null);

  // Scheduling State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [sitesList, setSitesList] = useState([]);
  const [inspectorsList, setInspectorsList] = useState([]);
  const [scheduleData, setScheduleData] = useState({
    title: '',
    site_id: '',
    inspector_id: '',
    scheduled_date: new Date().toISOString().slice(0, 10),
    priority: 'HIGH',
    zone_name: 'Zone A - Primary Deck',
    notes: ''
  });
  const [scheduleLoading, setScheduleLoading] = useState(false);

  useEffect(() => {
    if (initialFilter) {
      setStatusFilter(initialFilter);
    }
  }, [initialFilter]);

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

  const handleOpenScheduleModal = async () => {
    setIsScheduleModalOpen(true);
    const [sRes, iRes] = await Promise.all([api.getSites(), api.getInspectors()]);
    if (sRes.success && sRes.data) {
      setSitesList(sRes.data);
      if (sRes.data[0] && !scheduleData.site_id) {
        setScheduleData(prev => ({ ...prev, site_id: sRes.data[0].id }));
      }
    }
    if (iRes.success && iRes.data) {
      setInspectorsList(iRes.data);
      if (iRes.data[0] && !scheduleData.inspector_id) {
        setScheduleData(prev => ({ ...prev, inspector_id: iRes.data[0].id }));
      }
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleData.title || !scheduleData.site_id || !scheduleData.inspector_id) return;
    setScheduleLoading(true);
    try {
      const selectedSite = sitesList.find(s => s.id === scheduleData.site_id);
      const selectedInsp = inspectorsList.find(i => i.id === scheduleData.inspector_id);
      const payload = {
        title: scheduleData.title,
        site_id: scheduleData.site_id,
        site_name: selectedSite?.name || 'Infrastructure Facility',
        inspector_id: scheduleData.inspector_id,
        inspector_name: selectedInsp?.name || 'Field Inspector',
        scheduled_date: scheduleData.scheduled_date,
        priority: scheduleData.priority,
        zone_name: scheduleData.zone_name,
        notes: scheduleData.notes
      };
      const res = await api.createInspection(payload);
      if (res.success) {
        setIsScheduleModalOpen(false);
        setScheduleData({
          title: '',
          site_id: sitesList[0]?.id || '',
          inspector_id: inspectorsList[0]?.id || '',
          scheduled_date: new Date().toISOString().slice(0, 10),
          priority: 'HIGH',
          zone_name: 'Zone A - Primary Deck',
          notes: ''
        });
        await fetchInspections();
      }
    } catch (err) {
      console.error('Failed to schedule inspection:', err);
    } finally {
      setScheduleLoading(false);
    }
  };

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, color: 'var(--text-heading)' }}>Inspection Audits Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Comprehensive directory of statutory infrastructure inspections, scores, and supervisor sign-offs.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={handleOpenScheduleModal}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <Plus size={14} />
            <span>+ Schedule Inspection</span>
          </button>
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

      {/* Schedule Inspection Modal */}
      {isScheduleModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsScheduleModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, color: '#fff', fontSize: 16 }}>Schedule Infrastructure Inspection</h3>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleScheduleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 4, display: 'block' }}>
                    Inspection Title
                  </label>
                  <input
                    type="text"
                    required
                    className="input-control"
                    placeholder="e.g. Quarterly Structural Safety & Bearing Audit"
                    value={scheduleData.title}
                    onChange={e => setScheduleData({ ...scheduleData, title: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 4, display: 'block' }}>
                    Assigned Facility Site
                  </label>
                  <select
                    className="input-control"
                    value={scheduleData.site_id}
                    onChange={e => setScheduleData({ ...scheduleData, site_id: e.target.value })}
                  >
                    {sitesList.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code || s.id})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 4, display: 'block' }}>
                    Field Inspector
                  </label>
                  <select
                    className="input-control"
                    value={scheduleData.inspector_id}
                    onChange={e => setScheduleData({ ...scheduleData, inspector_id: e.target.value })}
                  >
                    {inspectorsList.map(i => (
                      <option key={i.id} value={i.id}>{i.name} ({i.badge_number || i.code || i.id})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 4, display: 'block' }}>
                      Scheduled Date
                    </label>
                    <input
                      type="date"
                      required
                      className="input-control"
                      value={scheduleData.scheduled_date}
                      onChange={e => setScheduleData({ ...scheduleData, scheduled_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 4, display: 'block' }}>
                      Priority Level
                    </label>
                    <select
                      className="input-control"
                      value={scheduleData.priority}
                      onChange={e => setScheduleData({ ...scheduleData, priority: e.target.value })}
                    >
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 4, display: 'block' }}>
                    Target Zone / Deck Area
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="e.g. Zone A - Primary Deck & Abutment A-1"
                    value={scheduleData.zone_name}
                    onChange={e => setScheduleData({ ...scheduleData, zone_name: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 4, display: 'block' }}>
                    Supervisor Instructions & Directives
                  </label>
                  <textarea
                    rows={2}
                    className="input-control"
                    placeholder="Provide specific hold points or statutory checklist requirements..."
                    value={scheduleData.notes}
                    onChange={e => setScheduleData({ ...scheduleData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduleLoading}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <CheckCircle2 size={15} />
                  <span>{scheduleLoading ? 'Scheduling...' : 'Confirm Assignment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
