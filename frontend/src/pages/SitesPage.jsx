import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Building2,
  MapPin,
  Shield,
  CheckCircle,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Search,
  Crosshair,
  Sliders,
  CheckCircle2,
  X
} from 'lucide-react';

const SITE_CATEGORIES = [
  'CIVIL_STRUCTURE',
  'TRANSPORTATION',
  'PORT_MARITIME',
  'ENERGY_INFRASTRUCTURE',
  'MUNICIPAL_WATER'
];

export default function SitesPage() {
  const toast = useToast();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // 'CREATE' | 'EDIT'
  const [activeSiteId, setActiveSiteId] = useState(null);
  const [selectedScoreBreakdown, setSelectedScoreBreakdown] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'CIVIL_STRUCTURE',
    address: '',
    latitude: 28.6139,
    longitude: 77.2090,
    geofence_radius: 600,
    supervisor_name: 'M. Muthukumar',
    status: 'ACTIVE'
  });

  const loadSites = async () => {
    setLoading(true);
    try {
      const res = await api.getSites();
      if (res.success) setSites(res.data || []);
    } catch (e) {
      toast.error('Failed to load facilities directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  const handleOpenCreateModal = () => {
    setModalMode('CREATE');
    setActiveSiteId(null);
    setFormData({
      code: `FAC-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      category: 'CIVIL_STRUCTURE',
      address: '',
      latitude: 28.6139,
      longitude: 77.2090,
      geofence_radius: 600,
      supervisor_name: 'M. Muthukumar',
      status: 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (site) => {
    setModalMode('EDIT');
    setActiveSiteId(site.id);
    setFormData({
      code: site.code || '',
      name: site.name || '',
      category: site.category || site.site_type || 'CIVIL_STRUCTURE',
      address: site.address || '',
      latitude: site.latitude || site.geo_fence_lat || 28.6139,
      longitude: site.longitude || site.geo_fence_lng || 77.2090,
      geofence_radius: site.geofence_radius || site.geo_fence_radius_meters || 600,
      supervisor_name: site.supervisor_name || 'M. Muthukumar',
      status: site.status || 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.warning('Please provide a facility name');
      return;
    }

    if (modalMode === 'CREATE') {
      const res = await api.createSite(formData);
      if (res.success) {
        toast.success(`Facility "${formData.name}" commissioned successfully!`);
        setIsModalOpen(false);
        loadSites();
      } else {
        toast.error('Failed to create facility');
      }
    } else {
      const res = await api.updateSite(activeSiteId, formData);
      if (res.success) {
        toast.success(`Facility "${formData.name}" updated successfully!`);
        setIsModalOpen(false);
        loadSites();
      } else {
        toast.error('Failed to update facility');
      }
    }
  };

  const handleDeleteSite = async (site) => {
    if (window.confirm(`Are you sure you want to decommission facility "${site.name}"? This action is tracked.`)) {
      const res = await api.deleteSite(site.id);
      if (res.success) {
        toast.warning(`Facility "${site.name}" decommissioned`);
        loadSites();
      } else {
        toast.error('Failed to delete facility');
      }
    }
  };

  // Filter sites
  const filteredSites = sites.filter(s => {
    const matchesSearch = !searchTerm || 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || s.category === categoryFilter || s.site_type === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="page-body">
      {/* Header with Title and Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 24, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building2 size={26} color="var(--accent-cyan)" />
            Strategic Infrastructure Facilities
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Monitored national assets, GPS perimeter geofencing zones, and assigned supervisory oversight.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} />
          <span>Commission New Facility</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: 12, top: 12 }} />
          <input
            type="text"
            placeholder="Search facility name, code, or location..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input-control"
            style={{ paddingLeft: 36 }}
          />
        </div>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="input-control"
          style={{ width: 'auto', padding: '8px 12px' }}
        >
          <option value="ALL">All Categories</option>
          {SITE_CATEGORIES.map(c => (
            <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* Sites Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
        {loading ? (
          <div style={{ padding: 40, color: 'var(--text-muted)', gridColumn: '1 / -1', textAlign: 'center' }}>
            Loading strategic facilities...
          </div>
        ) : filteredSites.length === 0 ? (
          <div className="glass-card" style={{ padding: 40, textAlign: 'center', gridColumn: '1 / -1' }}>
            <Building2 size={36} color="var(--text-dim)" style={{ margin: '0 auto 10px', display: 'block', opacity: 0.5 }} />
            <div style={{ color: '#fff', fontWeight: 600 }}>No Facilities Match Filter</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
              Try adjusting your search criteria or register a new facility above.
            </div>
          </div>
        ) : (
          filteredSites.map(s => (
            <div key={s.id} className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 800 }}>{s.code}</span>
                <span className="badge badge-success">{s.status || 'ACTIVE'}</span>
              </div>

              <h3 style={{ fontSize: 16, color: '#fff', marginBottom: 4 }}>{s.name}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>{s.address}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, background: 'rgba(15, 23, 42, 0.5)', padding: 14, borderRadius: 10, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Facility Type</span>
                  <strong style={{ color: '#fff' }}>{s.category || s.site_type || 'CIVIL_STRUCTURE'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Geofence Radius</span>
                  <strong style={{ color: 'var(--accent-cyan)' }}>{s.geofence_radius || s.geo_fence_radius_meters || 600} meters</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>GNSS Origin</span>
                  <span style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>
                    {(s.latitude || s.geo_fence_lat || 28.6139).toFixed(4)}° N, {(s.longitude || s.geo_fence_lng || 77.2090).toFixed(4)}° E
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Lead Supervisor</span>
                  <strong style={{ color: '#fff' }}>{s.supervisor_name || 'M. Muthukumar'}</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={async () => {
                    const res = await api.getSiteSafetyScore(s.id);
                    if (res && res.success && res.data) {
                      setSelectedScoreBreakdown(res.data);
                    } else {
                      setSelectedScoreBreakdown({
                        site_id: s.id,
                        site_name: s.name,
                        safety_score: s.safety_score || 85,
                        grade: s.safety_grade || 'MODERATE (B)',
                        badge_color: '#3b82f6',
                        metrics: {
                          open_critical: s.critical_defects_count || 0,
                          open_high: 0,
                          open_medium: 1,
                          recurring_issues: 0,
                          passed_inspections: s.total_inspections || 2
                        },
                        deductions: (s.critical_defects_count || 0) > 0 ? [
                          { reason: `${s.critical_defects_count} Unresolved Critical Severity Defect`, points: -(s.critical_defects_count * 15), severity: 'CRITICAL' }
                        ] : [],
                        bonuses: [
                          { reason: `${s.total_inspections || 1} Verified Compliant Inspection`, points: +5 }
                        ]
                      });
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                  title="Click to view transparent audit deduction formula & itemized breakdown"
                >
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Safety:</span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: (s.safety_score ?? 85) >= 80 ? '#34d399' : (s.safety_score ?? 85) >= 60 ? '#fbbf24' : '#f87171',
                    textDecoration: 'underline'
                  }}>
                    {s.safety_score ?? 85}/100 ({s.safety_grade || 'Grade A'})
                  </span>
                </button>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => handleOpenEditModal(s)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 8px', fontSize: 11 }}
                    title="Edit Facility Parameters"
                  >
                    <Edit2 size={12} />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDeleteSite(s)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 8px', fontSize: 11, color: '#f87171' }}
                    title="Decommission Facility"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE / EDIT FACILITY MODAL */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={18} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                  {modalMode === 'CREATE' ? 'Commission New Strategic Facility' : `Edit Facility: ${formData.name}`}
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                      Facility Code
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={e => setFormData(p => ({ ...p, code: e.target.value }))}
                      className="input-control"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                      Facility Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g., Chennai Coastal Expressway"
                      className="input-control"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                      Category / Type
                    </label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                      className="input-control"
                    >
                      {SITE_CATEGORIES.map(c => (
                        <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                      Operational Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
                      className="input-control"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                      <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                    Geographic Address / Corridor
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                    placeholder="e.g., East Coast Road Corridor, Chennai, TN"
                    className="input-control"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>
                      Latitude (°N)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={e => setFormData(p => ({ ...p, latitude: e.target.value }))}
                      className="input-control"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>
                      Longitude (°E)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={e => setFormData(p => ({ ...p, longitude: e.target.value }))}
                      className="input-control"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>
                      Geofence Radius (m)
                    </label>
                    <input
                      type="number"
                      value={formData.geofence_radius}
                      onChange={e => setFormData(p => ({ ...p, geofence_radius: e.target.value }))}
                      className="input-control"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                    Supervisory Officer Oversight
                  </label>
                  <select
                    value={formData.supervisor_name}
                    onChange={e => setFormData(p => ({ ...p, supervisor_name: e.target.value }))}
                    className="input-control"
                  >
                    <option value="M. Muthukumar">M. Muthukumar — Chief Infrastructure Supervisor</option>
                    <option value="Dr. S. Radhakrishnan">Dr. S. Radhakrishnan — State Director of Inspections</option>
                    <option value="K. Selvakumar, IAS">K. Selvakumar, IAS — Principal Administrator</option>
                  </select>
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
                  <span>{modalMode === 'CREATE' ? 'Register Facility' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* TRANSPARENT SAFETY SCORE AUDIT BREAKDOWN MODAL */}
      {selectedScoreBreakdown && (
        <div className="modal-backdrop" onClick={() => setSelectedScoreBreakdown(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={20} color="var(--accent-cyan)" />
                <h3 style={{ margin: 0, fontSize: 16, color: '#fff' }}>Transparent Site Safety Score Breakdown</h3>
              </div>
              <button 
                onClick={() => setSelectedScoreBreakdown(null)} 
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 8px' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.6)', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border-subtle)', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Facility</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', marginTop: 2 }}>{selectedScoreBreakdown.site_name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: selectedScoreBreakdown.badge_color || '#10b981' }}>
                    {selectedScoreBreakdown.safety_score}/100
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: selectedScoreBreakdown.badge_color || '#10b981' }}>
                    {selectedScoreBreakdown.grade}
                  </div>
                </div>
              </div>

              {/* Mathematical Formula Banner */}
              <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 11.5, color: '#e0f2fe' }}>
                <strong style={{ color: 'var(--accent-cyan)' }}>Institutional Scoring Formula:</strong>
                <div style={{ fontFamily: 'monospace', fontSize: 11, marginTop: 4, color: '#bae6fd' }}>
                  Score = 100 - (Crit × 15) - (High × 8) - (Med × 3) - (Recurring × 10) + (Passed × 5)
                </div>
              </div>

              {/* Itemized Deductions */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#f87171', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={14} />
                  <span>Itemized Point Deductions</span>
                </div>
                {(!selectedScoreBreakdown.deductions || selectedScoreBreakdown.deductions.length === 0) ? (
                  <div style={{ fontSize: 12, color: '#34d399', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 12px', borderRadius: 6 }}>
                    ✓ Zero point deductions. No unresolved critical, high, or recurring defects detected.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selectedScoreBreakdown.deductions.map((d, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '8px 12px', borderRadius: 6, fontSize: 12 }}>
                        <span style={{ color: '#fca5a5' }}>{d.reason}</span>
                        <strong style={{ color: '#f87171', fontWeight: 800 }}>{d.points} pts</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Itemized Bonuses */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#34d399', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={14} />
                  <span>Itemized Compliance Bonuses</span>
                </div>
                {(!selectedScoreBreakdown.bonuses || selectedScoreBreakdown.bonuses.length === 0) ? (
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', padding: '6px 0' }}>
                    No bonus points accrued yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selectedScoreBreakdown.bonuses.map((b, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '8px 12px', borderRadius: 6, fontSize: 12 }}>
                        <span style={{ color: '#86efac' }}>{b.reason}</span>
                        <strong style={{ color: '#34d399', fontWeight: 800 }}>+{b.points} pts</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'right', marginTop: 16 }}>
                <button
                  onClick={() => setSelectedScoreBreakdown(null)}
                  className="btn btn-primary btn-sm"
                  style={{ padding: '6px 16px' }}
                >
                  Close Audit Sheet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
