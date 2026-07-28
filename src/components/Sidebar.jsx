// src/components/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { logOut } from '../firebase/auth';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/learn',     label: 'Learn' },
  { to: '/build',     label: 'Build' },
  { to: '/balance',   label: 'Balance' },
  { to: '/campus',    label: 'Campus' },
  { to: '/plan',      label: 'Study Plan' },
  { to: '/profile',   label: 'Profile' },
];

export default function Sidebar() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logOut();
    toast.success('Signed out');
    navigate('/');
  };

  const initials = (profile?.name || user?.displayName || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-logo-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <div className="sidebar-brand-text">
            <span className="brand-name">LIAB</span>
            <span className="brand-tag">STUDENT OS</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">MENU</div>
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Footer Profile */}
      <div
        className="sidebar-footer"
        style={{ cursor: 'pointer' }}
        onClick={() => navigate('/profile')}
        title="Edit Profile"
      >
        <div className="user-profile">
          <div className="user-avatar">{initials}</div>
          <div className="user-meta">
            <div className="user-name">{profile?.name || user?.displayName || 'Student'}</div>
            <div className="user-status">{profile?.course || 'Student Account'}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={(e) => { e.stopPropagation(); handleLogout(); }} title="Sign Out">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>

      <style>{`
        .sidebar {
          width: var(--sidebar-width);
          height: 100vh;
          position: fixed;
          top: 0; left: 0;
          background: var(--bg-surface);
          border-right: 1px solid var(--border-default);
          display: flex;
          flex-direction: column;
          padding: 20px 14px;
          z-index: 100;
        }

        .sidebar-header {
          padding: 4px 8px 18px;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 20px;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sidebar-logo-box {
          width: 28px; height: 28px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
        }

        .sidebar-logo-dot {
          width: 8px; height: 8px;
          background: var(--cyan-primary);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--cyan-primary);
        }

        .sidebar-brand-text {
          display: flex;
          flex-direction: column;
        }

        .brand-name {
          font-size: 0.95rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--text-primary);
          line-height: 1.1;
        }

        .brand-tag {
          font-size: 0.6rem;
          font-weight: 700;
          color: var(--cyan-text);
          letter-spacing: 0.12em;
        }

        .nav-section-title {
          font-size: 0.625rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.12em;
          padding: 0 10px;
          margin-bottom: 10px;
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 12px;
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          transition: var(--trans-fast);
          border: 1px solid transparent;
        }

        .nav-item:hover {
          background: var(--bg-elevated);
          color: var(--text-primary);
        }

        .nav-item.active {
          background: var(--bg-elevated);
          color: var(--text-primary);
          border-color: var(--border-default);
          font-weight: 600;
        }

        .sidebar-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: var(--bg-app);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          margin-top: auto;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 10px;
          overflow: hidden;
        }

        .user-avatar {
          width: 28px; height: 28px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 700; color: var(--text-primary);
          flex-shrink: 0;
        }

        .user-meta { overflow: hidden; }

        .user-name {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-status {
          font-size: 0.65rem;
          color: var(--text-muted);
        }

        .logout-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: var(--radius-xs);
          transition: var(--trans-fast);
          display: flex; align-items: center; justify-content: center;
        }

        .logout-btn:hover {
          color: var(--rose);
        }
      `}</style>
    </aside>
  );
}
