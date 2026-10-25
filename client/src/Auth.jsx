import { useState } from 'react';
import { api } from './api.js';

export default function Auth({ onSignIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try { onSignIn(await api.post('/login/', { username, password })); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <main className="auth-wrap"><section className="auth-card" aria-labelledby="signin-heading">
    <span className="brand-mark" aria-hidden="true" />
    <p className="eyebrow">YOUR STUDY PLAN, IN ONE PLACE</p>
    <h1 id="signin-heading">Master Study Tracker</h1>
    <p>Sign in to your tracker with your existing account.</p>
    <form onSubmit={submit}>
      <label className="field"><span>Username</span><input autoComplete="username" required value={username} onChange={e => setUsername(e.target.value)} /></label>
      <label className="field"><span>Password</span><input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
      {error && <p role="alert">{error}</p>}
      <button className="btn primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  </section></main>;
}
