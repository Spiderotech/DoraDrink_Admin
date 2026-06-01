import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../components/Button.jsx';
import DataTable from '../components/DataTable.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { adminRequest, unwrapData } from '../lib/adminApi.js';

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'username', label: 'Username' },
  { key: 'email', label: 'Email' },
  { key: 'country', label: 'Country' },
  { key: 'city', label: 'City' },
  { key: 'coins', label: 'Coins' },
  { key: 'diamonds', label: 'Diamonds' },
  { key: 'energy', label: 'Energy' },
  { key: 'streak', label: 'Streak' },
  { key: 'lastActive', label: 'Last active' },
  { key: 'status', label: 'Status' },
];

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '-';
}

function mapUser(user) {
  return {
    id: String(user._id),
    username: user.username || '-',
    email: user.firebaseUid || user.guestId || '-',
    country: user.country || '-',
    city: user.city || '-',
    coins: user.wallet?.coins ?? 0,
    diamonds: user.wallet?.diamonds ?? 0,
    energy: user.activityLevel || '-',
    streak: user.currentStreakDays ?? 0,
    lastActive: formatDate(user.updatedAt),
    status: user.status || 'active',
  };
}

export default function UsersScreen({ session, openModal }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [country, setCountry] = useState('all');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (status !== 'all') query.set('status', status);
      if (country !== 'all') query.set('country', country);

      const suffix = query.toString() ? `?${query.toString()}` : '';
      const data = unwrapData(await adminRequest(session, `/api/admin/users${suffix}`));
      setRows((data.users || []).map(mapUser));
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  }, [country, search, session, status]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const countries = useMemo(() => ['all', ...new Set(rows.map(row => row.country).filter(value => value && value !== '-'))], [rows]);

  const filteredUsers = useMemo(() => rows.filter(user => {
    const haystack = Object.values(user).join(' ').toLowerCase();
    return (!search || haystack.includes(search.toLowerCase()))
      && (status === 'all' || user.status === status)
      && (country === 'all' || user.country === country);
  }), [country, rows, search, status]);

  async function updateStatus(row, nextStatus) {
    if (!window.confirm(`Set ${row.username} status to ${nextStatus}?`)) return;

    try {
      await adminRequest(session, `/api/admin/users/${row.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus, reason: 'Updated from admin panel' }),
      });
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Unable to update user status.');
    }
  }

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Search, inspect, and support hydration users."
        actions={<Button variant="primary" onClick={loadUsers}>Refresh users</Button>}
      />
      <div className="card">
        {error ? <div className="mb-4 rounded-2xl border border-danger/40 bg-danger/10 p-3 text-sm text-red-100">{error}</div> : null}
        <div className="mb-4 flex flex-wrap gap-3">
          <input className="input max-w-sm" placeholder="Search username, email, city" value={search} onChange={event => setSearch(event.target.value)} />
          <select className="input max-w-44" value={status} onChange={event => setStatus(event.target.value)}>
            {['all', 'active', 'disabled'].map(value => <option key={value} value={value}>{value}</option>)}
          </select>
          <select className="input max-w-44" value={country} onChange={event => setCountry(event.target.value)}>
            {countries.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
          {loading ? <span className="label self-center">Loading</span> : null}
        </div>
        <DataTable
          columns={columns}
          rows={filteredUsers}
          renderActions={row => (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => openModal('userDetail', row.id)}>Inspect</Button>
              {row.status === 'disabled' ? (
                <Button onClick={() => updateStatus(row, 'active')}>Enable</Button>
              ) : (
                <Button variant="danger" onClick={() => updateStatus(row, 'disabled')}>Disable</Button>
              )}
            </div>
          )}
        />
      </div>
    </>
  );
}
