export function formatTzs(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return 'TSh 0';
  }
  const numeric = Math.round(Number(amount));
  return `TSh ${numeric.toLocaleString()}`;
}

export function formatDate(dateString?: string | Date | null): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return String(dateString);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatOrderStatus(status?: string | null): { label: string; bg: string; text: string } {
  if (!status) {
    return { label: 'Pending', bg: 'bg-stone-100 border-stone-200', text: 'text-stone-700' };
  }
  switch (status) {
    case 'pending_review':
      return { label: 'Pending Review', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800' };
    case 'confirmed':
      return { label: 'Confirmed', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800' };
    case 'preparing':
      return { label: 'In Deck Oven / Prep', bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800' };
    case 'ready_for_pickup':
      return { label: 'Ready for Pickup', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800' };
    case 'out_for_delivery':
      return { label: 'Out for Delivery', bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-800' };
    case 'completed':
      return { label: 'Completed', bg: 'bg-stone-100 border-stone-200', text: 'text-stone-800' };
    case 'cancelled':
      return { label: 'Cancelled', bg: 'bg-red-50 border-red-200', text: 'text-red-800' };
    default:
      return { label: status, bg: 'bg-stone-100 border-stone-200', text: 'text-stone-700' };
  }
}
