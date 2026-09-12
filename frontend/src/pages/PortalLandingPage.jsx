import React, { useState, useEffect } from 'react';
import { Smartphone, LayoutDashboard, Shield, MapPin, CheckCircle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import ThemeToggle from '../components/ThemeToggle';

export default function PortalLandingPage() {
  const [branding, setBranding] = useState({
    app_name: 'INSPECTRA PRO',
    tagline: 'Smart Asset Inspection, Defect Tracking & Compliance Monitoring System',
    logo_url: '/logo.png'
  });

  useEffect(() => {
    api.getBranding().then(res => {
      if (res.success && res.data) setBranding(res.data);
    });
  }, []);

  return (
    <div 
      style={{
        minHeight: '100vh',
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 20px',
        position: 'relative'
      }}
    >
      {/* Floating Theme Toggle */}
      <div style={{ position: 'absolute', top: 20, right: 24, zIndex: 50 }}>
        <ThemeToggle />
      </div>

      {/* Brand Header */}
      <div style={{ textAlign: 'center', maxWidth: 640, marginBottom: 40 }}>
        <div 
          style={{
            width: 64,
            height: 64,
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            borderRadius: 16,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--glow-cyan)',
            marginBottom: 16,
            overflow: 'hidden',
            padding: 3
          }}
        >
          <img 
            src={branding.logo_url || "/logo.png"} 
            alt="Inspectra Pro" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
          />
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
          {branding.app_name}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>
          {branding.tagline || 'Smart Asset Inspection, Defect Tracking & Compliance Monitoring System'}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
          Select your portal to proceed to your dedicated workflow environment:
        </p>
      </div>

      {/* Two Portal Cards Grid */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 420px))',
          gap: 24,
          width: '100%',
          maxWidth: 900
        }}
      >
        {/* Portal 1: Field Inspector Application */}
        <a 
          href="/field-inspector"
          className="glass-card"
          style={{
            padding: 28,
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            boxShadow: '0 20px 40px -15px rgba(2, 132, 199, 0.3)',
            transition: 'all 0.25s ease'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div 
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Smartphone size={26} color="var(--accent-cyan)" />
              </div>
              <span className="badge badge-low">MOBILE APP STYLE</span>
            </div>

            <h2 style={{ fontSize: 20, color: 'var(--text-heading)', marginBottom: 6 }}>
              Field Inspector Application
            </h2>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 18 }}>
              Dedicated mobile-responsive interface for on-site field engineers. Includes live GNSS geofencing verification, dynamic pass/fail checklists, camera photo evidence with AI defect detection, and digital signature sign-offs.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={14} color="#34d399" />
                <span>Real-time GPS geofence locking & distance calculation</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={14} color="#34d399" />
                <span>Interactive checklist scoring & offline queue support</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={14} color="#34d399" />
                <span>Computer vision defect scanner HUD overlay</span>
              </div>
            </div>
          </div>

          <div 
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: 13, fontWeight: 700, display: 'flex', justifyContent: 'center' }}
          >
            <span>Launch Field Inspector App</span>
            <ArrowRight size={15} />
          </div>
        </a>

        {/* Portal 2: Admin / Management Dashboard */}
        <a 
          href="/admin-dashboard"
          className="glass-card"
          style={{
            padding: 28,
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 20px 40px -15px rgba(99, 102, 241, 0.25)',
            transition: 'all 0.25s ease'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div 
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <LayoutDashboard size={26} color="#818cf8" />
              </div>
              <span className="badge badge-purple">DESKTOP CONSOLE</span>
            </div>

            <h2 style={{ fontSize: 20, color: 'var(--text-heading)', marginBottom: 6 }}>
              Admin & Management Dashboard
            </h2>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 18 }}>
              Full desktop command center for administrators, directors, and supervisors. Features real-time geospatial OpenStreetMap telemetry, 5 inspector monitoring, defect remediation tracking, executive analytics, and PDF/CSV exports.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={14} color="#818cf8" />
                <span>Geospatial map with circular geofences & live inspector pins</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={14} color="#818cf8" />
                <span>Audit dossiers, supervisory sign-offs & PDF generation</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={14} color="#818cf8" />
                <span>Predictive maintenance forecaster & immutable audit logs</span>
              </div>
            </div>
          </div>

          <div 
            className="btn btn-secondary"
            style={{ width: '100%', padding: '12px', fontSize: 13, fontWeight: 700, display: 'flex', justifyContent: 'center' }}
          >
            <span>Open Management Dashboard</span>
            <ArrowRight size={15} />
          </div>
        </a>
      </div>

      {/* Dual Role Authentication Link */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <a
          href="/login"
          className="btn btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 22px',
            fontSize: 12.5,
            borderRadius: 30,
            textDecoration: 'none'
          }}
        >
          <Shield size={14} color="var(--accent-cyan)" />
          <span>Officer Login Page (/login) — Field Inspector & Admin Credentials</span>
          <ArrowRight size={14} />
        </a>
      </div>

      <div style={{ marginTop: 18, fontSize: 11, color: 'var(--text-dim)' }}>
        Dedicated Routes: <code style={{ color: 'var(--accent-cyan)' }}>/login</code> &bull; <code style={{ color: 'var(--accent-cyan)' }}>/field-inspector</code> &bull; <code style={{ color: '#818cf8' }}>/admin-dashboard</code>
      </div>
    </div>
  );
}
