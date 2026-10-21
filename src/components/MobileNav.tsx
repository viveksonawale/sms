import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Receipt,
  BarChart3,
  MessageSquareWarning,
} from 'lucide-react';
import { useStore } from '../store/useStore';

export default function MobileNav() {
  const language = useStore((state) => state.language);
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'dark';
  const isMarathi = language === 'mr';

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: isMarathi ? 'डॅशबोर्ड' : 'Dashboard' },
    { to: '/owners', icon: Users, label: isMarathi ? 'मालक' : 'Owners' },
    { to: '/expenses', icon: Receipt, label: isMarathi ? 'खर्च' : 'Expenses' },
    { to: '/reports', icon: BarChart3, label: isMarathi ? 'अहवाल' : 'Reports' },
    { to: '/warnings', icon: MessageSquareWarning, label: isMarathi ? 'सूचना' : 'Warnings' },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden print:hidden"
      style={{
        padding: '0 12px',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
        pointerEvents: 'none',
      }}
    >
      <div
        className="max-w-md mx-auto flex items-center justify-between"
        style={{
          pointerEvents: 'auto',
          backgroundColor: isDark ? 'rgba(24, 32, 42, 0.94)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '20px',
          padding: '6px 8px',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: isDark
            ? '0 12px 36px -4px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.06)'
            : '0 12px 30px -4px rgba(145, 158, 171, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.04)',
        }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all duration-200 select-none outline-none focus:outline-none focus:ring-0 active:scale-95 ${
                isActive
                  ? isDark
                    ? 'bg-orange-500/18 text-orange-500'
                    : 'bg-orange-500/12 text-orange-600'
                  : isDark
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-500 hover:text-gray-900'
              }`
            }
            style={{
              minHeight: '48px',
              touchAction: 'manipulation',
              textDecoration: 'none',
              outline: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {({ isActive }) => (
              <>
                <div
                  className="transition-transform duration-200 flex items-center justify-center"
                  style={{
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                    color: isActive ? '#f97316' : isDark ? '#919eab' : '#637381',
                  }}
                >
                  <item.icon size={20} strokeWidth={isActive ? 2.4 : 1.9} />
                </div>

                <span
                  className="text-[11px] mt-0.5 text-center leading-tight tracking-tight"
                  style={{
                    color: isActive ? '#f97316' : isDark ? '#919eab' : '#637381',
                    fontWeight: isActive ? 800 : 500,
                  }}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
