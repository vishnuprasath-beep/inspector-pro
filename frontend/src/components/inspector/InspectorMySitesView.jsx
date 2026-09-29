import React, { useState } from 'react';
import {
  MapPin,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Compass,
  Navigation,
  ExternalLink,
  ShieldCheck,
  Radio
} from 'lucide-react';
import LiveMapComponent from '../LiveMapComponent';

export default function InspectorMySitesView({
  sites = [],
  selectedSite,
  onSelectSite,
  zones = [],
  allDefects = [],
  userCoords
}) {
  const [viewMode, setViewMode] = useState('LIST'); // 'LIST' | 'MAP'
  const [focusedDestination, setFocusedDestination] = useState(selectedSite);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
            My Sites & Facilities
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Infrastructure facilities and geofenced inspection jurisdictions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 4, background: 'rgba(16, 185, 129, 0.08)', padding: 3, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setViewMode('LIST')}
            style={{
              padding: '5px 14px',
              borderRadius: 8,
              border: 'none',
              fontSize: 12,
              fontWeight: viewMode === 'LIST' ? 800 : 600,
              cursor: 'pointer',
              background: viewMode === 'LIST' ? 'var(--card-bg)' : 'transparent',
              color: viewMode === 'LIST' ? '#10b981' : 'var(--text-muted)',
              boxShadow: viewMode === 'LIST' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Directory
          </button>
          <button
            onClick={() => setViewMode('MAP')}
            style={{
              padding: '5px 14px',
              borderRadius: 8,
              border: 'none',
              fontSize: 12,
              fontWeight: viewMode === 'MAP' ? 800 : 600,
              cursor: 'pointer',
              background: viewMode === 'MAP' ? 'var(--card-bg)' : 'transparent',
              color: viewMode === 'MAP' ? '#10b981' : 'var(--text-muted)',
              boxShadow: viewMode === 'MAP' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Interactive Map
          </button>
        </div>
      </div>

      {/* Viewport: Interactive Map or Directory List */}
      {viewMode === 'MAP' ? (
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
          <LiveMapComponent
            sites={sites}
            height="500px"
            focusedDestination={focusedDestination}
            onSelectDestination={(dest) => {
              setFocusedDestination(dest);
              if (onSelectSite) onSelectSite(dest);
            }}
            showSites={true}
            showInspectors={true}
            showDefects={false}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {sites.map(site => {
            const isAssigned = selectedSite?.id === site.id;
            const siteDefects = allDefects.filter(d => d.site_id === site.id);
            const siteZones = zones.filter(z => z.site_id === site.id);
            const pendingZones = siteZones.filter(z => z.status !== 'INSPECTED');

            return (
              <div
                key={site.id}
                className="glass-card"
                style={{
                  padding: '18px',
                  borderRadius: 16,
                  border: isAssigned ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
                  backgroundColor: isAssigned ? 'rgba(16, 185, 129, 0.04)' : 'var(--card-bg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Building2 size={16} color="#10b981" />
                      <strong style={{ fontSize: 16, color: 'var(--text-heading)' }}>
                        {site.name}
                      </strong>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} />
                      <span>{site.address || 'Infrastructure Corridor'}</span>
                    </div>
                  </div>

                  {isAssigned ? (
                    <span className="badge badge-green" style={{ fontSize: 10 }}>ACTIVE DUTY</span>
                  ) : (
                    <span className="badge badge-blue" style={{ fontSize: 10 }}>{site.category || 'CIVIL'}</span>
                  )}
                </div>

                {/* Site Telemetry Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'var(--bg-secondary)' }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700 }}>STATUS</div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: pendingZones.length === 0 ? '#10b981' : '#f59e0b', marginTop: 2 }}>
                      {pendingZones.length === 0 ? 'Compliant' : `${pendingZones.length} Pending`}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700 }}>HOLD POINTS</div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-heading)', marginTop: 2 }}>
                      {siteZones.length || 6} Zones
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700 }}>OPEN ISSUES</div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: siteDefects.length > 0 ? '#ef4444' : '#10b981', marginTop: 2 }}>
                      {siteDefects.length} Issues
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                    Geofence: <strong>{site.geofence_radius || 150}m radius</strong>
                  </span>

                  <button
                    onClick={() => {
                      if (onSelectSite) onSelectSite(site);
                      setFocusedDestination(site);
                    }}
                    className={`btn ${isAssigned ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                    style={{ fontSize: 11.5, fontWeight: 700, padding: '6px 14px' }}
                  >
                    {isAssigned ? 'Selected Site' : 'Select Facility'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
