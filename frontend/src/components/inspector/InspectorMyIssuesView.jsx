import React, { useState } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  History,
  Image as ImageIcon
} from 'lucide-react';

export default function InspectorMyIssuesView({
  allDefects = [],
  selectedSite,
  onOpenReinspection,
  onViewTimeline
}) {
  const [activeFilter, setActiveFilter] = useState('OPEN'); // 'OPEN' | 'HIGH' | 'RESOLVED' | 'REINSPECT'
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Open Issues
  const openIssues = allDefects.filter(d => d.status !== 'RESOLVED');
  // 2. High Priority
  const highPriority = allDefects.filter(d => (d.severity === 'CRITICAL' || d.severity === 'HIGH') && d.status !== 'RESOLVED');
  // 3. Resolved
  const resolvedIssues = allDefects.filter(d => d.status === 'RESOLVED');
  // 4. Re-Inspection Required
  const reinspectRequired = allDefects.filter(d => d.requires_reinspection || d.status === 'REINSPECTION_PENDING' || d.severity === 'CRITICAL');

  let currentIssues = [];
  if (activeFilter === 'OPEN') currentIssues = openIssues;
  else if (activeFilter === 'HIGH') currentIssues = highPriority;
  else if (activeFilter === 'RESOLVED') currentIssues = resolvedIssues;
  else if (activeFilter === 'REINSPECT') currentIssues = reinspectRequired;

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    currentIssues = currentIssues.filter(i =>
      (i.title && i.title.toLowerCase().includes(q)) ||
      (i.description && i.description.toLowerCase().includes(q)) ||
      (i.location_details && i.location_details.toLowerCase().includes(q))
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header & Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
            My Issues & Corrective Actions
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Reported deficiencies, structural hazards, and statutory hold-point rectifications.
          </p>
        </div>

        {/* 4 Tabs: Open | High Priority | Resolved | Re-Inspection */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(239, 68, 68, 0.06)', padding: 4, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
          {[
            { key: 'OPEN', label: 'Open Issues', count: openIssues.length },
            { key: 'HIGH', label: 'High Priority', count: highPriority.length, badgeClass: 'badge-red' },
            { key: 'RESOLVED', label: 'Resolved', count: resolvedIssues.length },
            { key: 'REINSPECT', label: 'Re-Inspect', count: reinspectRequired.length, badgeClass: 'badge-purple' }
          ].map(tab => {
            const isSelected = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'var(--card-bg)' : 'transparent',
                  color: isSelected ? '#ef4444' : 'var(--text-muted)',
                  boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>{tab.label}</span>
                <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 10, background: isSelected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(100, 116, 139, 0.12)', color: isSelected ? '#ef4444' : 'var(--text-dim)', fontWeight: 700 }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Filter by defect title, description, or zone location..."
        className="input-control"
        style={{ width: '100%', fontSize: 13, height: 40, borderRadius: 10 }}
      />

      {/* Issues List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {currentIssues.length === 0 ? (
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
            <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>
              No Issues Matching Criteria
            </h4>
            <p style={{ margin: '6px 0 0', fontSize: 12.5 }}>
              All items in the "{activeFilter.toLowerCase()}" category are currently cleared.
            </p>
          </div>
        ) : (
          currentIssues.map((issue, idx) => {
            const isCritical = issue.severity === 'CRITICAL';
            const isHigh = issue.severity === 'HIGH';
            const isResolved = issue.status === 'RESOLVED';

            return (
              <div
                key={issue.id || idx}
                className="glass-card"
                style={{
                  padding: '16px 18px',
                  borderRadius: 14,
                  border: `1px solid ${isCritical ? 'rgba(239, 68, 68, 0.4)' : isHigh ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-subtle)'}`,
                  backgroundColor: isCritical ? 'rgba(239, 68, 68, 0.03)' : 'var(--card-bg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span className={`badge ${isCritical ? 'badge-red' : isHigh ? 'badge-amber' : 'badge-green'}`} style={{ fontSize: 9.5 }}>
                        {issue.severity || 'HIGH'}
                      </span>
                      <strong style={{ fontSize: 15, color: 'var(--text-heading)' }}>
                        {issue.title}
                      </strong>
                      <span className="badge badge-purple" style={{ fontSize: 9.5 }}>
                        {issue.category || 'STRUCTURAL'}
                      </span>
                    </div>

                    <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.4 }}>
                      {issue.description}
                    </p>

                    <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span><MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {issue.location_details || selectedSite?.name}</span>
                      <span>&bull;</span>
                      <span>Reported: {issue.date ? new Date(issue.date).toLocaleDateString() : 'Active'}</span>
                      <span>&bull;</span>
                      <span>Status: <strong style={{ color: isResolved ? '#10b981' : '#ef4444' }}>{issue.status}</strong></span>
                    </div>
                  </div>

                  {issue.photo_url && (
                    <img
                      src={issue.photo_url}
                      alt="Defect Evidence"
                      style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                    />
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                  {onViewTimeline && (
                    <button
                      onClick={() => onViewTimeline(issue)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <History size={13} />
                      <span>Audit History</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (onOpenReinspection) onOpenReinspection(issue);
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: 11.5, fontWeight: 700, padding: '6px 14px', background: '#8b5cf6', borderColor: '#8b5cf6', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <RotateCcw size={13} />
                    <span>Re-Inspect Defect</span>
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
