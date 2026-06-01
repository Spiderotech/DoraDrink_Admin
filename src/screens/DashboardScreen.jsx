import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import Button from '../components/Button.jsx';
import { adminRequest, unwrapData } from '../lib/adminApi.js';

function formatNumber(value) {
  if (value === null || value === undefined) return '-';
  return Number(value).toLocaleString();
}

function MetricCard({ label, value, delta, kind }) {
  return (
    <article className="card min-h-28 bg-gradient-to-b from-[#10192b] to-[#0d1423]">
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        <span className={`rounded-full px-2 py-1 text-xs font-black ${kind === 'good' ? 'bg-success/10 text-emerald-200' : 'bg-warning/10 text-yellow-100'}`}>{delta}</span>
      </div>
      <div className="mt-4 text-3xl font-black">{value}</div>
    </article>
  );
}

function DauChart({ points = [] }) {
  const max = Math.max(...points.map(point => Number(point.value) || 0), 1);
  const tickIndexes = new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]);

  return (
    <div className="mt-4 overflow-hidden">
      <div className="relative flex h-56 items-end gap-2 border-b border-line px-1 pb-1">
        {points.map(point => {
          const value = Number(point.value) || 0;
          const height = value > 0 ? Math.max(10, Math.round((value / max) * 176)) : 8;

          return (
            <div key={point.dateKey} className="group relative flex h-full flex-1 items-end justify-center">
              <div className="absolute bottom-full mb-2 hidden rounded-lg border border-line bg-[#080d18] px-2 py-1 text-xs font-bold text-slate-100 shadow-xl group-hover:block">
                {formatNumber(value)} active
              </div>
              <div className="w-full max-w-12 rounded-t-lg bg-gradient-to-b from-aqua to-brand" style={{ height }} />
            </div>
          );
        })}
      </div>
      <div className="mt-2 grid text-xs text-muted" style={{ gridTemplateColumns: `repeat(${Math.max(points.length, 1)}, minmax(0, 1fr))` }}>
        {points.map((point, index) => (
          <span
            key={point.dateKey}
            className={`truncate ${index === 0 ? 'text-left' : index === points.length - 1 ? 'text-right' : 'text-center'}`}
          >
            {tickIndexes.has(index) ? point.label : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function DashboardScreen({ session, onNavigate }) {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        const data = unwrapData(await adminRequest(session, '/api/admin/dashboard'));
        if (alive) {
          setDashboard(data.dashboard);
          setError('');
        }
      } catch (err) {
        if (alive) setError(err.message || 'Unable to load dashboard.');
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      alive = false;
    };
  }, [session]);

  const metrics = useMemo(() => [
    ['Total users', formatNumber(dashboard?.users), loading ? 'loading' : 'live', 'good'],
    ['Active competitions', formatNumber(dashboard?.activeCompetitions), loading ? 'loading' : 'live', 'good'],
    ['Reward ledger entries', formatNumber(dashboard?.rewardEntries), loading ? 'loading' : 'live', 'good'],
    ['Competition joins', formatNumber(dashboard?.competitionJoins), loading ? 'loading' : 'live', 'good'],
    ['Coins issued', formatNumber(dashboard?.coinsIssued), loading ? 'loading' : 'live', 'warn'],
  ], [dashboard, loading]);
  const dashboardAlerts = dashboard?.alerts || [];
  const dauTrend = dashboard?.dauTrend || [];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Platform overview, reward economy signals, and operational alerts." />
      {error ? <div className="mb-4 rounded-2xl border border-danger/40 bg-danger/10 p-3 text-sm text-red-100">{error}</div> : null}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, delta, kind]) => <MetricCard key={label} label={label} value={value} delta={delta} kind={kind} />)}
      </section>
      <section className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <article className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-black">DAU trend</h2>
            <span className="pill pill-info">Last 12 days</span>
          </div>
          <DauChart points={dauTrend} />
        </article>
        <article className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-black">Alerts</h2>
            <Button variant="ghost" onClick={() => onNavigate('analytics')}>Review</Button>
          </div>
          <div className="mt-4 grid gap-3">
            {dashboardAlerts.map(({ title, body, kind }) => (
              <div key={title} className="rounded-xl border border-line bg-[#0b1220] p-3">
                <div className="flex items-center justify-between gap-3">
                  <strong>{title}</strong>
                  <span className={`pill ${kind === 'warn' ? 'pill-warn' : kind === 'good' ? 'pill-good' : 'pill-info'}`}>{kind}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{body}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
