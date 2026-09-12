import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  Wrench, 
  CheckCircle2, 
  Clock, 
  User, 
  ShieldCheck, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  Copy, 
  Check, 
  Code, 
  FileText, 
  DollarSign, 
  Calendar, 
  Building2, 
  Layers, 
  Send, 
  X,
  ExternalLink,
  ChevronRight,
  Shield
} from 'lucide-react';
import VoiceDictationButton from '../components/VoiceDictationButton';
import BeforeAfterComparison from '../components/BeforeAfterComparison';

export default function CorrectiveActionsPage() {
  const toast = useToast();
  const [actions, setActions] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtering
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [supervisorFilter, setSupervisorFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalMode, setModalMode] = useState('edit'); // 'edit' or 'create'
  const [activeModalTab, setActiveModalTab] = useState('assignment'); // 'assignment' or 'payload'
  const [selectedAction, setSelectedAction] = useState(null);

  // Edit / Create Form State
  const [formData, setFormData] = useState({
    id: '',
    defect_id: '',
    directive_title: '',
    action_type: 'STRUCTURAL_REPAIR',
    priority: 'HIGH',
    assigned_supervisor_id: 'usr-supervisor-01',
    assigned_contractor: 'L&T Infrastructure Rehabilitation Team',
    estimated_cost: 75000,
    target_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    statutory_code: 'IRC:SP:40-2019 / IS 456-2000',
    proof_requirements: 'Compressive strength cube test (>35 MPa) + Optical Evidence',
    status: 'ASSIGNED',
    notes: '',
    customPayloadJson: ''
  });

  // Verify Modal
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyingAction, setVerifyingAction] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verifierName, setVerifierName] = useState('M. Muthukumar');
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Contractor Rework Submission State
  const [showReworkModal, setShowReworkModal] = useState(false);
  const [reworkAction, setReworkAction] = useState(null);
  const [reworkForm, setReworkForm] = useState({
    contractor_name: '',
    photo_url: '',
    notes: '',
    lab_reference: ''
  });

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [actRes, supRes, defRes] = await Promise.all([
        api.getCorrectiveActions(),
        api.getSupervisors(),
        api.getDefects()
      ]);

      if (actRes.success) setActions(actRes.data || []);
      if (supRes.success) setSupervisors(supRes.data || []);
      if (defRes.success) setDefects(defRes.data || []);
    } catch (err) {
      console.error('Failed to load corrective actions data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Filtered list
  const filteredActions = actions.filter(act => {
    if (statusFilter !== 'ALL' && act.status !== statusFilter) return false;
    if (supervisorFilter !== 'ALL' && act.assigned_supervisor_id !== supervisorFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (act.directive_title || act.action_taken || '').toLowerCase().includes(q);
      const matchDefect = (act.defect_title || '').toLowerCase().includes(q);
      const matchContractor = (act.assigned_contractor || '').toLowerCase().includes(q);
      const matchSupervisor = (act.assigned_supervisor_name || '').toLowerCase().includes(q);
      const matchId = (act.id || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDefect && !matchContractor && !matchSupervisor && !matchId) return false;
    }
    return true;
  });

  // Statistics
  const totalDirectives = actions.length;
  const inProgressCount = actions.filter(a => a.status === 'WORK_IN_PROGRESS' || a.status === 'IN_PROGRESS').length;
  const verifiedCount = actions.filter(a => a.status === 'VERIFIED').length;
  const totalBudget = actions.reduce((sum, a) => sum + (Number(a.estimated_cost) || 0), 0);

  // Open Edit / Assign Modal
  const handleOpenEdit = (action) => {
    setModalMode('edit');
    setSelectedAction(action);
    setActiveModalTab('assignment');

    const payloadObj = action.payload || {
      action_id: action.id,
      directive_title: action.directive_title || action.action_taken,
      defect_reference: {
        defect_id: action.defect_id,
        title: action.defect_title,
        severity: action.defect_severity,
        site: action.site_name
      },
      supervisory_officer: {
        id: action.assigned_supervisor_id,
        name: action.assigned_supervisor_name,
        role: action.assigned_supervisor_role
      },
      execution_agency: action.assigned_contractor,
      remediation_type: action.action_type,
      sla_deadline: action.target_date,
      estimated_budget_inr: action.estimated_cost,
      statutory_compliance: action.statutory_code,
      verification_protocol: action.proof_requirements,
      status: action.status
    };

    setFormData({
      id: action.id,
      defect_id: action.defect_id || (defects[0]?.id || 'def-01'),
      directive_title: action.directive_title || action.action_taken || '',
      action_type: action.action_type || 'STRUCTURAL_REPAIR',
      priority: action.priority || 'HIGH',
      assigned_supervisor_id: action.assigned_supervisor_id || (supervisors[0]?.id || 'usr-supervisor-01'),
      assigned_contractor: action.assigned_contractor || 'L&T Infrastructure Rehabilitation Team',
      estimated_cost: action.estimated_cost || 50000,
      target_date: action.target_date || new Date().toISOString().split('T')[0],
      statutory_code: action.statutory_code || 'IRC:SP:40-2019 / IS 456-2000',
      proof_requirements: action.proof_requirements || 'Compressive strength cube test (>35 MPa)',
      status: action.status || 'ASSIGNED',
      notes: action.notes || '',
      customPayloadJson: JSON.stringify(payloadObj, null, 2)
    });

    setShowEditModal(true);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedAction(null);
    setActiveModalTab('assignment');

    const firstDef = defects[0] || {};
    const firstSup = supervisors[0] || {};
    const nextId = `ACT-2026-${String(Math.floor(100 + Math.random() * 900))}`;

    const defaultPayload = {
      action_id: nextId,
      directive_title: 'Structural Integrity & Concrete Rebar Passivation Directive',
      defect_reference: {
        defect_id: firstDef.id || 'def-01',
        title: firstDef.title || 'Concrete Spalling',
        severity: firstDef.severity || 'CRITICAL',
        site: firstDef.site_name || 'Designated Facility'
      },
      supervisory_officer: {
        id: firstSup.id || 'usr-supervisor-01',
        name: firstSup.name || 'M. Muthukumar',
        badge: firstSup.badge || 'SUP-ZN-03',
        department: firstSup.department || 'Safety & Remediation Zonal Command'
      },
      execution_agency: 'L&T Infrastructure Rehabilitation Team',
      remediation_type: 'STRUCTURAL_REPAIR',
      sla_deadline: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      estimated_budget_inr: 85000,
      statutory_compliance: 'IRC:SP:40-2019 / IS 456-2000',
      verification_protocol: 'Compressive strength cube test (>35 MPa) + 4K Optical Evidence'
    };

    setFormData({
      id: nextId,
      defect_id: firstDef.id || 'def-01',
      directive_title: 'Structural Integrity & Concrete Rebar Passivation Directive',
      action_type: 'STRUCTURAL_REPAIR',
      priority: 'CRITICAL',
      assigned_supervisor_id: firstSup.id || 'usr-supervisor-01',
      assigned_contractor: 'L&T Infrastructure Rehabilitation Team',
      estimated_cost: 85000,
      target_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      statutory_code: 'IRC:SP:40-2019 / IS 456-2000',
      proof_requirements: 'Compressive strength cube test (>35 MPa) + 4K Optical Evidence',
      status: 'ASSIGNED',
      notes: 'Work order approved by Directorate for expedited execution.',
      customPayloadJson: JSON.stringify(defaultPayload, null, 2)
    });

    setShowEditModal(true);
  };

  // Synchronize JSON Payload when user changes form inputs
  const syncJsonPayloadFromForm = (updatedFields) => {
    try {
      const merged = { ...formData, ...updatedFields };
      const selectedSup = supervisors.find(s => s.id === merged.assigned_supervisor_id);
      const selectedDef = defects.find(d => d.id === merged.defect_id);

      const generated = {
        action_id: merged.id,
        directive_title: merged.directive_title,
        defect_reference: {
          defect_id: merged.defect_id,
          title: selectedDef?.title || 'Linked Defect',
          severity: selectedDef?.severity || merged.priority,
          site: selectedDef?.site_name || 'Designated Facility'
        },
        supervisory_officer: {
          id: selectedSup?.id || merged.assigned_supervisor_id,
          name: selectedSup?.name || 'M. Muthukumar',
          badge: selectedSup?.badge || 'SUP-ZN-03',
          department: selectedSup?.department || 'Safety & Remediation Zonal Command'
        },
        execution_agency: merged.assigned_contractor,
        remediation_type: merged.action_type,
        sla_deadline: merged.target_date,
        estimated_budget_inr: Number(merged.estimated_cost) || 0,
        statutory_compliance: merged.statutory_code,
        verification_protocol: merged.proof_requirements,
        status: merged.status,
        dispatch_timestamp: new Date().toISOString()
      };

      setFormData(prev => ({
        ...prev,
        ...updatedFields,
        customPayloadJson: JSON.stringify(generated, null, 2)
      }));
    } catch (e) {
      setFormData(prev => ({ ...prev, ...updatedFields }));
    }
  };

  // Save changes (Create or Update)
  const handleSaveModal = async (e) => {
    e.preventDefault();

    let parsedPayload;
    try {
      parsedPayload = JSON.parse(formData.customPayloadJson);
    } catch (err) {
      toast?.error?.('Invalid JSON in Remediation Payload tab. Please check formatting.');
      return;
    }

    if (modalMode === 'create') {
      const res = await api.createCorrectiveAction({
        ...formData,
        payload: parsedPayload
      });
      if (res.success) {
        toast?.success?.(`Remediation Directive ${formData.id} initiated and dispatched!`);
        setShowEditModal(false);
        fetchInitialData();
      }
    } else {
      const res = await api.updateCorrectiveAction(formData.id, {
        ...formData,
        payload: parsedPayload
      });
      if (res.success) {
        toast?.success?.(`Directive ${formData.id} supervisor assignment and payload updated.`);
        setShowEditModal(false);
        fetchInitialData();
      }
    }
  };

  // Open Verify Modal
  const handleOpenVerify = (action) => {
    setVerifyingAction(action);
    setVerificationNotes(`Physical site inspection conducted on ${new Date().toLocaleDateString()}. Structural repair verified against specification ${action.statutory_code || 'IS 456'}. All quality criteria satisfied.`);
    setVerifierName(action.assigned_supervisor_name || 'M. Muthukumar');
    setShowVerifyModal(true);
  };

  // Submit Verification Sign-off
  const handleSubmitVerification = async () => {
    if (!verifyingAction) return;
    const res = await api.verifyCorrectiveAction(verifyingAction.id, verificationNotes, verifierName);
    if (res.success) {
      toast?.success?.(`Corrective Action ${verifyingAction.id} verified and officially certified by ${verifierName}!`);
      setShowVerifyModal(false);
      setVerifyingAction(null);
      fetchInitialData();
    }
  };

  // Copy JSON Payload to clipboard
  const handleCopyPayload = () => {
    navigator.clipboard.writeText(formData.customPayloadJson);
    setCopiedPayload(true);
    toast?.info?.('Remediation JSON Payload copied to clipboard.');
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  // Open Contractor Rework Submission Modal
  const handleOpenReworkModal = (action) => {
    setReworkAction(action);
    setReworkForm({
      contractor_name: action.assigned_contractor || 'Afcons Infrastructure Civil Engineering Unit',
      photo_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
      notes: `Remediation completed for ${action.directive_title}. Structural bonding agent applied according to standard ${action.statutory_code || 'IS 456'}.`,
      lab_reference: 'LAB-TEST/2026/IS-456-CLEARED'
    });
    setShowReworkModal(true);
  };

  // Submit Contractor Rework & Trigger Reinspection
  const handleSubmitRework = async (e) => {
    e.preventDefault();
    if (!reworkAction) return;

    const res = await api.submitContractorRework(reworkAction.defect_id || reworkAction.id, {
      action_id: reworkAction.id,
      contractor_name: reworkForm.contractor_name,
      photo_url: reworkForm.photo_url,
      notes: `${reworkForm.notes} [Test Ref: ${reworkForm.lab_reference}]`
    });

    if (res && res.success) {
      toast?.success?.('Contractor rework proof submitted! Defect flagged for statutory reinspection.');
      setShowReworkModal(false);
      fetchInitialData();
    } else {
      toast?.error?.('Failed to submit contractor rework proof.');
    }
  };

  return (
    <div className="page-body">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wrench size={20} color="var(--accent-cyan)" />
            </div>
            <h1 style={{ fontSize: 24, color: '#fff', fontWeight: 800 }}>
              Remediation & Corrective Actions Workflow
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Full lifecycle directive governance: assign supervisory authorities, configure enterprise remediation payloads, track contractor SLAs, and record statutory sign-offs.
          </p>
        </div>

        {/* Action Button: Initiate Directive */}
        <button
          onClick={handleOpenCreate}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontWeight: 700, borderRadius: 10 }}
        >
          <Plus size={16} />
          <span>Initiate Remediation Directive</span>
        </button>
      </div>

      {/* KPI Overview Metrics */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
          marginBottom: 22
        }}
      >
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL DIRECTIVES</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginTop: 4 }}>{totalDirectives}</div>
          <div style={{ fontSize: 11, color: 'var(--accent-cyan)', marginTop: 2 }}>Statutory Work Orders</div>
        </div>
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>WORK IN PROGRESS</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>{inProgressCount}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Contractors on-site</div>
        </div>
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>VERIFIED & CLOSED</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#34d399', marginTop: 4 }}>{verifiedCount}</div>
          <div style={{ fontSize: 11, color: '#34d399', marginTop: 2 }}>Supervisor Certified</div>
        </div>
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>COMMITTED REMEDIATION BUDGET</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>₹{totalBudget.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>State Infrastructure Funds</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div 
        className="glass-card"
        style={{
          padding: 14,
          marginBottom: 18,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: 12, top: 11 }} />
          <input
            type="text"
            className="input-control"
            placeholder="Search directives by title, site, defect, or supervisor..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 36, fontSize: 12.5 }}
          />
        </div>

        {/* Supervisor Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <User size={15} color="var(--text-dim)" />
          <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 700 }}>SUPERVISOR:</span>
          <select
            className="input-control"
            style={{ fontSize: 12, padding: '7px 10px', minWidth: 180 }}
            value={supervisorFilter}
            onChange={e => setSupervisorFilter(e.target.value)}
          >
            <option value="ALL">All Supervisors</option>
            {supervisors.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.badge || 'SUP'})</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={15} color="var(--text-dim)" />
          <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 700 }}>STATUS:</span>
          <select
            className="input-control"
            style={{ fontSize: 12, padding: '7px 10px' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="WORK_IN_PROGRESS">Work In Progress</option>
            <option value="VERIFIED">Verified & Closed</option>
          </select>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="glass-card table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ minWidth: 220 }}>Remediation Directive & ID</th>
              <th style={{ minWidth: 180 }}>Defect Reference</th>
              <th style={{ minWidth: 200 }}>Assigned Supervisory Officer</th>
              <th style={{ minWidth: 160 }}>Contractor & Deadline</th>
              <th>Budget (INR)</th>
              <th>Status</th>
              <th style={{ minWidth: 160 }}>Verification Sign-Off</th>
              <th style={{ textAlign: 'right', minWidth: 170 }}>Workflow Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 50, color: 'var(--text-muted)' }}>
                  Loading enterprise remediation directives...
                </td>
              </tr>
            ) : filteredActions.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No remediation directives match the selected criteria.
                </td>
              </tr>
            ) : (
              filteredActions.map(act => (
                <tr key={act.id}>
                  {/* Directive Title & ID */}
                  <td>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: 13 }}>
                      {act.directive_title || act.action_taken}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <code style={{ fontSize: 10.5, color: 'var(--accent-cyan)', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: 4 }}>
                        {act.id}
                      </code>
                      <span style={{ fontSize: 10.5, color: '#94a3b8' }}>
                        {act.action_type?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </td>

                  {/* Defect Reference */}
                  <td>
                    <div style={{ color: '#e2e8f0', fontSize: 12 }}>
                      {act.defect_title || 'Concrete Spalling Anomaly'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <span className={`badge badge-${act.defect_severity?.toLowerCase() || 'high'}`} style={{ fontSize: 9 }}>
                        {act.defect_severity || 'HIGH'}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                        {act.site_name || 'Designated Facility'}
                      </span>
                    </div>
                  </td>

                  {/* Assigned Supervisor */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.2)', border: '1px solid var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, color: 'var(--accent-cyan)' }}>
                        {(act.assigned_supervisor_name || 'M')[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 12 }}>
                          {act.assigned_supervisor_name || 'M. Muthukumar'}
                        </div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>
                          {act.assigned_supervisor_role || 'Senior Safety Supervisor'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Contractor & SLA */}
                  <td>
                    <div style={{ fontSize: 12, color: '#f1f5f9', fontWeight: 600 }}>
                      {act.assigned_contractor || 'State Civil Maintenance Wing'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, fontSize: 11, color: '#94a3b8' }}>
                      <Calendar size={12} color="var(--accent-cyan)" />
                      <span>Target: {act.target_date || '2026-09-20'}</span>
                    </div>
                  </td>

                  {/* Cost */}
                  <td>
                    <strong style={{ color: '#38bdf8', fontSize: 12.5 }}>
                      ₹{(Number(act.estimated_cost) || 0).toLocaleString()}
                    </strong>
                  </td>

                  {/* Status */}
                  <td>
                    <span 
                      className={`badge ${
                        act.status === 'VERIFIED' 
                          ? 'badge-success' 
                          : act.status === 'WORK_IN_PROGRESS' || act.status === 'IN_PROGRESS' 
                          ? 'badge-medium' 
                          : 'badge-low'
                      }`}
                      style={{ fontSize: 10 }}
                    >
                      {act.status?.replace(/_/g, ' ')}
                    </span>
                  </td>

                  {/* Supervisor Verification */}
                  <td>
                    {act.status === 'VERIFIED' ? (
                      <div>
                        <div style={{ color: '#34d399', fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700 }}>
                          <CheckCircle2 size={14} />
                          <span>Certified by {act.verified_by_name || act.assigned_supervisor_name || 'M. Muthukumar'}</span>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                          {act.verified_at ? new Date(act.verified_at).toLocaleDateString() : 'Statutory Seal'}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: '#f59e0b', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} />
                        <span>Pending Sign-Off</span>
                      </span>
                    )}
                  </td>

                  {/* Actions Column */}
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                      <button
                        onClick={() => handleOpenEdit(act)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: 11, padding: '5px 9px', display: 'flex', alignItems: 'center', gap: 4 }}
                        title="Assign Supervisor & Edit Remediation Payload"
                      >
                        <User size={12} color="var(--accent-cyan)" />
                        <span>Assign / Payload</span>
                      </button>

                      {act.status !== 'VERIFIED' && (
                        <>
                          <button
                            onClick={() => handleOpenReworkModal(act)}
                            className="btn btn-secondary btn-sm"
                            style={{
                              fontSize: 11,
                              padding: '5px 9px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              borderColor: '#a855f7',
                              color: '#c084fc',
                              background: 'rgba(168, 85, 247, 0.1)'
                            }}
                            title="Contractor Rework Proof Submission"
                          >
                            <CheckCircle2 size={12} color="#c084fc" />
                            <span>Contractor Proof</span>
                          </button>

                          <button
                            onClick={() => handleOpenVerify(act)}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: 11, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                            title="Supervisor Physical Sign-off"
                          >
                            <ShieldCheck size={12} />
                            <span>Sign-off</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: ASSIGN SUPERVISOR & EDIT REMEDIATION PAYLOAD     */}
      {/* ========================================================= */}
      {showEditModal && (
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)} style={{ zIndex: 900 }}>
          <div 
            className="glass-card modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 780,
              width: '95%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 26,
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: 18,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8), 0 0 35px rgba(56, 189, 248, 0.2)'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Wrench size={20} color="var(--accent-cyan)" />
                  <h2 style={{ fontSize: 18, color: '#fff', fontWeight: 800 }}>
                    {modalMode === 'create' ? 'Initiate New Remediation Directive' : `Configure Remediation Payload (${formData.id})`}
                  </h2>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Assign state supervisory authority and edit the enterprise JSON remediation payload.
                </p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-subtle)', marginBottom: 20 }}>
              <button
                type="button"
                onClick={() => setActiveModalTab('assignment')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeModalTab === 'assignment' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                  color: activeModalTab === 'assignment' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  padding: '8px 16px',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <User size={14} />
                <span>Supervisor Assignment & Specs</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('payload')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeModalTab === 'payload' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                  color: activeModalTab === 'payload' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  padding: '8px 16px',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Code size={14} />
                <span>Remediation Payload (JSON Viewer)</span>
              </button>
            </div>

            <form onSubmit={handleSaveModal}>
              {/* TAB 1: SUPERVISOR ASSIGNMENT & DIRECTIVE SPECS */}
              {activeModalTab === 'assignment' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Supervisor Selector */}
                  <div style={{ background: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 12, padding: 14 }}>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
                      ASSIGNED SUPERVISORY OFFICER (STATUTORY AUTHORITY)
                    </label>
                    <select
                      className="input-control"
                      value={formData.assigned_supervisor_id}
                      onChange={e => syncJsonPayloadFromForm({ assigned_supervisor_id: e.target.value })}
                      style={{ fontSize: 13, fontWeight: 700 }}
                    >
                      {supervisors.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} &bull; {s.role} ({s.badge || 'SUP'})
                        </option>
                      ))}
                    </select>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Shield size={12} color="var(--accent-cyan)" />
                      <span>This officer holds primary statutory responsibility for validating contractor physical execution.</span>
                    </div>
                  </div>

                  {/* Directive Title */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', fontWeight: 700, marginBottom: 4 }}>
                      REMEDIATION DIRECTIVE TITLE
                    </label>
                    <input
                      type="text"
                      className="input-control"
                      value={formData.directive_title}
                      onChange={e => syncJsonPayloadFromForm({ directive_title: e.target.value })}
                      placeholder="e.g. High-Pressure Hydro-demolition & Polymer Grout Injection"
                      required
                    />
                  </div>

                  {/* Grid of 2: Linked Defect & Action Type */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', fontWeight: 700, marginBottom: 4 }}>
                        LINKED DEFECT REFERENCE
                      </label>
                      <select
                        className="input-control"
                        value={formData.defect_id}
                        onChange={e => syncJsonPayloadFromForm({ defect_id: e.target.value })}
                      >
                        {defects.map(d => (
                          <option key={d.id} value={d.id}>
                            [{d.id}] {d.title} ({d.severity})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', fontWeight: 700, marginBottom: 4 }}>
                        REMEDIATION CATEGORY / ACTION TYPE
                      </label>
                      <select
                        className="input-control"
                        value={formData.action_type}
                        onChange={e => syncJsonPayloadFromForm({ action_type: e.target.value })}
                      >
                        <option value="STRUCTURAL_REPAIR">Structural Repair (Civil / Concrete)</option>
                        <option value="SAFETY_CORRECTION">Life & Fire Safety Correction</option>
                        <option value="WATERPROOFING_MEMBRANE">Waterproofing & Fissure Grouting</option>
                        <option value="ELECTRICAL_ISOLATION">High Voltage Electrical Isolation</option>
                        <option value="CORROSION_PASSIVATION">Rebar Rust Conversion & Passivation</option>
                      </select>
                    </div>
                  </div>

                  {/* Grid of 2: Contractor & SLA Target Date */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', fontWeight: 700, marginBottom: 4 }}>
                        ASSIGNED ENGINEERING CONTRACTOR
                      </label>
                      <input
                        type="text"
                        className="input-control"
                        value={formData.assigned_contractor}
                        onChange={e => syncJsonPayloadFromForm({ assigned_contractor: e.target.value })}
                        placeholder="e.g. L&T Infrastructure Rehabilitation Team"
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', fontWeight: 700, marginBottom: 4 }}>
                        TARGET SLA COMPLETION DATE
                      </label>
                      <input
                        type="date"
                        className="input-control"
                        value={formData.target_date}
                        onChange={e => syncJsonPayloadFromForm({ target_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Grid of 2: Estimated Cost & Status */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', fontWeight: 700, marginBottom: 4 }}>
                        ESTIMATED REMEDIATION BUDGET (₹ INR)
                      </label>
                      <input
                        type="number"
                        className="input-control"
                        value={formData.estimated_cost}
                        onChange={e => syncJsonPayloadFromForm({ estimated_cost: Number(e.target.value) })}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', fontWeight: 700, marginBottom: 4 }}>
                        WORKFLOW STATUS
                      </label>
                      <select
                        className="input-control"
                        value={formData.status}
                        onChange={e => syncJsonPayloadFromForm({ status: e.target.value })}
                      >
                        <option value="ASSIGNED">Assigned (Ready for Execution)</option>
                        <option value="WORK_IN_PROGRESS">Work In Progress</option>
                        <option value="VERIFIED">Verified & Closed</option>
                      </select>
                    </div>
                  </div>

                  {/* Statutory Code & Proof Criteria */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', fontWeight: 700, marginBottom: 4 }}>
                        STATUTORY REFERENCE STANDARD
                      </label>
                      <input
                        type="text"
                        className="input-control"
                        value={formData.statutory_code}
                        onChange={e => syncJsonPayloadFromForm({ statutory_code: e.target.value })}
                        placeholder="e.g. IRC:SP:40-2019 / IS 456-2000"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', fontWeight: 700, marginBottom: 4 }}>
                        REQUIRED VERIFICATION PROOF
                      </label>
                      <input
                        type="text"
                        className="input-control"
                        value={formData.proof_requirements}
                        onChange={e => syncJsonPayloadFromForm({ proof_requirements: e.target.value })}
                        placeholder="e.g. Cube compression test + 4K photo"
                      />
                    </div>
                  </div>

                  {/* Execution Notes */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', fontWeight: 700, marginBottom: 4 }}>
                      ENGINEERING DIRECTIVE NOTES & METHODOLOGY
                    </label>
                    <textarea
                      className="input-control"
                      rows={3}
                      value={formData.notes}
                      onChange={e => syncJsonPayloadFromForm({ notes: e.target.value })}
                      placeholder="Special statutory conditions, safety cordon requirements, or equipment access details..."
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: REMEDIATION PAYLOAD (JSON VIEWER & EDITOR) */}
              {activeModalTab === 'payload' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Enterprise SCADA/ERP Remediation Dispatch Payload (JSON format):
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPayload}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}
                    >
                      {copiedPayload ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                      <span>{copiedPayload ? 'Payload Copied!' : 'Copy JSON Payload'}</span>
                    </button>
                  </div>

                  <textarea
                    className="input-control"
                    rows={14}
                    value={formData.customPayloadJson}
                    onChange={e => setFormData(prev => ({ ...prev, customPayloadJson: e.target.value }))}
                    style={{
                      fontFamily: 'Consolas, Monaco, monospace',
                      fontSize: 12,
                      lineHeight: 1.6,
                      background: '#070b14',
                      color: '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: 10,
                      padding: 14
                    }}
                  />
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    &bull; This JSON payload is automatically synchronized whenever fields in the Specs tab are modified, or can be edited manually before dispatch.
                  </div>
                </div>
              )}

              {/* Modal Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '9px 18px', fontSize: 12.5 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '9px 24px', fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Send size={14} />
                  <span>{modalMode === 'create' ? 'Dispatch Remediation Directive' : 'Save Payload & Supervisor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: SUPERVISOR PHYSICAL SIGN-OFF & CERTIFICATION     */}
      {/* ========================================================= */}
      {showVerifyModal && verifyingAction && (
        <div className="modal-backdrop" onClick={() => setShowVerifyModal(false)} style={{ zIndex: 900 }}>
          <div 
            className="glass-card modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 560,
              width: '95%',
              padding: 24,
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: 16
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={24} color="#10b981" />
              </div>
              <div>
                <h3 style={{ fontSize: 17, color: '#fff', fontWeight: 800 }}>
                  Supervisor Statutory Verification Sign-Off
                </h3>
                <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                  Action ID: {verifyingAction.id} &bull; Defect: {verifyingAction.defect_title}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', fontWeight: 700, marginBottom: 4 }}>
                  CERTIFYING SUPERVISORY OFFICER
                </label>
                <select
                  className="input-control"
                  value={verifierName}
                  onChange={e => setVerifierName(e.target.value)}
                  style={{ fontSize: 13, fontWeight: 700 }}
                >
                  {supervisors.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 700 }}>
                    SUPERVISOR PHYSICAL VERIFICATION REMARKS
                  </label>
                  <VoiceDictationButton
                    currentValue={verificationNotes}
                    onTranscript={setVerificationNotes}
                    buttonText="Dictate"
                    size="sm"
                  />
                </div>
                <textarea
                  className="input-control"
                  rows={4}
                  value={verificationNotes}
                  onChange={e => setVerificationNotes(e.target.value)}
                  placeholder="Record verification methodology, coupon test results, and statutory compliance status..."
                  required
                />
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: 12, borderRadius: 10, fontSize: 11.5, color: '#a7f3d0' }}>
                &bull; Submitting this certification marks this directive as <strong>VERIFIED</strong> and automatically resolves the associated defect in the State Defect Ledger.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: 12 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitVerification}
                  className="btn btn-primary"
                  style={{
                    padding: '8px 20px',
                    fontSize: 12,
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>Certify & Mark Verified</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: CONTRACTOR REWORK PROOF SUBMISSION                */}
      {/* ========================================================= */}
      {showReworkModal && reworkAction && (
        <div className="modal-backdrop" onClick={() => setShowReworkModal(false)} style={{ zIndex: 900 }}>
          <div 
            className="glass-card modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 680,
              width: '95%',
              padding: 24,
              border: '1px solid rgba(168, 85, 247, 0.4)',
              borderRadius: 16,
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wrench size={24} color="#c084fc" />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, color: '#fff', fontWeight: 800, margin: 0 }}>
                    Contractor Remediation Proof Submission
                  </h3>
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Directive: {reworkAction.directive_title} &bull; Defect Ref: {reworkAction.defect_id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReworkModal(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 8px' }}
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmitRework} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Interactive Visual Comparison of Before Defect vs After Remediation Proof */}
              <BeforeAfterComparison
                beforePhoto={reworkAction.defect_reference?.photo_url || reworkAction.photo_url || 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?w=800'}
                afterPhoto={reworkForm.photo_url}
                beforeTitle="BEFORE: Flagged Non-Conformity"
                afterTitle="AFTER: Contractor Remedial Proof"
                defectId={reworkAction.defect_id}
                height={200}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', fontWeight: 700, marginBottom: 4 }}>
                    ASSIGNED CONTRACTOR / AGENCY
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    value={reworkForm.contractor_name}
                    onChange={e => setReworkForm(p => ({ ...p, contractor_name: e.target.value }))}
                    placeholder="e.g. Afcons Marine Civil Engineering"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', fontWeight: 700, marginBottom: 4 }}>
                    LAB TEST / QUALITY CLEARANCE REF
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    value={reworkForm.lab_reference}
                    onChange={e => setReworkForm(p => ({ ...p, lab_reference: e.target.value }))}
                    placeholder="e.g. LAB-TEST/2026/IS-456-CLEARED"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', fontWeight: 700, marginBottom: 4 }}>
                  PROOF OF REMEDIATION PHOTO EVIDENCE URL
                </label>
                <input
                  type="url"
                  className="input-control"
                  value={reworkForm.photo_url}
                  onChange={e => setReworkForm(p => ({ ...p, photo_url: e.target.value }))}
                  placeholder="https://..."
                  required
                />
                {/* Demo Preset Buttons */}
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', alignSelf: 'center' }}>Demo Presets:</span>
                  {[
                    { label: 'Epoxy Grout Seal', url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800' },
                    { label: 'Formwork Realigned', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?w=800' },
                    { label: 'Conduit Pressure-Tested', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800' }
                  ].map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setReworkForm(p => ({ ...p, photo_url: preset.url }))}
                      style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8', cursor: 'pointer' }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 700 }}>
                    CONTRACTOR COMPLETION NOTES & METHODOLOGY
                  </label>
                  <VoiceDictationButton
                    currentValue={reworkForm.notes}
                    onTranscript={(val) => setReworkForm(p => ({ ...p, notes: val }))}
                    buttonText="Dictate Notes"
                    size="sm"
                  />
                </div>
                <textarea
                  className="input-control"
                  rows={3}
                  value={reworkForm.notes}
                  onChange={e => setReworkForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Describe remedial work executed, batch mix ratios, spacer blocks installed, etc."
                  required
                />
              </div>

              <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: 12, borderRadius: 10, fontSize: 11.5, color: '#e9d5ff' }}>
                &bull; Submitting this proof updates the defect to <strong>REINSPECTION REQUIRED</strong> and immediately dispatches it to the Field Auditor's terminal for on-site physical sign-off.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setShowReworkModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: 12 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '8px 20px',
                    fontSize: 12,
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Send size={14} />
                  <span>Submit Proof & Request Reinspection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
