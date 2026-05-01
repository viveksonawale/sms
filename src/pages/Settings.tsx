import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Globe, Building2, Save, Info } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useToast } from '../context/ToastContext';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);
  const language = useStore((state) => state.language);
  const setLanguage = useStore((state) => state.setLanguage);
  const societyName = useStore((state) => state.societyName);
  const setSocietyName = useStore((state) => state.setSocietyName);

  const [nameInput, setNameInput] = useState(societyName);

  const isDark = theme === 'dark';
  const cardBg = isDark ? '#1c252e' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#1c252e';
  const textSecondary = isDark ? '#919eab' : '#637381';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8';
  const cardShadow = isDark
    ? '0 0 2px 0 rgba(0,0,0,0.3), 0 12px 24px -4px rgba(0,0,0,0.2)'
    : '0 0 2px 0 rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)';

  const handleSaveSocietyName = () => {
    if (!nameInput.trim()) return;
    setSocietyName(nameInput.trim());
    toast(t('societyNameUpdated'), 'success');
  };

  const SectionCard = ({
    icon, iconBg, title, subtitle, children,
  }: {
    icon: React.ReactNode; iconBg: string;
    title: string; subtitle: string; children: React.ReactNode;
  }) => (
    <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', boxShadow: cardShadow }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', paddingBottom: '18px', borderBottom: `1px solid ${borderColor}` }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px',
          backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: textPrimary }}>{title}</h2>
          <p style={{ fontSize: '12px', color: textSecondary, marginTop: '2px' }}>{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );

  const ToggleBtn = ({
    active, onClick, id, children,
  }: { active: boolean; onClick: () => void; id?: string; children: React.ReactNode }) => (
    <button
      id={id}
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        padding: '11px 16px', borderRadius: '8px', cursor: 'pointer',
        fontSize: '14px', fontWeight: 700,
        border: `2px solid ${active ? '#00a76f' : (isDark ? 'rgba(255,255,255,0.08)' : '#dfe3e8')}`,
        backgroundColor: active ? 'rgba(0,167,111,0.1)' : 'transparent',
        color: active ? '#00a76f' : textSecondary,
        transition: 'all 0.15s ease',
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }} className="space-y-6 page-enter">
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: textPrimary }}>{t('settings')}</h1>
        <p style={{ fontSize: '13px', color: textSecondary, marginTop: '2px' }}>{t('managePreferences')}</p>
      </div>

      {/* Society Name */}
      <SectionCard
        icon={<Building2 size={18} style={{ color: '#00a76f' }} />}
        iconBg="rgba(0,167,111,0.12)"
        title={t('societyName')}
        subtitle={t('personalizeInterface')}
      >
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="input-field"
            style={{ flex: 1 }}
            placeholder="Society name..."
          />
          <button onClick={handleSaveSocietyName} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
            <Save size={14} />
            {t('save')}
          </button>
        </div>
      </SectionCard>

      {/* Theme */}
      <SectionCard
        icon={
          isDark
            ? <Moon size={18} style={{ color: '#00b8d9' }} />
            : <Sun size={18} style={{ color: '#ffab00' }} />
        }
        iconBg={isDark ? 'rgba(0,184,217,0.12)' : 'rgba(255,171,0,0.12)'}
        title={t('theme')}
        subtitle={t('personalizeInterface')}
      >
        <div style={{ display: 'flex', gap: '12px' }}>
          <ToggleBtn id="theme-light" active={theme === 'light'} onClick={() => setTheme('light')}>
            <Sun size={15} />
            {t('lightMode')}
          </ToggleBtn>
          <ToggleBtn id="theme-dark" active={theme === 'dark'} onClick={() => setTheme('dark')}>
            <Moon size={15} />
            {t('darkMode')}
          </ToggleBtn>
        </div>
      </SectionCard>

      {/* Language */}
      <SectionCard
        icon={<Globe size={18} style={{ color: '#8e33ff' }} />}
        iconBg="rgba(142,51,255,0.12)"
        title={t('language')}
        subtitle={t('chooseLanguage')}
      >
        <div style={{ display: 'flex', gap: '12px' }}>
          <ToggleBtn
            id="lang-en"
            active={language === 'en'}
            onClick={() => { setLanguage('en'); i18n.changeLanguage('en'); }}
          >
            🇬🇧 English
          </ToggleBtn>
          <ToggleBtn
            id="lang-mr"
            active={language === 'mr'}
            onClick={() => { setLanguage('mr'); i18n.changeLanguage('mr'); }}
          >
            🇮🇳 मराठी
          </ToggleBtn>
        </div>
      </SectionCard>

      {/* App Info */}
      <div style={{
        backgroundColor: cardBg, borderRadius: '12px', padding: '20px',
        boxShadow: cardShadow, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #00a76f, #007867)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'rgba(0,167,111,0.3) 0px 4px 10px 0px',
          }}>
            <Info size={18} style={{ color: '#fff' }} />
          </div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: textPrimary }}>Society Management System</p>
            <p style={{ fontSize: '12px', color: textSecondary, marginTop: '2px' }}>Version 1.0.0 — Shir Sai Apartment</p>
          </div>
        </div>
        <span style={{
          fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px',
          backgroundColor: 'rgba(0,167,111,0.1)', color: '#00a76f',
        }}>
          Active
        </span>
      </div>
    </div>
  );
}
