import { useCallback, useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import DataTable from '../components/DataTable.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { adminRequest, unwrapData } from '../lib/adminApi.js';

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'user', label: 'User' },
  { key: 'currency', label: 'Currency' },
  { key: 'amount', label: 'Amount' },
  { key: 'source', label: 'Source' },
  { key: 'created', label: 'Created' },
  { key: 'actor', label: 'Actor' },
];

function mapReward(reward) {
  return {
    id: String(reward._id),
    user: String(reward.userId || '-'),
    currency: reward.currency || '-',
    amount: reward.amount > 0 ? `+${reward.amount}` : reward.amount,
    source: reward.type || reward.source || '-',
    created: reward.createdAt ? new Date(reward.createdAt).toLocaleString() : '-',
    actor: reward.actor || 'system',
  };
}

export default function RewardsScreen({ session }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    userId: '',
    currency: 'coins',
    amount: 25,
    reason: '',
    internalNote: '',
  });

  const loadRewards = useCallback(async () => {
    try {
      setLoading(true);
      const data = unwrapData(await adminRequest(session, '/api/admin/rewards'));
      setRows((data.rewards || []).map(mapReward));
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load rewards.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadRewards();
  }, [loadRewards]);

  function updateField(key, value) {
    setForm(current => ({ ...current, [key]: value }));
  }

  async function submitAdjustment(event) {
    event.preventDefault();
    setSaving(true);

    try {
      await adminRequest(session, '/api/admin/rewards/manual-adjustment', {
        method: 'POST',
        body: JSON.stringify({
          userId: form.userId.trim(),
          currency: form.currency,
          amount: Number(form.amount),
          reason: form.reason,
          internalNote: form.internalNote,
        }),
      });
      setForm(current => ({ ...current, userId: '', reason: '', internalNote: '' }));
      await loadRewards();
    } catch (err) {
      setError(err.message || 'Unable to save manual adjustment.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Rewards"
        subtitle="Ledger, reward economy, ad rewards, bonuses, and manual adjustments."
        actions={<Button variant="primary" onClick={loadRewards}>Refresh ledger</Button>}
      />
      <div className="rounded-2xl border border-warning/40 bg-warning/10 p-3 text-sm leading-6 text-yellow-100">
        Manual wallet adjustments must create both a reward ledger entry and an audit log. Large adjustments require Super Admin approval.
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="card">
          {error ? <div className="mb-4 rounded-2xl border border-danger/40 bg-danger/10 p-3 text-sm text-red-100">{error}</div> : null}
          {loading ? <div className="mb-4 text-sm text-muted">Loading reward ledger...</div> : null}
          <DataTable columns={columns} rows={rows} />
        </div>
        <aside className="card">
          <h2 className="font-black">Manual adjustment</h2>
          <form className="mt-4 grid gap-3" onSubmit={submitAdjustment}>
            <label className="grid gap-2"><span className="label">Backend user ID</span><input className="input" required value={form.userId} onChange={event => updateField('userId', event.target.value)} placeholder="Mongo user id" /></label>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <label className="grid gap-2"><span className="label">Currency</span><select className="input" value={form.currency} onChange={event => updateField('currency', event.target.value)}><option value="coins">coins</option><option value="diamonds">diamonds</option></select></label>
              <label className="grid gap-2"><span className="label">Amount</span><input className="input" type="number" required value={form.amount} onChange={event => updateField('amount', event.target.value)} /></label>
            </div>
            <label className="grid gap-2"><span className="label">Reason</span><input className="input" required value={form.reason} onChange={event => updateField('reason', event.target.value)} /></label>
            <label className="grid gap-2"><span className="label">Internal note</span><textarea className="input min-h-24" value={form.internalNote} onChange={event => updateField('internalNote', event.target.value)} /></label>
            <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Submit adjustment'}</Button>
          </form>
        </aside>
      </div>
    </>
  );
}
