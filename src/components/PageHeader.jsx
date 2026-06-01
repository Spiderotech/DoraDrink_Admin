export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="label">DoraDrink V2 Admin</p>
        <h1 className="text-2xl font-black text-white">{title}</h1>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
