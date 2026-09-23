import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './ConfirmModal';
import { useToast } from './Toast';

const NAV_ITEMS = [
  { to: '/dashboard', label: '📊 Dashboard' },
  { to: '/detections', label: '🚨 Detections' },
  { to: '/reports', label: '📄 Reports' },
  { to: '/reported-medicines', label: '⚠️ Reported Medicines' },
];

const HEAD_ADMIN_NAV_ITEMS = [
  { to: '/pending-approvals', label: '✅ Approvals' },
  { to: '/admin-management', label: '👥 Admins' },
];

export function ProtectedLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const accountMenuRef = useRef(null);

  // Close the account dropdown on any click outside it.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target)
      ) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  const closeMobileMenu = () => setMobileOpen(false);

  const requestLogout = () => {
    if (loggingOut) return;
    setAccountMenuOpen(false);
    setConfirmLogoutOpen(true);
  };

  const confirmLogout = () => {
    if (loggingOut) return;
    setLoggingOut(true);

    // Logout itself is instant/local (clears session storage), but a
    // short processing state keeps the UI from feeling abrupt and
    // guarantees the click can't be fired twice.
    setTimeout(() => {
      logout();
      toast.success('Logged out successfully');
      setLoggingOut(false);
      setConfirmLogoutOpen(false);
      navigate('/login');
    }, 350);
  };

  const cancelLogout = () => {
    if (loggingOut) return;
    setConfirmLogoutOpen(false);
  };

  const isHeadAdmin = admin.role === 'HEAD_ADMIN';
  const allNavItems = isHeadAdmin
    ? [...NAV_ITEMS, ...HEAD_ADMIN_NAV_ITEMS]
    : NAV_ITEMS;

  const avatarLetter = (admin.name || '?').charAt(0).toUpperCase();

  return (
    <div className="app-shell">
      <div className="topnav">
        <div className="topnav-inner">
          <div className="topnav-logo">🛡️ VeriCure</div>

          <div className="topnav-links">
            {allNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  'topnav-link' + (isActive ? ' active' : '')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <button
            className="mobile-menu-btn topnav-mobile-toggle"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>

          <div className="topnav-account" ref={accountMenuRef}>
            <button
              className="topnav-account-trigger"
              onClick={() => setAccountMenuOpen((open) => !open)}
            >
              <div className="topnav-avatar">{avatarLetter}</div>
              <div className="topnav-account-text">
                <div className="topnav-account-name">
                  {admin.name}
                </div>
                <div className="topnav-account-role">
                  {isHeadAdmin ? 'Head Admin' : 'Admin'}
                </div>
              </div>
              <span className="topnav-account-caret">▾</span>
            </button>

            {accountMenuOpen && (
              <div className="topnav-account-menu">
                <button
                  className="topnav-account-menu-item"
                  onClick={requestLogout}
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>

        {mobileOpen && (
          <div className="topnav-mobile-panel">
            {allNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  'topnav-link' + (isActive ? ' active' : '')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>

      <div className="main-content">
        <Outlet />
      </div>

      <ConfirmModal
        open={confirmLogoutOpen}
        title="Logout?"
        message="Are you sure you want to logout?"
        confirmLabel="Logout"
        tone="danger"
        loading={loggingOut}
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </div>
  );
}

/*
 * Extra guard for pages that require HEAD_ADMIN specifically
 * (Pending Approvals, Admin Management). A regular ADMIN who
 * navigates here directly gets redirected back to Dashboard —
 * the backend enforces this too, this is just so the UI
 * doesn't show a broken/empty page.
 */
export function HeadAdminOnly({ children }) {
  const { admin } = useAuth();

  if (!admin || admin.role !== 'HEAD_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
