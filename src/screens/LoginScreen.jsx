import { useState } from 'react';
import Button from '../components/Button.jsx';

const defaultApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
const defaultAdminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@doradrink.app';

export default function LoginScreen({ onLogin }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const apiBaseUrl = String(form.get('apiBaseUrl') || '').replace(/\/$/, '');
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Admin login failed.');
      }

      const result = await response.json();
      const session = result?.data || {};
      onLogin({
        email: session.admin?.email || form.get('email'),
        role: 'super_admin',
        apiBaseUrl,
        token: session.token,
        adminId: session.admin?.id,
        expiresAt: session.expiresAt,
      });
    } catch (err) {
      setError(err.message || 'Admin login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_15%_20%,rgba(54,169,255,0.16),transparent_28rem),radial-gradient(circle_at_85%_5%,rgba(155,97,255,0.2),transparent_28rem),#070A12] p-7">
      <section className="w-full max-w-lg rounded-2xl border border-line bg-panel/95 p-7 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand to-violet font-black">DD</div>
          <div>
            <p className="label">Protected staff console</p>
            <h1 className="text-2xl font-black">DoraDrink Admin</h1>
          </div>
        </div>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          {error ? <div className="rounded-2xl border border-danger/40 bg-danger/10 p-3 text-sm text-red-100">{error}</div> : null}
          <label className="grid gap-2">
            <span className="label">Admin email</span>
            <input className="input" name="email" type="email" defaultValue={defaultAdminEmail} required />
          </label>
          <label className="grid gap-2">
            <span className="label">Password</span>
            <input className="input" name="password" type="password" required />
          </label>
          <label className="grid gap-2">
            <span className="label">API base URL</span>
            <input className="input" name="apiBaseUrl" defaultValue={defaultApiBaseUrl} />
          </label>
          <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</Button>
        </form>
      </section>
    </main>
  );
}
