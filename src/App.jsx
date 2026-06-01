import React, { useMemo, useState } from 'react';
import Layout from './components/Layout.jsx';
import Modal from './components/Modal.jsx';
import { getModalConfig } from './components/AdminForms.jsx';
import { roleAccess } from './data/mockData.js';
import LoginScreen from './screens/LoginScreen.jsx';
import DashboardScreen from './screens/DashboardScreen.jsx';
import UsersScreen from './screens/UsersScreen.jsx';
import CompetitionsScreen from './screens/CompetitionsScreen.jsx';
import LeaderboardsScreen from './screens/LeaderboardsScreen.jsx';
import VouchersScreen from './screens/VouchersScreen.jsx';
import NotificationsScreen from './screens/NotificationsScreen.jsx';
import AnalyticsScreen from './screens/AnalyticsScreen.jsx';
import RewardsScreen from './screens/RewardsScreen.jsx';
import PurchasesScreen from './screens/PurchasesScreen.jsx';

const STORAGE_KEY = 'doradrink_admin_session';

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export default function App() {
  const [session, setSession] = useState(readSession);
  const [page, setPage] = useState('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [modal, setModal] = useState(null);

  const allowedPages = useMemo(() => session ? roleAccess[session.role] || roleAccess.super_admin : [], [session]);

  function handleLogin(nextSession) {
    saveSession(nextSession);
    setSession(nextSession);
    setPage('dashboard');
  }

  function handleLogout() {
    clearSession();
    setSession(null);
    setPage('dashboard');
    setModal(null);
  }

  function navigate(nextPage) {
    if (!allowedPages.includes(nextPage)) {
      setPage(allowedPages[0] || 'dashboard');
      return;
    }
    setPage(nextPage);
    setMobileNavOpen(false);
  }

  function confirmAction(message) {
    setModal({
      title: 'Confirm action',
      body: (
        <div className="grid gap-4">
          <p className="text-sm leading-6 text-muted">{message}</p>
          <div className="rounded-2xl border border-warning/40 bg-warning/10 p-3 text-sm leading-6 text-yellow-100">
            Sensitive admin actions must be checked by role on the backend and written to audit logs.
          </div>
        </div>
      ),
      confirmText: 'Confirm',
    });
  }

  function openModal(type, id = '') {
    setModal(getModalConfig(type, id, confirmAction));
  }

  function renderPage() {
    const shared = { session, openModal, confirmAction, onNavigate: navigate };
    const pages = {
      dashboard: <DashboardScreen session={session} onNavigate={navigate} />,
      users: <UsersScreen {...shared} />,
      competitions: <CompetitionsScreen {...shared} />,
      leaderboards: <LeaderboardsScreen {...shared} />,
      rewards: <RewardsScreen {...shared} />,
      purchases: <PurchasesScreen {...shared} />,
      vouchers: <VouchersScreen {...shared} />,
      notifications: <NotificationsScreen {...shared} />,
      analytics: <AnalyticsScreen {...shared} />,
    };

    return pages[page] || pages.dashboard;
  }

  if (!session) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const activePage = allowedPages.includes(page) ? page : allowedPages[0];

  return (
    <>
      <Layout
        session={session}
        page={activePage}
        allowedPages={allowedPages}
        mobileNavOpen={mobileNavOpen}
        onNavigate={navigate}
        onLogout={handleLogout}
        onToggleMenu={() => setMobileNavOpen(value => !value)}
      >
        {renderPage()}
      </Layout>
      <Modal modal={modal} onClose={() => setModal(null)} onConfirm={() => setModal(null)} />
    </>
  );
}
