import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur)
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Notification Container */}
      <div 
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          maxWidth: 420,
          width: 'calc(100% - 48px)',
          pointerEvents: 'none'
        }}
      >
        {toasts.map(t => {
          let bg = 'rgba(15, 23, 42, 0.95)';
          let border = '1px solid var(--border-subtle)';
          let icon = <Info size={18} color="var(--accent-cyan)" />;

          if (t.type === 'success') {
            border = '1px solid #10b981';
            icon = <CheckCircle2 size={18} color="#10b981" />;
          } else if (t.type === 'error') {
            border = '1px solid #ef4444';
            icon = <XCircle size={18} color="#ef4444" />;
          } else if (t.type === 'warning') {
            border = '1px solid #f59e0b';
            icon = <AlertTriangle size={18} color="#f59e0b" />;
          }

          return (
            <div
              key={t.id}
              style={{
                background: bg,
                border,
                borderRadius: 10,
                padding: '12px 16px',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(12px)',
                pointerEvents: 'auto',
                animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                fontSize: 13,
                fontWeight: 500,
                lineHeight: 1.4
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                {icon}
                <span>{t.message}</span>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex'
                }}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      success: (m) => console.log('[Toast:success]', m),
      error: (m) => console.error('[Toast:error]', m),
      warning: (m) => console.warn('[Toast:warning]', m),
      info: (m) => console.info('[Toast:info]', m)
    };
  }
  return context;
}
