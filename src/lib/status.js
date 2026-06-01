export function statusClass(value) {
  const text = String(value).toLowerCase();
  if (['active', 'live', 'sent', 'available', 'distributed', 'low'].includes(text)) {
    return 'pill-good';
  }
  if (['draft', 'scheduled', 'pending', 'reviewing', 'medium', 'claimed', 'invited'].includes(text)) {
    return 'pill-warn';
  }
  if (['suspicious', 'inactive', 'high', 'open', 'expired', 'disabled'].includes(text)) {
    return 'pill-bad';
  }
  return 'pill-info';
}
