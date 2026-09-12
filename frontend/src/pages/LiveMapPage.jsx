import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import LiveMapComponent from '../components/LiveMapComponent';
import { MapPin, Shield, Users, Radio, Navigation, CheckCircle, Sliders, Battery, Building2, AlertTriangle, Flame, Layers, Eye } from 'lucide-react';

export default function LiveMapPage({ initialFocusedInspector = null, onClearFocus = null }) {
  const [sites, setSites] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [defects, setDefects] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [focusedInspector, setFocusedInspector] = useState(initialFocusedInspector);
  const [sidebarTab, setSidebarTab] = useState(initialFocusedInspector ? 'inspectors' : 'sites');
  const [loading, setLoading] = useState(true);

  // Layer Toggles
  const [showSites, setShowSites] = useState(true);
  const [showInspectors, setShowInspectors] = useState(true);
  const [showDefects, setShowDefects] = useState(true);
  const [showDensity, setShowDensity] = useState(false);

  useEffect(() => {
    async function loadMapData() {
      setLoading(true);
      const [sRes, iRes, dRes] = await Promise.all([
        api.getSites(), 
        api.getInspectors(),
        api.getDefects()
      ]);
      if (sRes.success) {
        setSites(sRes.data);
        if (sRes.data.length > 0 && !selectedSite) setSelectedSite(sRes.data[0]);
      }
      if (iRes.success) {
        setInspectors(iRes.data);
        if (initialFocusedInspector) {
          const matched = iRes.data.find(
            i => i.id === initialFocusedInspector.id || i.name === initialFocusedInspector.name
          );
          if (matched) {
            setFocusedInspector(matched);
            setSidebarTab('inspectors');
          }
        }
      }
      if (dRes.success) {
        setDefects(dRes.data || []);
      }
      setLoading(false);
    }
    loadMapData();
  }, [initialFocusedInspector]);

  // Handle clicking on an inspector to focus their duty on map
  const handleSelectInspector = (insp) => {
    setFocusedInspector(insp);
    setSidebarTab('inspectors');

    const matchingSite = sites.find(s => 
      s.id === insp.assigned_site_id || 
      s.name === insp.assigned_site_name
    );
    if (matchingSite) {
      setSelectedSite(matchingSite);
    }
  };

  const handleClearInspectorFocus = () => {
    setFocusedInspector(null);
    if (onClearFocus) onClearFocus();
  };

  return (
    <div className="page-body">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, color: '#fff' }}>Geospatial Geofencing & Telemetry Center</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Visualizing strategic infrastructure perimeters with live field auditor GNSS telemetry, active defect pins, and density clusters.
          </p>
        </div>

        {/* Map Layer Controls Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowSites(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              border: showSites ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
              background: showSites ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)',
              color: showSites ? '#38bdf8' : '#94a3b8'
            }}
          >
            <Building2 size={13} />
            <span>Sites ({sites.length})</span>
          </button>

          <button
            onClick={() => setShowInspectors(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              border: showInspectors ? '1px solid #10b981' : '1px solid var(--border-subtle)',
              background: showInspectors ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.6)',
              color: showInspectors ? '#34d399' : '#94a3b8'
            }}
          >
            <Radio size={13} />
            <span>Officers ({inspectors.length})</span>
          </button>

          <button
            onClick={() => setShowDefects(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              border: showDefects ? '1px solid #f97316' : '1px solid var(--border-subtle)',
              background: showDefects ? 'rgba(249, 115, 22, 0.15)' : 'rgba(15, 23, 42, 0.6)',
              color: showDefects ? '#fb923c' : '#94a3b8'
            }}
          >
            <AlertTriangle size={13} />
            <span>Issues ({defects.length})</span>
          </button>

          <button
            onClick={() => setShowDensity(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              border: showDensity ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
              background: showDensity ? 'rgba(239, 68, 68, 0.2)' : 'rgba(15, 23, 42, 0.6)',
              color: showDensity ? '#f87171' : '#94a3b8'
            }}
          >
            <Flame size={13} />
            <span>{showDensity ? '🔥 Density ON' : 'Density Heatmap'}</span>
          </button>

          {focusedInspector && (
            <button
              onClick={handleClearInspectorFocus}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: 11, padding: '6px 12px' }}
            >
              Reset to Full Overview
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 370px', gap: 20 }}>
        {/* Full Interactive Map */}
        <div className="glass-card" style={{ padding: 16 }}>
          <LiveMapComponent 
            sites={sites} 
            inspectors={inspectors} 
            defects={defects}
            showSites={showSites}
            showInspectors={showInspectors}
            showDefects={showDefects}
            showDensity={showDensity}
            height="670px" 
            focusedDestination={selectedSite}
            onSelectDestination={setSelectedSite}
            focusedInspector={focusedInspector}
            onSelectInspector={handleSelectInspector}
            onClearFocus={handleClearInspectorFocus}
          />
        </div>

        {/* Dynamic Sidebar with 3 Tabs: Active Inspectors, Strategic Facilities, Open Issues */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Tab Navigation Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.1fr', background: 'rgba(15, 23, 42, 0.6)', padding: 4, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setSidebarTab('inspectors')}
              style={{
                padding: '8px 6px',
                borderRadius: 7,
                border: 'none',
                background: sidebarTab === 'inspectors' ? 'var(--accent-cyan)' : 'transparent',
                color: sidebarTab === 'inspectors' ? '#090d16' : '#94a3b8',
                fontWeight: 700,
                fontSize: 11,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                transition: 'all 0.15s ease'
              }}
            >
              <Users size={13} />
              <span>Roster ({inspectors.length})</span>
            </button>

            <button
              onClick={() => setSidebarTab('sites')}
              style={{
                padding: '8px 6px',
                borderRadius: 7,
                border: 'none',
                background: sidebarTab === 'sites' ? 'var(--accent-cyan)' : 'transparent',
                color: sidebarTab === 'sites' ? '#090d16' : '#94a3b8',
                fontWeight: 700,
                fontSize: 11,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                transition: 'all 0.15s ease'
              }}
            >
              <Building2 size={13} />
              <span>Sites ({sites.length})</span>
            </button>

            <button
              onClick={() => setSidebarTab('issues')}
              style={{
                padding: '8px 6px',
                borderRadius: 7,
                border: 'none',
                background: sidebarTab === 'issues' ? 'var(--accent-cyan)' : 'transparent',
                color: sidebarTab === 'issues' ? '#090d16' : '#94a3b8',
                fontWeight: 700,
                fontSize: 11,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                transition: 'all 0.15s ease'
              }}
            >
              <AlertTriangle size={13} />
              <span>Issues ({defects.length})</span>
            </button>
          </div>

          {/* TAB 1: FIELD INSPECTORS ON DUTY */}
          {sidebarTab === 'inspectors' && (
            <div className="glass-card" style={{ padding: 16, flex: 1, overflowY: 'auto', maxHeight: '600px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: 12.5, color: 'var(--text-heading)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                  Active Field Inspectors
                </h4>
                <span style={{ fontSize: 10, color: 'var(--accent-cyan)', fontWeight: 700 }}>
                  Tap "Duty on Map" to vector
                </span>
              </div>

              {inspectors.map(insp => {
                const isSelected = focusedInspector && (focusedInspector.id === insp.id || focusedInspector.inspector_id === insp.id);
                const isSim = Boolean(insp.is_simulated);
                return (
                  <div
                    key={insp.id || insp.inspector_id}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      background: isSelected 
                        ? (isSim ? 'rgba(168, 85, 247, 0.18)' : 'rgba(56, 189, 248, 0.18)') 
                        : 'rgba(15, 23, 42, 0.6)',
                      border: `1.5px solid ${isSelected 
                        ? (isSim ? '#a855f7' : 'var(--accent-cyan)') 
                        : 'var(--border-subtle)'}`,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <img
                        src={insp.avatar_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"}
                        alt={insp.name}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          border: isSim ? '2px solid #a855f7' : '2px solid #10b981',
                          objectFit: 'cover',
                          flexShrink: 0
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: 'var(--text-heading)', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {insp.name}
                          </strong>
                          <span style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 4,
                            background: isSim ? 'rgba(168, 85, 247, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                            color: isSim ? '#d8b4fe' : '#34d399'
                          }}>
                            {isSim ? '⚡ SIMULATED' : 'LIVE GNSS'}
                          </span>
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--accent-cyan)', fontWeight: 600 }}>
                          {insp.badge_number || insp.employee_code || 'INSP-2024'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
                          Assigned: <strong style={{ color: '#cbd5e1' }}>{insp.assigned_site_name || 'Designated Facility'}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: 10.5, color: '#94a3b8' }}>
                        Battery: <strong style={{ color: '#34d399' }}>{insp.battery_level || 90}%</strong>
                      </div>

                      <button
                        onClick={() => handleSelectInspector(insp)}
                        style={{
                          background: isSelected 
                            ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' 
                            : 'rgba(56, 189, 248, 0.12)',
                          border: '1px solid #38bdf8',
                          color: isSelected ? '#fff' : '#38bdf8',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                      >
                        <Navigation size={12} />
                        <span>{isSelected ? '✓ Tracking' : 'Duty on Map'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: STRATEGIC FACILITIES */}
          {sidebarTab === 'sites' && (
            <>
              {/* Selected Site Details */}
              {selectedSite && (
                <div className="glass-card" style={{ padding: 18, border: '1px solid var(--border-focus)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-cyan)', fontSize: 11, fontWeight: 700 }}>
                    <MapPin size={15} />
                    <span>SELECTED FACILITY</span>
                  </div>
                  <h3 style={{ fontSize: 16, color: 'var(--text-heading)', margin: '4px 0' }}>{selectedSite.name}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{selectedSite.address}</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Geofence Radius</span>
                      <strong style={{ color: 'var(--text-heading)' }}>
                        {selectedSite.geo_fence_radius_meters ?? selectedSite.geofence_radius ?? 650} meters
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Coordinates</span>
                      <strong style={{ color: 'var(--accent-cyan)' }}>
                        {(selectedSite.geo_fence_lat ?? selectedSite.latitude ?? 28.6289).toFixed(4)}° N, {(selectedSite.geo_fence_lng ?? selectedSite.longitude ?? 77.2219).toFixed(4)}° E
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Open Defects</span>
                      <strong style={{ color: (selectedSite.open_defects_count || 0) > 0 ? '#f87171' : '#34d399' }}>
                        {selectedSite.open_defects_count || 0} defects
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Zonal Supervisor</span>
                      <strong style={{ color: 'var(--text-heading)' }}>
                        {selectedSite.supervisor_name || 'M. Muthukumar'}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick List of Strategic Sites */}
              <div className="glass-card" style={{ padding: 18, flex: 1, overflowY: 'auto' }}>
                <h4 style={{ fontSize: 13, color: 'var(--text-heading)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Strategic Assets ({sites.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sites.map(s => {
                    const isSelected = selectedSite && selectedSite.id === s.id;
                    const radius = s.geo_fence_radius_meters ?? s.geofence_radius ?? 600;
                    const locationCity = s.city || (s.address ? s.address.split(',')[0] : 'Strategic Site');
                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelectedSite(s)}
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.5)',
                          border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: 'var(--text-heading)', fontSize: 12.5 }}>{s.name}</strong>
                          <span style={{ fontSize: 9, color: 'var(--accent-cyan)', fontWeight: 700 }}>{s.code || 'FACILITY'}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                          {locationCity} • Radius: {radius}m
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* TAB 3: ACTIVE DEFECT ISSUES */}
          {sidebarTab === 'issues' && (
            <div className="glass-card" style={{ padding: 16, flex: 1, overflowY: 'auto', maxHeight: '600px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: 12.5, color: 'var(--text-heading)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                  Active Issues ({defects.length})
                </h4>
                <span style={{ fontSize: 10, color: '#f97316', fontWeight: 700 }}>
                  Color-coded Pins
                </span>
              </div>

              {defects.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                  Zero active issues recorded. All monitored infrastructure compliant.
                </div>
              ) : (
                defects.map((d, idx) => {
                  const severity = (d.severity || 'MEDIUM').toUpperCase();
                  const isCrit = severity === 'CRITICAL';
                  const isHigh = severity === 'HIGH';
                  const badgeBg = isCrit ? 'rgba(239, 68, 68, 0.2)' : isHigh ? 'rgba(249, 115, 22, 0.2)' : 'rgba(245, 158, 11, 0.2)';
                  const badgeColor = isCrit ? '#f87171' : isHigh ? '#fb923c' : '#fbbf24';

                  return (
                    <div
                      key={d.id || idx}
                      onClick={() => {
                        const matchedSite = sites.find(s => s.id === d.site_id || s.name === d.site_name);
                        if (matchedSite) setSelectedSite(matchedSite);
                      }}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: `1px solid ${isCrit ? '#ef444450' : 'var(--border-subtle)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: badgeBg, color: badgeColor }}>
                          {severity}
                        </span>
                        {d.is_recurring && (
                          <span style={{ fontSize: 9.5, fontWeight: 800, color: '#f87171', background: 'rgba(239, 68, 68, 0.15)', padding: '2px 6px', borderRadius: 4 }}>
                            🔁 RECURRING (x{d.recurrence_count || 2})
                          </span>
                        )}
                        <span style={{ fontSize: 9.5, color: '#38bdf8', fontWeight: 600 }}>{d.site_name || 'Strategic Site'}</span>
                      </div>

                      <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', marginBottom: 3 }}>
                        {d.title}
                      </div>

                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                        {d.location_details || d.site_name}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--border-subtle)', fontSize: 10.5 }}>
                        <span style={{ color: '#94a3b8' }}>Status: <strong style={{ color: '#ffffff' }}>{d.status || 'OPEN'}</strong></span>
                        <span style={{ color: '#38bdf8', fontWeight: 700 }}>Focus on Map →</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
