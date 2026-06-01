import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../components/Button.jsx';
import DataTable from '../components/DataTable.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { adminRequest, unwrapData } from '../lib/adminApi.js';

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'start', label: 'Start' },
  { key: 'end', label: 'End' },
  { key: 'fee', label: 'Entry fee' },
  { key: 'voucher', label: 'Voucher' },
  { key: 'participants', label: 'Participants' },
  { key: 'rewardStatus', label: 'Reward status' },
];

const participantColumns = [
  { key: 'rank', label: 'Rank' },
  { key: 'username', label: 'User' },
  { key: 'location', label: 'Location' },
  { key: 'tapScore', label: 'Score' },
  { key: 'completedSlotCount', label: 'Slots' },
  { key: 'joinedAt', label: 'Joined' },
  { key: 'rewardClaimed', label: 'Reward' },
];

const today = new Date().toISOString().slice(0, 10);

function plusDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function mapCompetition(competition) {
  return {
    id: String(competition._id),
    title: competition.title || '-',
    status: competition.status || 'draft',
    start: competition.startDate ? new Date(competition.startDate).toLocaleDateString() : '-',
    end: competition.endDate ? new Date(competition.endDate).toLocaleDateString() : '-',
    fee: `${competition.entryFeeDiamonds ?? 0} diamonds`,
    voucher: competition.selectedVoucher
      ? `${competition.selectedVoucher.provider || 'Voucher'} · ${competition.selectedVoucher.code || '-'}`
      : '-',
    selectedVoucher: competition.selectedVoucher || null,
    participants: competition.participants ?? 0,
    rewardStatus: competition.rewardStatus || 'draft',
  };
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : '-';
}

function mapParticipant(participant) {
  return {
    id: participant.entryId,
    rank: `#${participant.rank}`,
    username: participant.username,
    location: [participant.city, participant.country].filter(Boolean).join(', ') || '-',
    tapScore: Number(participant.tapScore || 0).toLocaleString(),
    completedSlotCount: participant.completedSlotCount ?? 0,
    joinedAt: formatDateTime(participant.joinedAt),
    rewardClaimed: participant.rewardClaimed ? 'claimed' : 'pending',
  };
}

export default function CompetitionsScreen({ session }) {
  const [rows, setRows] = useState([]);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState('');
  const [competitionDetail, setCompetitionDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: 'Weekly Hydration Challenge',
    description: 'Complete hydration slots and climb the weekly leaderboard.',
    type: 'global',
    startDate: today,
    endDate: plusDays(7),
    entryFeeDiamonds: 2,
    rankOneCoins: 300,
    rankOneDiamonds: 2,
    rankTwoCoins: 150,
    rankTwoDiamonds: 1,
    topTenCoins: 75,
    selectedVoucherId: '',
  });

  const loadCompetitions = useCallback(async () => {
    try {
      setLoading(true);
      const [competitionData, voucherData] = await Promise.all([
        adminRequest(session, '/api/admin/competitions'),
        adminRequest(session, '/api/admin/vouchers'),
      ]);
      const data = unwrapData(competitionData);
      const voucherPayload = unwrapData(voucherData);
      const vouchers = (voucherPayload.vouchers || []).filter(voucher => voucher.status === 'available');
      const nextRows = (data.competitions || []).map(mapCompetition);
      setRows(nextRows);
      setAvailableVouchers(vouchers);
      setForm(current => ({
        ...current,
        selectedVoucherId: current.selectedVoucherId || vouchers[0]?._id || '',
      }));
      if (!selectedCompetitionId && nextRows[0]) {
        setSelectedCompetitionId(nextRows[0].id);
      }
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load competitions.');
    } finally {
      setLoading(false);
    }
  }, [selectedCompetitionId, session]);

  const loadCompetitionDetail = useCallback(async (competitionId) => {
    if (!competitionId) return;

    try {
      setDetailLoading(true);
      const data = unwrapData(await adminRequest(session, `/api/admin/competitions/${competitionId}`));
      setCompetitionDetail({
        competition: data.competition,
        participants: (data.participants || []).map(mapParticipant),
      });
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load competition detail.');
    } finally {
      setDetailLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadCompetitions();
  }, [loadCompetitions]);

  useEffect(() => {
    loadCompetitionDetail(selectedCompetitionId);
  }, [loadCompetitionDetail, selectedCompetitionId]);

  const rewardPreview = useMemo(() => [
    `Rank 1: ${form.rankOneDiamonds || 0} diamonds + ${form.rankOneCoins || 0} coins + voucher gift`,
    `Ranks 2-3: ${form.rankTwoDiamonds || 0} diamond + ${form.rankTwoCoins || 0} coins`,
    `Ranks 4-10: ${form.topTenCoins || 0} coins`,
    'Other participants: 75% entry credit back + 20-50 bonus coins',
  ], [form.rankOneCoins, form.rankOneDiamonds, form.rankTwoCoins, form.rankTwoDiamonds, form.topTenCoins]);

  const unfinishedCompetition = useMemo(
    () => rows.find(row =>
      ['draft', 'scheduled', 'active'].includes(row.status)
      || (row.status === 'closed' && row.rewardStatus !== 'distributed'),
    ),
    [rows],
  );
  const createLocked = Boolean(unfinishedCompetition);
  const voucherLocked = availableVouchers.length === 0;

  function updateField(key, value) {
    setForm(current => ({ ...current, [key]: value }));
  }

  async function createCompetition(event) {
    event.preventDefault();
    if (createLocked) {
      setError(`Complete "${unfinishedCompetition.title}" before creating the next weekly challenge.`);
      return;
    }
    if (!form.selectedVoucherId) {
      setError('Select an available voucher before creating the weekly challenge.');
      return;
    }
    setSaving(true);

    try {
      await adminRequest(session, '/api/admin/competitions', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          type: form.type,
          startDate: form.startDate,
          endDate: form.endDate,
          entryFeeDiamonds: Number(form.entryFeeDiamonds),
          selectedVoucherId: form.selectedVoucherId,
          rewards: [
            {
              rankFrom: 1,
              rankTo: 1,
              rewardType: 'voucher_badge',
              value: 'Rank #1 Gift Voucher',
              coins: Number(form.rankOneCoins),
              diamonds: Number(form.rankOneDiamonds),
            },
            {
              rankFrom: 2,
              rankTo: 3,
              rewardType: 'diamonds_coins',
              coins: Number(form.rankTwoCoins),
              diamonds: Number(form.rankTwoDiamonds),
            },
            { rankFrom: 4, rankTo: 10, rewardType: 'coins', coins: Number(form.topTenCoins) },
            { rankFrom: 11, rankTo: 9999, rewardType: 'participation', value: '75% credit back + 20-50 bonus coins' },
          ],
        }),
      });
      await loadCompetitions();
      setForm(current => ({ ...current, title: '', description: '', selectedVoucherId: '' }));
    } catch (err) {
      setError(err.message || 'Unable to create competition.');
    } finally {
      setSaving(false);
    }
  }

  async function runAction(row, action) {
    const labels = {
      publish: 'Publish this competition to mobile users?',
      close: 'Close this competition?',
      'rerun-leaderboard': 'Rerun the leaderboard snapshot?',
      'distribute-rewards': 'Distribute rewards to ranked participants?',
    };

    if (!window.confirm(labels[action])) return;

    try {
      await adminRequest(session, `/api/admin/competitions/${row.id}/${action}`, {
        method: 'POST',
        body: JSON.stringify({ reason: `Admin panel ${action}` }),
      });
      await loadCompetitions();
      await loadCompetitionDetail(row.id);
    } catch (err) {
      setError(err.message || 'Unable to update competition.');
    }
  }

  return (
    <>
      <PageHeader
        title="Competitions"
        subtitle="Create, schedule, monitor, close, and distribute rewards."
        actions={<Button variant="primary" onClick={loadCompetitions}>Refresh competitions</Button>}
      />
      <div className="grid gap-4">
        <section className="card min-w-0">
          {error ? <div className="mb-4 rounded-2xl border border-danger/40 bg-danger/10 p-3 text-sm text-red-100">{error}</div> : null}
          {loading ? <div className="mb-4 text-sm text-muted">Loading competitions...</div> : null}
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-black">Competition List</h2>
              <p className="mt-1 text-sm text-muted">Select a competition to inspect participants and leaderboard data.</p>
            </div>
          </div>
          <DataTable
            columns={columns}
            rows={rows}
            renderActions={row => (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setSelectedCompetitionId(row.id)}>Detail</Button>
                {row.status !== 'active' ? <Button onClick={() => runAction(row, 'publish')}>Publish</Button> : null}
                {row.status !== 'closed' ? <Button variant="danger" onClick={() => runAction(row, 'close')}>Close</Button> : null}
                <Button onClick={() => runAction(row, 'rerun-leaderboard')}>Rerun</Button>
                <Button variant="primary" onClick={() => runAction(row, 'distribute-rewards')}>Distribute</Button>
              </div>
            )}
          />
        </section>

        <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
          <aside className="card min-w-0">
            <h2 className="text-lg font-black">Create Competition</h2>
            <p className="mt-1 text-sm leading-6 text-muted">Create a draft first. Use Publish when it is ready for mobile users and push notification.</p>
            {createLocked ? (
              <div className="mt-4 rounded-2xl border border-warning/40 bg-warning/10 p-3 text-sm leading-6 text-amber-100">
                Finish <strong>{unfinishedCompetition.title}</strong> first. Close it and distribute rewards before creating the next weekly challenge.
              </div>
            ) : null}
            {!createLocked && voucherLocked ? (
              <div className="mt-4 rounded-2xl border border-danger/40 bg-danger/10 p-3 text-sm leading-6 text-red-100">
                Add an available voucher first. Rank #1 voucher reward must be selected before creating the challenge.
              </div>
            ) : null}
            <form className="mt-5 grid gap-4" onSubmit={createCompetition}>
              <label className="grid gap-2"><span className="label">Title</span><input className="input" disabled={createLocked} required value={form.title} placeholder="Weekly Hydration Challenge" onChange={event => updateField('title', event.target.value)} /></label>
              <label className="grid gap-2"><span className="label">Description</span><textarea className="input min-h-28" disabled={createLocked} value={form.description} placeholder="Complete hydration slots and climb the leaderboard." onChange={event => updateField('description', event.target.value)} /></label>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                <label className="grid gap-2"><span className="label">Start</span><input className="input" disabled={createLocked} type="date" required value={form.startDate} onChange={event => updateField('startDate', event.target.value)} /></label>
                <label className="grid gap-2"><span className="label">End</span><input className="input" disabled={createLocked} type="date" required value={form.endDate} onChange={event => updateField('endDate', event.target.value)} /></label>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                <label className="grid gap-2"><span className="label">Type</span><select className="input" disabled={createLocked} value={form.type} onChange={event => updateField('type', event.target.value)}><option value="global">global</option><option value="country">country</option><option value="city">city</option></select></label>
                <label className="grid gap-2"><span className="label">Entry fee diamonds</span><input className="input" disabled={createLocked} type="number" min="0" max="100" value={form.entryFeeDiamonds} onChange={event => updateField('entryFeeDiamonds', event.target.value)} /></label>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                <label className="grid gap-2"><span className="label">Rank 1 coins</span><input className="input" disabled={createLocked} type="number" min="0" value={form.rankOneCoins} onChange={event => updateField('rankOneCoins', event.target.value)} /></label>
                <label className="grid gap-2"><span className="label">Rank 1 diamonds</span><input className="input" disabled={createLocked} type="number" min="0" value={form.rankOneDiamonds} onChange={event => updateField('rankOneDiamonds', event.target.value)} /></label>
                <label className="grid gap-2">
                  <span className="label">Rank 1 voucher</span>
                  <select className="input" disabled={createLocked || voucherLocked} required value={form.selectedVoucherId} onChange={event => updateField('selectedVoucherId', event.target.value)}>
                    <option value="">Select available voucher</option>
                    {availableVouchers.map(voucher => (
                      <option key={voucher._id} value={voucher._id}>
                        {voucher.provider || 'Voucher'} - {voucher.code} {voucher.valueLabel ? `(${voucher.valueLabel})` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                {!createLocked && form.selectedVoucherId ? (
                  <div className="md:col-span-2 xl:col-span-1">
                    <SelectedVoucherMiniCard voucher={availableVouchers.find(voucher => voucher._id === form.selectedVoucherId)} />
                  </div>
                ) : null}
                <label className="grid gap-2"><span className="label">Ranks 2-3 coins</span><input className="input" disabled={createLocked} type="number" min="0" value={form.rankTwoCoins} onChange={event => updateField('rankTwoCoins', event.target.value)} /></label>
                <label className="grid gap-2"><span className="label">Ranks 2-3 diamonds</span><input className="input" disabled={createLocked} type="number" min="0" value={form.rankTwoDiamonds} onChange={event => updateField('rankTwoDiamonds', event.target.value)} /></label>
                <label className="grid gap-2"><span className="label">Ranks 4-10 coins</span><input className="input" disabled={createLocked} type="number" min="0" value={form.topTenCoins} onChange={event => updateField('topTenCoins', event.target.value)} /></label>
              </div>
              <div className="rounded-2xl border border-line bg-[#0b1220] p-3">
                <p className="label">Reward Preview</p>
                <div className="mt-3 grid gap-2">
                  {rewardPreview.map(item => (
                    <div key={item} className="rounded-xl border border-line bg-[#080d18] p-3 text-sm font-extrabold">{item}</div>
                  ))}
                </div>
              </div>
              <Button variant="primary" type="submit" disabled={saving || createLocked || voucherLocked}>{saving ? 'Creating...' : createLocked ? 'Challenge in progress' : voucherLocked ? 'Add voucher first' : 'Create draft'}</Button>
            </form>
          </aside>

          <CompetitionDetailPanel detail={competitionDetail} loading={detailLoading} />
        </div>
      </div>
    </>
  );
}

function CompetitionDetailPanel({ detail, loading }) {
  const competition = detail?.competition;
  const participants = detail?.participants || [];

  return (
    <section className="card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-black">Competition Details</h2>
          <p className="mt-1 text-sm text-muted">{competition?.title || 'Select a competition to view details.'}</p>
        </div>
        {competition?.status ? <span className="pill pill-info">{competition.status}</span> : null}
      </div>

      {loading ? <div className="text-sm text-muted">Loading competition detail...</div> : null}
      {!loading && competition ? (
        <>
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <DetailMetric label="Participants" value={competition.participants || 0} />
            <DetailMetric label="Entry fee" value={`${competition.entryFeeDiamonds || 0} diamonds`} />
            <DetailMetric label="Reward status" value={competition.rewardStatus || 'draft'} />
            <DetailMetric label="Type" value={competition.type || 'global'} />
          </div>
          <SelectedVoucherPanel voucher={competition.selectedVoucher} />
          <div className="mb-4 rounded-2xl border border-line bg-[#0b1220] p-3 text-sm leading-6 text-muted">
            {competition.description || 'No description added.'}
          </div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-black">Participating Users</h3>
            <span className="label">{participants.length} joined</span>
          </div>
          <DataTable columns={participantColumns} rows={participants} />
        </>
      ) : null}
    </section>
  );
}

function VoucherLogo({ voucher }) {
  return (
    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-900/10 bg-white p-2 text-slate-950 shadow-sm">
      {voucher?.platformLogoUrl ? (
        <img src={voucher.platformLogoUrl} alt={`${voucher.provider || 'Voucher'} logo`} className="h-full w-full object-contain" />
      ) : (
        <span className="text-xl font-black">{String(voucher?.provider || 'V').slice(0, 1).toUpperCase()}</span>
      )}
    </div>
  );
}

function SelectedVoucherMiniCard({ voucher }) {
  if (!voucher) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-[#fff2bd] via-[#ffd36f] to-[#ff9f2f] p-3 text-[#251500]">
      <div className="flex items-center gap-3">
        <VoucherLogo voucher={voucher} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black">{voucher.provider || 'Voucher'}</p>
          <p className="truncate text-xs font-extrabold text-[#6d3b00]">{voucher.valueLabel || voucher.title || 'Rank #1 voucher'}</p>
          <p className="mt-1 truncate font-mono text-sm font-black">{voucher.code}</p>
        </div>
      </div>
    </div>
  );
}

function SelectedVoucherPanel({ voucher }) {
  return (
    <div className="mb-4">
      <span className="label">Selected Rank #1 Voucher</span>
      {voucher ? (
        <div className="mt-2 grid gap-3 overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-[#fff2bd] via-[#ffd36f] to-[#ff9f2f] p-4 text-[#251500] md:grid-cols-[1fr_auto]">
          <div className="flex min-w-0 items-center gap-3">
            <VoucherLogo voucher={voucher} />
            <div className="min-w-0">
              <h3 className="truncate text-base font-black">{voucher.provider || 'Voucher'}</h3>
              <p className="truncate text-xs font-extrabold text-[#6d3b00]">{voucher.valueLabel || voucher.title || 'Reward voucher'}</p>
              <p className="mt-2 truncate rounded-xl border border-[#5c3500]/10 bg-white/45 px-3 py-2 font-mono text-sm font-black">{voucher.code || '-'}</p>
            </div>
          </div>
          <span className="h-fit rounded-full border border-[#5c3500]/15 bg-white/40 px-3 py-1 text-xs font-black uppercase">{voucher.status || 'reserved'}</span>
        </div>
      ) : (
        <div className="mt-2 rounded-2xl border border-line bg-[#0b1220] p-3 text-sm text-muted">No voucher selected.</div>
      )}
    </div>
  );
}

function DetailMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-line bg-[#0b1220] p-3">
      <span className="label">{label}</span>
      <strong className="mt-2 block text-lg">{value}</strong>
    </div>
  );
}
