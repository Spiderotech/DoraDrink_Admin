import { useCallback, useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import DataTable from '../components/DataTable.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { adminRequest, unwrapData } from '../lib/adminApi.js';

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'user', label: 'User' },
  { key: 'platform', label: 'Platform' },
  { key: 'product', label: 'Product' },
  { key: 'coins', label: 'Coins' },
  { key: 'status', label: 'Status' },
  { key: 'environment', label: 'Env' },
  { key: 'storeId', label: 'Store ID' },
  { key: 'verified', label: 'Verified' },
];

const shortId = value => {
  if (!value) return '-';
  const text = String(value);
  return text.length > 22 ? `${text.slice(0, 10)}...${text.slice(-8)}` : text;
};

function mapPurchase(purchase) {
  const user = purchase.userId && typeof purchase.userId === 'object' ? purchase.userId : null;
  const storeId = purchase.orderId || purchase.transactionId || purchase.purchaseToken;

  return {
    id: shortId(purchase._id),
    user: user?.username ? `${user.username} (${shortId(user._id)})` : shortId(purchase.userId),
    platform: purchase.platform || '-',
    product: purchase.productId || '-',
    coins: purchase.coins?.toLocaleString?.() || purchase.coins || '-',
    status: purchase.status || '-',
    environment: purchase.providerEnvironment || '-',
    storeId: shortId(storeId),
    verified: purchase.verifiedAt ? new Date(purchase.verifiedAt).toLocaleString() : '-',
  };
}

export default function PurchasesScreen({ session }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    userId: '',
    platform: 'all',
    status: 'all',
  });

  const loadPurchases = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (filters.userId.trim()) query.set('userId', filters.userId.trim());
      if (filters.platform !== 'all') query.set('platform', filters.platform);
      if (filters.status !== 'all') query.set('status', filters.status);

      const suffix = query.toString() ? `?${query.toString()}` : '';
      const data = unwrapData(await adminRequest(session, `/api/admin/iap-purchases${suffix}`));
      setRows((data.purchases || []).map(mapPurchase));
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load purchase details.');
    } finally {
      setLoading(false);
    }
  }, [filters.platform, filters.status, filters.userId, session]);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  function updateFilter(key, value) {
    setFilters(current => ({ ...current, [key]: value }));
  }

  return (
    <>
      <PageHeader
        title="Product Purchases"
        subtitle="Verified App Store and Google Play coin purchases."
        actions={<Button variant="primary" onClick={loadPurchases}>Refresh purchases</Button>}
      />

      <div className="card mb-4 grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
        <label className="grid gap-2">
          <span className="label">Backend user ID</span>
          <input className="input" value={filters.userId} onChange={event => updateFilter('userId', event.target.value)} placeholder="Optional Mongo user id" />
        </label>
        <label className="grid gap-2">
          <span className="label">Platform</span>
          <select className="input" value={filters.platform} onChange={event => updateFilter('platform', event.target.value)}>
            <option value="all">All</option>
            <option value="ios">iOS</option>
            <option value="android">Android</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className="label">Status</span>
          <select className="input" value={filters.status} onChange={event => updateFilter('status', event.target.value)}>
            <option value="all">All</option>
            <option value="verified">Verified</option>
            <option value="failed">Failed</option>
          </select>
        </label>
        <div className="flex items-end">
          <Button onClick={loadPurchases}>Apply</Button>
        </div>
      </div>

      <div className="card">
        {error ? <div className="mb-4 rounded-2xl border border-danger/40 bg-danger/10 p-3 text-sm text-red-100">{error}</div> : null}
        {loading ? <div className="mb-4 text-sm text-muted">Loading purchase details...</div> : null}
        <DataTable columns={columns} rows={rows} />
      </div>
    </>
  );
}
