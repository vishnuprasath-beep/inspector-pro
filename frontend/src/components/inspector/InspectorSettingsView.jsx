import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Smartphone,
  Download,
  Camera,
  Mic,
  MapPin,
  RefreshCw,
  LogOut,
  Bell,
  CheckCircle2,
  HardDrive,
  Info,
  Sliders,
  Database
} from 'lucide-react';
import ThemeToggle from '../ThemeToggle';

export default function InspectorSettingsView({
  currentInspector,
  onAvatarChange,
  offlineSyncStatus,
  offlineQueue,
  onManualSync,
  onLogout
}) {
  const [notifEnabled, setNotifEnabled] = useState(true);

  const triggerPwaInstall = () => {
    if (typeof window !== 'undefined' && window.__promptInstallPwa) {
      window.__promptInstallPwa();
    } else {
      alert('To install Inspectra Pro as an App:\n\n1. In your browser menu (⋮ / ⎋), tap "Install App" or "Add to Home Screen".\n2. Inspectra Pro will launch natively with offline storage, full-screen camera, and GPS geofencing.');
    }
  };

  const queueTotal = (offlineQueue?.tier1?.length || 0) + (offlineQueue?.tier2?.length || 0) + (offlineQueue?.tier3?.length || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760 }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
          Inspector Settings & Profile
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
          Manage your field credentials, hardware permissions, and offline database telemetry.
        </p>
      </div>

      {/* 1. Profile & Account Credentials Card */}
      <div
        className="glass-card"
        style={{
          padding: 22,
          borderRadius: 16,
          border: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--card-bg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <User size={18} color="#10b981" />
          <span>Field Auditor Credentials</span>
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <label
            htmlFor="settings-avatar-input"
            style={{ position: 'relative', cursor: 'pointer', display: 'inline-block' }}
            title="Click to update avatar photo"
          >
            <img
              src={currentInspector?.avatar_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"}
              alt="Avatar"
              style={{ width: 68, height: 68, borderRadius: '50%', objectFit: 'cover', border: '3px solid #10b981' }}
            />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
              <Camera size={12} />
            </div>
            <input
              id="settings-avatar-input"
              type="file"
              accept="image/*"
              onChange={onAvatarChange}
              style={{ display: 'none' }}
            />
          </label>

          <div>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
              {currentInspector?.name || 'Vishnu Prasath'}
            </h4>
            <div style={{ fontSize: 12.5, color: '#10b981', fontWeight: 700, marginTop: 2 }}>
              {currentInspector?.badge || 'Lead Field Auditor / INSP-2026-VP01'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {currentInspector?.email || 'vishnu.prasath@inspectra.gov.in'}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg-secondary)' }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontWeight: 700 }}>ASSIGNED FACILITY</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-heading)', marginTop: 2 }}>
              {currentInspector?.assignedSite || 'Northern Metro Corridor'}
            </div>
          </div>
          <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg-secondary)' }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontWeight: 700 }}>CLEARANCE LEVEL</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', marginTop: 2 }}>
              State Directorate Level 2 Auditor
            </div>
          </div>
        </div>
      </div>

      {/* 2. Device Hardware & Permissions Status Card */}
      <div
        className="glass-card"
        style={{
          padding: 22,
          borderRadius: 16,
          border: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--card-bg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={18} color="#38bdf8" />
          <span>Hardware & Device Permissions</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Camera size={16} color="#10b981" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>Camera Sensor</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Required for optical inspections and WebRTC live share</div>
              </div>
            </div>
            <span className="badge badge-green" style={{ fontSize: 10.5 }}>ACTIVE</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Mic size={16} color="#10b981" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>Microphone Sensor</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Required for two-way voice chat and voice dictation</div>
              </div>
            </div>
            <span className="badge badge-green" style={{ fontSize: 10.5 }}>ACTIVE</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <MapPin size={16} color="#10b981" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>GNSS Geolocation</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Required for statutory hold-point geofence validation</div>
              </div>
            </div>
            <span className="badge badge-green" style={{ fontSize: 10.5 }}>ENABLED</span>
          </div>
        </div>
      </div>

      {/* 3. Offline Synchronization Queue Telemetry Card */}
      <div
        className="glass-card"
        style={{
          padding: 22,
          borderRadius: 16,
          border: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--card-bg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Database size={18} color="#f59e0b" />
          <span>Offline Database & Tiered Synchronizer</span>
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>
              Queue Status: <strong style={{ color: queueTotal > 0 ? '#f59e0b' : '#10b981' }}>
                {queueTotal > 0 ? `${queueTotal} Records Pending Sync` : 'All Field Audits Synced'}
              </strong>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
              Tier 1 (Defects): {offlineQueue?.tier1?.length || 0} &bull; Tier 2 (Audits): {offlineQueue?.tier2?.length || 0} &bull; Tier 3 (Photos): {offlineQueue?.tier3?.length || 0}
            </div>
          </div>

          <button
            onClick={onManualSync}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} />
            <span>Sync Records Now</span>
          </button>
        </div>
      </div>

      {/* 4. Manual PWA Install Option (Requirement 13) */}
      <div
        className="glass-card"
        style={{
          padding: 22,
          borderRadius: 16,
          border: '1.5px solid #10b981',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(56, 189, 248, 0.04) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Smartphone size={24} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-heading)' }}>
              Install Inspectra Pro App
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Launch in native full-screen mode with offline caching and direct hardware sensors.
            </div>
          </div>
        </div>

        <button
          onClick={triggerPwaInstall}
          className="btn btn-primary"
          style={{ background: '#10b981', borderColor: '#10b981', fontWeight: 800, fontSize: 13, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Download size={15} />
          <span>Install App</span>
        </button>
      </div>

      {/* 5. Theme & Logout Actions */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          borderRadius: 14,
          border: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--card-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>Color Theme:</span>
          <ThemeToggle />
        </div>

        <button
          onClick={onLogout}
          className="btn btn-secondary btn-sm"
          style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
