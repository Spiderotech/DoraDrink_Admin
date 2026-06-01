import Badge from './Badge.jsx';

const statusWords = new Set([
  'active',
  'inactive',
  'suspicious',
  'disabled',
  'draft',
  'scheduled',
  'closed',
  'cancelled',
  'pending',
  'distributed',
  'Live',
  'Closed',
  'Draft',
  'Pending',
  'Distributed',
  'available',
  'reserved',
  'claimed',
  'used',
  'expired',
  'scheduled',
  'sent',
  'open',
  'reviewing',
  'dismissed',
  'high',
  'medium',
  'low',
  'invited',
]);

export default function DataTable({ columns, rows = [], renderActions }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse">
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.key} className="table-head">
                {column.label}
              </th>
            ))}
            {renderActions ? <th className="table-head">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="table-cell text-muted" colSpan={columns.length + (renderActions ? 1 : 0)}>
                No records found.
              </td>
            </tr>
          ) : rows.map((row, index) => (
            <tr key={row.id || index}>
              {columns.map(column => {
                const value = row[column.key];
                return (
                  <td key={column.key} className="table-cell">
                    {statusWords.has(String(value)) ? <Badge>{value}</Badge> : value || '-'}
                  </td>
                );
              })}
              {renderActions ? <td className="table-cell">{renderActions(row)}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
