import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  FileText,
  Wallet,
  ArrowRightLeft,
  Download,
  ShieldAlert,
  History,
  Users,
  Settings,
  Power,
  Copy,
  Check
} from 'lucide-react';

export default function Sidebar({ user, onLogout }) {
  const role = user?.role;
  const [copied, setCopied] = useState(false);

  const handleCopyLoginLink = () => {
    const loginUrl = window.location.origin + '/login';
    navigator.clipboard.writeText(loginUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Define navigation based on role
  const getNavLinks = () => {
    switch (role) {
      case 'SUPER_ADMIN':
        return [
          { to: '/superadmin', label: 'Overview', icon: LayoutDashboard, end: true },
          { to: '/superadmin/audit-logs', label: 'System Audit Logs', icon: FileText },
          { to: '/superadmin/security-events', label: 'Security Alerts', icon: ShieldAlert },
        ];
      case 'ADMIN':
        return [
          { to: '/admin', label: 'Dashboard Queue', icon: LayoutDashboard, end: true },
          { to: '/admin/users', label: 'Manage Users', icon: Users },
        ];
      case 'USER':
        return [
          { to: '/user', label: 'My Wallet', icon: LayoutDashboard, end: true },
          { to: '/user/kyc', label: 'Complete KYC', icon: UserCheck },
          { to: '/user/fund-request', label: 'Request Funds', icon: Wallet },
          { to: '/user/transfer', label: 'Send Transfer', icon: ArrowRightLeft },
          { to: '/user/withdraw', label: 'Request Withdrawal', icon: Download },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavLinks();

  return (
    <aside className="w-64 bg-[#070b16] border-r border-slate-900 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand Banner */}
        <div className="p-6 border-b border-slate-900 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
            <span className="text-teal-400 font-extrabold text-sm">SBT</span>
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wide text-white">SBT</h1>
            <p className="text-[9px] text-teal-400 font-bold uppercase tracking-wider">Smart Banking Treasury</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-teal-950/40 border border-teal-900/50 text-teal-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Copy Login Link Action */}
        <div className="px-4 pb-4">
          <button
            onClick={handleCopyLoginLink}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide text-slate-400 hover:text-white hover:bg-slate-900/40 transition-all cursor-pointer border border-dashed border-slate-900 hover:border-slate-800"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-450 shrink-0" /> : <Copy className="w-4 h-4 text-teal-400 shrink-0" />}
            {copied ? 'Copied Login Link!' : 'Copy Login Link'}
          </button>
        </div>
      </div>

      {/* User profile footer */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/20">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate">
            <p className="text-xs font-bold text-slate-200 truncate">{user?.fullname}</p>
            <p className="text-[10px] text-slate-500 font-bold font-mono tracking-tight truncate">{user?.user_id}</p>
          </div>
          <button
            onClick={onLogout}
            className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition-all cursor-pointer"
            title="Log Out"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
