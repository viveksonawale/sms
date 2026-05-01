import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toastConfig = {
  success: {
    icon: <CheckCircle2 size={17} style={{ color: '#22c55e', flexShrink: 0 }} />,
    bar: '#22c55e',
    bg: '#ffffff',
    border: 'rgba(34,197,94,0.2)',
  },
  error: {
    icon: <XCircle size={17} style={{ color: '#ff5630', flexShrink: 0 }} />,
    bar: '#ff5630',
    bg: '#ffffff',
    border: 'rgba(255,86,48,0.2)',
  },
  info: {
    icon: <AlertCircle size={17} style={{ color: '#00b8d9', flexShrink: 0 }} />,
    bar: '#00b8d9',
    bg: '#ffffff',
    border: 'rgba(0,184,217,0.2)',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast Container */}
      <div
        style={{
          position: 'fixed', top: '20px', right: '20px',
          zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px',
          maxWidth: '360px', width: '100%', pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => {
          const cfg = toastConfig[t.type];
          return (
            <div
              key={t.id}
              style={{
                pointerEvents: 'auto',
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '14px 16px',
                backgroundColor: cfg.bg,
                borderRadius: '10px',
                border: `1px solid ${cfg.border}`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                animation: 'toastSlideIn 0.3s cubic-bezier(0.16,1,0.3,1)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Left accent bar */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: '4px', backgroundColor: cfg.bar, borderRadius: '10px 0 0 10px',
              }} />

              {/* Padded content (to account for the bar) */}
              <div style={{ paddingLeft: '4px', display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                {cfg.icon}
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1c252e', flex: 1 }}>
                  {t.message}
                </span>
              </div>

              <button
                onClick={() => removeToast(t.id)}
                style={{
                  padding: '2px', border: 'none', cursor: 'pointer',
                  backgroundColor: 'transparent', color: '#919eab', flexShrink: 0,
                  borderRadius: '4px', display: 'flex', alignItems: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#637381')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#919eab')}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
