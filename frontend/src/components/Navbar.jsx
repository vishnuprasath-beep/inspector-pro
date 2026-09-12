import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, 
  Smartphone, 
  LogOut, 
  ShieldCheck, 
  UserCheck 
} from 'lucide-react';

export default function Navbar({ onOpenMobileSim, activePage, setActivePage }) {
  const { user, logout } = useAuth();

  return (
    <header className="glass-header" style={{ padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, textTransform: 'capitalize', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--accent-cyan)' }}>•</span>
          {activePage.replace(/([A-Z])/g, ' $1').trim()}
        </h2>
        <span style={{ fontSize: 11, background: 'rgba(56, 189, 248, 0.12)', color: 'var(--accent-cyan)', padding: '3px 10px', borderRadius: 20, fontWeight: 600, border: '1px solid rgba(56, 189, 248, 0.25)' }}>
          ENTERPRISE LIVE SYSTEM
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Launch Mobile App Simulator Modal */}
        <button
          onClick={onOpenMobileSim}
          className="btn btn-primary btn-sm"
          style={{ 
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            boxShadow: '0 0 16px rgba(2, 132, 199, 0.35)',
            fontWeight: 700
          }}
          title="Test 12 Mobile Inspector Screens in browser"
        >
          <Smartphone size={15} />
          <span>Mobile Inspector Sim</span>
        </button>

        {/* Read-Only Role Badge (Zero Role Switching Allowed) */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6, 
            fontSize: 12, 
            padding: '6px 12px',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 8,
            color: '#f8fafc'
          }}
        >
          <UserCheck size={14} color="var(--accent-cyan)" />
          <span>Role: <strong style={{ color: 'var(--accent-cyan)' }}>{user ? user.role : 'AUTHORIZED'}</strong></span>
        </div>

        {/* User Badge */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 8, borderLeft: '1px solid var(--border-subtle)' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>{user.name}</div>
              <div style={{ fontSize: 10, color: 'var(--accent-cyan)' }}>{user.email}</div>
            </div>
            <img
              src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={user.name}
              style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid var(--accent-cyan)', objectFit: 'cover' }}
            />
          </div>
        )}
      </div>
    </header>
  );
}
