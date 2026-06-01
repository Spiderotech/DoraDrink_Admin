import { statusClass } from '../lib/status.js';

export default function Badge({ children }) {
  return <span className={`pill ${statusClass(children)}`}>{children}</span>;
}
