// Utility formatters for UI

export function formatCurrency(amount) {
  if (!amount) return 'Competitive';
  return `₹${(amount / 100000).toFixed(1)}L`;
}

export function formatDate(isoDate) {
  if (!isoDate) return '';
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function getStatusBadgeStyle(status) {
  switch (status) {
    case 'selected':
    case 'hired':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'shortlisted':
    case 'interview':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'under_review':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'rejected':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-slate-800 text-slate-400 border-slate-700';
  }
}
