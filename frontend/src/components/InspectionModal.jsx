import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  FileDown, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MapPin,
  Send
} from 'lucide-react';

export default function InspectionModal({ inspectionId, onClose, onRefresh }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function loadDetails() {
      setLoading(true);
      const res = await api.getInspectionById(inspectionId);
      if (res.success) {
        setData(res.data);
        setRemarks(res.data.supervisor_remarks || '');
      }
      setLoading(false);
    }
    if (inspectionId) loadDetails();
  }, [inspectionId]);

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    const res = await api.updateInspectionStatus(inspectionId, newStatus, remarks);
    setUpdating(false);
    if (res.success) {
      if (onRefresh) onRefresh();
      onClose();
    }
  };

  if (!inspectionId) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <span style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>
              INSPECTION AUDIT DOSSIER
            </span>
            <h3 style={{ fontSize: 18, color: '#fff', margin: '2px 0 0 0' }}>
              {data ? data.title : 'Loading Inspection...'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading audit details from database...
            </div>
          ) : data ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Top Banner Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 12, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Status</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 4 }}>{data.status}</div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 12, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Compliance Score</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: data.compliance_score >= 80 ? '#34d399' : '#f87171', marginTop: 4 }}>
                    {data.compliance_score}%
                  </div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 12, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Geofence Check</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: data.geofence_verified ? '#34d399' : '#fb923c', marginTop: 4 }}>
                    {data.geofence_verified ? 'VERIFIED ON-SITE' : 'OUTSIDE FENCE'}
                  </div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 12, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Lead Auditor</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginTop: 4 }}>
                    {data.inspector?.name || data.inspector_name || 'R. Saravanan (INSP-001)'}
                  </div>
                </div>
              </div>

              {/* Site Details */}
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-cyan)', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  <MapPin size={15} />
                  <span>{data.site?.name || data.site_name || 'Designated Infrastructure Facility'}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {data.site?.address || data.site_address || 'Verified Facility Coordinates'} • Geofence Radius: {data.site?.geo_fence_radius_meters || 800}m
                </div>
              </div>

              {/* Checklist Section */}
              <div>
                <h4 style={{ fontSize: 14, color: '#fff', marginBottom: 10 }}>Checklist Verifications</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(data.checklists || data.checklist_results || []).map((chk, idx) => {
                    const isPass = chk.status === 'PASS' || chk.passed === true;
                    return (
                      <div 
                        key={chk.id || idx} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: 'rgba(15, 23, 42, 0.4)',
                          borderRadius: 8,
                          border: '1px solid var(--border-subtle)',
                          fontSize: 12.5
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {isPass ? <CheckCircle2 size={16} color="#34d399" /> : <XCircle size={16} color="#f87171" />}
                          <div>
                            <strong style={{ color: '#fff' }}>{chk.section || chk.section_name || 'Checkpoint'}:</strong> {chk.text || chk.item_text || chk.notes || 'Verified statutory parameter'}
                          </div>
                        </div>
                        <span className={`badge ${isPass ? 'badge-success' : 'badge-critical'}`}>
                          {isPass ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Flagged Defects */}
              {((data.defects || data.detected_defects || []).length > 0) && (
                <div>
                  <h4 style={{ fontSize: 14, color: '#f87171', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={16} />
                    <span>Identified Defects ({(data.defects || data.detected_defects || []).length})</span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(data.defects || data.detected_defects || []).map((d, idx) => (
                      <div 
                        key={d.id || idx}
                        style={{
                          padding: 12,
                          borderRadius: 8,
                          background: 'rgba(244, 63, 94, 0.08)',
                          border: '1px solid rgba(244, 63, 94, 0.25)',
                          display: 'flex',
                          gap: 14
                        }}
                      >
                        {(d.photo_url || data.photo_evidence_url) && (
                          <img 
                            src={d.photo_url || data.photo_evidence_url} 
                            alt={d.title}
                            style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6 }} 
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <strong style={{ color: '#fff', fontSize: 13 }}>{d.title}</strong>
                            <span className={`badge badge-${(d.severity || 'CRITICAL').toLowerCase()}`}>{d.severity || 'CRITICAL'}</span>
                          </div>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0' }}>{d.description}</p>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Location: {d.location_details || 'Site wide'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Supervisor Remarks Box */}
              <div>
                <h4 style={{ fontSize: 14, color: '#fff', marginBottom: 6 }}>Supervisor Endorsement & Audit Remarks</h4>
                <textarea
                  className="input-control"
                  rows={3}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Enter supervisory notes, re-inspection requirements, or clearance instructions..."
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <a
            href={api.getPdfReportUrl(inspectionId)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <FileDown size={16} />
            <span>Official PDF Report</span>
          </a>

          {user && (user.role === 'ADMIN' || user.role === 'SUPERVISOR' || user.role === 'DIRECTOR') && (
            <>
              <button 
                onClick={() => handleStatusUpdate('REJECTED')} 
                className="btn btn-danger"
                disabled={updating}
              >
                Reject Audit
              </button>
              <button 
                onClick={() => handleStatusUpdate('APPROVED')} 
                className="btn btn-primary"
                disabled={updating}
              >
                Approve & Sign Off
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
