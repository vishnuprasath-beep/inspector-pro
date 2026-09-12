import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Clock, 
  MapPin, 
  UserCheck, 
  History, 
  Camera, 
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import ReinspectionExecutionModal from '../components/ReinspectionExecutionModal';
import IssueHistoryTimelineModal from '../components/IssueHistoryTimelineModal';

export default function ReinspectionsPage() {
  const [reinspections, setReinspections] = useState([]);
  const [defects, setDefects] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'ASSIGNED' | 'COMPLETED'
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    defect_id: '',
    assigned_inspector_id: 'usr-insp-vp01',
    priority: 'HIGH',
    deadline: '',
    instructions: 'Verify physical remedial work against specification tolerances.'
  });

  const [activeExecuteModal, setActiveExecuteModal] = useState(null);
  const [activeHistoryData, setActiveHistoryData] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const rRes = await api.getReinspections();
    if (rRes && rRes.success) setReinspections(rRes.data || []);

    const dRes = await api.getDefects();
    if (dRes && dRes.success) setDefects(dRes.data || []);

    const iRes = await api.getInspectors();
    if (iRes && iRes.success) setInspectors(iRes.data || []);
  };

  const handleOpenHistory = async (defectId) => {
    const res = await api.getIssueHistory(defectId);
    if (res && res.success) {
      setActiveHistoryData(res.data);
      setIsHistoryModalOpen(true);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!createForm.defect_id) {
      alert('Please select a defect / issue to re-inspect.');
      return;
    }

    const insp = inspectors.find(i => i.id === createForm.assigned_inspector_id) || { name: 'Vishnu Prasath', id: createForm.assigned_inspector_id };

    await api.createReinspectionRequest({
      defect_id: createForm.defect_id,
      assigned_inspector_id: insp.id,
      assigned_inspector_name: insp.name,
      priority: createForm.priority,
      instructions: createForm.instructions,
      deadline: createForm.deadline || new Date(Date.now() + 86400000 * 2).toISOString()
    });

    setIsCreateModalOpen(false);
    loadData();
  };

  const filtered = reinspections.filter(r => {
    if (filterStatus !== 'ALL' && r.status.toUpperCase() !== filterStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match = `${r.original_defect?.title || ''} ${r.site_name || ''} ${r.assigned_inspector_name || ''}`.toLowerCase();
      if (!match.includes(q)) return false;
    }
    return true;
  });

  const totalCount = reinspections.length;
  const completedCount = reinspections.filter(r => r.status === 'COMPLETED').length;
  const fixedCount = reinspections.filter(r => r.result === 'FIXED').length;
  const pendingCount = reinspections.filter(r => r.status === 'ASSIGNED').length;

  return (
    <div style={{ padding: '20px 24px', fontFamily: "'Roboto', 'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #A5D6A7' }}>
              <RotateCcw size={22} color="#43A047" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                Re-Inspections Management
              </h1>
              <p style={{ fontSize: 13, color: '#64748B', margin: '2px 0 0' }}>
                Track remedial verifications, assign inspectors, and preserve immutable audit histories
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            if (defects.length > 0 && !createForm.defect_id) {
              setCreateForm(prev => ({ ...prev, defect_id: defects[0].id }));
            }
            setIsCreateModalOpen(true);
          }}
          style={{
            padding: '10px 18px',
            backgroundColor: '#43A047',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 12px rgba(67, 160, 71, 0.3)'
          }}
        >
          <Plus size={16} />
          <span>Create Re-Inspection Request</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: '16px 20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>TOTAL RE-INSPECTIONS</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', margin: '4px 0' }}>{totalCount}</div>
          <div style={{ fontSize: 11, color: '#10B981' }}>Linked to historical issues</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: '16px 20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>VERIFIED & CLOSED</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#16A34A', margin: '4px 0' }}>{fixedCount}</div>
          <div style={{ fontSize: 11, color: '#64748B' }}>Passed physical audit</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: '16px 20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>PENDING FIELD CHECK</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#EAB308', margin: '4px 0' }}>{pendingCount}</div>
          <div style={{ fontSize: 11, color: '#CA8A04' }}>Assigned to field officers</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: '16px 20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>TOTAL COMPLETED</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0284C7', margin: '4px 0' }}>{completedCount}</div>
          <div style={{ fontSize: 11, color: '#64748B' }}>Evidence photos archived</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div 
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 18,
          backgroundColor: '#FFFFFF',
          padding: 14,
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 12 }} />
          <input
            type="text"
            placeholder="Search re-inspections by defect, site, or inspector..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              fontSize: 13,
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Status:</span>
          {['ALL', 'ASSIGNED', 'COMPLETED'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: filterStatus === st ? '1.5px solid #43A047' : '1px solid #CBD5E1',
                fontSize: 12,
                fontWeight: 700,
                backgroundColor: filterStatus === st ? '#E8F5E9' : '#FFFFFF',
                color: filterStatus === st ? '#1B5E20' : '#64748B',
                cursor: 'pointer'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Re-Inspections Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', color: '#64748B' }}>
            <RotateCcw size={36} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>No Re-Inspections Match Filter</h3>
            <p style={{ fontSize: 13, margin: 0 }}>Click "+ Create Re-Inspection Request" to schedule a physical verification.</p>
          </div>
        ) : (
          filtered.map(item => {
            const isDone = item.status === 'COMPLETED';
            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  border: '1.5px solid #E2E8F0',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >
                {/* Top Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#43A047', backgroundColor: '#E8F5E9', padding: '2px 8px', borderRadius: 6 }}>
                        {item.id}
                      </span>
                      <span style={{ fontSize: 11, color: '#64748B' }}>
                        Linked Issue: <strong>{item.defect_id}</strong>
                      </span>
                      <span 
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: 4,
                          backgroundColor: item.priority === 'CRITICAL' ? '#FEE2E2' : '#EFF6FF',
                          color: item.priority === 'CRITICAL' ? '#DC2626' : '#2563EB'
                        }}
                      >
                        {item.priority}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: '6px 0 2px' }}>
                      {item.original_defect?.title || 'Defect Verification'}
                    </h3>

                    <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={13} color="#94A3B8" />
                      <span>{item.site_name} &bull; {item.original_defect?.location_details || 'Site Zone'}</span>
                    </div>
                  </div>

                  {/* Status & Outcome Badges */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {item.result && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: 8,
                          backgroundColor: item.result === 'FIXED' ? '#E8F5E9' : item.result === 'STILL_OPEN' ? '#FEF9C3' : '#FEE2E2',
                          color: item.result === 'FIXED' ? '#1B5E20' : item.result === 'STILL_OPEN' ? '#854D0E' : '#991B1B'
                        }}
                      >
                        {item.result === 'FIXED' ? '✓ Fixed' : item.result === 'STILL_OPEN' ? '● Still Open' : '! Needs More Work'}
                      </span>
                    )}

                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 8,
                        backgroundColor: isDone ? '#F1F5F9' : '#FEF9C3',
                        color: isDone ? '#475569' : '#854D0E'
                      }}
                    >
                      {isDone ? 'Completed' : 'Pending Verification'}
                    </span>
                  </div>
                </div>

                {/* Instructions & Notes */}
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, fontSize: 13, color: '#334155' }}>
                  <div style={{ marginBottom: 4 }}>
                    <strong>Instructions:</strong> {item.instructions}
                  </div>
                  {item.notes && (
                    <div style={{ marginTop: 6, color: '#0F172A' }}>
                      <strong>Auditor Report:</strong> {item.notes}
                    </div>
                  )}
                  <div style={{ marginTop: 6, fontSize: 11, color: '#64748B' }}>
                    Assigned Inspector: <strong>{item.assigned_inspector_name}</strong> &bull; Deadline: {new Date(item.deadline).toLocaleDateString()}
                  </div>
                </div>

                {/* Evidence Comparison: Original Defect vs Re-Inspection Photo */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {/* Original Defect Photo */}
                  <div style={{ borderRadius: 10, border: '1px solid #CBD5E1', padding: 8, backgroundColor: '#FFFFFF' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Camera size={12} />
                      <span>Original Defect Photo</span>
                    </div>
                    {item.original_defect?.photo_url ? (
                      <img 
                        src={item.original_defect.photo_url} 
                        alt="Original Defect" 
                        style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 6 }} 
                      />
                    ) : (
                      <div style={{ height: 110, backgroundColor: '#F1F5F9', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 11 }}>
                        No initial photo
                      </div>
                    )}
                  </div>

                  {/* New Re-Inspection Evidence Photo */}
                  <div style={{ borderRadius: 10, border: item.new_evidence_photo ? '1.5px solid #43A047' : '1px dashed #CBD5E1', padding: 8, backgroundColor: item.new_evidence_photo ? '#F0FDF4' : '#FFFFFF' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: item.new_evidence_photo ? '#15803D' : '#64748B', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={12} color={item.new_evidence_photo ? '#15803D' : '#94A3B8'} />
                      <span>New Re-Inspection Photo</span>
                    </div>
                    {item.new_evidence_photo ? (
                      <img 
                        src={item.new_evidence_photo} 
                        alt="New Evidence" 
                        style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 6 }} 
                      />
                    ) : (
                      <div style={{ height: 110, backgroundColor: '#F8FAFC', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 11 }}>
                        Awaiting on-site photo
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
                  <button
                    onClick={() => handleOpenHistory(item.defect_id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'transparent',
                      color: '#43A047',
                      border: '1px solid #A5D6A7',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <History size={14} />
                    <span>View Full Issue History</span>
                  </button>

                  {!isDone && (
                    <button
                      onClick={() => setActiveExecuteModal(item)}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: '#43A047',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <span>Conduct Verification</span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Re-Inspection Request Modal */}
      {isCreateModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div 
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 18,
              padding: 24,
              width: '100%',
              maxWidth: 480,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: '0 0 6px' }}>
              Create Re-Inspection Request
            </h3>
            <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px' }}>
              Link a follow-up verification audit to an existing defect without modifying the original record.
            </p>

            <form onSubmit={handleCreateRequest} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Target Defect / Issue
                </label>
                <select
                  value={createForm.defect_id}
                  onChange={e => setCreateForm(prev => ({ ...prev, defect_id: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13 }}
                  required
                >
                  {defects.map(d => (
                    <option key={d.id} value={d.id}>
                      [{d.id}] {d.title} ({d.site_name || 'Site'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Assign Field Inspector
                </label>
                <select
                  value={createForm.assigned_inspector_id}
                  onChange={e => setCreateForm(prev => ({ ...prev, assigned_inspector_id: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13 }}
                >
                  {inspectors.map(insp => (
                    <option key={insp.id} value={insp.id}>
                      {insp.name} — {insp.assigned_site || 'Lead Auditor'}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Priority
                  </label>
                  <select
                    value={createForm.priority}
                    onChange={e => setCreateForm(prev => ({ ...prev, priority: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13 }}
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Target Deadline
                  </label>
                  <input
                    type="date"
                    value={createForm.deadline}
                    onChange={e => setCreateForm(prev => ({ ...prev, deadline: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Verification Instructions for Auditor
                </label>
                <textarea
                  rows={2}
                  value={createForm.instructions}
                  onChange={e => setCreateForm(prev => ({ ...prev, instructions: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #CBD5E1', background: '#F8FAFC', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 2, padding: 10, borderRadius: 8, border: 'none', background: '#43A047', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Schedule Re-Inspection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Execute Modal */}
      {activeExecuteModal && (
        <ReinspectionExecutionModal
          isOpen={!!activeExecuteModal}
          reinspection={activeExecuteModal}
          onClose={() => setActiveExecuteModal(null)}
          onSubmitSuccess={async (payload) => {
            await api.submitReinspection(payload.reinspectionId, payload);
            setActiveExecuteModal(null);
            loadData();
          }}
        />
      )}

      {/* Full History Timeline Modal */}
      {isHistoryModalOpen && activeHistoryData && (
        <IssueHistoryTimelineModal
          isOpen={isHistoryModalOpen}
          historyData={activeHistoryData}
          onClose={() => setIsHistoryModalOpen(false)}
        />
      )}
    </div>
  );
}
