import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { useStore } from '../store/useStore';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  children?: ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  children,
}: ModalProps) {
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const bgColor = isDark ? '#1c252e' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#1c252e';
  const textSecondary = isDark ? '#919eab' : '#637381';
  const btnSecondaryBg = isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8';
  const btnSecondaryHover = isDark ? 'rgba(255,255,255,0.1)' : '#dfe3e8';

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        style={{
          position: 'relative', zIndex: 10,
          width: '100%', maxWidth: '420px',
          backgroundColor: bgColor,
          borderRadius: '16px',
          boxShadow: isDark 
            ? '0 0 2px 0 rgba(0,0,0,0.3), 0 12px 24px -4px rgba(0,0,0,0.2)'
            : '0 25px 50px -12px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          animation: 'modalIn 0.2s ease both',
        }}
      >
        {/* Top accent */}
        {danger && (
          <div style={{ height: '4px', background: 'linear-gradient(90deg, #ff5630, #ffab00)' }} />
        )}
        {!danger && (
          <div style={{ height: '4px', background: 'linear-gradient(90deg, #00a76f, #5be49b)' }} />
        )}

        <div style={{ padding: '24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  backgroundColor: danger ? 'rgba(255,86,48,0.1)' : 'rgba(0,167,111,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                <AlertTriangle size={18} style={{ color: danger ? '#ff5630' : '#00a76f' }} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: textPrimary, lineHeight: 1.3 }}>
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '4px', background: 'none', border: 'none', cursor: 'pointer',
                color: textSecondary, borderRadius: '6px',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {children ? (
            children
          ) : (
            <>
              <p style={{ fontSize: '14px', color: textSecondary, lineHeight: 1.6, marginBottom: '24px' }}>
                {message}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={onClose}
                  style={{
                    padding: '8px 20px', borderRadius: '8px',
                    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                    backgroundColor: btnSecondaryBg, border: 'none', color: textSecondary,
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = btnSecondaryHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = btnSecondaryBg)}
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={() => { onConfirm?.(); onClose(); }}
                  style={{
                    padding: '8px 20px', borderRadius: '8px',
                    fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                    backgroundColor: danger ? '#ff5630' : '#00a76f',
                    border: 'none', color: '#ffffff',
                    boxShadow: danger
                      ? 'rgba(255,86,48,0.24) 0px 8px 16px 0px'
                      : 'rgba(0,167,111,0.24) 0px 8px 16px 0px',
                    transition: 'background-color 0.15s, transform 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = danger ? '#b71d18' : '#007867')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = danger ? '#ff5630' : '#00a76f')}
                >
                  {confirmLabel}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
}
