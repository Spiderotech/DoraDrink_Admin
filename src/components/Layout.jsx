import Button from './Button.jsx';
import { navItems, roles } from '../data/mockData.js';

export default function Layout({ session, page, allowedPages, mobileNavOpen, onNavigate, onLogout, onToggleMenu, children }) {
  const allowedNav = navItems.filter(([key]) => allowedPages.includes(key));

  const Sidebar = (
    <aside className={`border-line bg-[#080d18] p-5 lg:sticky lg:top-0 lg:flex lg:min-h-screen lg:flex-col lg:border-r ${mobileNavOpen ? 'flex min-h-screen flex-col' : 'hidden'} lg:block`}>
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand to-violet font-black">DD</div>
        <div>
          <strong>DoraDrink</strong>
          <p className="text-sm text-muted">Admin Console</p>
        </div>
      </div>
      <nav className="grid gap-1">
        {allowedNav.map(([key, label], index) => (
          <button
            key={key}
            className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm font-extrabold transition ${
              page === key
                ? 'border-line bg-panel3 text-white'
                : 'border-transparent text-slate-300 hover:border-line hover:bg-panel3 hover:text-white'
            }`}
            onClick={() => onNavigate(key)}
          >
            <span>{label}</span>
            <span className="text-xs text-slate-500">{String(index + 1).padStart(2, '0')}</span>
          </button>
        ))}
      </nav>
      <div className="mt-auto grid gap-3 border-t border-line pt-4">
        <div>
          <p className="label">Signed in</p>
          <strong className="block truncate">{session.email}</strong>
          <p className="text-sm text-muted">{roles[session.role]}</p>
        </div>
        <Button variant="ghost" onClick={onLogout}>Logout</Button>
      </div>
    </aside>
  );

  return (
    <div className="grid min-h-screen lg:grid-cols-[270px_minmax(0,1fr)]">
      {Sidebar}
      <main className="min-w-0">
        <header className="sticky top-0 z-20 flex min-h-[70px] items-center justify-between gap-3 border-b border-line bg-ink/85 px-4 backdrop-blur lg:px-6">
          <div className="flex items-center gap-3">
            <Button className="lg:hidden" onClick={onToggleMenu}>Menu</Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="pill pill-info">{roles[session.role]}</span>
            <Button onClick={() => window.location.reload()}>Refresh</Button>
          </div>
        </header>
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
