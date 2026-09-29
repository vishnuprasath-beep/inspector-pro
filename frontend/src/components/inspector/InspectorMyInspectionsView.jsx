import React, { useState } from 'react';
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  RotateCcw,
  MapPin,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  User,
  ExternalLink,
  Edit2
} from 'lucide-react';

export default function InspectorMyInspectionsView({
  zones = [],
  historyList = [],
  reinspectionsList = [],
  selectedSite,
  currentInspector,
  onSelectZone,
  onNavigate,
  onOpenReinspection
}) {
  const [activeTab, setActiveTab] = useState('ASSIGNED'); // 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'REINSPECTION'
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Assigned (Pending zones)
  const assignedZones = zones.filter(z => z.status !== 'INSPECTED');
  // 2. In progress (Zones that have partial draft or in active session)
  const inProgressZones = zones.filter(z => z.status === 'IN_PROGRESS');
  // 3. Completed (Inspected zones & history audits)
  const completedList = [
    ...zones.filter(z => z.status === 'INSPECTED').map(z => ({
      id: z.id,
      name: z.name,
      site_name: selectedSite?.name || 'Facility',
      floor_level: z.floor_level,
      date: z.last_inspector_visit || 'Recently Completed',
      status: 'COMPLETED',
      priority: z.priority,
      compliance_score: 95
    })),
    ...historyList.map(h => ({
      id: h.id,
      name: h.zone_name || h.title || 'Inspection Audit',
      site_name: h.site_name || selectedSite?.name || 'Facility',
      floor_level: h.floor_level || 'Zone Check',
      date: h.date ? new Date(h.date).toLocaleDateString() : 'Verified',
      status: 'COMPLETED',
      priority: h.zone_priority || 'NORMAL',
      compliance_score: h.compliance_score || 90
    }))
  ];
  // 4. Re-Inspections
  const reinspections = reinspectionsList;

  // Filter items based on active tab
  let currentItems = [];
  if (activeTab === 'ASSIGNED') currentItems = assignedZones;
  else if (activeTab === 'IN_PROGRESS') currentItems = inProgressZones.length > 0 ? inProgressZones : assignedZones.slice(0, 1);
  else if (activeTab === 'COMPLETED') currentItems = completedList;
  else if (activeTab === 'REINSPECTION') currentItems = reinspections;

  // Filter by search query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    currentItems = currentItems.filter(item => 
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.defect_title && item.defect_title.toLowerCase().includes(q)) ||
      (item.site_name && item.site_name.toLowerCase().includes(q))
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header & Filter Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
            My Inspections
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Hold-points and daily verification checks at {selectedSite?.name || 'Assigned Site'}.
          </p>
        </div>

        {/* 4 Tabs: Assigned | In Progress | Completed | Re-Inspection */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(16, 185, 129, 0.08)', padding: 4, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
          {[
            { key: 'ASSIGNED', label: 'Assigned', count: assignedZones.length },
            { key: 'IN_PROGRESS', label: 'In Progress', count: inProgressZones.length },
            { key: 'COMPLETED', label: 'Completed', count: completedList.length },
            { key: 'REINSPECTION', label: 'Re-Inspection', count: reinspections.length, badgeClass: 'badge-purple' }
          ].map(tab => {
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'var(--card-bg)' : 'transparent',
                  color: isSelected ? '#10b981' : 'var(--text-muted)',
                  boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tab.label}</span>
                <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 10, background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.12)', color: isSelected ? '#10b981' : 'var(--text-dim)', fontWeight: 700 }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input Bar */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by zone name, hold-point, or facility..."
          className="input-control"
          style={{ width: '100%', paddingLeft: 14, fontSize: 13, height: 40, borderRadius: 10 }}
        />
      </div>

      {/* Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {currentItems.length === 0 ? (
          <div
            className="glass-card"
            style={{
              padding: 36,
              textAlign: 'center',
              borderRadius: 14,
              border: '1px dashed var(--border-subtle)',
              color: 'var(--text-muted)'
            }}
          >
            <ClipboardCheck size={36} color="var(--text-dim)" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>
              No Inspections Found
            </h4>
            <p style={{ margin: '6px 0 0', fontSize: 12.5 }}>
              There are no inspections matching the "{activeTab.toLowerCase().replace('_', ' ')}" criteria.
            </p>
          </div>
        ) : (
          currentItems.map((item, idx) => {
            // Render Re-Inspection card
            if (activeTab === 'REINSPECTION') {
              return (
                <div
                  key={item.id || idx}
                  className="glass-card"
                  style={{
                    padding: '16px 18px',
                    borderRadius: 14,
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--card-bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="badge badge-purple" style={{ fontSize: 9.5 }}>RE-INSPECTION</span>
                        <strong style={{ fontSize: 15, color: 'var(--text-heading)' }}>
                          {item.defect_title || 'Defect Rectification Audit'}
                        </strong>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={12} />
                        <span>{item.site_name || selectedSite?.name} &bull; {item.zone_name || 'Hold Point'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`badge ${item.status === 'COMPLETED' ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: 10 }}>
                        {item.status === 'COMPLETED' ? 'Verified' : 'Requires Re-Inspection'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>
                      Assigned to: <strong style={{ color: 'var(--text-muted)' }}>{currentInspector?.name || 'Field Auditor'}</strong>
                    </div>

                    <button
                      onClick={() => {
                        if (onOpenReinspection) onOpenReinspection(item);
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: 12, fontWeight: 700, padding: '7px 16px', background: '#8b5cf6', borderColor: '#8b5cf6' }}
                    >
                      <RotateCcw size={14} />
                      <span>Execute Re-Inspection</span>
                    </button>
                  </div>
                </div>
              );
            }

            // Standard Zone / Inspection Card
            const isDone = item.status === 'INSPECTED' || item.status === 'COMPLETED';
            return (
              <div
                key={item.id || idx}
                className="glass-card"
                style={{
                  padding: '16px 18px',
                  borderRadius: 14,
                  border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
                  backgroundColor: isDone ? 'rgba(16, 185, 129, 0.04)' : 'var(--card-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 14
                }}
              >
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {item.code && (
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 6, background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
                        {item.code}
                      </span>
                    )}
                    <strong style={{ fontSize: 15, color: 'var(--text-heading)' }}>
                      {item.name}
                    </strong>
                    <span className={`badge ${isDone ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: 9.5 }}>
                      {isDone ? 'Completed' : 'Pending'}
                    </span>
                    {item.priority === 'CRITICAL' && (
                      <span className="badge badge-red" style={{ fontSize: 9.5 }}>HOLD POINT</span>
                    )}
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span>{item.floor_level || 'Ground Floor'}</span>
                    <span>&bull;</span>
                    <span>{item.frequency ? `Due: ${item.frequency}` : item.date || 'Scheduled Today'}</span>
                    <span>&bull;</span>
                    <span>Inspector: {currentInspector?.name || 'Vishnu Prasath'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => {
                      if (onSelectZone) onSelectZone(item);
                      if (onNavigate) onNavigate('start-inspection');
                    }}
                    className={`btn ${isDone ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '8px 16px',
                      borderRadius: 8,
                      background: isDone ? 'transparent' : '#10b981',
                      borderColor: '#10b981',
                      color: isDone ? '#10b981' : '#FFFFFF'
                    }}
                  >
                    <Edit2 size={13} />
                    <span>{isDone ? 'Re-Audit' : 'Start Inspection'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
