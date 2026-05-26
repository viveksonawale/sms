import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function NotFound() {
  const navigate = useNavigate();
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'dark';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#141a21' : '#f9fafb',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '64px', fontWeight: 800, color: isDark ? '#ffffff' : '#1c252e', margin: 0, lineHeight: 1 }}>
        404
      </h1>
      <p style={{ fontSize: '18px', fontWeight: 600, color: isDark ? '#919eab' : '#637381', marginTop: '16px', marginBottom: '32px' }}>
        Page not found
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#f97316',
          color: '#ffffff',
          border: 'none',
          padding: '10px 24px',
          borderRadius: '8px',
          fontWeight: 700,
          cursor: 'pointer'
        }}
      >
        <Home size={18} />
        Go Home
      </button>
    </div>
  );
}
