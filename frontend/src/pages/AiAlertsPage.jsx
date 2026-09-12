import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Sparkles, 
  Video, 
  Camera, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  UserCheck, 
  RotateCcw, 
  Search, 
  Filter,
  Eye,
  Check
} from 'lucide-react';
import ReinspectionExecutionModal from '../components/ReinspectionExecutionModal';

export default function AiAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [filterSource, setFilterSource] = useState('ALL'); // 'ALL' | 'cctv' | 'inspector'
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'OPEN' | 'REVIEWED' | 'RESOLVED'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignedInspector, setAssignedInspector] = useState('usr-insp-vp01');
  const [inspectors, setInspectors] = useState([]);

  useEffect(() => {
    loadAlerts();
    loadInspectors();
  }, []);

  const loadAlerts = async () => {
    const res = await api.getAiAlerts();
    if (res && res.success) {
      setAlerts(res.data || []);
    }
  };

  const loadInspectors = async () => {
    const res = await api.getInspectors();
    if (res && res.success) {
      setInspectors(res.data || []);
    }
  };

  const handleMarkReviewed = async (alertId) => {
    await api.updateAiAlert(alertId, { status: 'REVIEWED' });
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'REVIEWED' } : a));
  };

  const handleResolveAlert = async (alertId) => {
    await api.updateAiAlert(alertId, { status: 'RESOLVED' });
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'RESOLVED' } : a));
  };

  const handleAssignInspector = async () => {
    if (!selectedAlert) return;
    const inspObj = inspectors.find(i => i.id === assignedInspector) || { name: 'Vishnu Prasath', id: assignedInspector };
    
    // Create a re-inspection / verification request
    await api.createReinspectionRequest({
      defect_id: selectedAlert.id,
      title: `${selectedAlert.detection_type} (AI Detection)`,
      site_id: selectedAlert.site_id,
      site_name: selectedAlert.site_name,
      assigned_inspector_id: inspObj.id,
      assigned_inspector_name: inspObj.name,
      priority: 'HIGH',
      instructions: `Physical check required: ${selectedAlert.source === 'cctv' ? 'CCTV AI' : 'AI'} flagged "${selectedAlert.detection_type}" at ${selectedAlert.location}.`
    });

    await api.updateAiAlert(selectedAlert.id, { 
      status: 'ASSIGNED',
      assigned_inspector_id: inspObj.id,
      assigned_inspector_name: inspObj.name
    });

    setShowAssignModal(false);
    loadAlerts();
  };

  const filteredAlerts = alerts.filter(a => {
    if (filterSource !== 'ALL' && a.source !== filterSource) return false;
    if (filterStatus !== 'ALL' && a.status !== filterStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchText = `${a.detection_type} ${a.site_name} ${a.camera_name || ''} ${a.location || ''}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  return (
    <div style={{ padding: '20px 24px', fontFamily: "'Roboto', 'Inter', sans-serif" }}>
      {/* Page Title & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #A5D6A7' }}>
              <Sparkles size={20} color="#43A047" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                AI Alerts & Detection Ledger
              </h1>
              <p style={{ fontSize: 13, color: '#64748B', margin: '2px 0 0' }}>
                Autonomous detections from CCTV edge nodes and Field Inspector cameras
              </p>
            </div>
          </div>
        </div>

        {/* Source Filter Pills */}
        <div style={{ display: 'flex', gap: 6, backgroundColor: '#F1F5F9', padding: 4, borderRadius: 12 }}>
          {[
            { key: 'ALL', label: 'All Alerts' },
            { key: 'cctv', label: '📹 CCTV AI Alerts' },
            { key: 'inspector', label: '📱 Inspector Photo AI' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterSource(tab.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: 'none',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: filterSource === tab.key ? '#FFFFFF' : 'transparent',
                color: filterSource === tab.key ? '#1B5E20' : '#64748B',
                boxShadow: filterSource === tab.key ? '0 2px 4px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div 
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 20,
          backgroundColor: '#FFFFFF',
          padding: 14,
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 12 }} />
          <input
            type="text"
            placeholder="Search by defect, site, camera or location..."
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
          {['ALL', 'OPEN', 'REVIEWED', 'RESOLVED'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              style={{
                padding: '5px 10px',
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

      {/* Alerts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
        {filteredAlerts.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', color: '#64748B' }}>
            <Sparkles size={36} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>No AI Alerts Found</h3>
            <p style={{ fontSize: 13, margin: 0 }}>All sites and connected camera nodes are currently operating within normal parameters.</p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const isCctv = alert.source === 'cctv';
            return (
              <div
                key={alert.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  border: '1.5px solid #E2E8F0',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >
                {/* Card Top: Source Badge & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '4px 8px',
                      borderRadius: 6,
                      backgroundColor: isCctv ? '#EFF6FF' : '#F0FDF4',
                      color: isCctv ? '#1D4ED8' : '#15803D',
                      border: `1px solid ${isCctv ? '#BFDBFE' : '#BBF7D0'}`
                    }}
                  >
                    {isCctv ? <Video size={13} /> : <Camera size={13} />}
                    <span>{isCctv ? 'CCTV AI Alert' : 'Inspector Photo AI Result'}</span>
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 6,
                      backgroundColor: alert.status === 'RESOLVED' ? '#E8F5E9' : alert.status === 'REVIEWED' ? '#FEF9C3' : '#FEE2E2',
                      color: alert.status === 'RESOLVED' ? '#1B5E20' : alert.status === 'REVIEWED' ? '#854D0E' : '#991B1B'
                    }}
                  >
                    {alert.status}
                  </span>
                </div>

                {/* Main Defect Title */}
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
                    {alert.detection_type}
                  </h3>
                  <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={13} color="#94A3B8" />
                    <span>{alert.site_name} &bull; {alert.location}</span>
                  </div>
                  {alert.camera_name && (
                    <div style={{ fontSize: 11, color: '#3B82F6', marginTop: 2 }}>
                      Camera: <strong>{alert.camera_name}</strong>
                    </div>
                  )}
                </div>

                {/* Evidence Snapshot */}
                {alert.snapshot_url && (
                  <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid #CBD5E1' }}>
                    <img 
                      src={alert.snapshot_url} 
                      alt="AI Evidence" 
                      style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
                    />
                    <div 
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        left: 8,
                        backgroundColor: 'rgba(15, 23, 42, 0.85)',
                        color: '#FFFFFF',
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Sparkles size={12} color="#43A047" />
                      <span>YOLO Confidence: {(alert.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
                  <button
                    onClick={() => {
                      setSelectedAlert(alert);
                      setShowAssignModal(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      backgroundColor: '#43A047',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <UserCheck size={14} />
                    <span>Assign Inspector</span>
                  </button>

                  {alert.status === 'OPEN' && (
                    <button
                      onClick={() => handleMarkReviewed(alert.id)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#F8FAFC',
                        color: '#475569',
                        border: '1px solid #CBD5E1',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Mark Reviewed
                    </button>
                  )}

                  {alert.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#E8F5E9',
                        color: '#1B5E20',
                        border: '1px solid #A5D6A7',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Assign Inspector Modal */}
      {showAssignModal && selectedAlert && (
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
          onClick={() => setShowAssignModal(false)}
        >
          <div 
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 18,
              padding: 24,
              width: '100%',
              maxWidth: 440,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: '0 0 10px' }}>
              Assign Inspector for Physical Check
            </h3>
            <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px' }}>
              Dispatches a physical on-site re-inspection work order to the officer's mobile terminal.
            </p>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Select Field Inspector
              </label>
              <select
                value={assignedInspector}
                onChange={e => setAssignedInspector(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1.5px solid #CBD5E1',
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
              >
                {inspectors.map(insp => (
                  <option key={insp.id} value={insp.id}>
                    {insp.name} — {insp.assigned_site || insp.post || 'Lead Auditor'}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #CBD5E1', background: '#F8FAFC', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignInspector}
                style={{ flex: 2, padding: 10, borderRadius: 8, border: 'none', background: '#43A047', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >
                Dispatch Work Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
