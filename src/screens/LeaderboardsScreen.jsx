import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../components/Button.jsx';
import DataTable from '../components/DataTable.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { adminRequest, unwrapData } from '../lib/adminApi.js';

const columns = [
  { key: 'rank', label: 'Rank' },
  { key: 'user', label: 'User' },
  { key: 'location', label: 'Location' },
  { key: 'score', label: 'Score' },
  { key: 'slots', label: 'Slots' },
  { key: 'streak', label: 'Streak' },
  { key: 'diamonds', label: 'Diamonds' },
];

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '-';
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : '-';
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function getStatusClass(status) {
  if (status === 'active') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100';
  if (status === 'scheduled') return 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100';
  if (status === 'closed') return 'border-slate-400/30 bg-slate-400/10 text-slate-100';
  return 'border-amber-400/30 bg-amber-400/10 text-amber-100';
}

function getRankStyle(rank) {
  if (rank === 1) return {
    badge: 'border-yellow-300/60 bg-yellow-300/20 text-yellow-100',
    card: 'border-yellow-300/40 from-[#2f2308] to-[#0b1220]',
    medal: '🥇',
  };
  if (rank === 2) return {
    badge: 'border-slate-200/50 bg-slate-200/15 text-slate-100',
    card: 'border-slate-200/30 from-[#242b38] to-[#0b1220]',
    medal: '🥈',
  };
  if (rank === 3) return {
    badge: 'border-orange-300/50 bg-orange-300/15 text-orange-100',
    card: 'border-orange-300/30 from-[#312011] to-[#0b1220]',
    medal: '🥉',
  };
  return {
    badge: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100',
    card: 'border-line from-[#0b1220] to-[#080d18]',
    medal: `#${rank}`,
  };
}

function mapCompetition(competition) {
  return {
    id: String(competition._id),
    title: competition.title || 'Weekly Challenge',
    status: competition.status || 'draft',
    startDate: competition.startDate,
    endDate: competition.endDate,
    participants: competition.participants ?? 0,
    leaderboardGeneratedAt: competition.leaderboardGeneratedAt,
    rewardStatus: competition.rewardStatus || 'draft',
  };
}

function mapLeaderboardRow(row) {
  return {
    id: row.entryId || row.userId,
    rank: row.rank,
    user: (
      <div className="flex min-w-0 items-center gap-3">
        <Avatar row={row} size="sm" />
        <div className="min-w-0">
          <div className="truncate font-black text-slate-100">{row.username || 'Dora User'}</div>
          <div className="truncate text-xs text-muted">{row.userId}</div>
        </div>
      </div>
    ),
    location: [row.city, row.country].filter(Boolean).join(', ') || '-',
    score: formatNumber(row.tapScore),
    slots: row.completedSlotCount ?? 0,
    streak: row.streak ?? 0,
    diamonds: row.diamonds ?? 0,
  };
}

export default function LeaderboardsScreen({ session }) {
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState('');
  const [leaderboardRows, setLeaderboardRows] = useState([]);
  const [leaderboardGeneratedAt, setLeaderboardGeneratedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedCompetition = useMemo(
    () => competitions.find(competition => competition.id === selectedCompetitionId) || null,
    [competitions, selectedCompetitionId],
  );

  const topThree = useMemo(
    () => leaderboardRows.filter(row => row.rank <= 3).sort((a, b) => a.rank - b.rank),
    [leaderboardRows],
  );

  const tableRows = useMemo(() => leaderboardRows.map(mapLeaderboardRow), [leaderboardRows]);

  const loadCompetitions = useCallback(async () => {
    try {
      setLoading(true);
      const data = unwrapData(await adminRequest(session, '/api/admin/competitions'));
      const nextCompetitions = (data.competitions || []).map(mapCompetition);
      setCompetitions(nextCompetitions);
      setSelectedCompetitionId(current => current || nextCompetitions[0]?.id || '');
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load competitions.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  const loadLeaderboard = useCallback(async (competitionId = selectedCompetitionId) => {
    if (!competitionId) {
      setLeaderboardRows([]);
      setLeaderboardGeneratedAt(null);
      return;
    }

    try {
      setLeaderboardLoading(true);
      const data = unwrapData(await adminRequest(session, `/api/competitions/${competitionId}/leaderboard?limit=100`));
      setLeaderboardRows(data.leaderboard || []);
      setLeaderboardGeneratedAt(data.leaderboardGeneratedAt || data.competition?.leaderboardGeneratedAt || null);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load leaderboard.');
    } finally {
      setLeaderboardLoading(false);
    }
  }, [selectedCompetitionId, session]);

  useEffect(() => {
    loadCompetitions();
  }, [loadCompetitions]);

  useEffect(() => {
    loadLeaderboard(selectedCompetitionId);
  }, [loadLeaderboard, selectedCompetitionId]);

  async function rerunLeaderboard() {
    if (!selectedCompetitionId) return;
    if (!window.confirm(`Rerun leaderboard snapshot for ${selectedCompetition?.title || 'this challenge'}?`)) return;

    try {
      await adminRequest(session, `/api/admin/competitions/${selectedCompetitionId}/rerun-leaderboard`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Admin leaderboard screen rerun' }),
      });
      await loadCompetitions();
      await loadLeaderboard(selectedCompetitionId);
    } catch (err) {
      setError(err.message || 'Unable to rerun leaderboard.');
    }
  }

  return (
    <>
      <PageHeader
        title="Leaderboards"
        subtitle="Inspect weekly challenge rankings and highlighted podium users."
        actions={<Button variant="primary" onClick={rerunLeaderboard} disabled={!selectedCompetitionId || leaderboardLoading}>Rerun snapshot</Button>}
      />

      <div className="grid gap-4">
        {error ? <div className="rounded-2xl border border-danger/40 bg-danger/10 p-3 text-sm text-red-100">{error}</div> : null}

        <section className="card">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-black">Weekly Challenges</h2>
              <p className="mt-1 text-sm text-muted">Choose a challenge to view its leaderboard.</p>
            </div>
            {loading ? <span className="text-sm text-muted">Loading challenges...</span> : null}
          </div>

          {competitions.length === 0 && !loading ? (
            <div className="rounded-2xl border border-line bg-[#0b1220] p-4 text-sm text-muted">No weekly challenges found.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {competitions.map(competition => (
                <button
                  key={competition.id}
                  type="button"
                  onClick={() => setSelectedCompetitionId(competition.id)}
                  className={`rounded-2xl border p-4 text-left transition hover:border-cyan-400/50 ${
                    selectedCompetitionId === competition.id
                      ? 'border-cyan-400/70 bg-cyan-400/10'
                      : 'border-line bg-[#0b1220]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-black">{competition.title}</h3>
                      <p className="mt-1 text-xs text-muted">{formatDate(competition.startDate)} - {formatDate(competition.endDate)}</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase ${getStatusClass(competition.status)}`}>{competition.status}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <MiniMetric label="Participants" value={formatNumber(competition.participants)} />
                    <MiniMetric label="Rewards" value={competition.rewardStatus} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="card"><p className="label">Selected challenge</p><div className="mt-4 text-xl font-black">{selectedCompetition?.title || '-'}</div></div>
          <div className="card"><p className="label">Snapshot</p><div className="mt-4 text-xl font-black">{formatDateTime(leaderboardGeneratedAt)}</div></div>
          <div className="card"><p className="label">Ranked users</p><div className="mt-4 text-3xl font-black">{leaderboardRows.length}</div></div>
        </section>

        <section className="card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-black">Top 3 Podium</h2>
              <p className="mt-1 text-sm text-muted">Rank #1, #2, and #3 are highlighted from the selected challenge.</p>
            </div>
            {leaderboardLoading ? <span className="text-sm text-muted">Loading leaderboard...</span> : null}
          </div>

          {topThree.length === 0 ? (
            <div className="rounded-2xl border border-line bg-[#0b1220] p-4 text-sm text-muted">No ranked users yet.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {topThree.map(row => <PodiumCard key={row.entryId || row.userId} row={row} />)}
            </div>
          )}
        </section>

        <section className="card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-black">Challenge Leaderboard</h2>
              <p className="mt-1 text-sm text-muted">Scores, completed slots, challenge streak, and wallet diamonds.</p>
            </div>
            <Button onClick={() => loadLeaderboard(selectedCompetitionId)} disabled={!selectedCompetitionId || leaderboardLoading}>Refresh</Button>
          </div>
          <DataTable columns={columns} rows={tableRows} />
        </section>
      </div>
    </>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-xl border border-line bg-[#080d18] p-3">
      <p className="label">{label}</p>
      <p className="mt-1 truncate font-black">{value}</p>
    </div>
  );
}

function Avatar({ row, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'h-9 w-9 rounded-xl' : 'h-14 w-14 rounded-2xl';
  const imageUrl = row.profilePictureUrl;

  return (
    <div className={`grid shrink-0 place-items-center overflow-hidden border border-white/15 bg-[#101a2c] ${sizeClass}`}>
      {imageUrl ? (
        <img src={imageUrl} alt={row.username || 'User'} className="h-full w-full object-cover" />
      ) : (
        <span className="text-sm font-black">{String(row.username || 'D').slice(0, 1).toUpperCase()}</span>
      )}
    </div>
  );
}

function PodiumCard({ row }) {
  const rankStyle = getRankStyle(row.rank);

  return (
    <article className={`rounded-2xl border bg-gradient-to-br p-4 ${rankStyle.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar row={row} />
          <div className="min-w-0">
            <h3 className="truncate font-black">{row.username || 'Dora User'}</h3>
            <p className="truncate text-xs text-muted">{[row.city, row.country].filter(Boolean).join(', ') || 'No location'}</p>
          </div>
        </div>
        <span className={`rounded-full border px-3 py-1 text-sm font-black ${rankStyle.badge}`}>{rankStyle.medal}</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniMetric label="Score" value={formatNumber(row.tapScore)} />
        <MiniMetric label="Slots" value={row.completedSlotCount ?? 0} />
        <MiniMetric label="Streak" value={row.streak ?? 0} />
      </div>
      <div className="mt-3 rounded-xl border border-line bg-[#080d18]/70 p-3 text-sm">
        <span className="text-muted">Diamonds</span>
        <strong className="ml-2">{row.diamonds ?? 0}</strong>
      </div>
    </article>
  );
}
