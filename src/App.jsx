// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';

import Landing  from './pages/Landing';
import Auth     from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Learn    from './pages/Learn';
import Build    from './pages/Build';
import Balance  from './pages/Balance';
import Campus   from './pages/Campus';
import Onboard  from './pages/Onboard';
import StudyPlan from './pages/StudyPlan';
import Profile   from './pages/Profile';
import Sidebar  from './components/Sidebar';

import './index.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullscreenLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
};

const AppShell = ({ children }) => (
  <div className="app-shell">
    <Sidebar />
    <div className="main-content">{children}</div>
  </div>
);

const FullscreenLoader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: 'var(--bg-base)',
  }}>
    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <div style={{
        width: 56, height: 56,
        background: 'linear-gradient(135deg, var(--accent), var(--purple))',
        borderRadius: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, animation: 'float 2s ease-in-out infinite',
      }}>🧠</div>
      <div className="spinner spinner-lg" />
    </div>
  </div>
);

const Router = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/"       element={user ? <Navigate to="/dashboard" /> : <Landing />} />
      <Route path="/auth"   element={user ? <Navigate to="/dashboard" /> : <Auth />} />
      <Route path="/onboard" element={
        <ProtectedRoute><Onboard /></ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppShell><Dashboard /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="/learn" element={
        <ProtectedRoute>
          <AppShell><Learn /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="/build" element={
        <ProtectedRoute>
          <AppShell><Build /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="/balance" element={
        <ProtectedRoute>
          <AppShell><Balance /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="/campus" element={
        <ProtectedRoute>
          <AppShell><Campus /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="/plan" element={
        <ProtectedRoute>
          <AppShell><StudyPlan /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <AppShell><Profile /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Router />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-strong)',
              fontFamily: 'var(--font)',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: 'var(--emerald)', secondary: 'var(--bg-elevated)' } },
            error:   { iconTheme: { primary: 'var(--rose)', secondary: 'var(--bg-elevated)' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
