import { useCallback, useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import DataTable from '../components/DataTable.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { adminRequest, unwrapData } from '../lib/adminApi.js';

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'target', label: 'Target' },
  { key: 'push', label: 'Push' },
  { key: 'publishAt', label: 'Publish At' },
];

const tokenColumns = [
  { key: 'platform', label: 'Platform' },
  { key: 'owner', label: 'Owner' },
  { key: 'enabled', label: 'Enabled' },
  { key: 'lastSeenAt', label: 'Last Seen' },
];

const formatDate = value => value ? new Date(value).toLocaleString() : 'Now';

const mapNotification = notification => ({
  id: notification._id,
  title: notification.title,
  type: notification.type,
  status: notification.status,
  target: notification.target,
  push: `${notification.pushSuccessCount || 0}/${notification.pushAttemptedCount || 0}`,
  publishAt: formatDate(notification.publishAt),
});

const mapDeviceToken = deviceToken => ({
  id: deviceToken._id,
  platform: deviceToken.platform,
  owner: deviceToken.userId ? `user:${String(deviceToken.userId).slice(-6)}` : `guest:${String(deviceToken.guestInstallId || '').slice(-6)}`,
  enabled: deviceToken.enabled ? 'yes' : 'no',
  lastSeenAt: formatDate(deviceToken.lastSeenAt),
});

export default function NotificationsScreen({ session, confirmAction }) {
  const [rows, setRows] = useState([]);
  const [deviceRows, setDeviceRows] = useState([]);
  const [deviceStats, setDeviceStats] = useState({ total: 0, enabled: 0, android: 0, ios: 0 });
  const [form, setForm] = useState({
    title: 'New Weekly Competition Starts Tomorrow',
    body: 'Join the new hydration challenge and compete for rewards.',
    type: 'competition',
    target: 'all',
    publishAt: '',
    route: 'Competition',
  });
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    try {
      const [notificationsData, tokenData] = await Promise.all([
        adminRequest(session, '/api/admin/notifications'),
        adminRequest(session, '/api/admin/notifications/device-tokens'),
      ]);
      const data = unwrapData(notificationsData);
      const tokenPayload = unwrapData(tokenData);
      setRows((data.notifications || []).map(mapNotification));
      setDeviceRows((tokenPayload.deviceTokens || []).map(mapDeviceToken));
      setDeviceStats(tokenPayload.stats || { total: 0, enabled: 0, android: 0, ios: 0 });
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load notifications.');
    }
  }, [session]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const updateField = (key, value) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const submitNotification = async event => {
    event.preventDefault();
    try {
      const payload = {
        ...form,
        publishAt: form.publishAt ? new Date(form.publishAt).toISOString() : undefined,
        route: form.route || null,
      };
      await adminRequest(session, '/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await loadNotifications();
      confirmAction('Notification saved and push send attempted for registered devices.');
    } catch (err) {
      setError(err.message || 'Unable to save notification.');
    }
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Send global backend notifications to guest and logged-in devices."
        actions={<Button variant="primary" onClick={loadNotifications}>Refresh</Button>}
      />
      {error ? <div className="mb-4 rounded-2xl border border-danger/40 bg-danger/10 p-3 text-sm text-red-100">{error}</div> : null}
      <section className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Registered devices" value={deviceStats.total} />
        <Metric label="Enabled tokens" value={deviceStats.enabled} />
        <Metric label="Android" value={deviceStats.android} />
        <Metric label="iOS" value={deviceStats.ios} />
      </section>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form className="card grid gap-5" onSubmit={submitNotification}>
          <div>
            <h2 className="text-lg font-black">Broadcast Composer</h2>
            <p className="mt-1 text-sm leading-6 text-muted">Send an immediate or scheduled backend notification. Target “all” sends to guest and logged-in device tokens.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 md:col-span-2">
              <span className="label">Title</span>
              <input className="input" value={form.title} onChange={event => updateField('title', event.target.value)} />
            </label>
            <label className="grid gap-2 md:col-span-2">
              <span className="label">Body</span>
              <textarea className="input min-h-28" value={form.body} onChange={event => updateField('body', event.target.value)} />
            </label>
            <label className="grid gap-2">
              <span className="label">Type</span>
              <select className="input" value={form.type} onChange={event => updateField('type', event.target.value)}>
                <option value="competition">Competition</option>
                <option value="reward">Reward</option>
                <option value="motivation">Motivation</option>
                <option value="streak">Streak</option>
                <option value="system">System</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="label">Target</span>
              <select className="input" value={form.target} onChange={event => updateField('target', event.target.value)}>
                <option value="all">All users and guests</option>
                <option value="country">Country</option>
                <option value="city">City</option>
                <option value="inactive">Inactive users</option>
                <option value="streak_at_risk">Streak at risk</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="label">Schedule</span>
              <input className="input" type="datetime-local" value={form.publishAt} onChange={event => updateField('publishAt', event.target.value)} />
            </label>
            <label className="grid gap-2">
              <span className="label">App route</span>
              <input className="input" value={form.route} onChange={event => updateField('route', event.target.value)} placeholder="Competition" />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-[#0b1220] p-3">
            <p className="text-sm text-muted">{form.publishAt ? 'Scheduled notifications appear in the app feed after publish time.' : 'Immediate notifications are pushed to registered devices now.'}</p>
            <Button variant="primary" type="submit">Send / Schedule</Button>
          </div>
        </form>

        <div className="card">
          <h2 className="font-black">Mobile Preview</h2>
          <div className="mt-4 rounded-2xl border border-line bg-[#0b1220] p-4">
            <span className="pill pill-info">{form.type}</span>
            <h3 className="mt-4 text-lg font-black">{form.title || 'Notification title'}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{form.body || 'Notification body'}</p>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
              <span className="text-xs font-black text-slate-300">{form.target === 'all' ? 'All users + guests' : form.target}</span>
              <span className="text-xs font-black text-slate-300">{form.route || 'No route'}</span>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted">Publishing a competition automatically sends a “challenge started” notification to all registered devices.</p>
        </div>
      </section>
      <section className="mt-4">
        <div className="card">
          <h2 className="mb-4 font-black">Backend notifications</h2>
          <DataTable columns={columns} rows={rows} />
        </div>
      </section>
      <section className="mt-4">
        <div className="card">
          <h2 className="mb-4 font-black">Registered device tokens</h2>
          <DataTable columns={tokenColumns} rows={deviceRows} />
        </div>
      </section>
    </>
  );
}

function Metric({ label, value }) {
  return (
    <article className="card min-h-24">
      <span className="label">{label}</span>
      <div className="mt-4 text-3xl font-black">{value}</div>
    </article>
  );
}
