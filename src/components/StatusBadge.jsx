import React from 'react';

export default function StatusBadge({ status }) {
  const normalizedStatus = status ? status.toUpperCase() : 'PENDING';

  let colors = 'bg-amber-500/10 text-amber-400 border-amber-500/20';

  if (normalizedStatus === 'ACTIVE' || normalizedStatus === 'APPROVED' || normalizedStatus === 'COMPLETED') {
    colors = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  } else if (normalizedStatus === 'REJECTED' || normalizedStatus === 'SUSPENDED' || normalizedStatus === 'FAILED') {
    colors = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  } else if (normalizedStatus === 'PENDING_APPROVAL' || normalizedStatus === 'PASSWORD_RESET_PENDING') {
    colors = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors}`}>
      {normalizedStatus.replace('_', ' ')}
    </span>
  );
}
