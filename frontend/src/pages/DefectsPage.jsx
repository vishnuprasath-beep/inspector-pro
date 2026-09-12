import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  Download,
  Clock,
  MapPin,
  Tag,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  X,
  Wrench,
} from 'lucide-react';
import VoiceDictationButton from '../components/VoiceDictationButton';
import BeforeAfterComparison from '../components/BeforeAfterComparison';

const DEFECT_CATEGORIES = [
  'STRUCTURAL',
  'ELECTRICAL',
  'CORROSION',
  'THERMAL_EXPANSION',
  'DRAINAGE_SEEPAGE',
  'MECHANICAL'
];

export default function DefectsPage() {
  const toast = useToast();
  const [defects, setDefects] = useState([]);
  const [sites, setSites] = useState([]);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // 'CREATE' | 'EDIT'
  const [activeDefectId, setActiveDefectId] = useState(null);

  // Reinspection Modal State
  const [isReinspectionOpen, setIsReinspectionOpen] = useState(false);
  const [reinspectingDefect, setReinspectingDefect] = useState(null);
  const [reinspectionForm, setReinspectionForm] = useState({
    result: 'PASS',
    reinspected_by: 'Vishnu Prasath',
    remarks: '',
    photo_url: ''
  });

  const [formData, setFormData] = useState({
    title: '',
    site_name: '',
    component: '',
    category: 'STRUCTURAL',
    severity: 'CRITICAL',
    status: 'OPEN',
    description: '',
    assigned_to: 'Regional Infrastructure Engineering Wing',
    photo_url: ''
  });

  const fetchDefects = async () => {
    setLoading(true);
    try {
      const [defRes, siteRes] = await Promise.all([
        api.getDefects(),
        api.getSites()
      ]);
      if (defRes.success) setDefects(defRes.data || []);
      if (siteRes.success) setSites(siteRes.data || []);
    } catch (e) {
      toast.error('Failed to load defect registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefects();
  }, []);

  const handleOpenCreateModal = () => {
    setModalMode('CREATE');
    setActiveDefectId(null);
    const defaultSite = sites[0] || {};
    setFormData({
      title: '',
      site_name: defaultSite.name || 'Chennai Elevated Coastal Expressway',
      component: 'Pier Cap #4 Girder Joint',
      category: 'STRUCTURAL',
      severity: 'CRITICAL',
      status: 'OPEN',
      description: '',
      assigned_to: 'Regional Infrastructure Engineering Wing',
      photo_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?w=500'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (defect) => {
    setModalMode('EDIT');
    setActiveDefectId(defect.id);
    setFormData({
      title: defect.title || '',
      site_name: defect.site_name || '',
      component: defect.component || defect.asset_name || '',
      category: defect.category || 'STRUCTURAL',
      severity: defect.severity || 'HIGH',
      status: defect.status || 'OPEN',
      description: defect.description || '',
      assigned_to: defect.assigned_to || 'Regional Infrastructure Engineering Wing',
      photo_url: defect.photo_url || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.warning('Please specify the defect title.');
      return;
    }

    if (modalMode === 'CREATE') {
      const res = await api.createDefect(formData);
      if (res.success) {
        toast.success(`Defect "${formData.title}" registered successfully!`);
        setIsModalOpen(false);
        fetchDefects();
      } else {
        toast.error('Failed to register defect');
      }
    } else {
      const res = await api.updateDefect(activeDefectId, formData);
      if (res.success) {
        toast.success(`Defect "${formData.title}" updated successfully!`);
        setIsModalOpen(false);
        fetchDefects();
      } else {
        toast.error('Failed to update defect');
      }
    }
  };

  const handleUpdateStatus = async (id, newStatus, title) => {
    const res = await api.updateDefectStatus(id, newStatus, 'Status updated by supervisory control.');
    if (res.success) {
      toast.info(`Defect status updated to ${newStatus}`);
      fetchDefects();
    }
  };

  const handleOpenReinspection = (defect) => {
    setReinspectingDefect(defect);
    setReinspectionForm({
      result: 'PASS',
      reinspected_by: 'Vishnu Prasath',
      remarks: 'Corrective work verified on-site. Dimensional tolerances and rebar placement confirmed.',
      photo_url: defect.photo_url || ''
    });
    setIsReinspectionOpen(true);
  };

  const handleSubmitReinspection = async (e) => {
    e.preventDefault();
    if (!reinspectingDefect) return;

    const res = await api.recordReinspection(reinspectingDefect.id, reinspectionForm);
    if (res && res.success) {
      if (reinspectionForm.result === 'PASS') {
        toast.success(`Defect "${reinspectingDefect.title}" verified on reinspection and CLOSED!`);
      } else {
        toast.warning(`Defect "${reinspectingDefect.title}" failed reinspection. Defect kept OPEN for rework.`);
      }
      setIsReinspectionOpen(false);
      fetchDefects();
    } else {
      toast.error('Failed to record reinspection.');
    }
  };

  const handleDeleteDefect = async (defect) => {
    if (window.confirm(`Are you sure you want to delete defect record "${defect.title}"?`)) {
      const res = await api.deleteDefect(defect.id);
      if (res.success) {
        toast.warning(`Defect record removed`);
        fetchDefects();
      } else {
        toast.error('Failed to delete defect');
      }
    }
  };

  const filteredDefects = defects.filter(d => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      (d.title || '').toLowerCase().includes(term) ||
      (d.site_name || '').toLowerCase().includes(term) ||
      (d.description || '').toLowerCase().includes(term) ||
      (d.component || '').toLowerCase().includes(term);
    const matchesSeverity = severityFilter === 'ALL' || d.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="page-body">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 24, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={26} color="#f87171" />
            Defect & Anomaly Tracking Ledger
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Classified by structural & electrical severity indices, root cause engineering, and statutory deadlines.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleOpenCreateModal}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} />
            <span>Report New Defect</span>
          </button>

          <a 
            href={api.getCsvExportUrl('defects')} 
            download 
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: 12, top: 12 }} />
          <input
            type="text"
            placeholder="Search defect title, component, or site location..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input-control"
            style={{ paddingLeft: 36 }}
          />
        </div>

        {/* Severity Filter Chips */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '6px 12px',
                borderRadius: 6,
                border: 'none',
                background: severityFilter === sev ? 'var(--accent-cyan)' : 'rgba(30, 41, 59, 0.7)',
                color: severityFilter === sev ? '#0f172a' : '#94a3b8',
                cursor: 'pointer'
              }}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="input-control"
          style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }}
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="CORRECTED">Corrected (Awaiting Reinspection)</option>
          <option value="REINSPECTION_REQUIRED">Reinspection Required</option>
          <option value="CLOSED">Closed</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      {/* Defect Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
        {loading ? (
          <div style={{ padding: 40, color: 'var(--text-muted)', gridColumn: '1 / -1', textAlign: 'center' }}>
            Loading defects catalog...
          </div>
        ) : filteredDefects.length === 0 ? (
          <div className="glass-card" style={{ padding: 40, textAlign: 'center', gridColumn: '1 / -1' }}>
            <CheckCircle size={36} color="#34d399" style={{ margin: '0 auto 10px', display: 'block' }} />
            <div style={{ color: '#fff', fontWeight: 600 }}>No Defects Match Query</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
              All inspected components within this filter are operating at certified tolerance.
            </div>
          </div>
        ) : (
          filteredDefects.map(d => (
            <div key={d.id} className="glass-card" style={{ padding: 18, display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span className={`badge badge-${(d.severity || 'HIGH').toLowerCase()}`}>
                    {d.severity}
                  </span>
                  {d.is_recurring && (
                    <span style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 10.5,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      🔁 RECURRING ISSUE (x{d.recurrence_count || 2})
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                  {d.id}
                </span>
              </div>

              {/* Title & Photo */}
              <h3 style={{ fontSize: 15, color: '#fff', marginBottom: 6, fontWeight: 700 }}>{d.title}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, flex: 1, lineHeight: 1.5 }}>
                {d.description}
              </p>

              {d.is_recurring && (
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  marginBottom: 10,
                  fontSize: 11,
                  color: '#fca5a5'
                }}>
                  <strong>Recurrence Alert:</strong> Similar defect logged {d.recurrence_count - 1} time(s) prior at this site/zone. Chronic failure risk identified.
                </div>
              )}

              {d.photo_url && (
                <div style={{ height: 150, borderRadius: 10, overflow: 'hidden', marginBottom: 12, border: '1px solid var(--border-subtle)' }}>
                  <img src={d.photo_url} alt={d.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              {/* Meta details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, color: 'var(--text-dim)', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={13} color="var(--accent-cyan)" />
                  <span style={{ color: '#cbd5e1' }}>{d.site_name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Tag size={13} />
                  <span>Component: <strong style={{ color: '#fff' }}>{d.component || d.asset_name || 'Structural Element'}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={13} />
                  <span>Category: {d.category || 'STRUCTURAL'} • Deadline: {d.deadline ? new Date(d.deadline).toLocaleDateString() : 'Immediate Action'}</span>
                </div>
              </div>

              {/* Status & Reinspection Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ fontSize: 11 }}>
                  Status: <strong style={{ color: d.status === 'CLOSED' || d.status === 'RESOLVED' ? '#34d399' : d.status === 'REINSPECTION_REQUIRED' ? '#c084fc' : d.status === 'CORRECTED' ? '#38bdf8' : '#fbbf24' }}>
                    {d.status}
                  </strong>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {d.status !== 'CLOSED' && d.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleOpenReinspection(d)}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid #a855f7' }}
                      title="Record physical inspector reinspection before closure"
                    >
                      <CheckCircle2 size={12} style={{ marginRight: 4 }} />
                      Reinspect
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenEditModal(d)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 11, padding: '4px 8px' }}
                    title="Edit Defect Details"
                  >
                    <Edit2 size={12} />
                  </button>

                  <button
                    onClick={() => handleDeleteDefect(d)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 11, padding: '4px 8px', color: '#f87171' }}
                    title="Delete Defect Record"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE / EDIT DEFECT MODAL */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} color="#f87171" />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                  {modalMode === 'CREATE' ? 'Register Infrastructure Defect' : `Edit Defect: ${formData.title}`}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                    Defect Title / Anomaly Name
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g., Concrete Delamination and Micro-fissures"
                    className="input-control"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                      Associated Strategic Facility
                    </label>
                    <select
                      value={formData.site_name}
                      onChange={e => setFormData(p => ({ ...p, site_name: e.target.value }))}
                      className="input-control"
                    >
                      {sites.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                      Structural Component
                    </label>
                    <input
                      type="text"
                      value={formData.component}
                      onChange={e => setFormData(p => ({ ...p, component: e.target.value }))}
                      placeholder="e.g., Pier Cap #4 / Beam #12"
                      className="input-control"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                      className="input-control"
                    >
                      {DEFECT_CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>
                      Severity Level
                    </label>
                    <select
                      value={formData.severity}
                      onChange={e => setFormData(p => ({ ...p, severity: e.target.value }))}
                      className="input-control"
                    >
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
                      className="input-control"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="ACTION_REQUIRED">ACTION_REQUIRED</option>
                      <option value="RESOLVED">RESOLVED</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                      Engineering Observation & Root Cause Notes
                    </label>
                    <VoiceDictationButton
                      currentValue={formData.description}
                      onTranscript={(val) => setFormData(p => ({ ...p, description: val }))}
                      buttonText="Dictate"
                      size="sm"
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    placeholder="Describe specific structural defects, crack widths, corrosion depth, or electrical faults..."
                    className="input-control"
                    style={{ resize: 'vertical' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                    Evidence Photo URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.photo_url}
                    onChange={e => setFormData(p => ({ ...p, photo_url: e.target.value }))}
                    placeholder="https://..."
                    className="input-control"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                >
                  <CheckCircle2 size={14} />
                  <span>{modalMode === 'CREATE' ? 'Register Defect' : 'Save Defect Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REINSPECTION RECORDING MODAL */}
      {isReinspectionOpen && reinspectingDefect && (
        <div className="modal-backdrop" onClick={() => setIsReinspectionOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={20} color="#a855f7" />
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#fff' }}>
                  Record Physical Reinspection
                </h2>
              </div>
              <button
                onClick={() => setIsReinspectionOpen(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 8px' }}
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmitReinspection}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: 8, fontSize: 12 }}>
                  <div style={{ color: 'var(--text-muted)' }}>Defect Under Reinspection:</div>
                  <strong style={{ color: '#fff', fontSize: 13 }}>{reinspectingDefect.title}</strong>
                  <div style={{ color: 'var(--text-dim)', marginTop: 2 }}>{reinspectingDefect.site_name} &bull; {reinspectingDefect.component}</div>
                </div>

                {/* Interactive Before vs After Remediation Comparison */}
                <BeforeAfterComparison
                  beforePhoto={reinspectingDefect.photo_url}
                  afterPhoto={reinspectingDefect.rework_photo_url || reinspectionForm.photo_url || reinspectingDefect.photo_url}
                  beforeTitle="BEFORE: Defect Evidence"
                  afterTitle={reinspectingDefect.rework_photo_url ? "AFTER: Contractor Rework Evidence" : "AFTER: Remedial Verification Photo"}
                  defectId={reinspectingDefect.id}
                  height={220}
                />

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>
                    Reinspection Verification Outcome
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setReinspectionForm(p => ({ ...p, result: 'PASS' }))}
                      style={{
                        padding: '10px',
                        borderRadius: 8,
                        border: reinspectionForm.result === 'PASS' ? '2px solid #10b981' : '1px solid var(--border-subtle)',
                        background: reinspectionForm.result === 'PASS' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                        color: reinspectionForm.result === 'PASS' ? '#34d399' : '#94a3b8',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <CheckCircle size={16} />
                      <span>PASS (Close Defect)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReinspectionForm(p => ({ ...p, result: 'FAIL' }))}
                      style={{
                        padding: '10px',
                        borderRadius: 8,
                        border: reinspectionForm.result === 'FAIL' ? '2px solid #ef4444' : '1px solid var(--border-subtle)',
                        background: reinspectionForm.result === 'FAIL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                        color: reinspectionForm.result === 'FAIL' ? '#f87171' : '#94a3b8',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <X size={16} />
                      <span>FAIL (Keep Open)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                    Reinspecting Lead Auditor
                  </label>
                  <input
                    type="text"
                    value={reinspectionForm.reinspected_by}
                    onChange={e => setReinspectionForm(p => ({ ...p, reinspected_by: e.target.value }))}
                    className="input-control"
                    required
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                      On-Site Verification Findings & Measurements
                    </label>
                    <VoiceDictationButton
                      currentValue={reinspectionForm.remarks}
                      onTranscript={(val) => setReinspectionForm(p => ({ ...p, remarks: val }))}
                      buttonText="Dictate Findings"
                      size="sm"
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={reinspectionForm.remarks}
                    onChange={e => setReinspectionForm(p => ({ ...p, remarks: e.target.value }))}
                    placeholder="Document verified remedial work, concrete repair sound test, rebar spacing, etc."
                    className="input-control"
                    style={{ resize: 'vertical' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                    Reinspection Photographic Evidence URL
                  </label>
                  <input
                    type="url"
                    value={reinspectionForm.photo_url}
                    onChange={e => setReinspectionForm(p => ({ ...p, photo_url: e.target.value }))}
                    placeholder="https://..."
                    className="input-control"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsReinspectionOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ background: reinspectionForm.result === 'PASS' ? '#10b981' : '#ef4444', borderColor: reinspectionForm.result === 'PASS' ? '#10b981' : '#ef4444' }}
                >
                  <CheckCircle2 size={14} />
                  <span>Submit Reinspection Sign-off</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
