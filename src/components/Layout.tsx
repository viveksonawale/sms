import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useStore } from '../store/useStore';
import { Helmet } from 'react-helmet-async';

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'dark';

  return (
    <>
      <Helmet>
        <title>Shri Sai Apartment - Society Management</title>
        <meta name="description" content="Manage your society's maintenance, payments, and residents from one place." />
        <meta property="og:title" content="Shri Sai Apartment - Society Management" />
        <meta property="og:description" content="Manage your society's maintenance, payments, and residents from one place." />
        <meta property="og:type" content="website" />
      </Helmet>
      <div
        className="flex h-[100svh] overflow-hidden print:h-auto print:overflow-visible print:!bg-white"
        style={{ backgroundColor: isDark ? '#141a21' : '#f9fafb' }}
      >
      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />

      {/* Main Content Area */}
      <div 
        className="flex-1 flex flex-col overflow-hidden min-w-0 transition-all duration-400 print:overflow-visible print:!bg-white"
        style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        <Topbar onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 mobile-scroll print:p-0 print:overflow-visible print:!bg-white"
          style={{
            backgroundColor: isDark ? '#141a21' : '#f9fafb',
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorY: 'contain',
          }}
        >
          <Outlet />
        </main>
      </div>
      </div>
    </>
  );
}
