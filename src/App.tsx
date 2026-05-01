import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Owners from './pages/Owners';
import OwnerDetail from './pages/OwnerDetail';
import AddOwner from './pages/AddOwner';
import Settings from './pages/Settings';
import Expenses from './pages/Expenses';
import AddExpense from './pages/AddExpense';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  const theme = useStore((state) => state.theme);
  const language = useStore((state) => state.language);
  const { i18n } = useTranslation();

  // Wait for Zustand to rehydrate from localStorage before rendering routes.
  // Without this, ProtectedRoute sees isAuthenticated=false for one frame and
  // immediately redirects even if the user was logged in.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // useStore.persist.hasHydrated() is true once localStorage is loaded.
    if (useStore.persist.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
      return unsub;
    }
  }, []);

  // Sync theme class on <html>
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Sync i18n language and body class
  useEffect(() => {
    i18n.changeLanguage(language);
    if (language === 'mr') {
      document.body.classList.add('lang-mr');
    } else {
      document.body.classList.remove('lang-mr');
    }
  }, [language, i18n]);

  // Show a minimal loading screen while Zustand rehydrates (< 50ms typically)
  if (!hydrated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: theme === 'dark' ? '#141a21' : '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid rgba(0, 167, 111, 0.2)',
          borderTop: '3px solid #00a76f',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="owners" element={<Owners />} />
          <Route path="owners/:id" element={<OwnerDetail />} />
          <Route path="owners/add" element={<AddOwner />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="expenses/add" element={<AddExpense />} />
          <Route path="expenses/edit/:id" element={<AddExpense />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
