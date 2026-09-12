import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = '#38bdf8', trend, trendUp = true }) {
  return (
    <div className="glass-card stat-card">
      <div className="stat-header">
        <span className="stat-label">{title}</span>
        <div 
          className="stat-icon-wrapper" 
          style={{ 
            background: `${color}20`,
            border: `1px solid ${color}40`
          }}
        >
          <Icon size={20} color={color} />
        </div>
      </div>

      <div className="stat-value" style={{ color: '#ffffff' }}>
        {value}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
          {subtitle}
        </span>
        {trend && (
          <span 
            style={{ 
              fontSize: 11, 
              fontWeight: 700, 
              color: trendUp ? '#34d399' : '#f87171',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
    </div>
  );
}
