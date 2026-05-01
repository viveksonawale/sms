import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Settings as SettingsIcon, LogOut, X, Users, TrendingUp, Receipt } from 'lucide-react';
import { useStore } from '../store/useStore';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useStore((state) => state.setAuth);
  const societyName = useStore((state) => state.societyName);
  const owners = useStore((state) => state.owners);
  const payments = useStore((state) => state.payments);
  const sidebarCollapsed = useStore((state) => state.sidebarCollapsed);

  const totalCollected = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: t('dashboard') },
    { to: '/owners', icon: Users, label: t('owners') },
    { to: '/expenses', icon: Receipt, label: t('otherExpenses') },
    { to: '/settings', icon: SettingsIcon, label: t('settings') },
  ];

  const handleLogout = () => {
    setAuth(false);
    navigate('/login');
    setIsOpen(false);
  };

  const sidebarWidth = sidebarCollapsed ? '88px' : '260px';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-30 flex flex-col
                    transform transition-all duration-400
                    ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ 
          width: sidebarWidth, 
          backgroundColor: '#1c252e', 
          minHeight: '100vh',
          borderRight: '1px dashed rgba(255,255,255,0.08)',
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* ── Logo / Society Header ── */}
        <div style={{ 
          height: '64px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: sidebarCollapsed ? '0' : '0 20px',
        }}>
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} w-full`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: '32px', height: '32px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #00a76f 0%, #007867 100%)',
                  boxShadow: 'rgba(0, 167, 111, 0.3) 0px 4px 12px 0px',
                  overflow: 'hidden',
                }}
              >
                <img src="/images/shri.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0 transition-all duration-300 ease-in-out">
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', lineHeight: 1.3 }} className="truncate">
                    {societyName}
                  </p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                    {t('adminPortal')}
                  </p>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <button
                className="md:hidden p-1.5 rounded-lg transition-colors"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                onClick={() => setIsOpen(false)}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* ── Quick Stats Card (Hidden when collapsed) ── */}
        {!sidebarCollapsed && (
          <div style={{ padding: '16px 12px 8px' }} className="animate-in fade-in duration-300">
            <div
              style={{
                background: 'rgba(0,167,111,0.12)',
                borderRadius: '12px',
                padding: '14px 16px',
                border: '1px solid rgba(0,167,111,0.2)',
              }}
            >
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: 600 }}>
                {t('quickStats')}
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
                    {owners.length}
                  </p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '3px' }}>
                    {t('owners').toLowerCase()}
                  </p>
                </div>
                <div
                  style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: 'rgba(0,167,111,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <TrendingUp size={18} color="#5be49b" />
                </div>
              </div>
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>Total Collected</p>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#5be49b', marginTop: '2px' }}>
                  ₹{totalCollected.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden" style={{ padding: '8px 12px' }}>
          {!sidebarCollapsed && (
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, padding: '8px 12px 6px' }}>
              Menu
            </p>
          )}
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'} ${sidebarCollapsed ? 'justify-center px-0 gap-0' : ''}`
                }
                title={sidebarCollapsed ? item.label : ''}
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      size={20}
                      style={{ 
                        color: isActive ? '#00a76f' : 'rgba(255,255,255,0.45)', 
                        flexShrink: 0,
                        transition: 'transform 0.2s ease',
                        margin: sidebarCollapsed ? '0 auto' : '0'
                      }}
                      className={sidebarCollapsed ? 'scale-110' : ''}
                    />
                    {!sidebarCollapsed && (
                      <span style={{ color: isActive ? '#00a76f' : 'rgba(255,255,255,0.65)', fontWeight: isActive ? 700 : 500 }} className="truncate">
                        {item.label}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* ── Recent Owners (Hidden when collapsed) ── */}
        {!sidebarCollapsed && owners.length > 0 && (
          <div style={{ padding: '0 12px 8px' }} className="animate-in slide-in-from-bottom-2 duration-300">
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, padding: '8px 12px 6px' }}>
              Recent Owners
            </p>
            <div className="space-y-0.5">
              {owners.slice(0, 3).map((owner) => {
                const initials = owner.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
                return (
                  <button
                    key={owner.id}
                    onClick={() => { navigate(`/owners/${owner.id}`); setIsOpen(false); }}
                    className="w-full flex items-center gap-3 rounded-lg transition-all group"
                    style={{ padding: '8px 12px' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div
                      className="flex items-center justify-center flex-shrink-0 transition-all"
                      style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: 'rgba(0,167,111,0.15)',
                        color: '#5be49b',
                        fontSize: '11px', fontWeight: 700,
                      }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0 text-left">
                      <p style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.65)' }} className="truncate group-hover:text-white transition-colors">
                        {owner.name}
                      </p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)' }}>
                        {owner.flat}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Logout ── */}
        <div style={{ padding: '8px 12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 rounded-lg transition-all ${sidebarCollapsed ? 'justify-center px-0 gap-0' : ''}`}
            style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontWeight: 600 }}
            title={sidebarCollapsed ? t('logout') : ''}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 86, 48, 0.12)';
              e.currentTarget.style.color = '#ff5630';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
            }}
          >
            <LogOut size={18} className={sidebarCollapsed ? 'scale-110' : ''} />
            {!sidebarCollapsed && <span>{t('logout')}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
