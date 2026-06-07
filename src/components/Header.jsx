import React from 'react';
import { Shield } from 'lucide-react';

export default function Header({ title, user }) {
  // Format role name for display
  const formatRole = (role) => {
    if (role === 'SUPER_ADMIN') return 'SYSTEM AUDITOR';
    return role ? role.replace('_', ' ') : '';
  };

  return (
    <header className="h-16 border-b border-slate-900 bg-[#0b1120] px-8 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h2 className="text-sm font-bold tracking-wide text-white uppercase">{title || 'Dashboard'}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Connection status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/5 border border-teal-500/10 text-teal-400 text-[10px] font-bold tracking-wider uppercase">
          <Shield className="w-3.5 h-3.5" />
          SSL Encrypted
        </div>

        {/* User Role Tag */}
        <span className="text-[10px] font-bold font-mono tracking-wider px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 uppercase">
          {formatRole(user?.role)}
        </span>
      </div>
    </header>
  );
}
