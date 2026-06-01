import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../components/Button.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { adminRequest, unwrapData } from '../lib/adminApi.js';

const defaultForm = {
  code: '',
  title: 'Rank #1 Gift Voucher',
  provider: 'Amazon',
  category: 'competition',
  valueLabel: '₹500',
  redemptionUrl: '',
  platformLogoUrl: '',
  expiresAt: '',
  terms: 'Valid once. Voucher cannot be transferred after assignment.',
};

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '-';
}

function mapVoucher(voucher) {
  const assignedUser = voucher.assignedUserId || {};
  const competition = voucher.competitionId || {};

  return {
    id: String(voucher._id),
    code: voucher.code || '-',
    title: voucher.title || '-',
    provider: voucher.provider || '-',
    valueLabel: voucher.valueLabel || '-',
    platform: voucher.redemptionUrl ? 'Open link' : '-',
    redemptionUrl: voucher.redemptionUrl || '',
    platformLogoUrl: voucher.platformLogoUrl || '',
    competition: competition.title || '-',
    user: assignedUser.username || '-',
    status: voucher.status || 'available',
    expiresAt: formatDate(voucher.expiresAt),
  };
}

export default function VouchersScreen({ session }) {
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [assignForm, setAssignForm] = useState({ voucherId: '', userId: '', competitionId: '' });
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const availableRows = useMemo(() => rows.filter(row => row.status === 'available'), [rows]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [voucherData, userData, competitionData] = await Promise.all([
        adminRequest(session, '/api/admin/vouchers'),
        adminRequest(session, '/api/admin/users'),
        adminRequest(session, '/api/admin/competitions'),
      ]);

      const nextRows = (unwrapData(voucherData).vouchers || []).map(mapVoucher);
      const nextUsers = unwrapData(userData).users || [];
      const nextCompetitions = unwrapData(competitionData).competitions || [];

      setRows(nextRows);
      setUsers(nextUsers);
      setCompetitions(nextCompetitions);
      setAssignForm(current => ({
        ...current,
        voucherId: current.voucherId || nextRows.find(row => row.status === 'available')?.id || '',
        userId: current.userId || nextUsers[0]?._id || '',
        competitionId: current.competitionId || nextCompetitions[0]?._id || '',
      }));
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load vouchers.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function updateField(key, value) {
    setForm(current => ({ ...current, [key]: value }));
  }

  async function createVoucher(event) {
    event.preventDefault();
    setSaving(true);

    try {
      let platformLogoUrl = form.platformLogoUrl || null;
      if (logoFile) {
        const uploadBody = new FormData();
        uploadBody.append('logo', logoFile);
        const uploadResult = unwrapData(await adminRequest(session, '/api/admin/vouchers/logo-upload', {
          method: 'POST',
          body: uploadBody,
        }));
        platformLogoUrl = uploadResult.platformLogoUrl;
      }

      await adminRequest(session, '/api/admin/vouchers', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          redemptionUrl: form.redemptionUrl || null,
          platformLogoUrl,
          expiresAt: form.expiresAt || null,
        }),
      });
      setForm(current => ({ ...current, code: '', platformLogoUrl: '' }));
      setLogoFile(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to create voucher.');
    } finally {
      setSaving(false);
    }
  }

  async function assignVoucher(event) {
    event.preventDefault();
    if (!assignForm.voucherId || !assignForm.userId) return;

    setSaving(true);
    try {
      await adminRequest(session, `/api/admin/vouchers/${assignForm.voucherId}/assign`, {
        method: 'POST',
        body: JSON.stringify({
          userId: assignForm.userId,
          competitionId: assignForm.competitionId || undefined,
          reason: 'Manual voucher assignment',
        }),
      });
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to assign voucher.');
    } finally {
      setSaving(false);
    }
  }

  async function markUsed(row) {
    if (!window.confirm(`Mark voucher ${row.code} as used?`)) return;

    try {
      await adminRequest(session, `/api/admin/vouchers/${row.id}/used`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Marked used from admin panel' }),
      });
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to mark voucher used.');
    }
  }

  async function deleteUsedVoucher(row) {
    if (!window.confirm(`Delete used voucher ${row.code}? This cannot be undone.`)) return;

    try {
      await adminRequest(session, `/api/admin/vouchers/${row.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason: 'Deleted used voucher from admin panel' }),
      });
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to delete voucher.');
    }
  }

  return (
    <>
      <PageHeader
        title="Vouchers"
        subtitle="Create voucher inventory, assign winners, and track voucher use."
        actions={<Button variant="primary" onClick={loadData}>Refresh vouchers</Button>}
      />
      <div className="grid gap-4">
        {error ? <div className="rounded-2xl border border-danger/40 bg-danger/10 p-3 text-sm text-red-100">{error}</div> : null}
        {loading ? <div className="text-sm text-muted">Loading vouchers...</div> : null}

        <section className="card min-w-0">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-black">Voucher Inventory</h2>
              <p className="mt-1 text-sm text-muted">Rank #1 rewards use the oldest available voucher automatically during reward distribution.</p>
            </div>
            <span className="pill pill-info">{availableRows.length} available</span>
          </div>
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-line bg-[#0b1220] p-4 text-sm text-muted">No vouchers found.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {rows.map(row => (
                <VoucherInventoryCard
                  key={row.id}
                  row={row}
                  onReveal={() => window.alert(`Voucher code: ${row.code}`)}
                  onSelect={() => setAssignForm(current => ({ ...current, voucherId: row.id }))}
                  onMarkUsed={() => markUsed(row)}
                  onDelete={() => deleteUsedVoucher(row)}
                />
              ))}
            </div>
          )}
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="card min-w-0">
            <h2 className="font-black">Create Voucher</h2>
            <form className="mt-5 grid gap-4" onSubmit={createVoucher}>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2"><span className="label">Code</span><input className="input" required value={form.code} placeholder="AMZ-XXXX-XXXX" onChange={event => updateField('code', event.target.value)} /></label>
                <label className="grid gap-2"><span className="label">Value</span><input className="input" value={form.valueLabel} placeholder="₹500" onChange={event => updateField('valueLabel', event.target.value)} /></label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2"><span className="label">Title</span><input className="input" value={form.title} onChange={event => updateField('title', event.target.value)} /></label>
                <label className="grid gap-2"><span className="label">Provider</span><input className="input" value={form.provider} onChange={event => updateField('provider', event.target.value)} /></label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2"><span className="label">Platform link</span><input className="input" type="url" value={form.redemptionUrl} placeholder="https://www.amazon.in/gift-card" onChange={event => updateField('redemptionUrl', event.target.value)} /></label>
                <label className="grid gap-2">
                  <span className="label">Platform logo image</span>
                  <input
                    className="input"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={event => setLogoFile(event.target.files?.[0] || null)}
                  />
                </label>
              </div>
              {logoFile || form.platformLogoUrl ? (
                <div className="rounded-2xl border border-line bg-[#0b1220] p-3 text-sm text-muted">
                  <span className="label">Logo preview</span>
                  <div className="mt-3 flex items-center gap-3">
                    {form.platformLogoUrl ? <img src={form.platformLogoUrl} alt="Voucher platform logo" className="h-12 w-12 rounded-xl bg-white object-contain p-2" /> : null}
                    <span>{logoFile ? logoFile.name : 'Stored logo URL will be used.'}</span>
                  </div>
                </div>
              ) : null}
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2"><span className="label">Category</span><input className="input" value={form.category} onChange={event => updateField('category', event.target.value)} /></label>
                <label className="grid gap-2"><span className="label">Expires</span><input className="input" type="date" value={form.expiresAt} onChange={event => updateField('expiresAt', event.target.value)} /></label>
              </div>
              <label className="grid gap-2"><span className="label">Terms</span><textarea className="input min-h-28" value={form.terms} onChange={event => updateField('terms', event.target.value)} /></label>
              <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Create voucher'}</Button>
            </form>
          </section>

          <section className="card min-w-0">
            <h2 className="font-black">Manual Assignment</h2>
            <p className="mt-1 text-sm leading-6 text-muted">Use this only for support cases. Normal Rank #1 assignment happens from competition reward distribution.</p>
            <form className="mt-5 grid gap-4" onSubmit={assignVoucher}>
              <label className="grid gap-2">
                <span className="label">Voucher</span>
                <select className="input" value={assignForm.voucherId} onChange={event => setAssignForm(current => ({ ...current, voucherId: event.target.value }))}>
                  {rows.map(row => <option key={row.id} value={row.id}>{row.code} - {row.status}</option>)}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="label">User</span>
                <select className="input" value={assignForm.userId} onChange={event => setAssignForm(current => ({ ...current, userId: event.target.value }))}>
                  {users.map(user => <option key={user._id} value={user._id}>{user.username} ({user.wallet?.diamonds ?? 0} diamonds)</option>)}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="label">Competition</span>
                <select className="input" value={assignForm.competitionId} onChange={event => setAssignForm(current => ({ ...current, competitionId: event.target.value }))}>
                  <option value="">No competition</option>
                  {competitions.map(competition => <option key={competition._id} value={competition._id}>{competition.title}</option>)}
                </select>
              </label>
              <Button variant="primary" type="submit" disabled={saving || !assignForm.voucherId || !assignForm.userId}>Assign voucher</Button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}

function voucherStatusClass(status) {
  if (status === 'available') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100';
  if (status === 'reserved') return 'border-amber-400/30 bg-amber-400/10 text-amber-100';
  if (status === 'used' || status === 'expired') return 'border-red-400/30 bg-red-400/10 text-red-100';
  return 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100';
}

function VoucherLogo({ row }) {
  return (
    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-900/10 bg-white p-2 text-slate-950 shadow-sm">
      {row.platformLogoUrl ? (
        <img src={row.platformLogoUrl} alt={`${row.provider} logo`} className="h-full w-full object-contain" />
      ) : (
        <span className="text-xl font-black">{String(row.provider || 'V').slice(0, 1).toUpperCase()}</span>
      )}
    </div>
  );
}

function VoucherInventoryCard({ row, onReveal, onSelect, onMarkUsed, onDelete }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-[#0b1220] shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
      <div className="relative overflow-hidden border-b border-white/20 bg-gradient-to-br from-[#fff2bd] via-[#ffd36f] to-[#ff9f2f] p-4 text-[#251500]">
        <div className="absolute -left-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-[#0b1220]" />
        <div className="absolute -right-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-[#0b1220]" />
        <div className="absolute right-4 top-7 text-5xl font-black text-white/20">DORA</div>
        <div className="relative flex items-center gap-3">
          <VoucherLogo row={row} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-black">{row.provider}</h3>
            <p className="truncate text-xs font-extrabold text-[#6d3b00]">{row.valueLabel || row.title}</p>
          </div>
          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase ${voucherStatusClass(row.status)}`}>{row.status}</span>
        </div>
        <div className="relative mt-4 rounded-xl border border-[#5c3500]/10 bg-white/45 p-3">
          <p className="text-[10px] font-black uppercase text-[#7a4300]">Voucher code</p>
          <p className="mt-1 truncate font-mono text-lg font-black tracking-wide">{row.code}</p>
        </div>
      </div>

      <div className="grid gap-3 p-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <VoucherMeta label="User" value={row.user} />
          <VoucherMeta label="Expires" value={row.expiresAt} />
          <VoucherMeta label="Competition" value={row.competition} wide />
          <VoucherMeta
            label="Platform"
            value={row.redemptionUrl ? <a className="text-cyan-200 underline decoration-cyan-400/60" href={row.redemptionUrl} target="_blank" rel="noreferrer">Open link</a> : '-'}
            wide
          />
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button onClick={onReveal}>Reveal</Button>
          <Button onClick={onSelect}>Select</Button>
          {row.status !== 'used' ? <Button variant="danger" onClick={onMarkUsed}>Used</Button> : null}
          {row.status === 'used' ? <Button variant="danger" onClick={onDelete}>Delete</Button> : null}
        </div>
      </div>
    </article>
  );
}

function VoucherMeta({ label, value, wide = false }) {
  return (
    <div className={`rounded-xl border border-line bg-[#080d18] p-3 ${wide ? 'col-span-2' : ''}`}>
      <p className="label">{label}</p>
      <div className="mt-1 truncate text-sm font-extrabold text-slate-100">{value || '-'}</div>
    </div>
  );
}
