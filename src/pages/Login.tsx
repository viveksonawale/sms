import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useStore((state) => state.setAuth);
  const societyName = useStore((state) => state.societyName);
  const { toast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 600));
    if (username === 'admin' && password === 'society@123') {
      setAuth(true);
      toast('Welcome back, Ramesh Sonawale!', 'success');
      navigate('/');
    } else {
      setError(t('invalidCredentials'));
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: '#f9fafb' }}
    >
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col items-center justify-center flex-1 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fdba74 100%)' }}
      >
        {/* Background orbs */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

        <div className="relative z-10 text-center text-white px-12">
          <div
            className="mx-auto flex items-center justify-center overflow-hidden"
            style={{
              width: '72px', height: '72px', borderRadius: '20px',
              marginBottom: '24px',
            }}
          >
            <img src="/images/shri.png?v=orange" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px', lineHeight: 1.2 }}>
            {societyName}
          </h1>
          <p style={{ fontSize: '17px', opacity: 0.75, lineHeight: 1.6, maxWidth: '320px' }}>
            Manage your society's maintenance, payments, and residents from one place.
          </p>

          <div className="flex items-center justify-center gap-6 mt-10">
            {[
              { val: '100%', label: 'Secure' },
              { val: '24/7', label: 'Access' },
              { val: '∞', label: 'Records' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p style={{ fontSize: '22px', fontWeight: 800 }}>{s.val}</p>
                <p style={{ fontSize: '11px', opacity: 0.65, marginTop: '2px' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col items-center justify-center flex-1 p-6 md:p-12" style={{ maxWidth: '520px', margin: '0 auto' }}>
        {/* Mobile logo */}
        <div className="lg:hidden text-center mb-8">
          <div
            className="inline-flex items-center justify-center overflow-hidden"
            style={{
              width: '56px', height: '56px', borderRadius: '16px',
              marginBottom: '12px',
            }}
          >
            <img src="/images/shri.png?v=orange" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1c252e' }}>{societyName}</h1>
        </div>

        {/* Form card */}
        <div
          style={{
            width: '100%', maxWidth: '440px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)',
          }}
        >
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1c252e', marginBottom: '6px' }}>
              Sign in
            </h2>
            <p style={{ fontSize: '14px', color: '#637381' }}>
              {t('signInPortal')}
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Username */}
            <div>
              <label className="label">{t('username')}</label>
              <div style={{ position: 'relative' }}>
                <User
                  size={16}
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#919eab' }}
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="input-field pl-10"
                  style={{ backgroundColor: '#ffffff', color: '#1c252e', borderColor: '#dfe3e8' }}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label">{t('password')}</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#919eab' }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="society@123"
                  className="input-field pl-10 pr-10"
                  style={{ backgroundColor: '#ffffff', color: '#1c252e', borderColor: '#dfe3e8' }}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#919eab', padding: '0',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 14px', borderRadius: '10px',
                  backgroundColor: 'rgba(255, 86, 48, 0.08)',
                  border: '1px solid rgba(255, 86, 48, 0.24)',
                }}
              >
                <AlertCircle size={15} style={{ color: '#ff5630', flexShrink: 0 }} />
                <p style={{ fontSize: '13px', color: '#b71d18' }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center"
              style={{ padding: '12px 20px', fontSize: '15px', borderRadius: '10px', marginTop: '4px' }}
            >
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg style={{ animation: 'spin 0.8s linear infinite', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  {t('signingIn')}
                </span>
              ) : t('login')}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#919eab', marginTop: '20px' }}>
            Hint: <strong style={{ color: '#637381' }}>admin</strong> / <strong style={{ color: '#637381' }}>society@123</strong>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
