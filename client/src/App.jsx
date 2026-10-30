import { NavLink, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from './api.js';
import Auth from './Auth.jsx';
import { NoticeProvider } from './components/ui.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Daily from './pages/Daily.jsx';
import Weekly from './pages/Weekly.jsx';
import Tests from './pages/Tests.jsx';
import Backlog from './pages/Backlog.jsx';
import Apfc from './pages/Apfc.jsx';
import CavaTracker from './pages/CavaTracker.jsx';
import PyqWorkbooks from './pages/PyqWorkbooks.jsx';
import GoogleSheetsSync from './pages/GoogleSheetsSync.jsx';
import Settings from './pages/Settings.jsx';
import Guide from './pages/Guide.jsx';
import PublicView from './pages/PublicView.jsx';
import TimerBar from './components/TimerBar.jsx';
import ThemeSelector from './components/ThemeSelector.jsx';

const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/daily', label: 'Daily log' },
  { to: '/weekly', label: 'Weekly plan' },
  { to: '/tests', label: 'Mocks & Tests' },
  { to: '/cava', label: 'CAVA Lectures' },
  { to: '/pyqs', label: 'PYQ Workbooks' },
  { to: '/backlog', label: 'CSE Backlog' },
  { to: '/apfc', label: 'APFC Course' },
  { to: '/sheets', label: 'Sheets Sync' },
  { to: '/settings', label: 'Settings' },
];

export default function App() {
  const isPublic = window.location.pathname.startsWith('/public');

  if (isPublic) {
    return (
      <NoticeProvider>
        <PublicView />
      </NoticeProvider>
    );
  }

  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/session/').then(setSession).catch(e => setError(e.message));
    const expire = () => setSession({ authenticated: false });
    window.addEventListener('session-expired', expire);
    return () => window.removeEventListener('session-expired', expire);
  }, []);
  if (!session) return <div className="auth-wrap"><div className="auth-card"><h1>Master Study Tracker</h1><p role="status">{error || 'Opening your tracker…'}</p>{error && <button className="btn" onClick={() => window.location.reload()}>Try again</button>}</div></div>;
  if (!session.authenticated) return <Auth onSignIn={setSession} />;
  async function signOut() {
    try { await api.post('/logout/', {}); setSession({ authenticated: false }); }
    catch (e) { setError(e.message); }
  }
  return (
    <NoticeProvider>
      <div className="shell">
        <nav className="side" aria-label="Main">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <span>Master Study Tracker <span className="v2-tag">v2</span></span>
          </div>
          <TimerBar />
          <ul>
            {NAV.map((n) => (
              <li key={n.to}>
                <NavLink to={n.to} end={n.end}>{n.label}</NavLink>
              </li>
            ))}
            <li>
              <NavLink to="/public">Public View ↗</NavLink>
            </li>
          </ul>
          <div className="side-theme-box">
            <ThemeSelector compact />
          </div>
          <NavLink to="/guide" className="guide-link">How this app is built (V2)</NavLink>
          <div className="account-block"><span>{session.username}</span><button className="btn ghost" onClick={signOut}>Sign out</button>{error && <p role="alert">{error}</p>}</div>
        </nav>
        <main className="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/daily" element={<Daily />} />
            <Route path="/weekly" element={<Weekly />} />
            <Route path="/tests" element={<Tests />} />
            <Route path="/cava" element={<CavaTracker />} />
            <Route path="/pyqs" element={<PyqWorkbooks />} />
            <Route path="/backlog" element={<Backlog />} />
            <Route path="/apfc" element={<Apfc />} />
            <Route path="/sheets" element={<GoogleSheetsSync />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/public" element={<PublicView />} />
            <Route path="*" element={<p className="empty">Page not found.</p>} />
          </Routes>
        </main>
      </div>
    </NoticeProvider>
  );
}
