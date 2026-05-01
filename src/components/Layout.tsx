import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useStore } from '../store/useStore';

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'dark';

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: isDark ? '#141a21' : '#f9fafb' }}
    >
      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />

      {/* Main Content Area */}
      <div 
        className="flex-1 flex flex-col overflow-hidden min-w-0 transition-all duration-400"
        style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        <Topbar onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8"
          style={{ backgroundColor: isDark ? '#141a21' : '#f9fafb' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
