import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ compact = false, style = {} }) {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? 0 : 6,
        padding: compact ? '6px 8px' : '6px 12px',
        borderRadius: 20,
        background: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.95)',
        border: `1px solid ${isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(203, 213, 225, 0.9)'}`,
        color: isDark ? '#38bdf8' : '#d97706',
        cursor: 'pointer',
        fontSize: 11.5,
        fontWeight: 700,
        boxShadow: isDark 
          ? '0 0 12px rgba(56, 189, 248, 0.15)' 
          : '0 2px 8px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
        ...style
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: isDark ? 'rotate(0deg)' : 'rotate(360deg)',
          transition: 'transform 0.4s ease'
        }}
      >
        {isDark ? (
          <Moon size={compact ? 13 : 14} color="#38bdf8" />
        ) : (
          <Sun size={compact ? 13 : 14} color="#f59e0b" />
        )}
      </span>
      {!compact && (
        <span style={{ color: isDark ? '#cbd5e1' : '#334155', letterSpacing: '0.02em' }}>
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}
