import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { useEffect, useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import Layout from './components/Layout';

// Lazy load pages
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Owners = lazy(() => import('./pages/Owners'));
const OwnerDetail = lazy(() => import('./pages/OwnerDetail'));
const AddOwner = lazy(() => import('./pages/AddOwner'));
const Settings = lazy(() => import('./pages/Settings'));
const Expenses = lazy(() => import('./pages/Expenses'));
const AddExpense = lazy(() => import('./pages/AddExpense'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function LoadingScreen() {
  const theme = useStore((state) => state.theme);
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

function App() {
  const theme = useStore((state) => state.theme);
  const language = useStore((state) => state.language);
  const { i18n } = useTranslation();

  // Wait for Zustand to rehydrate from localStorage before rendering routes.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
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

  if (!hydrated) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <Suspense fallback={<LoadingScreen />}>
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
      </Suspense>
    </Router>
  );
}

export default App;
