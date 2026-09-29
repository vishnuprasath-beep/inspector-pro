import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Users,
  Shield,
  Award,
  MapPin,
  CheckCircle,
  Activity,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  X,
  Phone,
  UserCheck,
  Building,
  Camera,
  Upload,
  Image as ImageIcon,
  Navigation
} from 'lucide-react';

const PRESET_INSPECTOR_AVATARS = [
  { label: 'Officer Male 1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
  { label: 'Officer Male 2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
  { label: 'Officer Female 1', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' },
  { label: 'Officer Female 2', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150' }
];

const SPECIALIZATIONS = [
  'Civil & Structural Engineering',
  'Bridge & Highway Auditing',
  'Marine & Coastal Infrastructure',
  'Geotechnical & Foundation Safety',
  'Electrical & Mechanical Systems'
];

export default function InspectorsPage({ onViewDutyOnMap, roleVal = 'INSPECTOR' }) {
  const toast = useToast();
  const [inspectors, setInspectors] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // 'CREATE' | 'EDIT'
  const [activeInspectorId, setActiveInspectorId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    badge_number: '',
    email: '',
    phone: '',
    specialization: 'Civil & Structural Engineering',
    assigned_site_id: '',
    assigned_site_name: '',
    status: 'ACTIVE',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const siteRes = await api.getSites();
      if (siteRes.success) setSites(siteRes.data || []);

      if (roleVal && roleVal !== 'INSPECTOR') {
        const usersRes = await api.getUsers(roleVal);
        if (usersRes.success) {
          const mappedUsers = (usersRes.data || []).map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone || '+91 98401 23456',
            badge_number: u.badge || `${roleVal.substring(0, 4)}-${u.id}`,
            specialization: u.role === 'DIRECTOR' ? 'Directorate Oversight & Governance' : 'Field Operations Supervision',
            assigned_site_name: u.assigned_site_name || 'All Regional Facilities',
            status: u.status || 'ACTIVE',
            avatar_url: u.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            inspections_conducted: u.inspections_conducted || (u.role === 'DIRECTOR' ? 120 : 64),
            avg_compliance_score: 99.1,
            geofence_adherence_rate: 100.0,
            battery_level: 95
          }));
          setInspectors(mappedUsers);
        }
      } else {
        const inspRes = await api.getInspectors();
        if (inspRes.success) setInspectors(inspRes.data || []);
      }
    } catch (e) {
      toast.error(`Failed to load ${roleVal.toLowerCase()} roster`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roleVal]);

  const handleOpenCreateModal = () => {
    setModalMode('CREATE');
    setActiveInspectorId(null);
    const defaultSite = sites[0] || {};
    setFormData({
      name: '',
      badge_number: `INSP-2024-00${inspectors.length + 1}`,
      email: '',
      phone: '+91 98401 ',
      specialization: 'Civil & Structural Engineering',
      assigned_site_id: defaultSite.id || 'site-nh44-flyover',
      assigned_site_name: defaultSite.name || 'Designated Strategic Facility',
      status: 'ACTIVE',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (insp) => {
    setModalMode('EDIT');
    setActiveInspectorId(insp.id || insp.inspector_id);
    setFormData({
      name: insp.name || '',
      badge_number: insp.badge_number || insp.code || '',
      email: insp.email || '',
      phone: insp.phone || '',
      specialization: insp.specialization || 'Civil & Structural Engineering',
      assigned_site_id: insp.assigned_site_id || (sites[0]?.id || ''),
      assigned_site_name: insp.assigned_site_name || (sites[0]?.name || ''),
      status: insp.status || 'ACTIVE',
      avatar_url: insp.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    });
    setIsModalOpen(true);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error('Photo size must not exceed 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, avatar_url: reader.result }));
      toast.info('Photo loaded. Click "Save Details" to persist.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.warning('Please provide the officer full name.');
      return;
    }

    if (modalMode === 'CREATE') {
      const res = await api.createInspector(formData);
      if (res.success) {
        toast.success(`Inspector "${formData.name}" commissioned into active roster!`);
        setIsModalOpen(false);
        loadData();
      } else {
        toast.error('Failed to commission inspector');
      }
    } else {
      const res = await api.updateInspector(activeInspectorId, formData);
      if (res.success) {
        toast.success(`Officer credentials for "${formData.name}" updated!`);
        setIsModalOpen(false);
        loadData();
      } else {
        toast.error('Failed to update inspector');
      }
    }
  };

  const handleDeleteInspector = async (insp) => {
    const id = insp.id || insp.inspector_id;
    if (window.confirm(`Are you sure you want to decommission field inspector "${insp.name}"?`)) {
      const res = await api.deleteInspector(id);
      if (res.success) {
        toast.warning(`Officer "${insp.name}" decommissioned`);
        loadData();
      } else {
        toast.error('Failed to decommission inspector');
      }
    }
  };

  const filteredInspectors = inspectors.filter(insp => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      (insp.name || '').toLowerCase().includes(term) ||
      (insp.badge_number || insp.code || '').toLowerCase().includes(term) ||
      (insp.assigned_site_name || '').toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'ALL' || insp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page-body">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 24, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={26} color="var(--accent-cyan)" />
            {roleVal === 'SUPERVISOR' ? 'Field Operations Supervisors' : roleVal === 'DIRECTOR' ? 'Directorate Leadership Officers' : 'Field Inspectors & Duty Management'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            {roleVal === 'SUPERVISOR' ? 'Supervisory oversight officers, assigned jurisdictional sites, and operational escalation logs.' : roleVal === 'DIRECTOR' ? 'Executive infrastructure governance officers and executive review authority.' : 'Official rosters, active badge credentials, live GNSS telemetry, and performance ratings.'}
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          data-tooltip={`Add new ${roleVal.toLowerCase()}`}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '10px 18px', fontWeight: 700 }}
        >
          <Plus size={16} />
          <span>+ Add {roleVal === 'SUPERVISOR' ? 'Supervisor' : roleVal === 'DIRECTOR' ? 'Director' : 'Inspector'}</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="glass-card" style={{ padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: 12, top: 12 }} />
          <input
            type="text"
            placeholder="Search inspector name, badge, or assigned site..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input-control"
            style={{ paddingLeft: 36 }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="input-control"
          style={{ width: 'auto', padding: '8px 12px' }}
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active Duty</option>
          <option value="ON_FIELD">On Field</option>
          <option value="INACTIVE">Inactive / Standby</option>
        </select>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {loading ? (
          <div style={{ padding: 40, color: 'var(--text-muted)', gridColumn: '1 / -1', textAlign: 'center' }}>
            Loading field inspectors roster...
          </div>
        ) : filteredInspectors.length === 0 ? (
          <div className="glass-card" style={{ padding: 40, textAlign: 'center', gridColumn: '1 / -1' }}>
            <Users size={36} color="var(--text-dim)" style={{ margin: '0 auto 10px', display: 'block', opacity: 0.5 }} />
            <div style={{ color: '#fff', fontWeight: 600 }}>No Inspectors Found</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
              Try modifying your search or register a new field inspector.
            </div>
          </div>
        ) : (
          filteredInspectors.map(insp => {
            const inspId = insp.id || insp.inspector_id;
            return (
              <div key={inspId} className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
                {/* Header info */}
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
                  <img
                    src={insp.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                    alt={insp.name}
                    style={{ width: 54, height: 54, borderRadius: 12, border: '2px solid var(--accent-cyan)', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ fontSize: 16, color: '#fff', fontWeight: 700 }}>{insp.name}</h3>
                      <span className="badge badge-success" style={{ fontSize: 10 }}>{insp.status || 'ACTIVE'}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 600 }}>{insp.badge_number || insp.code || 'INSP-2024'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{insp.specialization || 'Civil Infrastructure'}</div>
                  </div>
                </div>

                {/* Assigned facility chip */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#cbd5e1', background: 'rgba(15, 23, 42, 0.4)', padding: '6px 10px', borderRadius: 6, marginBottom: 12 }}>
                  <Building size={12} color="var(--accent-cyan)" />
                  <span style={{ color: 'var(--text-dim)' }}>Assigned:</span>
                  <strong style={{ color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {insp.assigned_site_name || 'Designated Strategic Facility'}
                  </strong>
                </div>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, background: 'rgba(15, 23, 42, 0.6)', padding: 12, borderRadius: 10, marginBottom: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{insp.inspections_conducted || insp.completed_audits || 48}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Audits</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#34d399' }}>{insp.avg_compliance_score || insp.performance_score || 98.4}%</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Score Avg</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#38bdf8' }}>{insp.geofence_adherence_rate || 99.2}%</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Geofence</div>
                  </div>
                </div>

                {/* Contact & Actions */}
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                    Battery: <strong style={{ color: '#34d399' }}>{insp.battery_level || 90}%</strong>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => onViewDutyOnMap && onViewDutyOnMap(insp)}
                      className="btn btn-primary btn-sm"
                      style={{
                        padding: '4px 9px',
                        fontSize: 11,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        border: '1px solid #38bdf8'
                      }}
                      title="Locate inspector on map and calculate distance to assigned duty spot"
                    >
                      <Navigation size={12} />
                      <span>Duty on Map</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(insp)}
                      data-tooltip="Edit user details"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px 10px', fontSize: 12 }}
                      title="Edit user details"
                    >
                      <Edit2 size={13} />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDeleteInspector(insp)}
                      data-tooltip="Remove user"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px 10px', fontSize: 12, color: '#D32F2F' }}
                      title="Remove user"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT INSPECTOR MODAL */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserCheck size={18} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                  {modalMode === 'CREATE' ? 'Commission New Field Inspector' : `Edit Officer: ${formData.name}`}
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
                {/* Profile Photo Uploader Section */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: 14,
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 12
                }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img
                      src={formData.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                      alt={formData.name || 'Inspector'}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 12,
                        objectFit: 'cover',
                        border: '2px solid var(--accent-cyan)',
                        boxShadow: '0 4px 12px rgba(56, 189, 248, 0.25)'
                      }}
                    />
                    <label
                      htmlFor="inspector-photo-file-input"
                      style={{
                        position: 'absolute',
                        bottom: -4,
                        right: -4,
                        background: 'var(--accent-cyan)',
                        color: '#090d16',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                      }}
                      title="Upload Officer Photo"
                    >
                      <Camera size={13} />
                    </label>
                    <input
                      id="inspector-photo-file-input"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      style={{ display: 'none' }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-heading)', marginBottom: 2 }}>
                      Inspector Profile Picture
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
                      Upload custom portrait photo or choose an official preset:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {PRESET_INSPECTOR_AVATARS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, avatar_url: preset.url }))}
                          className="btn btn-secondary btn-sm"
                          style={{
                            padding: '2px 8px',
                            fontSize: 10,
                            borderRadius: 6,
                            border: formData.avatar_url === preset.url ? '1px solid var(--accent-cyan)' : undefined
                          }}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                      Officer Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g., R. Saravanan"
                      className="input-control"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                      Badge Number
                    </label>
                    <input
                      type="text"
                      value={formData.badge_number}
                      onChange={e => setFormData(p => ({ ...p, badge_number: e.target.value }))}
                      className="input-control"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                      Government Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                      placeholder="officer@inspection.gov.in"
                      className="input-control"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                      Contact Mobile (+91)
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+91 98401 23456"
                      className="input-control"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                    Engineering Specialization
                  </label>
                  <select
                    value={formData.specialization}
                    onChange={e => setFormData(p => ({ ...p, specialization: e.target.value }))}
                    className="input-control"
                  >
                    {SPECIALIZATIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                    Assigned Strategic Facility
                  </label>
                  <select
                    value={formData.assigned_site_id}
                    onChange={e => {
                      const selected = sites.find(s => s.id === e.target.value);
                      setFormData(p => ({
                        ...p,
                        assigned_site_id: e.target.value,
                        assigned_site_name: selected ? selected.name : ''
                      }));
                    }}
                    className="input-control"
                  >
                    {sites.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                    Duty Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
                    className="input-control"
                  >
                    <option value="ACTIVE">ACTIVE (On Duty)</option>
                    <option value="ON_FIELD">ON_FIELD (Live Inspection)</option>
                    <option value="INACTIVE">INACTIVE (Off Duty / Leave)</option>
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
                  <span>{modalMode === 'CREATE' ? 'Commission Officer' : 'Save Details'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
