import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../components/Button.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { adminRequest, unwrapData } from '../lib/adminApi.js';

function formatNumber(value) {
  if (value === null || value === undefined) return '-';
  return Number(value).toLocaleString();
}

function formatLiters(value) {
  if (!value) return '0L';
  return `${(Number(value) / 1000).toFixed(1)}L`;
}

function formatPercent(value) {
  if (value === null || value === undefined) return '0%';
  return `${Number(value).toFixed(1).replace('.0', '')}%`;
}

function MetricCard({ label, value, sub }) {
  return (
    <article className="card min-h-28 bg-gradient-to-b from-[#10192b] to-[#0d1423]">
      <p className="label">{label}</p>
      <div className="mt-4 text-3xl font-black">{value}</div>
      {sub ? <p className="mt-2 text-sm text-muted">{sub}</p> : null}
    </article>
  );
}

function Chart({ points, unit = 'number' }) {
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
                {unit === 'percent' ? formatPercent(value) : formatNumber(value)}
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

export default function AnalyticsScreen({ session }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const data = unwrapData(await adminRequest(session, '/api/admin/analytics'));
      setAnalytics(data.analytics);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load analytics.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const metrics = analytics?.metrics || {};
  const cards = useMemo(() => [
    ['DAU', formatNumber(metrics.dailyActiveUsers), 'Users updated today'],
    ['WAU', formatNumber(metrics.weeklyActiveUsers), `${formatPercent(metrics.weeklyActiveRate)} of all users`],
    ['Average hydration', formatLiters(metrics.averageHydrationMl), 'Last 7 days competition progress'],
    ['Reward claims', formatNumber(metrics.rewardClaims), 'Positive ledger entries, last 30 days'],
    ['Notification delivery', formatPercent(metrics.notificationDeliveryRate), `${formatNumber(metrics.notificationsSent)} notifications sent`],
    ['Ad rewards', formatNumber(metrics.adRewards), 'Ad reward claims, last 30 days'],
    ['Store purchases', formatNumber(metrics.storePurchases), `${formatNumber(metrics.purchasedCoins)} coins bought`],
    ['Active push tokens', formatNumber(metrics.activeDeviceTokens), 'Seen in last 30 days'],
  ], [metrics]);

  const completionTrend = analytics?.trends?.completionRateByDay || [];
  const rewardsTrend = analytics?.trends?.rewardsIssuedByDay || [];

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Live retention, hydration behavior, rewards, purchase, and notification health."
        actions={<Button variant="primary" onClick={loadAnalytics}>{loading ? 'Loading...' : 'Refresh analytics'}</Button>}
      />

      {error ? <div className="mb-4 rounded-2xl border border-danger/40 bg-danger/10 p-3 text-sm text-red-100">{error}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, sub]) => <MetricCard key={label} label={label} value={loading ? '...' : value} sub={sub} />)}
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-black">Completion rate by day</h2>
            <span className="pill pill-info">Last 12 days</span>
          </div>
          <Chart points={completionTrend} unit="percent" />
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-black">Rewards issued</h2>
            <span className="pill pill-info">Coins and diamonds</span>
          </div>
          <Chart points={rewardsTrend} />
        </div>
      </section>
    </>
  );
}
