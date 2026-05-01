import { useState, useRef, useEffect } from 'react';
import { Menu, Sun, Moon, Globe, User, LogOut, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { i18n } = useTranslation();
  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);
  const language = useStore((state) => state.language);
  const setLanguage = useStore((state) => state.setLanguage);
  const societyName = useStore((state) => state.societyName);
  const setAuth = useStore((state) => state.setAuth);
  const sidebarCollapsed = useStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsed = useStore((state) => state.setSidebarCollapsed);

  const [showAdminPop, setShowAdminPop] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'mr' : 'en';
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(event.target as Node)) {
        setShowAdminPop(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between px-4"
      style={{
        height: '64px',
        backgroundColor: theme === 'dark' ? '#1c252e' : '#ffffff',
        borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.06)' : '#f4f6f8'}`,
        boxShadow: '0 1px 2px 0 rgba(145, 158, 171, 0.08)',
      }}
    >
      {/* Left: Hamburger + Brand Icon (No Title as requested) */}
      <div className="flex items-center gap-2">
        {/* Mobile Toggle */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg transition-colors flex-shrink-0"
          style={{ color: theme === 'dark' ? '#919eab' : '#637381' }}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden md:flex p-2 rounded-lg transition-all hover:bg-black/5 dark:hover:bg-white/5"
          style={{ color: theme === 'dark' ? '#919eab' : '#637381' }}
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        {/* Mobile Brand (Visible only on mobile) */}
        <div className="flex items-center gap-2 md:hidden overflow-hidden ml-1">
          <div
            className="flex-shrink-0 flex items-center justify-center"
            style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #00a76f, #007867)',
              overflow: 'hidden',
            }}
          >
            <img src="/images/shri.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span className="text-sm font-bold truncate" style={{ color: theme === 'dark' ? '#ffffff' : '#1c252e' }}>
            {societyName}
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 rounded-lg transition-all"
          style={{
            padding: '6px 8px',
            fontSize: '11px',
            fontWeight: 700,
            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : '#f4f6f8',
            color: theme === 'dark' ? '#919eab' : '#637381',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Globe size={13} style={{ color: '#00a76f' }} />
          <span>{language === 'en' ? 'मर' : 'EN'}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-all"
          style={{ color: theme === 'dark' ? '#919eab' : '#637381', border: 'none', cursor: 'pointer' }}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} style={{ color: '#ffab00' }} />}
        </button>

        {/* Admin Avatar - Clickable */}
        <div className="relative" ref={popRef}>
          <button
            onClick={() => setShowAdminPop(!showAdminPop)}
            className="flex items-center gap-2 pl-2 sm:pl-3 transition-opacity hover:opacity-80 focus:outline-none"
            style={{ borderLeft: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : '#f4f6f8'}`, marginLeft: '4px' }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: '32px', height: '32px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #00a76f 0%, #007867 100%)',
                boxShadow: 'rgba(0, 167, 111, 0.3) 0px 4px 8px 0px',
                color: '#fff', fontSize: '13px', fontWeight: 800, flexShrink: 0,
              }}
            >
              RS
            </div>
            <div className="hidden sm:block text-left">
              <p style={{ fontSize: '12px', fontWeight: 700, color: theme === 'dark' ? '#ffffff' : '#1c252e', lineHeight: 1.1 }}>Ramesh S.</p>
              <p style={{ fontSize: '10px', color: '#919eab' }}>Secretary</p>
            </div>
          </button>

          {/* Popover */}
          {showAdminPop && (
            <div
              style={{
                position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                width: '220px', backgroundColor: theme === 'dark' ? '#212b36' : '#ffffff',
                borderRadius: '12px', padding: '16px',
                boxShadow: '0 12px 24px -4px rgba(0,0,0,0.16)',
                border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(145,158,171,0.12)'}`,
                zIndex: 50,
              }}
            >
              <div className="mb-4 pb-4" style={{ borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.06)' : '#f4f6f8'}` }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: theme === 'dark' ? '#ffffff' : '#1c252e' }}>Ramesh Sonawale</p>
                <p style={{ fontSize: '12px', color: '#919eab' }}>Society Secretary</p>
              </div>
              <div className="space-y-1">
                <button 
                  className="w-full flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: theme === 'dark' ? '#ffffff' : '#1c252e', fontSize: '13px' }}
                >
                  <User size={16} /> Profile Information
                </button>
                <button 
                  className="w-full flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: theme === 'dark' ? '#ffffff' : '#1c252e', fontSize: '13px' }}
                >
                  <Settings size={16} /> Admin Settings
                </button>
                <button 
                  onClick={() => setAuth(false)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-red-50 text-red-500"
                  style={{ fontSize: '13px' }}
                >
                  <LogOut size={16} /> {language === 'en' ? 'Logout' : 'बाहेर पडा'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
