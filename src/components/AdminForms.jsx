import Button from './Button.jsx';
import { users } from '../data/mockData.js';

export function getModalConfig(type, id, confirmAction) {
  const configs = {
    supportNote: {
      title: 'Add support note',
      body: (
        <form className="grid gap-4" onSubmit={event => { event.preventDefault(); confirmAction('Save support note?'); }}>
          <label className="grid gap-2"><span className="label">User ID</span><input className="input" required placeholder="u_1024" /></label>
          <label className="grid gap-2"><span className="label">Note</span><textarea className="input min-h-24" required placeholder="Internal support note" /></label>
          <Button variant="primary" type="submit">Save note</Button>
        </form>
      ),
    },
    userDetail: {
      title: `User detail: ${id}`,
      body: <UserDetail id={id} confirmAction={confirmAction} />,
    },
    competitionCreate: {
      title: 'Create competition',
      body: <CompetitionForm confirmAction={confirmAction} />,
    },
    competitionDetail: {
      title: `Competition detail: ${id}`,
      body: <CompetitionDetail id={id} confirmAction={confirmAction} />,
    },
    scoreSource: {
      title: `Score source: ${id}`,
      body: <p className="text-sm leading-6 text-muted">Shows hydration logs, slot completions, streak data, and competition calculations used for this score.</p>,
    },
    rewardAdjust: {
      title: 'Manual reward adjustment',
      body: <RewardAdjustmentForm confirmAction={confirmAction} />,
    },
    voucherUpload: {
      title: 'Upload vouchers',
      body: <VoucherUploadForm confirmAction={confirmAction} />,
    },
    voucherAssign: {
      title: `Assign voucher: ${id}`,
      body: <VoucherAssignForm id={id} confirmAction={confirmAction} />,
    },
  };

  return configs[type] || { title: 'Action', body: <p className="text-muted">No form configured.</p> };
}

function UserDetail({ id, confirmAction }) {
  const user = users.find(row => row.id === id) || users[0];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="grid gap-3">
        <Info label="Profile" value={`${user.username} / ${user.email}`} />
        <Info label="Wallet" value={`${user.coins} coins, ${user.diamonds} diamonds`} />
        <Info label="Location" value={`${user.country}, ${user.city}`} />
      </div>
      <div className="grid gap-3">
        <Button onClick={() => confirmAction(`Adjust wallet for ${id}?`)}>Adjust wallet</Button>
        <Button variant="danger" onClick={() => confirmAction(`Disable account ${id}?`)}>Disable account</Button>
        <Button variant="danger" onClick={() => confirmAction(`Mark account ${id} suspicious?`)}>Mark suspicious</Button>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-line bg-[#0b1220] p-3">
      <span className="label">{label}</span>
      <strong className="mt-1 block">{value}</strong>
    </div>
  );
}

function CompetitionForm({ confirmAction }) {
  return (
    <form className="grid gap-4" onSubmit={event => { event.preventDefault(); confirmAction('Create competition draft?'); }}>
      <label className="grid gap-2"><span className="label">Title</span><input className="input" required /></label>
      <label className="grid gap-2"><span className="label">Description</span><textarea className="input min-h-24" /></label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-2"><span className="label">Start</span><input className="input" type="date" /></label>
        <label className="grid gap-2"><span className="label">End</span><input className="input" type="date" /></label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-2"><span className="label">Type</span><select className="input"><option>global</option><option>country</option><option>city</option></select></label>
        <label className="grid gap-2"><span className="label">Entry fee diamonds</span><input className="input" type="number" defaultValue="2" /></label>
      </div>
      <Button variant="primary" type="submit">Create draft</Button>
    </form>
  );
}

function CompetitionDetail({ confirmAction }) {
  return (
    <div className="grid gap-3">
      <Info label="Participant count" value="1,284" />
      <Info label="Leaderboard snapshot" value="Generated hourly, next refresh at 11:00" />
      <p className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm leading-6 text-yellow-100">Published competitions should not be freely editable. Reward changes after start require Super Admin confirmation.</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => confirmAction('Publish or schedule this competition?')}>Publish</Button>
        <Button onClick={() => confirmAction('Distribute rewards for this competition?')}>Distribute rewards</Button>
        <Button variant="danger" onClick={() => confirmAction('Force close this competition?')}>Force close</Button>
      </div>
    </div>
  );
}

function RewardAdjustmentForm({ confirmAction }) {
  return (
    <form className="grid gap-4" onSubmit={event => { event.preventDefault(); confirmAction('Create manual wallet adjustment and audit log?'); }}>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-2"><span className="label">User ID</span><input className="input" required placeholder="u_1024" /></label>
        <label className="grid gap-2"><span className="label">Currency</span><select className="input"><option>coins</option><option>diamonds</option></select></label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-2"><span className="label">Amount</span><input className="input" type="number" required /></label>
        <label className="grid gap-2"><span className="label">Notify user</span><select className="input"><option>No</option><option>Yes</option></select></label>
      </div>
      <label className="grid gap-2"><span className="label">Reason</span><input className="input" required /></label>
      <label className="grid gap-2"><span className="label">Internal note</span><textarea className="input min-h-24" /></label>
      <Button variant="primary" type="submit">Submit adjustment</Button>
    </form>
  );
}

function VoucherUploadForm({ confirmAction }) {
  return (
    <form className="grid gap-4" onSubmit={event => { event.preventDefault(); confirmAction('Upload voucher CSV?'); }}>
      <label className="grid gap-2"><span className="label">CSV file</span><input className="input" type="file" accept=".csv" /></label>
      <p className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-yellow-100">Expected columns: code,rewardCategory,competitionId</p>
      <Button variant="primary" type="submit">Upload</Button>
    </form>
  );
}

function VoucherAssignForm({ id, confirmAction }) {
  return (
    <form className="grid gap-4" onSubmit={event => { event.preventDefault(); confirmAction(`Assign voucher ${id}?`); }}>
      <label className="grid gap-2"><span className="label">User ID</span><input className="input" required placeholder="u_1024" /></label>
      <label className="grid gap-2"><span className="label">Reason</span><input className="input" required placeholder="Competition Rank 1 reward" /></label>
      <Button variant="primary" type="submit">Assign voucher</Button>
    </form>
  );
}
